import {ArrayMaxSize, IsArray, IsNotEmpty, IsOptional, IsString, MaxLength} from 'class-validator'
import { ExtendedUserDTO } from '@domains/user/dto'

export class CreatePostInputDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
    content!: string

  @IsOptional()
  @IsArray() // Asegura que es un arreglo
  @ArrayMaxSize(4) // Limita la cantidad máxima de elementos en el arreglo a 4
  @IsString({ each: true }) // Valida que cada elemento del arreglo sea una cadena
  images?: string[];
}

export class PostDTO {
  constructor (post: PostDTO) {
    this.id = post.id
    this.authorId = post.authorId
    this.content = post.content
    this.images = post.images
    this.createdAt = post.createdAt
  }

  id: string
  authorId: string
  content: string
  images: string[]
  createdAt: Date
}

export class ExtendedPostDTO extends PostDTO {
  constructor (post: ExtendedPostDTO) {
    super(post)
    this.author = post.author
    this.qtyComments = post.qtyComments
    this.qtyLikes = post.qtyLikes
    this.qtyRetweets = post.qtyRetweets
  }

  author!: ExtendedUserDTO // TODO: propose changes. I don't like it to return a Extended User DTO since it also returns the hashed password.
  qtyComments!: number
  qtyLikes!: number
  qtyRetweets!: number
}

export class PendingPostDTO {
  constructor (post: PendingPostDTO) {
    this.id = post.id
    this.preSignedUrls = post.preSignedUrls

  }
  id: string
  preSignedUrls: string[]
}
