export class UserDTO {
  constructor (user: UserDTO) {
    this.id = user.id
    this.name = user.name
    this.createdAt = user.createdAt
  }

  id: string
  name: string | null
  createdAt: Date
}

export class ExtendedUserDTO extends UserDTO {
  constructor (user: ExtendedUserDTO) {
    super(user)
    this.email = user.email
    this.name = user.name
    this.password = user.password
  }

  email!: string
  username!: string
  password!: string
}
export class UserViewDTO {
  constructor (user: UserViewDTO) {
    this.id = user.id
    this.name = user.name
    this.username = user.username
    this.profilePicture = user.profilePicture
  }

  id: string
  name: string  // TODO: propose change so this accepts also null values
  username: string
  profilePicture: string | null
}

export class ExtendedUserViewDTO extends UserViewDTO {
  constructor(user: UserViewDTO, followsYou: boolean) {
    super(user);
    this.followsYou = followsYou;
  }

  followsYou!: boolean;
}

