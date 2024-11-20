import { FollowerRepository } from '@domains/follower/repository/follower.repository';
import { Follow, PrismaClient } from '@prisma/client';


export class FollowerRepositoryImpl implements FollowerRepository{
  constructor (private readonly db: PrismaClient) {}

  async follow(followedId: string, followerId: string): Promise<Follow | string> {
    const existingFollow = await this.db.follow.findFirst({
      where: {
        followedId,
        followerId,
      },
    });

    if (existingFollow) {
      return await this.updateExistingFollow(existingFollow)
    }

    return await this.createFollow(followedId, followerId);
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

  async unfollow(followedId: string, followerId: string): Promise<boolean | string> {
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
}
