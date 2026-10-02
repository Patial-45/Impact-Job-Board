import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const res = context.getResponse<Response>();
    const req = context.getRequest<Request>();
    const status =
      error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = error instanceof HttpException ? error.getResponse() : null;
    const message =
      typeof body === 'object' && body && 'message' in body
        ? body.message
        : error instanceof HttpException
          ? error.message
          : 'Internal server error';
    if (status >= 500)
      console.error(
        JSON.stringify({
          level: 'error',
          event: 'http.error',
          route: req.path,
          status,
          error: error instanceof Error ? error.name : 'UnknownError',
        }),
      );
    res.status(status).json({
      code:
        status === 500
          ? 'INTERNAL_ERROR'
          : typeof body === 'object' && body && 'code' in body
            ? body.code
            : 'REQUEST_ERROR',
      message,
      requestId: res.getHeader('x-request-id'),
    });
  }
}
