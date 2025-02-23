import winston from 'winston'

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf((info: winston.Logform.TransformableInfo) => {
      const { timestamp, level, message, ...meta } = info
      const metaString = Object.keys(meta).length ? JSON.stringify(meta) : ''
      return `${timestamp} ${level}: ${message} ${metaString}`
    })
  ),
  transports: [
    new winston.transports.Console(),
  ],
})
