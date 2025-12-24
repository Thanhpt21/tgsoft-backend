// upload.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly uploadDir: string;
  private readonly publicUrl: string; // URL base để truy cập ảnh (ví dụ https://store.aiban.vn/uploads)

  constructor(private configService: ConfigService) {
    // Thư mục lưu ảnh trên VPS
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', '/var/www/store.aiban.vn/uploads');

    // URL public để truy cập ảnh
    this.publicUrl = this.configService.get<string>('UPLOAD_PUBLIC_URL', 'https://store.aiban.vn/uploads');

    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      console.log(`📁 Thư mục upload đã được tạo: ${this.uploadDir}`);
    }
  }

  /**
   * Upload ảnh lên VPS (local storage)
   * @param file Express.Multer.File
   * @returns URL public của ảnh
   */
  async uploadLocalImage(file: Express.Multer.File): Promise<string> {
    if (!file || !file.buffer) {
      throw new BadRequestException('File không hợp lệ');
    }

    // Kiểm tra loại file (chỉ cho phép ảnh)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Chỉ hỗ trợ định dạng ảnh: JPEG, PNG, GIF, WebP, SVG');
    }

    // Tạo tên file unique
    const ext = path.extname(file.originalname);
    const fileName = `${uuidv4()}${ext}`;
    const filePath = path.join(this.uploadDir, fileName);

    // Ghi file vào disk
    try {
      fs.writeFileSync(filePath, file.buffer);
      console.log(`✅ Upload thành công: ${filePath}`);
    } catch (error) {
      console.error('❌ Lỗi ghi file:', error);
      throw new BadRequestException('Không thể lưu ảnh lên server');
    }

    // Trả về URL public
    return `${this.publicUrl.replace(/\/$/, '')}/${fileName}`;
  }

  /**
   * Xóa ảnh cũ khi update
   * @param imageUrl URL ảnh cũ (ví dụ https://store.aiban.vn/uploads/abc.jpg)
   */
  async deleteLocalImage(imageUrl: string): Promise<void> {
    if (!imageUrl) return;

    try {
      // Trích xuất tên file từ URL
      const urlPath = new URL(imageUrl).pathname;
      const fileName = path.basename(urlPath);
      const filePath = path.join(this.uploadDir, fileName);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ Đã xóa ảnh cũ: ${filePath}`);
      }
    } catch (error) {
      console.error('❌ Lỗi xóa ảnh:', error);
      // Không throw để không làm gián đoạn update config
    }
  }
}