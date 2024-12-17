import { UserRepository } from '@main/domains/user/repository'
import { UserService, UserServiceImpl } from '@main/domains/user/service'
import { UserViewDTO } from '@main/domains/user/dto'

jest.mock('../../main/domains/user/repository/user.repository')

describe('User Service', () => {
  let userService: UserService
  let userRepositoryMock: jest.Mocked<UserRepository>

  beforeEach(() => {
    userRepositoryMock = {
      create: jest.fn(),
      delete: jest.fn(),
      getRecommendedUsersPaginated: jest.fn(),
      getById: jest.fn(),
      getByEmailOrUsername: jest.fn(),
      changeVisibility: jest.fn(),
      getByUsername: jest.fn()
    } as unknown as jest.Mocked<UserRepository>
    userService = new UserServiceImpl(userRepositoryMock)
  })

  it('Get User', async () => {
    const profileDto: UserViewDTO = { id: 'id', name: 'Matt Smith', username: 'matt', profilePicture: 'profile.jpg' }
    userRepositoryMock.getById.mockResolvedValue(profileDto)

    const res = await userService.getUser('id', 'myId')

    expect(res).toEqual(profileDto)
    expect(userRepositoryMock.getById).toHaveBeenCalledWith('id', 'myId')
  })

  it('Delete User', async () => {
    userRepositoryMock.delete.mockResolvedValue()

    await userService.deleteUser('id')

    expect(userRepositoryMock.delete).toHaveBeenCalledWith('id')
  })

  it('Get User Recommendations', async () => {
    const users: UserViewDTO[] = [
      { id: 'id1', name: 'Matt Smith', username: 'matt', profilePicture: 'profile.jpg' },
      { id: 'id2', name: 'Peter Capaldi', username: 'peter', profilePicture: 'profile.jpg' }
    ]
    userRepositoryMock.getRecommendedUsersPaginated.mockResolvedValue(users)

    const res = await userService.getUserRecommendations('id', { skip: 0, limit: 2 })

    expect(res).toEqual(users)
    expect(userRepositoryMock.getRecommendedUsersPaginated).toHaveBeenCalledWith({ skip: 0, limit: 2 })
  })

  it('Change Visibility', async () => {
    userRepositoryMock.changeVisibility.mockResolvedValue() // it resolves void, so I leave it empty

    await userService.changeVisibility('id', true)

    expect(userRepositoryMock.changeVisibility).toHaveBeenCalledWith('id', true)
  })

  it('Get Users By Username', async () => {
    const users: UserViewDTO[] = [
      { id: 'id1', name: 'The Doctor', username: 'matt', profilePicture: 'profile.jpg' },
      { id: 'id2', name: 'Doctor House', username: 'peter', profilePicture: 'profile.jpg' }
    ]
    userRepositoryMock.getByUsername.mockResolvedValue(users)

    const res = await userService.getUsersByUsername('Doctor', { skip: 0, limit: 2 })

    expect(res).toEqual(users)
    expect(userRepositoryMock.getByUsername).toHaveBeenCalledWith('Doctor', { skip: 0, limit: 2 })
  })
})
