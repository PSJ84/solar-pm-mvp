import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch()
export class LoggingExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const responseBody = isHttpException ? exception.getResponse() : 'Internal server error';
    const message =
      typeof responseBody === 'string'
        ? responseBody
        : (responseBody as Record<string, any>)?.message || 'Internal server error';

    const error = exception as any;
    const isPrismaError =
      error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientUnknownRequestError ||
      error instanceof Prisma.PrismaClientInitializationError ||
      error instanceof Prisma.PrismaClientValidationError ||
      error instanceof Prisma.PrismaClientRustPanicError;

    const logPayload: Record<string, any> = {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    };

    if (isPrismaError && 'code' in error) {
      logPayload.code = (error as Prisma.PrismaClientKnownRequestError).code;
    }

    if (isPrismaError && 'meta' in error) {
      logPayload.meta = (error as Prisma.PrismaClientKnownRequestError).meta;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.error(`[${request.method}] ${request.url} -> status ${status}`, logPayload);
    } else {
      console.error(`[${request.method}] ${request.url} -> status ${status}: ${message}`);
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
