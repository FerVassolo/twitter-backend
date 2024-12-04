import {Message} from "@prisma/client";

export interface MessageService{
  saveMessage: (message: string, senderId: string, receiverId: string) => Promise<Message>
  deleteMessage: (messageId: string, deleterId: string) => Promise<void>
  getMessagesPaginated: (userId: string, otherId: string, skip?: number, take?: number)=> Promise<Message[]>
}
