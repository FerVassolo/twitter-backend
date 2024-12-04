import express from 'express'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import { Constants, NodeEnv, Logger } from '@utils'
import { router } from '@router'
import { ErrorHandling } from '@utils/errors'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './swagger'

// Socket.IO
import { createServer } from 'http';
import { Server } from 'socket.io';
import {SocketHandler} from '@domains/message/socket/socketHandler';

const app = express()
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: Constants.CORS_WHITELIST,
  },
});

// Set up request logger
if (Constants.NODE_ENV === NodeEnv.DEV) {
  app.use(morgan('tiny')) // Log requests only in development environments
}

// Set up request parsers
app.use(express.json()) // Parses application/json payloads request bodies
app.use(express.urlencoded({ extended: false })) // Parse application/x-www-form-urlencoded request bodies
app.use(cookieParser()) // Parse cookies


// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Set up CORS
app.use(
  cors({
    origin: Constants.CORS_WHITELIST
  })
);


app.use('/api', router)

app.use(ErrorHandling);

// Configurar Socket.IO
const socketHandler = new SocketHandler(io);
socketHandler.setupHandlers().then(r => {});

httpServer.listen(Constants.PORT, () => {
  Logger.info(`Server listening on port ${Constants.PORT}`)
})
