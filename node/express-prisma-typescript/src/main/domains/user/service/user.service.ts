import { OffsetPagination } from 'main/types'
import {UserDTO, UserViewDTO} from '../dto'

export interface UserService {
  deleteUser: (userId: any) => Promise<void>
  getUser: (userId: any, self: any) => Promise<UserViewDTO>
  getUserRecommendations: (userId: any, options: OffsetPagination) => Promise<UserViewDTO[]>
  changeVisibility: (userId: string, value: boolean) => Promise<string>
  getUsersByUsername: (username: string, options: OffsetPagination) => Promise<UserViewDTO[]>
}
