import {SignupInputDTO} from '@main/domains/auth/dto'
import {PrismaClient, User} from '@prisma/client'
import {OffsetPagination} from 'main/types'
import {ExtendedUserDTO, ExtendedUserViewDTO, UserDTO, UserViewDTO} from '../dto'
import {UserRepository} from './user.repository'
import {StorageRepository, StorageRepositoryImpl} from "@main/domains/storage";
import {FollowerRepository, FollowerRepositoryImpl} from "@main/domains/follower/repository";

export class UserRepositoryImpl implements UserRepository {
  private readonly storageRepository: StorageRepository;
  private readonly followerRepository: FollowerRepository;
  constructor (private readonly db: PrismaClient) {
    this.storageRepository = new StorageRepositoryImpl();
    this.followerRepository = new FollowerRepositoryImpl(db);
  }

  async create (data: SignupInputDTO): Promise<UserDTO> {
    return await this.db.user.create({
      data
    }).then(user => new UserDTO(user))
  }

  async getById(userId: string, self: string): Promise<UserViewDTO | null> {
    const dto = await this.getUserViewDTOById(userId);
    if(dto == null) return null

    if (userId == self) {
      return dto
    }

    // ask if userId is follower of self (or should it be the opposite? The README is very difficult to understand)
    const followsYou = await this.followerRepository.isFollower(self, userId);
    return new ExtendedUserViewDTO(dto, followsYou);
  }

  private async getUserViewDTOById(userId: any): Promise<UserViewDTO | null> {
    const user = await this.db.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) return null;

    const profilePicture = await this.storageRepository.getProfilePreSignedUrl(userId);

    return new UserViewDTO({
      id: user.id,
      name: user.name || '',
      username: user.username,
      profilePicture: profilePicture,
    });
  }

  async getByUsername(username: string, options: OffsetPagination): Promise<UserViewDTO[]> {
    const users = await this.db.user.findMany({
      take: options.limit ? options.limit : undefined,
      skip: options.skip ? options.skip : undefined,
      where: {
        username: {
          contains: username, // Checks that the username contains, at least, the search term
          mode: 'insensitive' // Makes the search case insensitive. It doesn't differentiate between upper and lower cases
        }
      }
    })

    return await this.usersWithProfileImage(users);
  }

  async delete (userId: any): Promise<void> {
    await this.db.user.delete({
      where: {
        id: userId
      }
    })
  }

  async getRecommendedUsersPaginated(userId: string, options: OffsetPagination): Promise<UserViewDTO[]> {
    // The pagination happens on the followerRepository
    const followedByUsersTheUserFollows: string[] = await this.followerRepository.getFollowedByUsersTheUserFollows(userId, options);

    if (followedByUsersTheUserFollows.length === 0) {
      return [];
    }

    const users = await this.db.user.findMany({
      where: {
        id: {
          in: followedByUsersTheUserFollows,
        },
      },
      orderBy: [
        {
          id: 'asc',
        },
      ],
    });

    return await this.usersWithProfileImage(users);
  }


  async getByEmailOrUsername (email?: string, username?: string): Promise<ExtendedUserDTO | null> {
    const user = await this.db.user.findFirst({
      where: {
        OR: [
          {
            email
          },
          {
            username
          }
        ]
      }
    })
    return user ? new ExtendedUserDTO(user) : null
  }

  async changeVisibility(userId: string, value: boolean): Promise<void> {
    await this.db.user.update({
      where: {
        id: userId
      },
      data: {
        isPublic: value
      }
    })
  }

  async usersWithProfileImage(users: User[]): Promise<UserViewDTO[]>{
    return await Promise.all(
      users.map(async (user) => {
        const profilePicture = await this.storageRepository.getProfilePreSignedUrl(user.id);
        return new UserViewDTO({
          id: user.id,
          name: user.name || '',
          username: user.username,
          profilePicture: profilePicture,
        });
      })
    );
  }

  async createProfilePreSignedUrl(userId: string): Promise<string> {
    const user = await this.db.user.findUnique({
      where: {
        id: userId
      }
    })
    if (!user) throw new Error('User not found')
    return this.storageRepository.createProfilePreSignedUrl(userId)
  }

  async userIsPublic(authorId: string): Promise<boolean> {
    const author = await this.db.user.findUnique({
      where: {
        id: authorId
      },
      select: {
        isPublic: true
      }
    });
    return author?.isPublic ?? false;
  }

  async canAccessProfile(userId: string, authorId: string): Promise<boolean> {
    if(userId === authorId) return true;
    const user = await this.db.user.findUnique({
      where: { id: authorId },
      select: {
        isPublic: true,
        followers: { where: { followerId: userId }, select: { id: true } },
      },
    });
    return !!user && (user.isPublic || user.followers.length > 0);
  }

  async getExtendedDTO(authorId: string): Promise<ExtendedUserDTO> {
    const author = await this.db.user.findUnique({
      where: { id: authorId },
    });

    if (!author) {
      throw new Error('Author not found');
    }

    return new ExtendedUserDTO({
      ...author
    });
  }

}
