// apps/api/src/auth/dto/auth.dto.ts
import { IsEmail, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestMagicLinkDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}

export class VerifyMagicLinkDto {
  @ApiProperty()
  @IsString()
  token: string;
}

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '홍길동', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty()
  @IsString()
  companyId: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    companyId: string;
  };
}
