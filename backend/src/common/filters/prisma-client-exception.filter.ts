import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception.code === 'P2002') {
      const target = Array.isArray(exception.meta?.target)
        ? exception.meta.target.join(', ')
        : 'campo único';
      const conflict = new ConflictException(
        `Ya existe un registro con el valor informado en: ${target}.`,
      );
      response.status(conflict.getStatus()).json(conflict.getResponse());
      return;
    }

    if (exception.code === 'P2025') {
      const notFound = new NotFoundException(
        'No se encontró el recurso solicitado.',
      );
      response.status(notFound.getStatus()).json(notFound.getResponse());
      return;
    }

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Ocurrió un error al procesar la operación en la base de datos.',
      error: 'Bad Request',
    });
  }
}
