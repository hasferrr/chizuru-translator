import winston from 'winston'

const logFormat = process.env.GCP_LOGGING_ENABLED === 'true'
  ? (info: winston.Logform.TransformableInfo) => {
    const { timestamp, level, message, ...meta } = info
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : ''
    return `[${level}]: ${message} ${metaString}`
  }
  : (info: winston.Logform.TransformableInfo) => {
    const { timestamp, level, message, ...meta } = info
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : ''
    return `${timestamp} [${level}]: ${message} ${metaString}`
  }

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    process.env.GCP_LOGGING_ENABLED === 'true'
      ? winston.format.uncolorize()
      : winston.format.colorize(),
    winston.format.printf(logFormat)
  ),
  transports: [
    new winston.transports.Console(),
  ],
})
