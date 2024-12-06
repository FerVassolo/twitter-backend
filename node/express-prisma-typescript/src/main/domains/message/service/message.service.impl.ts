import { MessageService } from '@main/domains/message/service/message.service'
import { MessageRepository } from '@main/domains/message/repository/message.repository'
import { Message } from '@prisma/client'

export class MessageServiceImpl implements MessageService {
  constructor (private readonly messageRepository: MessageRepository) {}

  async saveMessage (message: string, senderId: string, receiverId: string): Promise<Message> {
    return await this.messageRepository.saveMessage(message, senderId, receiverId)
  }

  async deleteMessage (messageId: string, deleterId: string): Promise<void> {
    await this.messageRepository.deleteMessage(messageId, deleterId)
  }

  async getMessagesPaginated (userId: string, otherId: string, skip?: number, take?: number): Promise<Message[]> {
    return await this.messageRepository.getMessagesPaginated(userId, otherId, skip, take)
  }
}
