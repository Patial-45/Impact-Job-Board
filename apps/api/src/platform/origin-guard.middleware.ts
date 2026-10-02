import type { Request, Response, NextFunction } from 'express';
export class OriginGuardMiddleware {
  constructor(private readonly webUrl: string) {}
  use = (req: Request, res: Response, next: NextFunction) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.header('origin');
    if (origin && origin !== this.webUrl)
      return res.status(403).json({ code: 'FORBIDDEN_ORIGIN', message: 'Origin is not allowed' });
    next();
  };
}
