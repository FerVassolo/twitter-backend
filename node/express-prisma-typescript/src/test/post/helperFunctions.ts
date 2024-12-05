import {PendingPostDTO, PostDTO} from "@main/domains/post/dto";
import {PostRepository} from "@main/domains/post/repository";
import {PostService} from "@main/domains/post/service";

export class HelperFunctions {
  private postService: PostService;
  private postRepositoryMock: jest.Mocked<PostRepository>;

  constructor(postService: PostService, postRepositoryMock: jest.Mocked<PostRepository>) {
    this.postRepositoryMock = postRepositoryMock;
    this.postService = postService;
  }

  async createMockedPendingPost(id: string): Promise<PostDTO | PendingPostDTO>  {
    const data = { content: "content", images: ["David Tennant"] };
    this.postRepositoryMock.create.mockResolvedValueOnce({
      id: "id",
      preSignedUrls: ["David Tennant url link"]
    });
    return this.postService.createPost("1", data);
  }

   async finishMockedPendingPost(id: string, createResult: PendingPostDTO, postDTO: PostDTO): Promise<PostDTO> {
    this.postRepositoryMock.finalize.mockResolvedValue(postDTO);
    this.postRepositoryMock.getCommentOrPostById.mockResolvedValue(postDTO);
    return await this.postService.finalizePost("1", createResult.id);
  }

}
