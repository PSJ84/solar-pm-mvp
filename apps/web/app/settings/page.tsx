// apps/web/app/settings/page.tsx
import { AppShell } from '@/components/layout/AppShell';

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">설정</h1>
          <p className="text-slate-600 mt-1">계정 및 환경 설정 페이지를 준비 중입니다.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-600">
          알림, 권한, 회사 정보 관리 기능이 곧 제공될 예정입니다.
        </div>
      </div>
    </AppShell>
  );
}
