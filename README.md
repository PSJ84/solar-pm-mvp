# 🌞 Solar PM - 태양광 프로젝트 관리 MVP



## 📌 프로젝트 개요

태양광 발전소 인허가 및 시공 프로젝트를 효율적으로 관리하는 SaaS 플랫폼입니다.

### MVP 핵심 기능

| # | 기능 | 설명 | 구현 상태 |
|---|------|------|-----------|
| #1 | 프로젝트 생성 | 발전소 정보 + 단계 자동 생성 | ✅ 완료 |
| #2 | 태스크 관리 | 담당자 배정, 상태 변경 | ✅ 완료 |
| #3 | 문서 버전 관리 | 보완 버전 추적 | ✅ 완료 |
| #5 | 현장 사진 업로드 | GPS + 타임스탬프 | 🔲 구조만 |
| #6 | 오늘 마감 위젯 | 대시보드 위젯 | ✅ 완료 |
| #9 | 외부 공유 링크 | 비밀번호 + 만료일 | ✅ 완료 |
| #20 | 착공 강제 조건 | 필수 태스크 체크 | ✅ 완료 |
| #24 | 문서 만료 알림 | 30일 전 알림 | ✅ 완료 |
| #25 | 지연 위험 프로젝트 | 위험도 점수 계산 | ✅ 완료 |
| #30 | 활동 로그 | 태스크 변경 히스토리 | ✅ 완료 |

## 🛠 기술 스택

- **프론트엔드**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **상태관리**: TanStack Query (React Query)
- **백엔드**: NestJS + TypeScript
- **DB**: PostgreSQL + Prisma ORM
- **파일 저장**: AWS S3 + presigned URL (MVP는 구조만)
- **인증**: Magic Link (이메일 로그인)
- **배포**: Vercel (프론트) + Railway/Render (백엔드+DB)

## 📂 프로젝트 구조

```
solar-pm-mvp/
├── apps/
│   ├── web/          # Next.js 15 App Router (프론트엔드)
│   └── api/          # NestJS (백엔드 API)
├── packages/
│   ├── ui/           # 공용 UI 컴포넌트
│   ├── config/       # 공용 타입, 상수, 환경설정
│   └── prisma/       # Prisma schema 및 client
├── .env.example      # 환경변수 템플릿
├── pnpm-workspace.yaml
└── package.json
```

## 🚀 빠른 시작

### 1. 필수 요구사항

- Node.js 18+
- pnpm 8+ (`npm install -g pnpm`)
- PostgreSQL 14+ (로컬 또는 클라우드)

### 2. 저장소 클론 및 의존성 설치

```bash
git clone <repository-url>
cd solar-pm-mvp
pnpm install
```

### 3. 환경변수 설정

```bash
cp .env.example .env
# .env 파일을 열고 DATABASE_URL 등을 설정
```

- **Railway 배포 시 주의**: Prisma migrate는 `DATABASE_URL`과 `DIRECT_URL`이 모두 설정되어 있어야 하며, `DIRECT_URL`이 없으면 P1012 오류로 실패할 수 있습니다. 두 값을 모두 Railway Variables에 넣어주세요.

### 4. 데이터베이스 설정

```bash
# Prisma 클라이언트 생성
pnpm db:generate

# DB 마이그레이션 (스키마 적용)
pnpm db:migrate

# (선택) 초기 데이터 시딩
cd packages/prisma && pnpm seed
```

### 5. 개발 서버 실행

```bash
# 전체 실행 (프론트 + 백엔드)
pnpm dev

# 또는 개별 실행
pnpm dev:web   # Next.js (http://localhost:3000)
pnpm dev:api   # NestJS (http://localhost:3001)
```

### 6. 접속

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:3001/api
- **Swagger 문서**: http://localhost:3001/api/docs
- **Prisma Studio**: `pnpm db:studio` (http://localhost:5555)

### 배포 시 Vercel ↔ Railway 연동 점검

- Railway Public URL이 변경되면 **Vercel 프로젝트의 `NEXT_PUBLIC_API_URL` 환경변수**도 동일한 값(예: `https://<railway-subdomain>.railway.app`)으로 맞춘다.
- 프론트 빌드 전 Vercel Environment Variables에서 API URL이 최신인지 확인한다.
- /api/health가 200 OK를 반환하는지 Railway Logs에서 확인해 API 컨테이너가 실제로 기동했는지 점검한다.
- Supabase는 migrate 시 풀러(6543) 대신 직결(5432)을 권장하므로, Railway/환경변수에 `DIRECT_URL`을 설정하고 `pnpm --filter @solar-pm/prisma migrate:deploy:log`로 적용/누락 여부를 로그로 확인한다.
- `DIRECT_URL`을 넣지 못한 경우를 대비해 모든 Prisma 스크립트가 `DIRECT_URL=${DIRECT_URL:-$DATABASE_URL}`으로 기본값을 지정한다(풀러로도 동작). 가능하면 Railway Variables에 `DIRECT_URL`을 추가해 직결로 마이그레이션한다.

## 📋 주요 API 엔드포인트

```
# 인증
POST   /api/auth/magic-link    Magic Link 요청
POST   /api/auth/verify        Magic Link 검증

# 대시보드
GET    /api/dashboard/summary  요약 통계
GET    /api/dashboard/today    오늘 마감 태스크 (#6)
GET    /api/dashboard/risk-projects  지연 위험 프로젝트 (#25)

# 프로젝트
GET    /api/projects           프로젝트 목록
POST   /api/projects           프로젝트 생성 (#1)
GET    /api/projects/:id       프로젝트 상세
GET    /api/projects/:id/activity-log  활동 로그 (#30)

# 태스크
PATCH  /api/tasks/:id/status   상태 변경 + 히스토리 기록 (#30)

# 공유 링크
POST   /api/share-links        공유 링크 생성 (#9)
GET    /api/share-links/view/:token  외부 조회
```

## 📝 MVP 이후 TODO

### Phase 1 (2주)
- [ ] Magic Link 실제 이메일 발송 (Nodemailer)
- [ ] AWS S3 파일 업로드 연동
- [ ] 사진 GPS 메타데이터 추출
- [ ] React Query 실제 연동 (Mock → API)

### Phase 2 (4주)
- [ ] 실시간 알림 (WebSocket 또는 SSE)
- [ ] 이메일 알림 스케줄러 (D-7, D-3, D-1)
- [ ] 문서 만료 30일 전 알림
- [ ] 착공 전 필수 태스크 검증 로직 강화

### Phase 3 (MVP 완성)
- [ ] 모바일 반응형 최적화
- [ ] 오프라인 모드 (PWA)
- [ ] 단계/태스크 템플릿 커스터마이징 UI
- [ ] 프로젝트 대시보드 차트 (진행률 추이)
- [ ] 다중 회사 지원 (Multi-tenancy)

### 인프라
- [ ] Vercel 배포 설정
- [ ] Railway/Render 백엔드 배포
- [ ] CI/CD 파이프라인 (GitHub Actions)
- [ ] 에러 모니터링 (Sentry)
- [ ] 로깅 (Logtail/Papertrail)

## 🔒 환경변수 설명

| 변수 | 설명 | 예시 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 (런타임/풀러) | `postgresql://user:pass@localhost:5432/solar_pm` |
| `DIRECT_URL` | Prisma migrate 전용 직결 문자열(풀러 우회) | `postgresql://user:pass@localhost:5432/solar_pm?pgbouncer=false` |
| `JWT_SECRET` | JWT 서명 키 | 32자 이상 랜덤 문자열 |
| `MAGIC_LINK_SECRET` | Magic Link 암호화 키 | 32자 이상 랜덤 문자열 |
| `NEXT_PUBLIC_API_URL` | API 서버 URL | `http://localhost:3001` |
| `SMTP_*` | 이메일 발송 설정 | SMTP 서버 정보 |

## 🤝 기여 가이드

1. 이 저장소를 Fork
2. Feature 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📄 라이선스

Private - All Rights Reserved

---

**개발자**: 12년차 태양광 PM + 8년차 SaaS 빌더  
**문의**: 프로젝트 이슈 탭 활용