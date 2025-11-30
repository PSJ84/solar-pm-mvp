// apps/web/app/documents/page.tsx
import { AppShell } from '@/components/layout/AppShell';

export default function DocumentsPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">문서 관리</h1>
          <p className="text-slate-600 mt-1">문서 만료 관리 화면을 준비 중입니다.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-600">
          만료 임박 문서와 프로젝트별 문서를 확인하는 기능이 곧 제공될 예정입니다.
        </div>
      </div>
    </AppShell>
  );
}
