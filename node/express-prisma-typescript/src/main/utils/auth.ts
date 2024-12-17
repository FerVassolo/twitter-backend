import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { Request, Response } from 'express'
import { Constants } from '@main/utils/index'
import { UnauthorizedException } from '@main/utils/errors'
import { Socket } from 'socket.io'

export const generateAccessToken = (payload: Record<string, string | boolean | number>): string => {
  // Do not use this in production, the token will last 24 hours
  // For production apps, use a 15-minute token with a refresh token stored in a HttpOnly Cookie
  return jwt.sign(payload, Constants.TOKEN_SECRET, { expiresIn: '24h' })
}

export const withAuth = (req: Request, res: Response, next: () => any): void => {
  // Get the token from the authorization header
  const [bearer, token] = (req.headers.authorization)?.split(' ') ?? []

  // Verify that the Authorization header has the expected shape
  if (!bearer || !token || bearer !== 'Bearer') throw new UnauthorizedException('MISSING_TOKEN')

  // Verify that the token is valid
  jwt.verify(token, Constants.TOKEN_SECRET, (err, context) => {
    if (err) throw new UnauthorizedException('INVALID_TOKEN')
    res.locals.context = context
    next()
  })
}

export const socketAuth = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1]

  if (!token) { next(new UnauthorizedException('MISSING_TOKEN')); return }

  jwt.verify(token, Constants.TOKEN_SECRET, (err: any, context: any) => {
    if (err) { next(new UnauthorizedException('INVALID_TOKEN')); return }
    console.log('User id:', context.userId)
    socket.data.context = context
    next()
  })
}

export const encryptPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10)
}

export const checkPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash)
}
