import {Post, PostStatus, PrismaClient, ReactionType} from '@prisma/client'

import {CursorPagination} from 'main/types'

import {PostRepository} from '.'
import {CreatePostInputDTO, ExtendedPostDTO, PendingPostDTO, PostDTO} from '../dto'
import {StorageRepository, StorageRepositoryImpl} from "@main/domains/storage/repository";
import {ExtendedUserDTO} from "@main/domains/user/dto";

export class PostRepositoryImpl implements PostRepository {
  private readonly storageRepository: StorageRepository = new StorageRepositoryImpl();

  constructor (private readonly db: PrismaClient) {}

  async create (userId: string, data: CreatePostInputDTO): Promise<PostDTO | PendingPostDTO> {
    return this.addPostToDB(userId, data)
  }

  async createComment (userId: string, postId: string, data: CreatePostInputDTO): Promise<PostDTO | PendingPostDTO> {
    const canPost = await this.canPostComment(userId, postId)
    if(canPost instanceof Error) {
      throw canPost
    }
    return this.addPostToDB(userId, data, postId)
  }


  // --- GET POST AND COMMENT BY DATE PAGINATED
  async getAllByDatePaginated (userId: string, options: CursorPagination): Promise<ExtendedPostDTO[]> {
    const followingUserIds = await this.getFollowingUsers(userId);
    const filter = this.buildPostFilter(followingUserIds);

    const posts = await this.getPostByFilters(options, filter)

    // They are not sorted. Wasn't asked. I think it is ok not to sort them.
    return this.getListOfDtoWithPreSignedUrls(userId, posts)
  }

  async getAllCommentsByDatePaginated (userId: string, postId: string, options: CursorPagination): Promise<ExtendedPostDTO[]> {
    const followingUserIds = await this.getFollowingUsers(userId);

    // You cannot see comments from private accounts
    const filter = {
      ...this.buildPostFilter(followingUserIds, postId),
      respondsToId: postId,
    };
    return await this.getSortedPostsByFilters(userId, options, filter);
  }

  private async getSortedPostsByFilters(userId: string, options: CursorPagination, filter: Object): Promise<ExtendedPostDTO[]> {
    const posts = await this.getPostByFilters(options, filter)
    const extendedDTOs = await Promise.all(
      posts.map((post) => this.getPostDTO(userId, post))
    );

    // Sort comments by reactions before returning
    return this.sortByReactions(extendedDTOs);
  }

  private async getPostByFilters(options: CursorPagination, filter: Object): Promise<Post[]> {
    const posts = await this.db.post.findMany({
      where: filter,
      cursor: options.after ? { id: options.after } : (options.before) ? { id: options.before } : undefined,
      skip: options.after ?? options.before ? 1 : undefined,
      take: options.limit ? (options.before ? -options.limit : options.limit) : undefined,
      orderBy: [
        {
          createdAt: 'desc'
        },
        {
          id: 'asc'
        }
      ]
    })
    return posts
  }


  // ---
  async delete (postId: string): Promise<void> {
    await this.db.post.delete({
      where: {
        id: postId
      }
    })
  }

  async getById(userId: string, postId: string, status?: PostStatus): Promise<PostDTO | null> {
    const followingUserIds = await this.getFollowingUsers(userId);
    const filter = {
      AND: {
        OR: [
          this.buildPostFilter(followingUserIds,null, status),
          this.buildPostFilter(followingUserIds, postId, status),
        ],
        id: postId
      }
    };

    const post = await this.db.post.findFirst({
      where: filter
    });
    return post ? this.getPostDTO(userId, post) : null;
  }

  async getCommentOrPostById(userId: string, postId: string, status?: PostStatus): Promise<PostDTO | null> {
    const followingUserIds = await this.getFollowingUsers(userId);
    const filter = {
      AND: {
        OR: [
          this.getAnyPostById(followingUserIds, status),
        ],
        id: postId
      }
    };
    const post = await this.db.post.findFirst({
      where: filter
    });
    return post ? this.getPostDTO(userId, post) : null;
  }


// --- HELPER FUNCTIONS --- Todo: Should they be moved to another file? Should also chance the interface.

  async postExistsById(postId: string): Promise<boolean> {

    const post = await this.db.post.findUnique({
      where: {
        id: postId
      }
    })
    return (post != null)
  }

  async getByAuthorId(userId: string, authorId: string, includeComments?: boolean): Promise<ExtendedPostDTO[]> {
    if(!await this.canViewPosts(userId, authorId)) {
      throw new Error("You can't see this user's posts. It may be that the user is private or that it doesn't exist.")
    }

    const posts = await this.db.post.findMany({
      where: { authorId, status: PostStatus.APPROVED, respondsTo: includeComments ? undefined : null },
    });

    return this.getListOfDtoWithPreSignedUrls(userId, posts)
  }


  async isFollowed (userId:string, authorId: string): Promise<boolean> {
    if(userId === authorId) return true;

    const follow = await this.db.follow.findFirst({
      where: {
        followedId: authorId,
        followerId: userId
      }
    })
    return !!follow;
  }

  private async getFollowingUsers(userId: string): Promise<string[]> {
    const followedIds = await this.db.follow.findMany({
      where: {
        followerId: userId
      },
      select: {
        followedId: true // Select only the `followedId` field
      }
    });
    return [userId, ...followedIds.map(follow => follow.followedId)];
  }

  private buildPostFilter(followingUserIds: string[], respondsTo: string | null = null, status?: PostStatus): object {
    return {
      AND: {
        OR: [
          { authorId: { in: followingUserIds } },
          { author: { isPublic: true } },
        ],
        respondsTo: respondsTo ? { id: respondsTo } : null, // Porque tengo esto? porque si quiero extraer solo los post sin comments
        status: status ?? PostStatus.APPROVED
      }
    };
  }

  private getAnyPostById(followingUserIds: string[], status?: PostStatus): object {
    return {
      AND: {
        OR: [
          { authorId: { in: followingUserIds } },
          { author: { isPublic: true } },
        ],
        status: status ?? PostStatus.APPROVED
      }
    };
  }

  async getPostAuthor(postId: string): Promise<string | undefined> {
    const post = await this.db.post.findFirst({
      where: {
        id: postId,
        status: PostStatus.APPROVED
      },
      select: {
        authorId: true,
      }
    });
    return post?.authorId;
  }

  private async authorIsPublic(authorId: string): Promise<boolean> {
    const author = await this.db.user.findUnique({
      where: {
        id: authorId
      },
      select: {
        isPublic: true
      }
    });
    return author?.isPublic ?? false;
  }

  public async canViewPosts(userId: string, authorId: string): Promise<boolean> {
    if(userId === authorId) return true;
    const user = await this.db.user.findUnique({
      where: { id: authorId },
      select: {
        isPublic: true,
        followers: { where: { followerId: userId }, select: { id: true } },
      },
    });
    return !!user && (user.isPublic || user.followers.length > 0);
  }

  async canPostComment(userId: string, postId: string): Promise<boolean | Error> {
    const author = await this.getPostAuthor(postId);
    if (author == undefined) {
      return Error("You can't comment on this post. It may be that the author doesn't exist.")
    }
    else if (!await this.isFollowed(userId, author) && !await this.authorIsPublic(author)) {
      return Error("You can't comment on this post. " +
        "It may be that the author is private and you don't follow them")
    }
    else if(await this.postIsPending(postId)) {
      return Error("You can't comment on this post. It may be that the post has not yet been published")
    }
    return true
  }

  private async postIsPending(postId: string): Promise<boolean> {
    return this.db.post.findFirst({
      where: {
        id: postId,
        status: PostStatus.PENDING
      }
    }).then(post => !!post);
  }

  private renameDuplicateImages(images: string[]): string[] {
    const imageMap: Record<string, number> = {};
    const renamedImages: string[] = [];

    for (const image of images) {
      if (imageMap[image] === undefined) {
        // If there is no duplicates, add it to the imageMap with counter 0
        imageMap[image] = 0;
        renamedImages.push(image);
      } else {
        // Increment counter and rename
        imageMap[image]++;
        const newName = `${image} (${imageMap[image]})`;
        renamedImages.push(newName);
        imageMap[newName] = 0; // Register the new name as well
      }
    }

    return renamedImages;
  }

  private async createPresignedUrls(userId: string, postId: string, images: string[]): Promise<PendingPostDTO> {
    const preSignedUrls = await this.storageRepository.createPostPreSignedUrls(userId, postId, images)
    return {
      id: postId,
      preSignedUrls
    }
  }

  async finalize (postId: string): Promise<PostDTO> {
    const post = await this.db.post.update({
      where: {
        id: postId
      },
      data: {
        status: PostStatus.APPROVED
      }
    })
    return new PostDTO(post)
  }

  private async addPostToDB(userId: string, data: CreatePostInputDTO, respondsTo?: string): Promise<PostDTO | PendingPostDTO> {
    let status: PostStatus = PostStatus.APPROVED;
    if(data.images){
      status = PostStatus.PENDING;
      data.images = this.renameDuplicateImages(data.images);
    }

    const post = await this.db.post.create({
      data: {
        authorId: userId,
        respondsToId: respondsTo,
        ...data,
        status: status
      }
    })

    if(!data.images){
      return new PostDTO(post)
    }
    return this.createPresignedUrls(userId, post.id, data.images)
  }

  private async getListOfDtoWithPreSignedUrls(userId: string, posts: Post[]): Promise<ExtendedPostDTO[]> {
    const postsWithUrls: ExtendedPostDTO[] = []
    for (const post of posts) {
        postsWithUrls.push(await this.getPostDTO(userId, post))
    }
    return postsWithUrls
  }

  private async getPostDTO(userId: string, post: Post): Promise<ExtendedPostDTO> {
    if(post.images?.length){
      post.images = await this.storageRepository.getPostPreSignedUrls(userId, post.id)
    }

    const [qtyComments, qtyLikes, qtyRetweets] = await Promise.all([
      this.getQtyComments(post.id),
      this.getQtyOfReactions(post.id, ReactionType.LIKE),
      this.getQtyOfReactions(post.id, ReactionType.RETWEET)
    ]);

    const author = await this.getAuthorDTO(post.authorId);

    return new ExtendedPostDTO({
      ...post,
      author,
      qtyComments,
      qtyLikes,
      qtyRetweets
    });
  }

  private async getAuthorDTO(authorId: string): Promise<ExtendedUserDTO> {
    const author = await this.db.user.findUnique({
      where: { id: authorId },
    });

    if (!author) {
      throw new Error('Author not found');
    }

    return new ExtendedUserDTO({
      ...author
    });
  }


  private async getQtyComments(postId: string): Promise<number> {
    return this.db.post.count({
      where: {
        respondsToId: postId
      }
    })
  }

  private async getQtyOfReactions(postId: string, reaction: ReactionType): Promise<number> {
    return this.db.reaction.count({
      where: {
        postId,
        type: reaction
      }
    })
  }

  private sortByReactions(posts: ExtendedPostDTO[]): ExtendedPostDTO[] {
    return posts.sort((a, b) => {
      const totalReactionsA = (a.qtyLikes ?? 0) + (a.qtyRetweets ?? 0);
      const totalReactionsB = (b.qtyLikes ?? 0) + (b.qtyRetweets ?? 0);

      if (totalReactionsB !== totalReactionsA)
        return totalReactionsB - totalReactionsA;

      // If there is a tie, also sort by comments
      return (b.qtyComments ?? 0) - (a.qtyComments ?? 0);
    });
  }



}
