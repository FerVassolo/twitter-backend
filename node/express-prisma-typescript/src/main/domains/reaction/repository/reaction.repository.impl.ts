import {PrismaClient, ReactionType} from '@prisma/client';
import {CreateReactionInputDTO} from '@main/domains/reaction/dto';
import {ReactionRepository} from './reaction.repository';
import {PostDTO} from '@main/domains/post/dto';
import {PostRepository, PostRepositoryImpl} from "@main/domains/post/repository";


export class ReactionRepositoryImpl implements ReactionRepository {
  private readonly postRepository: PostRepository;
  constructor
  (private readonly db: PrismaClient) {
    this.postRepository = new PostRepositoryImpl(db);
  }


  async createReaction(input: CreateReactionInputDTO): Promise<string> {
    const { userId, postId, reactionType } = input
    const authorId = await this.postRepository.getPostAuthor(postId);
    if(!authorId) {
      throw new Error('Post not found')
    }

    if(await this.accountIsPrivate(authorId) && !await this.isFollowed(userId, authorId)) {
      throw new Error('You must be following the author to react to this post')
    }

    if (await this.relationExists(input)) {
      throw new Error('Reaction already exists for this post and type.')
    }

    // Create the new reaction
    await this.db.reaction.create({
      data: {
        postId,
        type: reactionType,
        reactioner: {
          connect: { id: userId }
        },
      }
    })

    return 'Reaction created successfully';
  }

  async relationExists(input: CreateReactionInputDTO): Promise<boolean> {
    const { userId, postId, reactionType } = input

    const existingReaction = await this.db.reaction.findFirst({
      where: {
        reactionerId: userId,
        postId,
        type: reactionType,
      }
    })

    return !!existingReaction
  }

  async deleteReaction(input: CreateReactionInputDTO): Promise<string> {
    const { userId, postId, reactionType } = input;

    if (!await this.relationExists(input)) {
      throw new Error('Reaction not found')
    }

    // Delete the reaction
    await this.db.reaction.delete({
      where: {
        reactionerId_postId_type: {
          reactionerId: userId,
          postId,
          type: reactionType
        }
      }
    })

    return 'Reaction deleted successfully';
  }


  private async isFollowed (userId:string, authorId: string): Promise<boolean> {
    if(userId === authorId) return true;

    const follow = await this.db.follow.findFirst({
      where: {
        followedId: authorId,
        followerId: userId
      }
    })
    return !!follow;
  }

  private async accountIsPrivate(userId: string): Promise<boolean> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { isPublic: true },
    });

    return user?.isPublic === false
  }

  // there is a double security check here,
  // first, we cannot view the reactions of a user we don't follow and is private
  // second, we cannot view the posts the user reacted to of users we don't follow and are private
  async getReactions(userId: string, otherId: string, reaction: ReactionType): Promise<PostDTO[]> {
    if(!await this.postRepository.canViewPosts(userId, otherId)) {
      throw new Error("You can't see this user's posts. It may be that the user is private or that it doesn't exist.")
    }

    const reactions = await this.db.reaction.findMany({
      where: {
        reactionerId: otherId,
        type: reaction,
      },
      select: {
        postId: true,
      },
    });

    // get all reactioned posts
    const posts = await Promise.all(
      reactions.map(({ postId }) => this.postRepository.getById(userId, postId))
    );

    // Filter null values
    return posts.filter((post): post is PostDTO => post !== null);
  }

}
