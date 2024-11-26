import { Request, Response, Router } from 'express'
import HttpStatus from 'http-status'
// express-async-errors is a module that handles async errors in express, don't forget import it in your new controllers
import 'express-async-errors'

export const healthRouter = Router()

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Checks the health status of the API.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy and operational.
 *       500:
 *         description: API is non-operational.
 */
healthRouter.get('/', (req: Request, res: Response) => {
  return res.status(HttpStatus.OK).send()
})
