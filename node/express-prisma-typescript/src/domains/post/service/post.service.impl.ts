import { CreatePostInputDTO, PostDTO } from '../dto'
import { PostRepository } from '../repository'
import { PostService } from '.'
import { validate } from 'class-validator'
import { ForbiddenException, NotFoundException } from '@utils'
import { CursorPagination } from '@types'

export class PostServiceImpl implements PostService {
  constructor (private readonly repository: PostRepository) {}

  async createPost (userId: string, data: CreatePostInputDTO): Promise<PostDTO> {
    await validate(data)
    return await this.repository.create(userId, data)
  }

  async deletePost (userId: string, postId: string): Promise<void> {
    const post = await this.repository.getById(userId, postId)
    if (!post) throw new NotFoundException('post')
    if (post.authorId !== userId) throw new ForbiddenException()
    await this.repository.delete(postId)
  }

  async getPost (userId: string, postId: string): Promise<PostDTO> {
    const post = await this.repository.getById(userId, postId)
    const postExists = await this.repository.postExistsById(userId, postId)

    // I'm throwing a 404 error because it is what was asked, but I'd rather return a 403 error
    if(postExists && !post) throw new NotFoundException("post. It may be that the author is private and you don't follow them")
    if (!post) throw new NotFoundException('post')

    return post
  }

  async getLatestPosts (userId: string, options: CursorPagination): Promise<PostDTO[]> {
    return await this.repository.getAllByDatePaginated(userId, options)
  }

  async getPostsByAuthor (userId: any, authorId: string): Promise<PostDTO[]> {
    const posts = await this.repository.getByAuthorId(userId, authorId)

    if(!posts) throw new NotFoundException("posts. It may be that the user is private or that it doesn't exist")

    return posts;
  }
}
