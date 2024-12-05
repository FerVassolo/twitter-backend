import {NotFoundException} from '@main/utils/errors'
import {OffsetPagination} from 'main/types'
import {UserViewDTO} from '../dto'
import {UserRepository} from '../repository'
import {UserService} from './user.service'

export class UserServiceImpl implements UserService {
  constructor (private readonly repository: UserRepository) {}

  async getUser (userId: any, self: any):  Promise<UserViewDTO>{
    const user = await this.repository.getById(userId, self)
    if (!user) throw new NotFoundException('user')
    return user
  }

  async getUserRecommendations (userId: any, options: OffsetPagination): Promise<UserViewDTO[]> {
    // TODO: make this return only users followed by users the original user follows
    return await this.repository.getRecommendedUsersPaginated(options)
  }

  async changeVisibility(userId: string, value: boolean): Promise<string> {
    await this.repository.changeVisibility(userId, value);
    return 'Visibility is now ' + value;
  }

  async getUsersByUsername(username: string, options: OffsetPagination): Promise<UserViewDTO[]> {
    return await this.repository.getByUsername(username, options)
  }

  async deleteUser (userId: any): Promise<void> {
    await this.repository.delete(userId)
  }
}
