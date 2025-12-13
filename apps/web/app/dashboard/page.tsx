// apps/web/app/dashboard/page.tsx
'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { TodayWidget } from '@/components/dashboard/TodayWidget';
import { RiskProjectsBanner } from '@/components/dashboard/RiskProjectsBanner';
import { ProjectList } from '@/components/dashboard/ProjectList';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { ExpiringDocuments } from '@/components/dashboard/ExpiringDocuments';
import { MyWorkSection } from '@/components/dashboard/MyWorkSection';
import { dashboardApi, DashboardFullSummary } from '@/lib/api';

export default function DashboardPage() {
  // [v1.1] 통합 Summary API 호출
  const { data: summary, isLoading, error } = useQuery<DashboardFullSummary>({
    queryKey: ['dashboard', 'full-summary'],
    queryFn: async () => {
      const res = await dashboardApi.getFullSummary();
      return res.data;
    },
    // 개발 중에는 에러가 나도 fallback 데이터 사용
    retry: 1,
    staleTime: 30 * 1000, // 30초
  });

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">대시보드</h1>
          <p className="text-slate-600 mt-1">데이터를 불러오는 중...</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-slate-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">대시보드</h1>
          <p className="text-slate-600 mt-1">오늘의 태양광 프로젝트 현황을 확인하세요.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            href="/tasks"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
          >
            내 태스크
          </Link>
          <Link
            href="/tomorrow"
            className="inline-flex items-center justify-center rounded-lg bg-solar-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-solar-600"
          >
            내일 뭐하지?
          </Link>
        </div>
      </div>

      {/* 요약 카드 */}
      <SummaryCards stats={summary?.stats} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* 오늘 마감 위젯 + 지연 위험 배너 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TodayWidget
              tasks={summary?.todayTasks || []}
              upcoming7Days={summary?.upcoming7Days || []}
            />
            <RiskProjectsBanner projects={summary?.riskProjects || []} />
          </div>

          {/* [v1.1] 만료 임박 문서 */}
          {summary?.expiringDocuments && summary.expiringDocuments.length > 0 && (
            <ExpiringDocuments documents={summary.expiringDocuments} />
          )}

          {/* 프로젝트 목록 */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">내 프로젝트</h2>
            <ProjectList />
          </div>
        </div>

        <div className="space-y-6">
          <MyWorkSection />
        </div>
      </div>
    </div>
  );
}
