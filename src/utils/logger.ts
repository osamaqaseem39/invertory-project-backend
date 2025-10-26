import pino from 'pino';
import config from '../config';

// Check if we're in a serverless environment (Vercel, AWS Lambda, etc.)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production';

const logger = pino({
  level: config.logging.level,
  transport: config.env === 'development' && !isServerless ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      singleLine: false,
    },
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  redact: {
    paths: ['req.headers.authorization', 'password', 'token', 'password_hash'],
    remove: true,
  },
});

export default logger;





