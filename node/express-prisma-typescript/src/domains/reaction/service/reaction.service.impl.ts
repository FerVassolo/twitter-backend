import { CreateReactionInputDTO } from '../dto';
import { ReactionService } from './reaction.service'
import { ReactionRepository } from '../repository/reaction.repository'
import { PostDTO } from '@domains/post/dto';
import { ReactionType } from '@prisma/client';

export class ReactionServiceImpl implements ReactionService {
  constructor(private readonly repository: ReactionRepository) {
  }

  getReactions (userId: string, otherId: string, reaction: ReactionType): Promise<PostDTO[]>{

    return this.repository.getReactions(userId, otherId, reaction)
  }

  async reactToPost (input: CreateReactionInputDTO): Promise<string> {

    return await this.repository.createReaction(input)
  }

  async deleteReaction (input: CreateReactionInputDTO): Promise<string> {

    return await this.repository.deleteReaction(input)
  }
}
