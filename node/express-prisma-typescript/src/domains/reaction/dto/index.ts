import {IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength} from "class-validator";
import {ReactionType} from "@prisma/client";

export class CreateReactionInputDTO {
  @IsString()
  @IsNotEmpty()
    userId!: string

  @IsString()
  @IsNotEmpty()
    postId!: string

  @IsString()
  @IsNotEmpty()
    reactionType!: ReactionType
}
