// upload.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Get,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';


@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File không được để trống');
    }

    // Kiểm tra loại file
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Chỉ chấp nhận định dạng ảnh: JPEG, JPG, PNG, WEBP, GIF');
    }

    // Kiểm tra kích thước (max 10MB - tăng lên vì banner có thể lớn)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File không được vượt quá 10MB');
    }

    try {
      const imageUrl = await this.uploadService.uploadLocalImage(file);
      return {
        success: true,
        message: 'Upload ảnh thành công',
        data: { url: imageUrl },
      };
    } catch (error) {
      throw new BadRequestException('Upload thất bại: ' + error.message);
    }
  }

  // Bonus: Route xem ảnh trực tiếp (tùy chọn, nếu cần)
  // Không cần thiết vì Nginx đã serve /uploads/
  // Nhưng nếu muốn backend proxy thì thêm:
  // @Get('image/:filename')
  // async getImage(@Param('filename') filename: string, @Res() res: Response) {
  //   const filePath = path.join(this.uploadService['uploadDir'], filename);
  //   if (!fs.existsSync(filePath)) {
  //     throw new NotFoundException('Ảnh không tồn tại');
  //   }
  //   return res.sendFile(filePath);
  // }
}