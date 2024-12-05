
// they may return a boolean, but void is fine.
import { Follow } from '@prisma/client';

export interface FollowerService {
  follow: (followedId: string, followerId: string) =>  Promise<Follow>
  unfollow: (followedId: string, followerId: string) => Promise<boolean>
  getFriends: (userId: string) => Promise<string[]> // We consider friends to those users the user follow and the users follow them back
  areFriends: (userId: string, friendId: string) => Promise<boolean>
}
