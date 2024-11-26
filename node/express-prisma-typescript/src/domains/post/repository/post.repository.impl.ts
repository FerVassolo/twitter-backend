import { PrismaClient } from '@prisma/client'

import { CursorPagination } from '@types'

import { PostRepository } from '.'
import { CreatePostInputDTO, PostDTO } from '../dto'

export class PostRepositoryImpl implements PostRepository {
  constructor (private readonly db: PrismaClient) {}

  async create (userId: string, data: CreatePostInputDTO): Promise<PostDTO> {
    const post = await this.db.post.create({
      data: {
        authorId: userId,
        ...data
      }
    })
    return new PostDTO(post)
  }

  async createComment (userId: string, postId: string, data: CreatePostInputDTO): Promise<PostDTO> {
    const author = await this.getPostAuthor(postId);
    if (author == undefined) {
      throw new Error("You can't comment on this post. It may be that the author doesn't exist.")
    }
    else if (!await this.isFollowed(userId, author) && !await this.authorIsPublic(author)) {
      throw new Error("You can't comment on this post. " +
        "It may be that the author is private and you don't follow them")
    }

    const post = await this.db.post.create({
      data: {
        authorId: userId,
        respondsToId: postId,
        ...data
      }
    })
    return new PostDTO(post)
  }

  async getAllByDatePaginated (userId: string, options: CursorPagination): Promise<PostDTO[]> {
    const followingUserIds = await this.getFollowingUsers(userId);
    const filter = this.buildPostFilter(followingUserIds);

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
    return posts.map(post => new PostDTO(post))
  }

  async getAllCommentsByDatePaginated (userId: string, postId: string, options: CursorPagination): Promise<PostDTO[]> {
    const followingUserIds = await this.getFollowingUsers(userId);
    followingUserIds.push(userId); // You should be able to see your own posts
    const filter = this.buildPostFilter(followingUserIds, postId);  // You cannot see comments from private accounts

    console.log("userId: ", userId);
    console.log("postId: ", postId);
    // print all following users
    console.log("followingUserIds: ", followingUserIds);

    const comments = await this.db.post.findMany({
      where: {
        ...filter,
        respondsToId: postId
      },
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
    return comments.map(comment => new PostDTO(comment))
  }

  async delete (postId: string): Promise<void> {
    await this.db.post.delete({
      where: {
        id: postId
      }
    })
  }

  async getById(userId: string, postId: string): Promise<PostDTO | null> {
    const followingUserIds = await this.getFollowingUsers(userId);
    followingUserIds.push(userId); // You should be able to see your own posts
    const filter = {
      AND: {
        OR: [
          this.buildPostFilter(followingUserIds),
          this.buildPostFilter(followingUserIds, postId),
        ],
        id: postId
      }
    };

    const post = await this.db.post.findFirst({
      where: filter
    });
    return post ? new PostDTO(post) : null;
  }

  async postExistsById(postId: string): Promise<boolean> {

    const post = await this.db.post.findUnique({
      where: {
        id: postId
      }
    })
    return (post != null)
  }


  async getByAuthorId(userId: string, authorId: string): Promise<PostDTO[]> {
    if(!await this.canViewPosts(userId, authorId)) {
      throw new Error("You can't see this user's posts. It may be that the user is private or that it doesn't exist.")
    }

    const posts = await this.db.post.findMany({
      where: { authorId },
    });

    return posts.map(post => new PostDTO(post));
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

  private async userExists (userId: string): Promise<boolean> {
    const user = await this.db.user.findUnique({
      where: {
        id: userId
      }
    })
    return !!user;
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

    return followedIds.map(follow => follow.followedId);
  }

  private buildPostFilter(followingUserIds: string[], retrieveComments: string | null = null): object {
    return {
      AND: {
        OR: [
          { authorId: { in: followingUserIds } },
          { author: { isPublic: true } },
        ],
        respondsTo: retrieveComments ? { id: retrieveComments } : null
      }
    };
  }

  private async getPostAuthor(postId: string): Promise<string | undefined> {
    const post = await this.db.post.findUnique({
      where: {
        id: postId
      },
      select: {
        authorId: true
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
    const user = await this.db.user.findUnique({
      where: { id: authorId },
      select: {
        isPublic: true,
        followers: { where: { followerId: userId }, select: { id: true } },
      },
    });
    return !!user && (user.isPublic || user.followers.length > 0);
  }

}
