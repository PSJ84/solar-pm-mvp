// apps/api/src/documents/documents.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// TODO: AWS S3 연동
// import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 문서 업로드 (MVP #3 버전 관리)
   * TODO: 실제 S3 연동 구현
   */
  async create(data: {
    fileName: string;
    fileUrl: string;
    fileSize?: number;
    mimeType?: string;
    docType?: string;
    expiryDate?: Date; // MVP #24 만료일
    projectId: string;
    taskId?: string;
    parentId?: string; // 버전 관리용 부모 문서
  }) {
    // 버전 관리: 부모 문서가 있으면 revision 증가
    let revision = 1;
    if (data.parentId) {
      const parent = await this.prisma.document.findUnique({
        where: { id: data.parentId },
      });
      if (parent) {
        revision = parent.revision + 1;
      }
    }

    return this.prisma.document.create({
      data: {
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        docType: data.docType,
        expiryDate: data.expiryDate,
        projectId: data.projectId,
        taskId: data.taskId,
        parentId: data.parentId,
        revision,
      },
    });
  }

  /**
   * 프로젝트 문서 목록 조회
   */
  async findByProject(projectId: string) {
    return this.prisma.document.findMany({
      where: { projectId },
      orderBy: [{ docType: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * 문서 버전 히스토리 조회 (MVP #3)
   */
  async getVersionHistory(documentId: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      throw new NotFoundException('문서를 찾을 수 없습니다.');
    }

    // 같은 계열의 모든 버전 조회
    // TODO: parentId 체인을 따라가는 로직 구현
    return this.prisma.document.findMany({
      where: {
        OR: [
          { id: documentId },
          { parentId: documentId },
        ],
      },
      orderBy: { revision: 'desc' },
    });
  }

  /**
   * MVP #24: 만료 예정 문서 조회
   */
  async getExpiringDocuments(companyId: string, daysAhead = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.prisma.document.findMany({
      where: {
        project: { companyId },
        expiryDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  /**
   * S3 Presigned URL 생성 (업로드용)
   * TODO: 실제 구현
   */
  async getUploadUrl(fileName: string, contentType: string) {
    // const s3Client = new S3Client({ region: process.env.AWS_S3_REGION });
    // const command = new PutObjectCommand({
    //   Bucket: process.env.AWS_S3_BUCKET,
    //   Key: `documents/${Date.now()}-${fileName}`,
    //   ContentType: contentType,
    // });
    // const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    // return { url, key };

    // MVP: 임시 로컬 URL 반환
    return {
      url: `http://localhost:3001/api/upload/mock`,
      key: `documents/${Date.now()}-${fileName}`,
    };
  }
}
