// apps/web/app/templates/page.tsx
import { AppShell } from '@/components/layout/AppShell';

export default function TemplatesPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">체크리스트 템플릿 관리</h1>
          <p className="text-slate-600 mt-1">템플릿 CRUD 기능이 곧 추가될 예정입니다.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-600">
          템플릿 목록과 편집 화면을 준비 중입니다.
        </div>
      </div>
    </AppShell>
  );
}
