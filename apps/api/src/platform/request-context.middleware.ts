import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
export class RequestContextMiddleware {
  use = (req: Request, res: Response, next: NextFunction) => {
    const provided = req.header('x-request-id');
    const requestId = provided && /^[a-zA-Z0-9_-]{1,64}$/.test(provided) ? provided : randomUUID();
    res.setHeader('x-request-id', requestId);
    const started = Date.now();
    res.on('finish', () =>
      console.log(
        JSON.stringify({
          level: 'info',
          event: 'http.request',
          requestId,
          method: req.method,
          route: req.path,
          status: res.statusCode,
          durationMs: Date.now() - started,
        }),
      ),
    );
    next();
  };
}
