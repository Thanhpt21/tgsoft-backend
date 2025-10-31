// upload.service.ts
import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {}

  private get uploadDir(): string {
    // ƯU TIÊN: .env → fallback → process.cwd()
    const envDir = this.configService.get<string>('UPLOAD_DIR');
    if (envDir) return envDir;

    // Local fallback
    return join(process.cwd(), 'uploads');
  }

  async uploadLocalImage(file: Express.Multer.File): Promise<string> {
    const filename = `${uuidv4()}-${file.originalname}`;
    const uploadPath = join(this.uploadDir, filename);

    if (!existsSync(this.uploadDir)) {
      console.log('Creating uploads directory at:', this.uploadDir);
      await mkdir(this.uploadDir, { recursive: true });
    }

    await writeFile(uploadPath, file.buffer);
    console.log('Uploaded:', uploadPath);

    return `uploads/${filename}`;
  }

  async deleteLocalImage(relativePath: string): Promise<void> {
    try {
      const filename = relativePath.replace(/^uploads\//, '');
      const filePath = join(this.uploadDir, filename);
      await unlink(filePath);
      console.log('Deleted:', filePath);
    } catch (error) {
      console.error('Delete error:', error);
    }
  }
}