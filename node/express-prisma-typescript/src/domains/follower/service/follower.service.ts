
// they may return a boolean, but void is fine.
import { Follow } from '@prisma/client';

export interface FollowerService {
  follow: (followedId: string, followerId: string) =>  Promise<Follow>
  unfollow: (followedId: string, followerId: string) => Promise<boolean>
}
