import {CreateReactionInputDTO} from "@domains/reaction/dto";
import {PostDTO} from "@domains/post/dto";
import {ReactionType} from "@prisma/client";

export interface ReactionRepository {
  createReaction: (input: CreateReactionInputDTO) => Promise<string>
  deleteReaction: (input: CreateReactionInputDTO) => Promise<string>
  getReactions: (userId: string, otherId: string, reaction: ReactionType) => Promise<PostDTO[]>
}
