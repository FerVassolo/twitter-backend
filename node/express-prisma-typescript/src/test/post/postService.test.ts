import {PostService, PostServiceImpl} from "@main/domains/post/service";
import {PostRepository} from "@main/domains/post/repository";
import {ExtendedPostDTO, PendingPostDTO, PostDTO} from "@main/domains/post/dto";
import {HelperFunctions} from "./helperFunctions";

jest.mock("../../main/domains/post/repository/post.repository");

describe("Post Service", () => {
  let postService: PostService;
  let postRepositoryMock: jest.Mocked<PostRepository>;
  let helper: HelperFunctions;

  beforeEach(() => {
    postRepositoryMock = {
      create: jest.fn(),
      finalize: jest.fn(),
      createComment: jest.fn(),
      getAllByDatePaginated: jest.fn(),
      getAllCommentsByDatePaginated: jest.fn(),
      delete: jest.fn(),
      getById: jest.fn(),
      getByAuthorId: jest.fn(),
      postExistsById: jest.fn(),
      isFollowed: jest.fn(),
      canViewPosts: jest.fn(),
      getPostAuthor: jest.fn(),
      getCommentOrPostById: jest.fn(),
    } as jest.Mocked<PostRepository>;

    postService = new PostServiceImpl(postRepositoryMock);
    helper = new HelperFunctions(postService, postRepositoryMock);
  });

  it("should create post", async () => {
    const userId = "userId";
    const data = { content: "content" };
    const postDTO: PostDTO = { id: "id", authorId: "1", content: "content", images: [], createdAt: new Date()};
    postRepositoryMock.create.mockResolvedValue(postDTO);

    const result = await postService.createPost(userId, data);

    expect(result).toEqual(postDTO);
  });

  it("should create a pending post and then finalize it", async () => {
    const createResult = await helper.createMockedPendingPost("1");
    if(createResult instanceof PendingPostDTO) {
      const postDTO: PostDTO = { id: "id", authorId: "1", content: "content", images: ["David Tennant"], createdAt: new Date()};
      const finalizedPost = await helper.finishMockedPendingPost("1", createResult, postDTO);
      expect(finalizedPost).toEqual(postDTO);
    }
  });

  it("should get post", async () => {
    const userId = "userId";
    const postId = "postId";
    const postDTO: PostDTO = { id: "id", authorId: "1", content: "content", images: [], createdAt: new Date()};
    postRepositoryMock.getById.mockResolvedValue(postDTO);

    const result = await postService.getPost(userId, postId);

    expect(result).toEqual(postDTO);
  });

  it("should delete post", async () => {
    const userId = "userId";
    const postId = "postId";
    postRepositoryMock.delete.mockResolvedValue(undefined);

    const res = await postService.deletePost(userId, postId);

    expect(postRepositoryMock.delete).toHaveBeenCalledWith(postId);
    expect(res).toEqual(undefined);
  })

  it("should get latest posts by pagination", async () => {
    const userId = "userId";
    const options = { limit: 10, before: "post4", after: "post6" };
    const author = { id: "1", username: "username", password: "password", email: "email", createdAt: new Date(), name: "name"}
    const postDTO: ExtendedPostDTO = { id: "id", authorId: "1", content: "content", images: [], createdAt: new Date(), author, qtyComments: 3, qtyLikes: 4, qtyRetweets: 2};
    postRepositoryMock.getAllByDatePaginated.mockResolvedValue([postDTO]);

    const result = await postService.getLatestPosts(userId, options);

    expect(result).toEqual([postDTO]);
  })

  it("Should get latest comments by pagination", async () => {
    const userId = "userId";
    const options = { limit: 10, before: "post4", after: "post6" };
    const author = { id: "1", username: "username", password: "password", email: "email", createdAt: new Date(), name: "name"}
    const postDTO: ExtendedPostDTO = { id: "id", authorId: "1", content: "content", images: [], createdAt: new Date(), author, qtyComments: 3, qtyLikes: 4, qtyRetweets: 2};
    postRepositoryMock.getAllCommentsByDatePaginated.mockResolvedValue([postDTO]);

    const result = await postService.getLatestComments(userId, "post1", options);

    expect(result).toEqual([postDTO]);
  })

  it("Should get posts by author", async () => {
    const userId = "userId";
    const authorId = "authorId";
    const author = { id: "1", username: "username", password: "password", email: "email", createdAt: new Date(), name: "name"}
    const postDTO: ExtendedPostDTO = { id: "id", authorId: "1", content: "content", images: [], createdAt: new Date(), author, qtyComments: 3, qtyLikes: 4, qtyRetweets: 2};
    postRepositoryMock.getByAuthorId.mockResolvedValue([postDTO]);

    const result = await postService.getPostsByAuthor(userId, authorId);

    expect(result).toEqual([postDTO]);
  })

  it("should create comment", async () => {
    const userId = "userId";
    const postId = "postId";
    const data = { content: "content" };
    const postDTO: PostDTO = { id: "id", authorId: "1", content: "content", images: [], createdAt: new Date()};
    postRepositoryMock.createComment.mockResolvedValue(postDTO);

    const result = await postService.createComment(userId, postId, data);

    expect(result).toEqual(postDTO);
  })
})


