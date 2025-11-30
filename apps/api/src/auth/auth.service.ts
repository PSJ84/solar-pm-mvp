// apps/api/src/auth/auth.service.ts
import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
// import * as nodemailer from 'nodemailer'; // TODO: 실제 이메일 발송 구현

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Magic Link 요청 - 이메일로 로그인 링크 발송
   * MVP: 실제 이메일 대신 콘솔 출력 (개발용)
   */
  async requestMagicLink(email: string): Promise<{ message: string; token?: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('등록되지 않은 이메일입니다.');
    }

    // Magic Link 토큰 생성 (30분 유효)
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        magicLinkToken: token,
        magicLinkExpires: expires,
      },
    });

    // TODO: 실제 이메일 발송 구현
    // await this.sendMagicLinkEmail(email, token);

    // MVP 개발용: 토큰을 응답에 포함 (프로덕션에서는 제거)
    const magicLink = `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/auth/verify?token=${token}`;
    console.log(`🔗 Magic Link for ${email}: ${magicLink}`);

    return {
      message: '로그인 링크가 이메일로 발송되었습니다.',
      token: process.env.NODE_ENV === 'development' ? token : undefined,
    };
  }

  /**
   * Magic Link 검증 및 JWT 발급
   */
  async verifyMagicLink(token: string): Promise<{ accessToken: string; user: any }> {
    const user = await this.prisma.user.findFirst({
      where: {
        magicLinkToken: token,
        magicLinkExpires: {
          gt: new Date(),
        },
      },
      include: {
        company: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('유효하지 않거나 만료된 링크입니다.');
    }

    // 토큰 무효화
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        magicLinkToken: null,
        magicLinkExpires: null,
      },
    });

    // JWT 발급
    const payload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        companyName: user.company.name,
      },
    };
  }

  /**
   * JWT 토큰으로 사용자 정보 조회
   */
  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  /**
   * 현재 사용자 정보 조회
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      companyName: user.company.name,
    };
  }

  // TODO: 실제 이메일 발송 구현
  // private async sendMagicLinkEmail(email: string, token: string) {
  //   const transporter = nodemailer.createTransport({...});
  //   await transporter.sendMail({...});
  // }
}
