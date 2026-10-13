import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const res = context.getResponse<Response>();
    const req = context.getRequest<Request>();
    const isProduction = process.env.NODE_ENV === 'production';

    const status =
      error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = error instanceof HttpException ? error.getResponse() : null;

    let message: string | string[];
    if (status >= 500 && isProduction) {
      message = 'An unexpected internal error occurred. Please contact support with your request ID.';
    } else if (typeof body === 'object' && body && 'message' in body) {
      message = (body as { message: string | string[] }).message;
    } else if (error instanceof HttpException) {
      message = error.message;
    } else if (error instanceof Error && !isProduction) {
      message = error.message;
    } else {
      message = 'Internal server error';
    }

    const requestId = (res.getHeader('x-request-id') as string) || (res.getHeader('x-correlation-id') as string) || undefined;

    if (status >= 500) {
      console.error(
        JSON.stringify({
          level: 'error',
          event: 'http.error',
          route: req.path,
          method: req.method,
          status,
          requestId,
          error: error instanceof Error ? error.name : 'UnknownError',
          errorMessage: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        }),
      );
    }

    res.status(status).json({
      code:
        status === 500
          ? 'INTERNAL_ERROR'
          : typeof body === 'object' && body && 'code' in body
            ? (body as { code: string }).code
            : 'REQUEST_ERROR',
      message,
      requestId,
      path: req.path,
      timestamp: new Date().toISOString(),
    });
  }
}

