import { mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';

import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';

export const productPhotoMulterOptions = {
  storage: diskStorage({
    destination: (_req, _file, callback) => {
      const uploadDir = process.env.UPLOAD_DIR || 'uploads';
      const destinationPath = join(process.cwd(), uploadDir, 'products');
      mkdirSync(destinationPath, { recursive: true });
      callback(null, destinationPath);
    },
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(
        new BadRequestException(
          'Solo se permiten archivos de imagen.',
        ) as never,
        false,
      );
      return;
    }

    callback(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};
