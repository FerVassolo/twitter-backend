import { Router } from 'express'
import { withAuth } from '@main/utils'

import { userRouter } from '@main/domains/user'
import {healthRouter} from "@main/domains/health";
import {authRouter} from "@main/domains/auth";
import {postRouter} from "@main/domains/post";
import {followerRouter} from "@main/domains/follower";
import {reactionRouter} from "@main/domains/reaction";
import {messageRouter} from "@main/domains/message";

export const router = Router()

router.use('/health', healthRouter)
router.use('/auth', authRouter)
router.use('/user', withAuth, userRouter)
router.use('/post', withAuth, postRouter)
router.use('/follower', withAuth, followerRouter)
router.use('/reaction', withAuth, reactionRouter)
router.use('/message', withAuth, messageRouter)
