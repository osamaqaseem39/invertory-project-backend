import { Request, Response, NextFunction } from 'express';
import { AppError, formatError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    path: req.path,
    method: req.method,
  }, 'Request error');

  if (error instanceof AppError) {
    res.status(error.statusCode).json(formatError(error));
  } else {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
};

/**
 * 404 handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response
): void => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};

