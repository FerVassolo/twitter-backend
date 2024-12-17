import { MessageService, MessageServiceImpl } from '@main/domains/message/service'
import { MessageRepository } from '@main/domains/message/repository'
import { Message } from '@prisma/client'

jest.mock('../../../src/main/domains/message/repository/message.repository')

describe('Message Service', () => {
  let messageService: MessageService
  let messageRepositoryMock: jest.Mocked<MessageRepository>

  beforeEach(() => {
    messageRepositoryMock = {
      saveMessage: jest.fn(),
      deleteMessage: jest.fn(),
      getMessagesPaginated: jest.fn()
    } as unknown as jest.Mocked<MessageRepository>
    messageService = new MessageServiceImpl(messageRepositoryMock)
  })

  it('Save Message', () => {
    const message: Message = { id: 'id', senderId: 'senderId', receiverId: 'receiverId', content: 'A veces la lluvia solo moja pensó', createdAt: new Date(), updatedAt: new Date(), deletedAt: null }
    messageRepositoryMock.saveMessage.mockResolvedValue(message)

    const res = messageService.saveMessage('A veces la lluvia solo moja pensó', 'senderId', 'receiverId')

    expect(res).resolves.toEqual(message)
  })

  it('Delete Message', () => {
    messageRepositoryMock.deleteMessage.mockResolvedValue()

    const res = messageService.deleteMessage('messageId', 'deleterId')

    expect(res).resolves.toEqual(undefined)
  })

  it('Get Messages Paginated', () => {
    const messages: Message[] = [
      { id: 'id1', senderId: 'senderId', receiverId: 'receiverId', content: 'Preso de tu ilusión vas a bailar', createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      { id: 'id2', senderId: 'senderId', receiverId: 'receiverId', content: 'Por mis penas bailar', createdAt: new Date(), updatedAt: new Date(), deletedAt: null }
    ]

    messageRepositoryMock.getMessagesPaginated.mockResolvedValue(messages)

    const res = messageService.getMessagesPaginated('userId', 'otherId', 0, 2)
    expect(res).resolves.toEqual(messages)
  })
})
