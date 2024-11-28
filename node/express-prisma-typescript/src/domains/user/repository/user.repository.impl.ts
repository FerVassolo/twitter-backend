import {SignupInputDTO} from '@domains/auth/dto'
import {PrismaClient, User} from '@prisma/client'
import {OffsetPagination} from '@types'
import {ExtendedUserDTO, UserDTO, UserViewDTO} from '../dto'
import {UserRepository} from './user.repository'
import {StorageRepository, StorageRepositoryImpl} from "@domains/storage";

export class UserRepositoryImpl implements UserRepository {
  private readonly storageRepository: StorageRepository;
  constructor (private readonly db: PrismaClient) {
    this.storageRepository = new StorageRepositoryImpl();
  }

  async create (data: SignupInputDTO): Promise<UserDTO> {
    return await this.db.user.create({
      data
    }).then(user => new UserDTO(user))
  }

  async getById(userId: any): Promise<UserViewDTO | null> {
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



  async delete (userId: any): Promise<void> {
    await this.db.user.delete({
      where: {
        id: userId
      }
    })
  }

  async getRecommendedUsersPaginated (options: OffsetPagination): Promise<UserViewDTO[]> {
    const users = await this.db.user.findMany({
      take: options.limit ? options.limit : undefined,
      skip: options.skip ? options.skip : undefined,
      orderBy: [
        {
          id: 'asc'
        }
      ]
    })

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
}
