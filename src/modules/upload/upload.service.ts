import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  async uploadLocalImage(file: Express.Multer.File): Promise<string> {
    const filename = `${uuidv4()}-${file.originalname}`;
    
    // ⭐ Đường dẫn tuyệt đối đến thư mục uploads (ngang hàng với src)
    const uploadDir = join(process.cwd(), 'uploads');
    const uploadPath = join(uploadDir, filename);

    // Tạo thư mục nếu chưa có
    if (!existsSync(uploadDir)) {
      console.log('🆕 Creating uploads directory...');
      await mkdir(uploadDir, { recursive: true });
    }

    // Lưu file
    await writeFile(uploadPath, file.buffer);


    return `/uploads/${filename}`.replace(/^\/+/, ''); 
  }

  async deleteLocalImage(relativePath: string): Promise<void> {
    try {
      const filePath = join(process.cwd(), relativePath);
      await unlink(filePath);
    } catch (error) {
      console.error('❌ Delete error:', error);
    }
  }
}