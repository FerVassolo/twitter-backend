import { FollowerService } from './follower.service'
import { FollowerRepository } from '@main/domains/follower/repository'
import { Follow } from '@prisma/client'

export class FollowerServiceImpl implements FollowerService {
  constructor (private readonly repository: FollowerRepository) {}

  async follow (followedId: string, followerId: string): Promise<Follow> {
    if (followedId === followerId) throw new Error('You cannot follow yourself')

    const follow = await this.repository.follow(followedId, followerId)
    console.log(follow)
    if (typeof follow === 'string') throw new Error(follow)
    return follow
  }

  async unfollow (followedId: string, followerId: string): Promise<boolean> {
    if (followedId === followerId) throw new Error('You cannot follow yourself')

    const unfollow = await this.repository.unfollow(followedId, followerId)
    if (typeof unfollow === 'string') throw new Error(unfollow)
    return unfollow
  }

  async getFriends (userId: string): Promise<string[]> {
    return await this.repository.getFriends(userId)
  }

  async areFriends (userId: string, friendId: string): Promise<boolean> {
    return await this.repository.areFriends(userId, friendId)
  }
}
