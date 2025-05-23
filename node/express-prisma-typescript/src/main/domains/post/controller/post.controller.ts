import { Request, Response, Router } from 'express'
import HttpStatus from 'http-status'
// express-async-errors is a module that handles async errors in express, don't forget import it in your new controllers
import 'express-async-errors'

import { db, BodyValidation } from 'main/utils'

import { PostRepositoryImpl } from '../repository'
import { PostService, PostServiceImpl } from '../service'
import { CreatePostInputDTO } from '../dto'

export const postRouter = Router()

// Use dependency injection
const service: PostService = new PostServiceImpl(new PostRepositoryImpl(db))

/**
 * @swagger
 * tags:
 *   - name: Post
 *     description: Operations related to users
 */

/**
 * @swagger
 * /api/post:
 *   get:
 *     summary: Retrieves a list of posts from public users or users followed by the authenticated user.
 *     tags: [Post]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           example: "10"
 *         description: The maximum number of posts to retrieve.
 *         required: false
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: Cursor for reverse pagination.
 *         required: false
 *       - in: query
 *         name: after
 *         schema:
 *           type: string
 *         description: Cursor for forward pagination.
 *         required: false
 *     responses:
 *       200:
 *         description: Successfully retrieved the list of posts.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PostDTO'
 *       401:
 *         description: Unauthorized.
 */
postRouter.get('/', async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { limit, before, after } = req.query as Record<string, string>

  const posts = await service.getLatestPosts(userId, { limit: Number(limit), before, after })

  return res.status(HttpStatus.OK).json(posts)
})

/**
 * @swagger
 * /api/post/{postId}:
 *   get:
 *     summary: Retrieves a post by its ID.
 *     tags: [Post]
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the post to retrieve.
 *     responses:
 *       200:
 *         description: Successfully retrieved the post.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PostDTO'
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Post not found. It may be that the author is private and you don't follow them.
 */
postRouter.get('/:postId', async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { postId } = req.params

  const post = await service.getPost(userId, postId)

  return res.status(HttpStatus.OK).json(post)
})

/**
 * @swagger
 * /api/post/by_user/{userId}:
 *   get:
 *     summary: Retrieves a list of the posts from a specific user.
 *     tags: [Post]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user whose posts to retrieve.
 *     responses:
 *       200:
 *         description: Successfully retrieved the list of posts.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PostDTO'
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: User not found. It may be that the user is private or that it doesn't exist.
 */
postRouter.get('/by_user/:userId', async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { userId: authorId } = req.params

  const posts = await service.getPostsByAuthor(userId, authorId)

  return res.status(HttpStatus.OK).json(posts)
})

/**
 * @swagger
 * /api/post:
 *   post:
 *     summary: Creates a new post by the authenticated user.
 *     tags: [Post]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePostInputDTO'
 *     responses:
 *       201:
 *         description: Successfully created a new post.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PostDTO'
 *       400:
 *         description: Invalid input data.
 *       401:
 *         description: Unauthorized.
 */
postRouter.post('/', BodyValidation(CreatePostInputDTO), async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const data = req.body

  const post = await service.createPost(userId, data)

  return res.status(HttpStatus.CREATED).json(post)
})

postRouter.post('/finalize/:postId', async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { postId } = req.params

  const post = await service.finalizePost(userId, postId)
  return res.status(HttpStatus.CREATED).json(post)
})

/**
 * @swagger
 * /api/post/{postId}:
 *   delete:
 *     summary: Deletes a post by its ID.
 *     tags: [Post]
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the post to delete.
 *     responses:
 *       200:
 *         description: Successfully deleted the post.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Deleted post {postId}
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Post not found. It may be that the author is private and you don't follow them, or the post doesn't exist.
 */
postRouter.delete('/:postId', async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { postId } = req.params

  await service.deletePost(userId, postId)

  return res.status(HttpStatus.OK).send(`Deleted post ${postId}`)
})

postRouter.post('/comment/:postId', async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const data = req.body
  const { postId } = req.params

  const post = await service.createComment(userId, postId, data)

  return res.status(HttpStatus.CREATED).json(post)
})

postRouter.get('/comment/:postId', async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { limit, before, after } = req.query as Record<string, string>
  const { postId } = req.params

  const comments = await service.getLatestComments(userId, postId, { limit: Number(limit), before, after })
  return res.status(HttpStatus.OK).json(comments)
})

postRouter.post('/comment/finalize/:postId', async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { postId } = req.params

  const post = await service.finalizePost(userId, postId)

  return res.status(HttpStatus.CREATED).json(post)
})

postRouter.get('/comments/user/:user_id', async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { user_id: otherId } = req.params
  const reactions = await service.getCommentsByAuthor(userId, otherId)
  res.status(HttpStatus.OK).json(reactions)
})
