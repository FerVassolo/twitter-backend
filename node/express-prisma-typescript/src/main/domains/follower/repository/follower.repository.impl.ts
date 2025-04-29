import { FollowerRepository } from '@main/domains/follower/repository/follower.repository';
import { Follow, PrismaClient } from '@prisma/client';
import {OffsetPagination} from "@main/types";


export class FollowerRepositoryImpl implements FollowerRepository{
  constructor (private readonly db: PrismaClient) {}

  async follow(followedId: string, followerId: string): Promise<Follow | string> {
    if(!await this.userExists(followedId))
      return 'The other user does not exist'

    const existingFollow = await this.findFollow(followedId, followerId);

    if (existingFollow) {
      return await this.updateExistingFollow(existingFollow)
    }

    return await this.createFollow(followedId, followerId);
  }

  async unfollow(followedId: string, followerId: string): Promise<boolean | string> {
    if(!await this.userExists(followedId))
      return 'The other user does not exist'

    return this.db.follow.updateMany({
      where: {
        followerId,
        followedId,
        deletedAt: null // Solo afecta relaciones activas
      },
      data: {
        deletedAt: new Date() // Marca como eliminado
      }
    }).then(() => true).catch(() => "Error unfollowing user");
  }


  async updateExistingFollow(existingFollow: Follow): Promise<Follow | string> {
    if (existingFollow.deletedAt === null) {
      return 'Follow relationship already exists.'
    }

    return this.db.follow.update({
      where: { id: existingFollow.id },
      data: { deletedAt: null },
    });
  }

  async createFollow(followedId: string, followerId: string): Promise<Follow> {
    return this.db.follow.create({
      data: {
        followedId,
        followerId,
      },
    });
  }
  async userExists(userId: string): Promise<boolean> {
    // Check if the followed user exists
    try {
      const followedUser = await this.db.user.findUnique({
        where: { id: userId },
      });
      return true
    }
    catch (error) {
      return false
    }
  }

  async findFollow(followedId: string, followerId: string): Promise<Follow | null> {
    return this.db.follow.findFirst({
      where: {
        followedId,
        followerId,
      },
    });
  }
  async isFollower(followedId: string, followerId: string): Promise<boolean> {
    const follow = await this.db.follow.findFirst({
      where: {
        followedId,
        followerId,
        deletedAt: null
      }
    })

    return !!follow
  }

  async isFollowed (userId:string, otherId: string): Promise<boolean> {
    if(userId === otherId) return true;

    const follow = await this.db.follow.findFirst({
      where: {
        followedId: otherId,
        followerId: userId
      }
    })
    return !!follow;
  }

  async getFriends(userId: string): Promise<string[]> {
    // Ids of users followed by the user.
    const followed = await this.db.follow.findMany({
      where: {
        followerId: userId,
        deletedAt: null,
      },
      select: {
        followedId: true,
      },
    });

    // Extract the followed IDs.
    const followedIds = followed.map(f => f.followedId);

    // Search for friends (users that follow the user).
    const friends = await this.db.follow.findMany({
      where: {
        followerId: {
          in: followedIds,
        },
        followedId: userId,
        deletedAt: null,
      },
      select: {
        followerId: true,
      },
    });

    return friends.map(friend => friend.followerId);
  }

  async areFriends(userId: string, friendId: string): Promise<boolean> {
    if(userId === friendId) return true
    const isUserFollowingFriend = await this.isFollower(friendId, userId);
    const isFriendFollowingUser = await this.isFollower(userId, friendId);

    return isUserFollowingFriend && isFriendFollowingUser;
  }

  async getFollowingUsers(userId: string): Promise<string[]> {

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

  async getFollowedByUsersTheUserFollows(userId: string, options: OffsetPagination): Promise<string[]> {
    const following: string[] = await this.getFollowingUsers(userId);

    if (following.length === 0) {
      return [];
    }
    return this.getPaginatedUsers(userId, [], following, options);
  }


  private async getPaginatedUsers(
    userId: string,
    followedIds: string[],
    pendingFollowersIds: string[],
    options: OffsetPagination
  ): Promise<string[]> {
    let followedTotal = new Set(followedIds);
    let remainingIds = [...pendingFollowersIds];
    let skip = options.skip || 0;
    let limit = options.limit || 0;

    while (remainingIds.length > 0 && limit > 0) {
      const { followedIds: processed, unprocessed } = await this.getRelatedFollowers(
        userId,
        remainingIds,
        { limit, skip }
      );

      for (const id of processed) {
        followedTotal.add(id);
      }
      remainingIds = unprocessed;
      skip += limit;
      limit -= processed.length;
    }

    return Array.from(followedTotal);
  }
  private async getRelatedFollowers(userId: string, following: string[], options: OffsetPagination): Promise<{ followedIds: string[]; unprocessed: string[] }> {
    const unprocessedFollowerIds: string[] = [];

    const retrievedUsers = await this.relatedFollowers(userId, following, options);

    // We eliminate duplicated users by converting the array to a Set and then back to an array
    const followedIds: string[] = Array.from(new Set(retrievedUsers.map(f => f.followedId)));

    const processedFollowerIds =  new Set(retrievedUsers.map(f => f.followerId));
    unprocessedFollowerIds.push( ...following.filter(followerId => !processedFollowerIds.has(followerId)));

    return { followedIds: followedIds, unprocessed: unprocessedFollowerIds };
  }

  private async relatedFollowers( userId: string, following: string[], options: OffsetPagination): Promise<{ followerId: string; followedId: string }[]> {
    const followed = await this.db.follow.findMany({
      where: {
        followerId: {
          in: following,
        },
        followedId: {
          not: userId,
        },
      },
      select: {
        followerId: true,
        followedId: true,
      },
      take: options.limit ? options.limit : undefined,
      skip: options.skip ? options.skip : undefined,
    });

    return followed.map(f => ({
      followerId: f.followerId,
      followedId: f.followedId,
    }));
  }


}
