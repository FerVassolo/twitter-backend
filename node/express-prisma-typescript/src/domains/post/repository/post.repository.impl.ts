import {Post, PostStatus, PrismaClient} from '@prisma/client'

import {CursorPagination} from '@types'

import {PostRepository} from '.'
import {CreatePostInputDTO, PendingPostDTO, PostDTO} from '../dto'
import {StorageRepository, StorageRepositoryImpl} from "@domains/storage/repository";

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


  async getAllByDatePaginated (userId: string, options: CursorPagination): Promise<PostDTO[]> {
    const followingUserIds = await this.getFollowingUsers(userId);
    const filter = this.buildPostFilter(followingUserIds);

    const posts = await this.getPostByFilters(options, filter)
    return this.getListOfDtoWithPreSignedUrls(userId, posts)
  }

  async getAllCommentsByDatePaginated (userId: string, postId: string, options: CursorPagination): Promise<PostDTO[]> {
    const followingUserIds = await this.getFollowingUsers(userId);

    // You cannot see comments from private accounts
    const filter = {
      ...this.buildPostFilter(followingUserIds, postId),
      respondsToId: postId,
    };

    const posts = await this.getPostByFilters(options, filter)
    return this.getListOfDtoWithPreSignedUrls(userId, posts)
  }

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
    return post ? this.getDtoWithPreSignedUrl(userId, post) : null;
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
    return post ? this.getDtoWithPreSignedUrl(userId, post) : null;
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

  async getByAuthorId(userId: string, authorId: string, includeComments?: boolean): Promise<PostDTO[]> {
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

  private async getListOfDtoWithPreSignedUrls(userId: string, posts: Post[]): Promise<PostDTO[]> {
    const postsWithUrls: PostDTO[] = []
    for (const post of posts) {
        postsWithUrls.push(await this.getDtoWithPreSignedUrl(userId, post))
    }
    return postsWithUrls
  }

  private async getDtoWithPreSignedUrl(userId: string, post: Post): Promise<PostDTO> {
    if(post.images){
      post.images = await this.storageRepository.getPostPreSignedUrls(userId, post.id)
      return new PostDTO(post)
    }
    else {
      return new PostDTO(post)
    }
  }

}
