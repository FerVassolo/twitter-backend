import { Follow } from '@prisma/client';
import {OffsetPagination} from "@main/types";


export interface FollowerRepository{
    follow: (followedId: string, followerId: string) =>  Promise<Follow | string>
    unfollow: (followedId: string, followerId: string) => Promise<boolean | string>
    isFollower: (followedId: string, followerId: string) => Promise<boolean>
    isFollowed: (userId:string, otherId: string)=> Promise<boolean>
    getFriends: (userId: string) => Promise<string[]>
    areFriends: (userId: string, friendId: string) => Promise<boolean>
    getFollowingUsers: (userId: string)=> Promise<string[]>
    getFollowedByUsersTheUserFollows: (userId: string, options: OffsetPagination) => Promise<string[]>
}

