// upload.service.ts
import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private readonly uploadDir = '/app/uploads';  // ĐƯỜNG DẪN TRONG CONTAINER

  async uploadLocalImage(file: Express.Multer.File): Promise<string> {
    const filename = `${uuidv4()}-${file.originalname}`;
    const uploadPath = join(this.uploadDir, filename);

    // Tạo thư mục nếu chưa có
    if (!existsSync(this.uploadDir)) {
      console.log('Creating uploads directory...');
      await mkdir(this.uploadDir, { recursive: true });
    }

    // Lưu file
    await writeFile(uploadPath, file.buffer);

    return `/uploads/${filename}`;
  }

  async deleteLocalImage(relativePath: string): Promise<void> {
    try {
      const filePath = join(this.uploadDir, relativePath.replace(/^\/uploads\//, ''));
      await unlink(filePath);
    } catch (error) {
      console.error('Delete error:', error);
    }
  }
}