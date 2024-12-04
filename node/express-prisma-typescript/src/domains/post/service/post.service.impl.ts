import {CreatePostInputDTO, ExtendedPostDTO, PendingPostDTO, PostDTO} from '../dto'
import { PostRepository } from '../repository'
import { PostService } from '.'
import { validate } from 'class-validator'
import { ForbiddenException, NotFoundException } from '@utils'
import { CursorPagination } from '@types'
import {PostStatus} from "@prisma/client";

export class PostServiceImpl implements PostService {
  constructor (private readonly repository: PostRepository) {}

  async createPost (userId: string, data: CreatePostInputDTO): Promise<PostDTO | PendingPostDTO> {
    await validate(data)
    return await this.repository.create(userId, data)
  }

  async finalizePost (userId: string, postId: string): Promise<PostDTO> {
    const post = await this.repository.getCommentOrPostById(userId, postId, PostStatus.PENDING)
    if (!post) throw new NotFoundException('post')
    if (post.authorId !== userId) throw new ForbiddenException()
    return await this.repository.finalize(postId)
  }

  async deletePost (userId: string, postId: string): Promise<void> {
    const post = await this.repository.getById(userId, postId)
    if (!post) throw new NotFoundException('post')
    if (post.authorId !== userId) throw new ForbiddenException()
    await this.repository.delete(postId)
  }

  async getPost (userId: string, postId: string): Promise<PostDTO> {
    const post = await this.repository.getById(userId, postId)
    const postExists = await this.repository.postExistsById(postId)

    // I'm throwing a 404 error because it is what was asked, but I'd rather return a 403 error
    if(postExists && !post) throw new NotFoundException("post. It may be that the author is private and you don't follow them")
    if (!post) throw new NotFoundException('post')

    return post
  }

  async getLatestPosts (userId: string, options: CursorPagination): Promise<PostDTO[]> {
    return await this.repository.getAllByDatePaginated(userId, options)
  }

  async getPostsByAuthor (userId: any, authorId: string): Promise<ExtendedPostDTO[]> {
    const posts = await this.repository.getByAuthorId(userId, authorId)

    if(!posts) throw new NotFoundException("posts. It may be that the user is private or that it doesn't exist.")

    return posts;
  }

  async createComment (userId: string, postId: string, data: CreatePostInputDTO): Promise<PostDTO | PendingPostDTO>  {
    try{
      await validate(data)
      return await this.repository.createComment(userId, postId, data)
    }
    catch(e) {
      throw e
    }
  }

  async getLatestComments (userId: string, postId: string, options: CursorPagination): Promise<PostDTO[]> {
    return await this.repository.getAllCommentsByDatePaginated(userId, postId, options)
  }

  getCommentsByAuthor(userId: any, authorId: string): Promise<ExtendedPostDTO[]> {
    throw new Error('Method not implemented.');
  }
}
