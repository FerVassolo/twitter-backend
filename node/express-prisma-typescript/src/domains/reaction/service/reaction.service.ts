import { CreateReactionInputDTO } from '../dto/index'
import {PostDTO} from "@domains/post/dto";
import {ReactionType} from "@prisma/client";

export interface ReactionService {
  reactToPost: (input: CreateReactionInputDTO) => Promise<string>
  deleteReaction: (input: CreateReactionInputDTO) => Promise<string>
  getReactions: (userId: string, otherId: string, reaction: ReactionType) => Promise<PostDTO[]>
}
