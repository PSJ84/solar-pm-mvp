// apps/api/src/vendors/vendors.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.vendor.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, deletedAt: null },
    });

    if (!vendor) {
      throw new NotFoundException('업체를 찾을 수 없습니다.');
    }

    return vendor;
  }

  async create(dto: CreateVendorDto) {
    return this.prisma.vendor.create({ data: dto });
  }

  async update(id: string, dto: UpdateVendorDto) {
    await this.findOne(id);

    return this.prisma.vendor.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    const deletedAt = new Date();

    return this.prisma.vendor.update({
      where: { id },
      data: { deletedAt },
    });
  }
}
