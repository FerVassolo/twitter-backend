import {FollowerService, FollowerServiceImpl} from "../../../src/main/domains/follower/service";
import {FollowerRepository} from "../../../src/main/domains/follower/repository";

jest.mock("../../../src/main/domains/follower/repository/follower.repository");

describe("Follower Service", () => {
  let followerService: FollowerService;
  let followerRepositoryMock: jest.Mocked<FollowerRepository>;

  beforeEach(() => {
    followerRepositoryMock = {
      follow: jest.fn(),
      unfollow: jest.fn(),
      isFollower: jest.fn(),
      isFollowed: jest.fn(),
      getFriends: jest.fn(),
      areFriends: jest.fn(),
      getFollowingUsers: jest.fn(),
      getFollowedByUsersTheUserFollows: jest.fn()
    } as jest.Mocked<FollowerRepository>;
    followerService = new FollowerServiceImpl(followerRepositoryMock);
  })

  it("should follow a user", async () => {
    const now = new Date();
    followerRepositoryMock.follow.mockResolvedValueOnce({
      id: "1",
      followerId: "1",
      followedId: "2",
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    });
    const response = await followerService.follow("2", "1")
    expect(response).toEqual({
      id: "1",
      followerId: "1",
      followedId: "2",
      createdAt: now,
      updatedAt: now,
      deletedAt: null })
  })
  it("unfollow a user", async () => {
    const now = new Date();
    followerRepositoryMock.unfollow.mockResolvedValueOnce(true);
    const response = await followerService.unfollow("2", "1")
    expect(response).toEqual(true)
  })

  it("get friends of user", async () => {
    const now = new Date();
    followerRepositoryMock.getFriends.mockResolvedValueOnce(["2"]);
    const response = await followerService.getFriends("1")
    expect(response).toEqual(["2"])
  })

  it("check if two users are friends", async () => {
    const now = new Date();
    followerRepositoryMock.areFriends.mockResolvedValueOnce(true);
    const response = await followerService.areFriends("1", "2")
    expect(response).toEqual(true)
  })


  it("should get users followed by users the user follows", async () => {
    const userId = "1";
    const options = { limit: 6, skip: 0 };
    const followedByUser = ["2", "3", "4", "5", "6"];
    followerRepositoryMock.getFollowingUsers.mockResolvedValueOnce(followedByUser);

    const firstMock = [["3", "5", "8", "9"], ["4", "5", "6"]]
    const secondMock = [["3", "5", "8", "9", "10", "11"], ["6"]]

    jest.spyOn(followerRepositoryMock as any, 'relatedFollowers')
      .mockResolvedValueOnce(firstMock)
      .mockResolvedValueOnce(secondMock)

    const response = await followerRepositoryMock.getFollowedByUsersTheUserFollows(userId, options);
    expect(response).toEqual(["3", "5", "8", "9", "10", "11"]);
  });


})
