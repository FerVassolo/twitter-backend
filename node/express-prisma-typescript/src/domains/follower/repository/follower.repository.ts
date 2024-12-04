import { Follow } from '@prisma/client';


export interface FollowerRepository{
    follow: (followedId: string, followerId: string) =>  Promise<Follow | string>
    unfollow: (followedId: string, followerId: string) => Promise<boolean | string>
    isFollower: (followedId: string, followerId: string) => Promise<boolean>
    getFriends: (userId: string) => Promise<string[]>
    areFriends: (userId: string, friendId: string) => Promise<boolean>

}
