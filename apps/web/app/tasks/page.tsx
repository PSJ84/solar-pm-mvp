// apps/web/app/tasks/page.tsx
import { AppShell } from '@/components/layout/AppShell';

export default function TasksPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">내 태스크</h1>
          <p className="text-slate-600 mt-1">모든 태스크 목록을 한 곳에서 확인할 수 있도록 준비 중입니다.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-600">
          곧 태스크 목록과 필터 기능이 제공될 예정입니다.
        </div>
      </div>
    </AppShell>
  );
}
