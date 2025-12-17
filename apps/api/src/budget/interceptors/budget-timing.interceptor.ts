import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { tap } from 'rxjs/operators';

@Injectable()
export class BudgetTimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(BudgetTimingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler) {
    const now = Date.now();
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();
    const path = `${request.method} ${request.url}`;

    this.logger.log(`[Budget] Start ${path}`);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        try {
          response.setHeader('X-Response-Time', `${duration}ms`);
        } catch (error) {
          this.logger.warn(`Failed to set X-Response-Time header for ${path}: ${String(error)}`);
        }
        this.logger.log(`[Budget] Completed ${path} in ${duration}ms`);
      }),
    );
  }
}
