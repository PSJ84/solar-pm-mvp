import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

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

    const stackSnippet = exception instanceof Error && exception.stack
      ? exception.stack.split('\n').slice(0, 3).join('\n')
      : undefined;

    console.error(
      `[${request.method}] ${request.url} -> status ${status}: ${message}`,
      stackSnippet,
    );

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
