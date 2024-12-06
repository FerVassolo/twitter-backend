import { FollowerRepository } from '@main/domains/follower/repository/follower.repository'
import { Follow, PrismaClient } from '@prisma/client'

export class FollowerRepositoryImpl implements FollowerRepository {
  constructor (private readonly db: PrismaClient) {}

  async follow (followedId: string, followerId: string): Promise<Follow | string> {
    if (!await this.userExists(followedId)) { return 'The other user does not exist' }

    const existingFollow = await this.findFollow(followedId, followerId)

    if (existingFollow) {
      return await this.updateExistingFollow(existingFollow)
    }

    return await this.createFollow(followedId, followerId)
  }

  async unfollow (followedId: string, followerId: string): Promise<boolean | string> {
    if (!await this.userExists(followedId)) { return 'The other user does not exist' }

    return await this.db.follow.updateMany({
      where: {
        followerId,
        followedId,
        deletedAt: null // Solo afecta relaciones activas
      },
      data: {
        deletedAt: new Date() // Marca como eliminado
      }
    }).then(() => true).catch(() => 'Error unfollowing user')
  }

  async updateExistingFollow (existingFollow: Follow): Promise<Follow | string> {
    if (existingFollow.deletedAt === null) {
      return 'Follow relationship already exists.'
    }

    return await this.db.follow.update({
      where: { id: existingFollow.id },
      data: { deletedAt: null }
    })
  }

  async createFollow (followedId: string, followerId: string): Promise<Follow> {
    return await this.db.follow.create({
      data: {
        followedId,
        followerId
      }
    })
  }

  async userExists (userId: string): Promise<boolean> {
    // Check if the followed user exists
    try {
      const followedUser = await this.db.user.findUnique({
        where: { id: userId }
      })
      return true
    } catch (error) {
      return false
    }
  }

  async findFollow (followedId: string, followerId: string): Promise<Follow | null> {
    return await this.db.follow.findFirst({
      where: {
        followedId,
        followerId
      }
    })
  }

  async isFollower (followedId: string, followerId: string): Promise<boolean> {
    const follow = await this.db.follow.findFirst({
      where: {
        followedId,
        followerId,
        deletedAt: null
      }
    })

    return !!follow
  }

  async getFriends (userId: string): Promise<string[]> {
    // Ids of users followed by the user.
    const followed = await this.db.follow.findMany({
      where: {
        followerId: userId,
        deletedAt: null
      },
      select: {
        followedId: true
      }
    })

    // Extract the followed IDs.
    const followedIds = followed.map(f => f.followedId)

    // Search for friends (users that follow the user).
    const friends = await this.db.follow.findMany({
      where: {
        followerId: {
          in: followedIds
        },
        followedId: userId,
        deletedAt: null
      },
      select: {
        followerId: true
      }
    })

    return friends.map(friend => friend.followerId)
  }

  async areFriends (userId: string, friendId: string): Promise<boolean> {
    if (userId === friendId) return true
    const isUserFollowingFriend = await this.isFollower(friendId, userId)
    const isFriendFollowingUser = await this.isFollower(userId, friendId)

    return isUserFollowingFriend && isFriendFollowingUser
  }
}
