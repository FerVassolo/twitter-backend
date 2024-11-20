import { Follow } from '@prisma/client';


export interface FollowerRepository{
    follow: (followedId: string, followerId: string) =>  Promise<Follow | string>
    unfollow: (followedId: string, followerId: string) => Promise<boolean | string>
}
