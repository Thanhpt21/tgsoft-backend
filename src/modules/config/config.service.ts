import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';
import { UploadService } from '../upload/upload.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { ConfigResponseDto } from './dto/config-response.dto';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { Prisma } from '@prisma/client';

@Injectable()
export class ConfigService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
    private readonly uploadService: UploadService,
  ) {
    super(prisma, request);
  }

async create(
  dto: CreateConfigDto,
  logoFile?: Express.Multer.File,
  bannerFiles?: Express.Multer.File[],
) {
  // Kiểm tra tồn tại config cho tenant (nếu bạn muốn chỉ 1 config/tenant)
  const existing = await this.prisma.config.findFirst({
    where: { tenantId: this.tenantId },
  });
  if (existing) {
    return {
      success: false,
      message: 'Config đã tồn tại cho tenant này',
    };
  }

  // Upload logo + banner
  let logoUrl: string | null = null;
  let bannerUrls: string[] = [];

  try {
    // Upload logo (1 file)
    if (logoFile) {
      logoUrl = await this.uploadService.uploadLocalImage(logoFile);
    }

    // Upload nhiều ảnh banner
    if (bannerFiles?.length) {
      bannerUrls = await Promise.all(
        bannerFiles.map((file) => this.uploadService.uploadLocalImage(file))
      );
    }
  } catch (error) {
    return {
      success: false,
      message: 'Upload hình ảnh thất bại',
      error: error.message,
    };
  }

  // Hàm parse boolean an toàn
  const parseBool = (value: any, defaultValue: boolean): boolean => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return defaultValue;
  };

  // Tạo config
  const config = await this.prisma.config.create({
    data: {
      tenantId: this.tenantId,
      logo: logoUrl,
      banner: bannerUrls.length ? bannerUrls : Prisma.JsonNull,

      // Thông tin cơ bản
      name: dto.name,
      email: dto.email,
      mobile: dto.mobile,
      address: dto.address,
      googlemap: dto.googlemap,
      facebook: dto.facebook,
      zalo: dto.zalo,
      instagram: dto.instagram,
      tiktok: dto.tiktok,
      youtube: dto.youtube,
      x: dto.x,
      linkedin: dto.linkedin,

      // Cấu hình VNPAY
      VNP_TMN_CODE: dto.VNP_TMN_CODE,
      VNP_SECRET: dto.VNP_SECRET,
      VNP_API_URL: dto.VNP_API_URL,

      // Cấu hình Email
      EMAIL_USER: dto.EMAIL_USER,
      EMAIL_PASS: dto.EMAIL_PASS,
      EMAIL_FROM: dto.EMAIL_FROM,

      // Cờ hiển thị
      showEmail: parseBool(dto.showEmail, true),
      showMobile: parseBool(dto.showMobile, true),
      showAddress: parseBool(dto.showAddress, true),
      showGooglemap: parseBool(dto.showGooglemap, false),
      showFacebook: parseBool(dto.showFacebook, true),
      showZalo: parseBool(dto.showZalo, false),
      showInstagram: parseBool(dto.showInstagram, false),
      showTiktok: parseBool(dto.showTiktok, false),
      showYoutube: parseBool(dto.showYoutube, false),
      showX: parseBool(dto.showX, false),
      showLinkedin: parseBool(dto.showLinkedin, false),
    },
  });

  return {
    success: true,
    message: 'Tạo config thành công',
    data: new ConfigResponseDto(config),
  };
}



  async getConfigs(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;

    const where: Prisma.ConfigWhereInput = { tenantId: this.tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const [configs, total] = await this.prisma.$transaction([
      this.prisma.config.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.config.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách config thành công',
      data: {
        data: configs.map((c) => new ConfigResponseDto(c)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }


  async getAll(search = '') {
    const where: Prisma.ConfigWhereInput = { tenantId: this.tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const configs = await this.prisma.config.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      message: 'Lấy danh sách config thành công',
      data: configs.map((c) => new ConfigResponseDto(c)),
    };
  }

  async getById(id: number) {
    const config = await this.prisma.config.findUnique({ where: { id } });
    if (!config) return { success: false, message: 'Config không tồn tại' };

    return {
      success: true,
      message: 'Lấy config thành công',
      data: new ConfigResponseDto(config),
    };
  }

  async getByTenantId(tenantId: string | number) {
    const tenantIdNumber = typeof tenantId === 'string' ? parseInt(tenantId, 10) : tenantId;

    const config = await this.prisma.config.findFirst({
      where: { tenantId: tenantIdNumber },
    });

    if (!config) {
      return {
        success: false,
        message: `Config không tồn tại cho tenantId: ${tenantId}`,
      };
    }

    return {
      success: true,
      message: 'Lấy config theo tenantId thành công',
      data: new ConfigResponseDto(config),
    };
  }


  async update(
    id: number,
    dto: UpdateConfigDto,
    logoFile?: Express.Multer.File,
    bannerFiles?: Express.Multer.File[],
  ) {
    // 1. Kiểm tra tồn tại
    const config = await this.prisma.config.findFirst({
      where: { id, tenantId: this.tenantId },
    });

    if (!config) {
      return { success: false, message: 'Config không tồn tại trong tenant' };
    }

    // 2. Upload logo & banner mới (nếu có)
    let logoUrl = config.logo;
    let bannerUrls: string[] = Array.isArray(config.banner)
      ? (config.banner as string[])
      : [];

    try {
      // Xử lý logo
      if (logoFile) {
        // Xóa ảnh cũ nếu có
        if (config.logo) {
          await this.uploadService.deleteLocalImage(config.logo);
        }
        logoUrl = await this.uploadService.uploadLocalImage(logoFile);
      }

      // Xử lý banner (nhiều ảnh)
      if (bannerFiles?.length) {
        // Nếu muốn thêm mới => gộp ảnh cũ + ảnh mới
        const uploadedBannerUrls = await Promise.all(
          bannerFiles.map((file) => this.uploadService.uploadLocalImage(file))
        );
        bannerUrls = [...bannerUrls, ...uploadedBannerUrls];
      }
    } catch (error) {
      return {
        success: false,
        message: 'Upload hình ảnh thất bại',
        error: error.message,
      };
    }

    // 3. Parse boolean an toàn
    const parseBool = (value: any, defaultValue?: boolean): boolean | undefined => {
      if (value === 'true' || value === true) return true;
      if (value === 'false' || value === false) return false;
      return defaultValue ?? undefined;
    };

    // 4. Cập nhật Config
    const updated = await this.prisma.config.update({
      where: { id },
      data: {
        // Cập nhật cơ bản
        name: dto.name ?? config.name,
        email: dto.email ?? config.email,
        mobile: dto.mobile ?? config.mobile,
        address: dto.address ?? config.address,
        googlemap: dto.googlemap ?? config.googlemap,
        facebook: dto.facebook ?? config.facebook,
        zalo: dto.zalo ?? config.zalo,
        instagram: dto.instagram ?? config.instagram,
        tiktok: dto.tiktok ?? config.tiktok,
        youtube: dto.youtube ?? config.youtube,
        x: dto.x ?? config.x,
        linkedin: dto.linkedin ?? config.linkedin,
        logo: logoUrl,
        banner: bannerUrls.length ? bannerUrls : Prisma.JsonNull,

        // VNPAY
        VNP_TMN_CODE: dto.VNP_TMN_CODE ?? config.VNP_TMN_CODE,
        VNP_SECRET: dto.VNP_SECRET ?? config.VNP_SECRET,
        VNP_API_URL: dto.VNP_API_URL ?? config.VNP_API_URL,

        // Email
        EMAIL_USER: dto.EMAIL_USER ?? config.EMAIL_USER,
        EMAIL_PASS: dto.EMAIL_PASS ?? config.EMAIL_PASS,
        EMAIL_FROM: dto.EMAIL_FROM ?? config.EMAIL_FROM,

        // Cờ hiển thị
        showEmail: dto.showEmail !== undefined ? parseBool(dto.showEmail) : config.showEmail,
        showMobile: dto.showMobile !== undefined ? parseBool(dto.showMobile) : config.showMobile,
        showAddress: dto.showAddress !== undefined ? parseBool(dto.showAddress) : config.showAddress,
        showGooglemap: dto.showGooglemap !== undefined ? parseBool(dto.showGooglemap) : config.showGooglemap,
        showFacebook: dto.showFacebook !== undefined ? parseBool(dto.showFacebook) : config.showFacebook,
        showZalo: dto.showZalo !== undefined ? parseBool(dto.showZalo) : config.showZalo,
        showInstagram: dto.showInstagram !== undefined ? parseBool(dto.showInstagram) : config.showInstagram,
        showTiktok: dto.showTiktok !== undefined ? parseBool(dto.showTiktok) : config.showTiktok,
        showYoutube: dto.showYoutube !== undefined ? parseBool(dto.showYoutube) : config.showYoutube,
        showX: dto.showX !== undefined ? parseBool(dto.showX) : config.showX,
        showLinkedin: dto.showLinkedin !== undefined ? parseBool(dto.showLinkedin) : config.showLinkedin,
      },
    });

    // 5. Trả kết quả
    return {
      success: true,
      message: 'Cập nhật config thành công',
      data: new ConfigResponseDto(updated),
    };
  }



  async delete(id: number) {
    const config = await this.prisma.config.findUnique({ where: { id } });
    if (!config) return { success: false, message: 'Config không tồn tại' };

    if (config.logo) {
      await this.uploadService.deleteLocalImage(config.logo);
    }

    await this.prisma.config.delete({ where: { id } });

    return { success: true, message: 'Xóa config thành công' };
  }
}
