import winston from 'winston'

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf((info: winston.Logform.TransformableInfo) => {
      const { timestamp, level, message } = info
      return `${timestamp} ${level.toUpperCase()}: ${message}`
    })
  ),
  transports: [
    new winston.transports.Console(),
  ],
})
