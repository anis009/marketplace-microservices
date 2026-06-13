import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodObject, ZodRawShape } from 'zod';
import { sendError } from '../utils/response';

export const validate = <T extends ZodRawShape>(
  schema: ZodObject<T>,
  source: 'body' | 'query' | 'params' = 'body'
): RequestHandler => {
  return ((req: Request, res: Response, next: NextFunction): void => {
    const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
    const parsed = schema.safeParse(data);

    if (!parsed.success) {
      sendError(res, {
        statusCode: 400,
        message: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    // Attach validated data
    if (source === 'body') {
      req.body = parsed.data;
    } else if (source === 'query') {
      req.query = parsed.data as any;
    } else {
      req.params = parsed.data as any;
    }

    next();
  }) as unknown as RequestHandler;
};
