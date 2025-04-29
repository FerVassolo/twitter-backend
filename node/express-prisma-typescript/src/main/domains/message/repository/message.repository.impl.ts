import {MessageRepository} from "@main/domains/message/repository/message.repository";
import {Message, PrismaClient} from "@prisma/client";

export class MessageRepositoryImpl implements MessageRepository{
  constructor (private readonly db: PrismaClient) {}

   async saveMessage(message: string, senderId: string, receiverId: string): Promise<Message> {
    return this.db.message.create({
      data: {
        content: message,
        senderId,
        receiverId
      }
    })
  }

  async deleteMessage(messageId: string, deleterId: string): Promise<void> {
    // TODO: Delete message from database (optional)
  }

  async getMessagesPaginated(userId: string, otherId: string, skip?: number, take?: number): Promise<Message[]> {
    console.log("skip", skip);
    console.log("take", take);

    // Ensure skip and take are numbers
    const validatedSkip = Number.isInteger(skip) ? skip : 0;
    const validatedTake = Number.isInteger(take) ? take : undefined;

    return this.db.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherId },
          { senderId: otherId, receiverId: userId },
        ],
      },
      orderBy: {
        createdAt: 'desc', // Order by descending createdAt
      },
      skip: validatedSkip,
      take: validatedTake,
    });
  }

}
