// apps/web/app/settings/page.tsx
import { AppShell } from '@/components/layout/AppShell';
import Link from 'next/link';
import { Settings, Users } from 'lucide-react';

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-solar-500" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">설정</h1>
            <p className="text-slate-600 mt-1">회사 설정과 마스터 데이터를 관리하세요.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/settings/vendors"
            className="block bg-white border border-slate-200 rounded-xl p-5 hover:border-solar-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-solar-500" />
              <div>
                <h2 className="text-lg font-semibold text-slate-900">업체 관리</h2>
                <p className="text-sm text-slate-600">협력업체 정보를 등록하고 프로젝트에 연결합니다.</p>
              </div>
            </div>
          </Link>

          <div className="bg-white border border-dashed border-slate-200 rounded-xl p-5 text-slate-600">
            알림, 권한, 회사 정보 관리 기능이 곧 제공될 예정입니다.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
