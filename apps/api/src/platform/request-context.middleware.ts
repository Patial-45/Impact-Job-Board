import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

const SENSITIVE_QUERY_PARAMS = new Set(['token', 'secret', 'code', 'password', 'key', 'apiKey', 'api_key']);

function sanitizeQuery(query: Request['query']): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (SENSITIVE_QUERY_PARAMS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'string') {
      result[key] = value.slice(0, 100);
    }
  }
  return result;
}

export class RequestContextMiddleware {
  use = (req: Request, res: Response, next: NextFunction) => {
    const rawRequestId = req.header('x-request-id') || req.header('x-correlation-id');
    const requestId =
      rawRequestId && /^[a-zA-Z0-9_-]{1,64}$/.test(rawRequestId) ? rawRequestId : randomUUID();

    res.setHeader('x-request-id', requestId);
    res.setHeader('x-correlation-id', requestId);

    const started = Date.now();
    res.on('finish', () => {
      const sanitizedQuery = Object.keys(req.query).length > 0 ? sanitizeQuery(req.query) : undefined;
      const logPayload: Record<string, unknown> = {
        level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
        event: 'http.request',
        requestId,
        method: req.method,
        route: req.path,
        status: res.statusCode,
        durationMs: Date.now() - started,
      };

      if (sanitizedQuery && Object.keys(sanitizedQuery).length > 0) {
        logPayload.query = sanitizedQuery;
      }

      console.log(JSON.stringify(logPayload));
    });

    next();
  };
}

