import { Request, Response, Router } from 'express'
import HttpStatus from 'http-status'
// express-async-errors is a module that handles async errors in express, don't forget import it in your new controllers
import 'express-async-errors'

import { db } from 'main/utils'

import { UserRepositoryImpl } from '../repository'
import { UserService, UserServiceImpl } from '../service'

export const userRouter = Router()

// Use dependency injection
const service: UserService = new UserServiceImpl(new UserRepositoryImpl(db))

/**
 * @swagger
 * tags:
 *   - name: User
 *     description: Operations related to users
 */

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Returns a list of users that are followed by users the original user follows. Catchy, innit?
 *     tags:
 *       - User
 *     parameters:
 *       - name: limit
 *         in: query
 *         description: Number of users to retrieve (optional)
 *         required: false
 *         schema:
 *           type: integer
 *       - name: skip
 *         in: query
 *         description: Number of users in the database to skip before starting to return users (optional)
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of recommended users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  $ref: '#/components/schemas/UserDTO'
 */
userRouter.get('/', async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { limit, skip } = req.query as Record<string, string>

  const users = await service.getUserRecommendations(userId, { limit: Number(limit), skip: Number(skip) })

  return res.status(HttpStatus.OK).json(users)
})

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Get the current user's information
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: Information about the current user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserDTO'
 *       404:
 *         description: Could not find user
 *       500:
 *         description: Internal Server Error
 */
userRouter.get('/me', async (req: Request, res: Response) => {
  const { userId } = res.locals.context

  const user = await service.getUser(userId, userId)

  return res.status(HttpStatus.OK).json(user)
})

/**
 * @swagger
 * /api/user/{userId}:
 *   get:
 *     summary: Get a user's information by ID
 *     tags:
 *       - User
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Information about the specified user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserDTO'
 *      404:
 *         description: Could not find user
 *       500:
 *         description: Internal Server Error
 */
userRouter.get('/:user_id', async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { user_id: otherUserId } = req.params

  const user = await service.getUser(otherUserId, userId)

  return res.status(HttpStatus.OK).json(user)
})

/**
 * @swagger
 * /api/user/make-public/{boolean}:
 *   post:
 *     summary: Update the visibility of the current user's profile
 *     tags:
 *       - User
 *     parameters:
 *       - name: boolean
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Whether to make the profile public or private
 *     responses:
 *       200:
 *         description: Visibility updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Confirmation message
 *       400:
 *         description: Invalid param value, they should be "true" or "false"
 */
userRouter.post('/make-public/:boolean', async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { boolean } = req.params
  const isPublic = boolean === 'true'

  if (boolean !== 'true' && boolean !== 'false') {
    return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid param value, they should be "true" or "false"' })
  }

  const response = await service.changeVisibility(userId, isPublic)
  return res.status(HttpStatus.OK).json({ message: response })
})

/**
 * @swagger
 * /api/user:
 *   delete:
 *     summary: Delete the current user's profile
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: Could not find user
 */
userRouter.delete('/', async (req: Request, res: Response) => {
  const { userId } = res.locals.context

  await service.deleteUser(userId)

  return res.status(HttpStatus.OK)
})

userRouter.get('/by_username/:username', async (req: Request, res: Response) => {
  const { username } = req.params
  const { limit, skip } = req.query as Record<string, string>

  const user = await service.getUsersByUsername(username, { limit: Number(limit), skip: Number(skip) })

  return res.status(HttpStatus.OK).json(user)
})
