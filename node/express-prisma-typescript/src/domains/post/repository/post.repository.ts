import { CursorPagination } from '@types'
import {CreatePostInputDTO, PendingPostDTO, PostDTO} from '../dto'
import {PostStatus} from "@prisma/client";

export interface PostRepository {
  create: (userId: string, data: CreatePostInputDTO) => Promise<PostDTO | PendingPostDTO>
  finalize: (postId: string) => Promise<PostDTO>
  createComment: (userId: string, postId: string, data: CreatePostInputDTO) => Promise<PostDTO | PendingPostDTO>
  getAllByDatePaginated: (userId: string, options: CursorPagination) => Promise<PostDTO[]>
  getAllCommentsByDatePaginated: (userId: string, postId: string, options: CursorPagination) => Promise<PostDTO[]>
  delete: (postId: string) => Promise<void>
  getById: (userId: string, postId: string, status?: PostStatus) => Promise<PostDTO | null>
  getByAuthorId: (userId: string, authorId: string, includeComments?: boolean) => Promise<PostDTO[]>
  postExistsById: (postId: string) => Promise<boolean>
  isFollowed: (userId: string, authorId: string) => Promise<boolean>
  canViewPosts: (userId: string, authorId: string) => Promise<boolean>
  getPostAuthor: (postId: string) => Promise<string | undefined>
  getCommentOrPostById: (userId: string, postId: string, status?: PostStatus) => Promise<PostDTO | null>
}
