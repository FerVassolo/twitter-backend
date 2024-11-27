import { Request, Response, Router } from 'express'
import HttpStatus from 'http-status'
// express-async-errors is a module that handles async errors in express, don't forget import it in your new controllers
import 'express-async-errors'


import { StorageRepositoryImpl } from '../repository'
import { StorageService, StorageServiceImpl } from '../service'

// AS FOR NOW, THIS IS OBSOLETE. There shouldnt be a storage controller.
// IM using this controller ONLY so I can test  the service and repository.
export const storageRouter = Router()

// Use dependency injection
const service: StorageService = new StorageServiceImpl(new StorageRepositoryImpl())

storageRouter.post('/profile-image', async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const result = await service.createProfilePreSignedUrl(userId)
  res.status(HttpStatus.CREATED).json(result)
})

storageRouter.get('/profile-image/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params
  const result = await service.getProfilePreSignedUrl(userId)
  res.status(HttpStatus.CREATED).json(result)
})

// TODO: Debería verificar que el post es del usuario. No se puede editar un post.
storageRouter.post('/post/:postId', async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { postId } = req.params
  const result = await service.createPostPreSignedUrl(userId, postId)
  res.status(HttpStatus.CREATED).json(result)
})

storageRouter.get('/post/:postId', async (req: Request, res: Response) => {
  const { userId } = res.locals.context
  const { postId } = req.params
  const result = await service.getPostPreSignedUrl(userId, postId)
  res.status(HttpStatus.CREATED).json(result)
})
