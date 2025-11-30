// apps/web/app/notifications/page.tsx
import { AppShell } from '@/components/layout/AppShell';

export default function NotificationsPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">알림 센터</h1>
          <p className="text-slate-600 mt-1">새로운 알림 기능을 준비 중입니다.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-600">
          알림 목록과 읽음 처리 기능이 곧 제공될 예정입니다.
        </div>
      </div>
    </AppShell>
  );
}
