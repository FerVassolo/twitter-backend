import { Router } from 'express'
import { db } from 'main/utils'
import { MessageService } from '@main/domains/message/service/message.service'
import { MessageServiceImpl } from '@main/domains/message/service/message.service.impl'
import { MessageRepositoryImpl } from '@main/domains/message/repository/message.repository.impl'
import HttpStatus from 'http-status'

export const messageRouter = Router()

const service: MessageService = new MessageServiceImpl(new MessageRepositoryImpl(db))

// Get the messages between you and the other_id. You can use pagination by sending skip and take as query parameters
messageRouter.get('/:other_id', async (req, res) => {
  const { userId } = res.locals.context
  const { other_id } = req.params
  const { skip, take } = req.query
  const response = await service.getMessagesPaginated(userId, other_id, Number(skip), Number(take))
  res.status(HttpStatus.CREATED).json(response)
})
