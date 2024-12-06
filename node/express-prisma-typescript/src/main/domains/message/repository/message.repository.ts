import { Message } from '@prisma/client'

export interface MessageRepository {
  saveMessage: (message: string, senderId: string, receiverId: string) => Promise<Message>
  deleteMessage: (messageId: string, deleterId: string) => Promise<void> // Deleter should be the same id as the messageId.senderId
  getMessagesPaginated: (userId: string, otherId: string, skip?: number, take?: number) => Promise<Message[]>
}
