import { SignupInputDTO } from '@main/domains/auth/dto'
import { OffsetPagination } from 'main/types'
import {ExtendedUserDTO, UserDTO, UserViewDTO} from '../dto'

export interface UserRepository {
  create: (data: SignupInputDTO) => Promise<UserDTO>
  delete: (userId: string) => Promise<void>
  getRecommendedUsersPaginated: (userId: string, options: OffsetPagination) => Promise<UserViewDTO[]>
  getById: (userId: any, self: any) => Promise<UserViewDTO| null>
  getByEmailOrUsername: (email?: string, username?: string) => Promise<ExtendedUserDTO | null>
  changeVisibility: (userId: string, value: boolean) => Promise<void>
  getByUsername: (username: string, options: OffsetPagination) => Promise<UserViewDTO[]>
  createProfilePreSignedUrl: (userId: string) => Promise<string>
  userIsPublic: (userId: string) => Promise<boolean>
  canAccessProfile: (userId: string, authorId: string)=> Promise<boolean>
  getExtendedDTO: (userId: string) => Promise<ExtendedUserDTO>
}
