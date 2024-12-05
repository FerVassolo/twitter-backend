import {ReactionService, ReactionServiceImpl} from "@main/domains/reaction/service";
import {ReactionRepository, ReactionRepositoryImpl} from "@main/domains/reaction/repository";
import {CreateReactionInputDTO} from "@main/domains/reaction/dto";
import {ReactionType} from "@prisma/client";
import {PostDTO} from "@main/domains/post/dto";

jest.mock("../../main/domains/reaction/repository/reaction.repository");

describe("Reaction Service", () => {
  let reactionService: ReactionService;
  let reactionRepositoryMock: jest.Mocked<ReactionRepositoryImpl>;

  beforeEach(() => {
    reactionRepositoryMock = {
      createReaction: jest.fn(),
      deleteReaction: jest.fn(),
      getReactions: jest.fn(),
    } as unknown as jest.Mocked<ReactionRepositoryImpl>;
    reactionService = new ReactionServiceImpl(reactionRepositoryMock);
  })


  it("should create reaction", async () => {
    const input: CreateReactionInputDTO = { userId: "userId", postId: "postId", reactionType: ReactionType.LIKE };
    reactionRepositoryMock.createReaction.mockResolvedValue("reactionId");
    const result = await reactionService.reactToPost(input);
    expect(result).toEqual("reactionId");
  })


  it('should delete reaction successfully', async () => {
    const input: CreateReactionInputDTO = { userId: 'userId', postId: 'postId', reactionType: ReactionType.LIKE };
    reactionRepositoryMock.deleteReaction.mockResolvedValue('Reaction deleted successfully'); // Eliminación exitosa

    const result = await reactionService.deleteReaction(input);

    expect(reactionRepositoryMock.deleteReaction).toHaveBeenCalledWith(input);
    expect(result).toEqual('Reaction deleted successfully');
  });

  it('should get reactions successfully', async () => {
    const reactions: PostDTO[] = [{ id: "id", authorId: "1", content: "content", images: [], createdAt: new Date()}]
    reactionRepositoryMock.getReactions.mockResolvedValue(reactions);
    const result = await reactionService.getReactions("userId", "postId", ReactionType.LIKE);
    expect(result).toEqual(reactions);

  })


});
