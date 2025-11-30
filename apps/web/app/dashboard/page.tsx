// apps/web/app/dashboard/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { TodayWidget } from '@/components/dashboard/TodayWidget';
import { RiskProjectsBanner } from '@/components/dashboard/RiskProjectsBanner';
import { ProjectList } from '@/components/dashboard/ProjectList';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { ExpiringDocuments } from '@/components/dashboard/ExpiringDocuments';
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">대시보드</h1>
        <p className="text-slate-600 mt-1">오늘의 태양광 프로젝트 현황을 확인하세요.</p>
      </div>

      {/* 요약 카드 */}
      <SummaryCards stats={summary?.stats} />

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
  );
}
