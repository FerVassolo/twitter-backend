const postSchemas = {
  CreatePostInputDTO: {
    type: 'object',
    required: ['content'],
    properties: {
      content: {
        type: 'string',
        maxLength: 240,
        description: 'Content of the post'
      },
      images: {
        type: 'array',
        items: {
          type: 'string',
          maxLength: 4
        },
        nullable: true,
        description: 'Optional list of image URLs'
      }
    }
  },
  PostDTO: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Unique identifier for the post'
      },
      authorId: {
        type: 'string',
        format: 'uuid',
        description: 'ID of the post author'
      },
      content: {
        type: 'string',
        description: 'Content of the post'
      },
      images: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'List of image URLs associated with the post'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Timestamp when the post was created'
      }
    }
  },
  ExtendedPostDTO: {
    allOf: [
      { $ref: '#/components/schemas/PostDTO' },
      {
        type: 'object',
        properties: {
          author: {
            $ref: '#/components/schemas/ExtendedUserDTO',
            description: 'Detailed information about the post author'
          },
          qtyComments: {
            type: 'integer',
            description: 'Number of comments on the post'
          },
          qtyLikes: {
            type: 'integer',
            description: 'Number of likes on the post'
          },
          qtyRetweets: {
            type: 'integer',
            description: 'Number of retweets of the post'
          }
        }
      }
    ]
  }
}

const userSchemas = {
  UserDTO: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Unique identifier for the user'
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'Email address of the user'
      },
      username: {
        type: 'string',
        description: 'Username of the user'
      },
      isPublic: {
        type: 'boolean',
        description: 'Indicates if the user profile is public'
      }
    }
  },
  ExtendedUserDTO: {
    allOf: [
      { $ref: '#/components/schemas/UserDTO' },
      {
        type: 'object',
        properties: {
          password: {
            type: 'string',
            description: 'Hashed password of the user'
          }
        }
      }
    ]
  },
  UserViewDTO: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Unique identifier for the user'
      },
      name: {
        type: 'string',
        description: 'Name of the user'
      },
      username: {
        type: 'string',
        description: 'Username of the user'
      },
      profilePicture: {
        type: 'string',
        nullable: true,
        description: 'URL of the user’s profile picture'
      }
    }
  }
}

const swaggerSchemas = {
  ...postSchemas,
  ...userSchemas
}

export default swaggerSchemas
