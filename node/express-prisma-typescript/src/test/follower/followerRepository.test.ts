import {FollowerRepository, FollowerRepositoryImpl} from "@main/domains/follower/repository";
import {PrismaClient} from "@prisma/client";

describe("Follower Repository", () => {
  let followerRepository: FollowerRepository;

  beforeEach(async () => {
    // Simula el cliente de Prisma (sin usar la base de datos real)
    const mockDb = {
      follow: {
        findMany: jest.fn(),
      },
    };
    followerRepository = new FollowerRepositoryImpl(mockDb as unknown as PrismaClient);
  });

  it("should get users followed by users the user follows by reaching limit", async () => {
    const userId = "1";
    const options = { limit: 6, skip: 0 };
    const followedByUser = ["2", "3", "4", "5", "6"];

    jest.spyOn(followerRepository as any, 'getFollowingUsers')
      .mockResolvedValueOnce(followedByUser)


    const firstMock = [
      { followerId: "2", followedId: "3" },
      { followerId: "3", followedId: "5" },
      { followerId: "3", followedId: "8" },
      { followerId: "4", followedId: "9" },
    ];
    const secondMock = [
      { followerId: "5", followedId: "10"},
      { followerId: "5", followedId: "6"}
    ];

    jest.spyOn(followerRepository as any, 'relatedFollowers')
      .mockResolvedValueOnce(firstMock)
      .mockResolvedValueOnce(secondMock)

    const response = await followerRepository.getFollowedByUsersTheUserFollows(userId, options);
    expect(response).toEqual(["3", "5", "8", "9", "10", "6"]);
  });

  it("should get users followed by users the user follows without reaching limit", async () => {
    const userId = "1";
    const options = { limit: 6, skip: 0 };
    const followedByUser = ["2", "3", "4", "5", "6"];

    jest.spyOn(followerRepository as any, 'getFollowingUsers')
      .mockResolvedValueOnce(followedByUser)

    jest.spyOn(followerRepository as any, 'getRelatedFollowers')
      .mockReturnValueOnce({ followedIds: ["3", "5", "8", "9"], unprocessed: ["4", "6"] })
      .mockReturnValueOnce({ followedIds: ["10"], unprocessed: [] });




    const response = await followerRepository.getFollowedByUsersTheUserFollows(userId, options);
    expect(response).toEqual(["3", "5", "8", "9", "10"]);
  });

  it("should get users followed by users with repeated values", async () => {
    const userId = "1";
    const options = { limit: 6, skip: 0 };
    const followedByUser = ["2", "3", "4", "5", "6"];

    jest.spyOn(followerRepository as any, 'getFollowingUsers')
      .mockResolvedValueOnce(followedByUser)


    const firstMock = [
      { followerId: "2", followedId: "3" },
      { followerId: "3", followedId: "5" },
      { followerId: "3", followedId: "8" },
      { followerId: "4", followedId: "9" },
    ];
    const secondMock = [
      { followerId: "5", followedId: "5"},
      { followerId: "5", followedId: "6"}
    ];

    jest.spyOn(followerRepository as any, 'relatedFollowers')
      .mockResolvedValueOnce(firstMock)
      .mockResolvedValueOnce(secondMock)

    const response = await followerRepository.getFollowedByUsersTheUserFollows(userId, options);
    expect(response).toEqual(["3", "5", "8", "9", "6"]);
  });


})
