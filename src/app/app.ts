import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import translateRoutes from './routes/translate'
import extractContextRoutes from './routes/extract-context'
import { errorHandler } from './middlewares/middleware'
import { logger } from './logger'

const app = express()
console.log("NODE_ENV: ", process.env.NODE_ENV)

app.set('trust proxy', true)

// Request Logging Middleware (using the imported logger)
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, { ip: req.ip }) // Log IP as metadata
  })
  next()
})

// Middlewares
app.use(helmet())

const allowedOrigin = process.env.ALLOWED_ORIGIN?.split(',') || []
console.log("ALLOWED_ORIGIN: ", allowedOrigin)
app.use(cors({
  origin: allowedOrigin,
  methods: ['POST'],
  allowedHeaders: ['Authorization', 'Content-Type']
}))

app.use(express.json())

// Routes
app.use('/api', translateRoutes)
app.use('/api', extractContextRoutes)
app.use(errorHandler)

export default app
