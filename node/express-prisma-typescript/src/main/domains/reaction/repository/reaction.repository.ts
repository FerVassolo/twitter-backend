import {CreateReactionInputDTO} from "@main/domains/reaction/dto";
import {PostDTO} from "@main/domains/post/dto";
import {ReactionType} from "@prisma/client";

export interface ReactionRepository {
  createReaction: (input: CreateReactionInputDTO) => Promise<string>
  deleteReaction: (input: CreateReactionInputDTO) => Promise<string>
  getReactions: (userId: string, otherId: string, reaction: ReactionType) => Promise<PostDTO[]>
}
