import swaggerJSDoc from 'swagger-jsdoc'
import path from 'path'
import swaggerSchemas from '@main/swaggerSchemas'

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Twitter Backend API Documentation',
      version: '1.0.0'
    },
    components: {
      schemas: {
        ...swaggerSchemas
      }
    }
  },
  apis: [`${path.join(__dirname, './router/*')}`, `${path.join(__dirname, './domains/**/controller/*')}`]
}

const swaggerSpec = swaggerJSDoc(options)

export default swaggerSpec
