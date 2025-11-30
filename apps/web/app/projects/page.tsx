// apps/web/app/projects/page.tsx
'use client';

import { ProjectList } from '@/components/dashboard/ProjectList';
import { AppShell } from '@/components/layout/AppShell';

export default function ProjectsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">프로젝트</h1>
          <p className="text-slate-600 mt-1">프로젝트 전체 목록을 확인하세요.</p>
        </div>
        <ProjectList />
      </div>
    </AppShell>
  );
}
