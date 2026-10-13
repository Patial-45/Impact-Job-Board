import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import type { Request, Response } from 'express';
import { HttpErrorFilter } from './http-error.filter';

describe('HttpErrorFilter', () => {
  let filter: HttpErrorFilter;
  let mockRequest: Partial<Request>;
  let mockResponse: {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
    getHeader: ReturnType<typeof vi.fn>;
  };
  let mockHost: ArgumentsHost;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    filter = new HttpErrorFilter();
    mockRequest = {
      path: '/api/v1/test',
      method: 'GET',
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      getHeader: vi.fn().mockReturnValue('req-12345'),
    };
    mockHost = {
      switchToHttp: () => ({
        getRequest: () => mockRequest as Request,
        getResponse: () => mockResponse as unknown as Response,
      }),
    } as unknown as ArgumentsHost;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('formats HttpException with correct status and message', () => {
    const error = new HttpException({ code: 'NOT_FOUND', message: 'Resource missing' }, HttpStatus.NOT_FOUND);
    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'NOT_FOUND',
        message: 'Resource missing',
        requestId: 'req-12345',
        path: '/api/v1/test',
      }),
    );
  });

  it('masks sensitive 500 error messages in production mode', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Database password leak: postgres://secret@localhost');
    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INTERNAL_ERROR',
        message: 'An unexpected internal error occurred. Please contact support with your request ID.',
        requestId: 'req-12345',
        path: '/api/v1/test',
      }),
    );
  });

  it('retains detailed error message when not in production for debugging', () => {
    process.env.NODE_ENV = 'test';
    const error = new Error('Query error details');
    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INTERNAL_ERROR',
        message: 'Query error details',
        requestId: 'req-12345',
      }),
    );
  });
});
