import { PrismaClient } from '@prisma/client'

import { CursorPagination } from '@types'

import { PostRepository } from '.'
import { CreatePostInputDTO, PostDTO } from '../dto'
import { UserDTO } from '@domains/user/dto';

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
      AND: [
        this.buildPostFilter(followingUserIds),
        { id: postId }
      ]
    };

    const post = await this.db.post.findFirst({
      where: filter
    });
    return post ? new PostDTO(post) : null;
  }

  async postExistsById(userId: string, postId: string): Promise<boolean> {
    const followingUserIds = await this.getFollowingUsers(userId);
    followingUserIds.push(userId); // You should be able to see your own posts

    const post = await this.db.post.findUnique({
      where: {
        id: postId
      }
    })
    return (post != null)
  }

  async getByAuthorId (userId: string, authorId: string): Promise<PostDTO[] | null> {
    if(!await this.isFollowed(userId, authorId)) {
        return null
    }

    if(!await this.userExists(authorId)) return null;

    const posts = await this.db.post.findMany({
      where: {
        authorId
      }
    })
    return posts.map(post => new PostDTO(post))
  }

  private async isFollowed (userId:string, authorId: string): Promise<boolean> {
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

    // Extract the `followedId`s as a list of strings
    return followedIds.map(follow => follow.followedId);
  }

  private buildPostFilter(followingUserIds: string[]): object {
    return {
      OR: [
        { authorId: { in: followingUserIds } },
        { author: { isPublic: true } },
      ],
    };
  }


}
