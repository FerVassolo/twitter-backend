import { Request, Response, Router } from 'express'
import HttpStatus from 'http-status'
import 'express-async-errors'

import { db } from 'main/utils'
import { FollowerService, FollowerServiceImpl } from '@main/domains/follower/service';
import { FollowerRepositoryImpl } from '@main/domains/follower/repository';

export const followerRouter = Router()

const service: FollowerService = new FollowerServiceImpl(new FollowerRepositoryImpl(db))

followerRouter.post('/follow/:user_id', async (req: Request, res: Response) => {
    const { userId } = res.locals.context
    const { user_id: otherUserId } = req.params;
    console.log(otherUserId)
    console.log(userId)

    try {
      const follow = await service.follow(otherUserId, userId)
      res.status(HttpStatus.CREATED).json(follow)
    }
    catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      res.status(HttpStatus.BAD_REQUEST).json({ error: errorMessage });
    }
})

followerRouter.post('/unfollow/:user_id', async (req: Request, res: Response) => {
    const { userId } = res.locals.context
    const { user_id: otherUserId } = req.params;

    try {
      const unfollow = await service.unfollow(otherUserId, userId)
      res.status(HttpStatus.ACCEPTED).json(unfollow)
    }
    catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      res.status(HttpStatus.BAD_REQUEST).json({ error: errorMessage });
    }
})

