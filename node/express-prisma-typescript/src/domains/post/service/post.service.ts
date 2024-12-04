import {CreatePostInputDTO, ExtendedPostDTO, PendingPostDTO, PostDTO} from '../dto'

export interface PostService {
  createPost: (userId: string, body: CreatePostInputDTO) => Promise<PostDTO | PendingPostDTO>
  createComment: (userId: string, postId: string, body: CreatePostInputDTO) => Promise<PostDTO | PendingPostDTO>
  finalizePost: (userId: string, postId: string) => Promise<PostDTO>
  deletePost: (userId: string, postId: string) => Promise<void>
  getPost: (userId: string, postId: string) => Promise<PostDTO>
  getLatestPosts: (userId: string, options: { limit?: number, before?: string, after?: string }) => Promise<PostDTO[]>
  getLatestComments: (userId: string, postId: string, options: { limit?: number, before?: string, after?: string }) => Promise<PostDTO[]>
  getPostsByAuthor: (userId: any, authorId: string) => Promise<ExtendedPostDTO[]>
  getCommentsByAuthor: (userId: any, authorId: string) => Promise<ExtendedPostDTO[]>
}
