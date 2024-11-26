import { Request, Response, Router } from 'express'
import HttpStatus from 'http-status'
// express-async-errors is a module that handles async errors in express, don't forget import it in your new controllers
import 'express-async-errors'

import { db } from '@utils'
import { ReactionRepositoryImpl } from '../repository/reaction.repository.impl'
import { ReactionServiceImpl } from '../service/reaction.service.impl'
import { ReactionService } from '../service/reaction.service'
import {ReactionType} from "@prisma/client";

export const reactionRouter = Router()
const service: ReactionService = new ReactionServiceImpl(new ReactionRepositoryImpl(db))

// must be follower to react (or a public account). However, if it stops following, the reaction stays.
reactionRouter.post('/:post_id', async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { post_id: postId } = req.params
  const { reactionType } = req.body

  const reaction = await service.reactToPost({ userId, postId, reactionType })
  res.status(HttpStatus.CREATED).json(reaction)
})

// To delete it is not necesary to be follower and stuff.
reactionRouter.delete('/:post_id', async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { post_id: postId } = req.params
  const { reactionType } = req.body

  const response = await service.deleteReaction({ userId, postId, reactionType })
  res.status(HttpStatus.NO_CONTENT).json(response)
})

reactionRouter.get('/likes/:user_id', async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { user_id: otherId } = req.params
  const reactions = await service.getReactions(userId, otherId, ReactionType.LIKE)
  res.status(HttpStatus.OK).json(reactions)
})

reactionRouter.get('/retweets/:user_id', async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { user_id: otherId } = req.params
  const reactions = await service.getReactions(userId, otherId, ReactionType.RETWEET)
  res.status(HttpStatus.OK).json(reactions)
})
