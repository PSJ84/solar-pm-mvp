// apps/api/src/share-links/share-links.service.ts
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ShareLinksService {
  constructor(private prisma: PrismaService) {}

  /**
   * MVP #9: 공유 링크 생성
   */
  async create(data: {
    projectId: string;
    password?: string;
    expiresAt?: Date;
    allowedStages?: string[];
    createdById: string;
  }) {
    const hashedPassword = data.password
      ? await bcrypt.hash(data.password, 10)
      : null;

    return this.prisma.shareLink.create({
      data: {
        projectId: data.projectId,
        password: hashedPassword,
        expiresAt: data.expiresAt,
        allowedStages: data.allowedStages || [],
        createdById: data.createdById,
      },
    });
  }

  /**
   * 토큰으로 공유 링크 조회 (외부 접근용)
   */
  async findByToken(token: string, password?: string) {
    const shareLink = await this.prisma.shareLink.findUnique({
      where: { token },
      include: {
        project: {
          include: {
            stages: {
              include: {
                template: true,
                tasks: {
                  include: {
                    photos: true,
                    documents: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!shareLink) {
      throw new NotFoundException('공유 링크를 찾을 수 없습니다.');
    }

    // 만료 체크
    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      throw new UnauthorizedException('만료된 공유 링크입니다.');
    }

    // 비밀번호 체크
    if (shareLink.password) {
      if (!password) {
        throw new UnauthorizedException('비밀번호가 필요합니다.');
      }
      const isValid = await bcrypt.compare(password, shareLink.password);
      if (!isValid) {
        throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
      }
    }

    // 조회수 증가
    await this.prisma.shareLink.update({
      where: { id: shareLink.id },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    });

    // 허용된 단계만 필터링
    const project = shareLink.project;
    if (shareLink.allowedStages.length > 0) {
      project.stages = project.stages.filter((stage) =>
        shareLink.allowedStages.includes(stage.template.name),
      );
    }

    return {
      project: {
        id: project.id,
        name: project.name,
        address: project.address,
        capacityKw: project.capacityKw,
        status: project.status,
        stages: project.stages,
      },
      expiresAt: shareLink.expiresAt,
    };
  }

  /**
   * 프로젝트의 공유 링크 목록 조회
   */
  async findByProject(projectId: string) {
    return this.prisma.shareLink.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 공유 링크 삭제
   */
  async remove(id: string) {
    return this.prisma.shareLink.delete({ where: { id } });
  }
}
