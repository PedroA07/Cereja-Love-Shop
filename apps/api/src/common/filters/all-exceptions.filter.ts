import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

/**
 * Filtro global de erros (§10): nunca vaza stack trace nem detalhe interno ao
 * cliente. Erros inesperados viram 500 genérico com um id de correlação, que
 * é o que aparece no log do servidor para investigação.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      // Erros de domínio já são seguros para exibir (mensagens tratadas).
      if (status >= 500) {
        const errorId = randomUUID();
        this.logger.error(`[${errorId}] ${req.method} ${req.url}`, exception.stack);
        res.status(status).json({
          statusCode: status,
          message: 'Erro interno. Tente novamente em instantes.',
          errorId,
        });
        return;
      }
      res.status(status).json(typeof body === 'string' ? { statusCode: status, message: body } : body);
      return;
    }

    const errorId = randomUUID();
    this.logger.error(
      `[${errorId}] ${req.method} ${req.url} — ${String(exception)}`,
      exception instanceof Error ? exception.stack : undefined,
    );
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Erro interno. Tente novamente em instantes.',
      errorId,
    });
  }
}
