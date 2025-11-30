// apps/web/components/dashboard/RiskProjectsBanner.tsx
'use client';

import Link from 'next/link';
import { AlertTriangle, ChevronRight, TrendingDown, Clock } from 'lucide-react';
import { cn, SEVERITY_LABELS } from '@/lib/utils';
import type { RiskProjectItem } from '@/lib/api';

interface RiskProjectsBannerProps {
  projects: RiskProjectItem[];
}

export function RiskProjectsBanner({ projects }: RiskProjectsBannerProps) {
  if (projects.length === 0) {
    return (
      <div className="bg-green-50 rounded-xl border border-green-200 p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingDown className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-green-900">모든 프로젝트 정상</h3>
            <p className="text-sm text-green-700">지연 위험 프로젝트가 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-red-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-red-900">지연 위험 프로젝트</h3>
            <p className="text-sm text-red-700">{projects.length}개 프로젝트 주의 필요</p>
          </div>
        </div>
        <Link
          href="/projects?filter=risk"
          className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
        >
          전체 보기
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 위험 프로젝트 목록 */}
      <div className="divide-y divide-slate-100">
        {projects.slice(0, 5).map((project) => {
          const severityConfig = SEVERITY_LABELS[project.severity] || SEVERITY_LABELS.medium;
          
          return (
            <Link
              key={project.projectId}
              href={`/projects/${project.projectId}`}
              className="block px-5 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-slate-900 truncate">
                      {project.projectName}
                    </h4>
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs font-medium rounded-full',
                        severityConfig.color
                      )}
                    >
                      {severityConfig.label}
                    </span>
                  </div>
                  
                  {/* 지연 정보 */}
                  {project.delayDays > 0 && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      최대 {project.delayDays}일 지연
                    </p>
                  )}
                  
                  {/* 위험 요인 */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {project.factors.map((factor, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded"
                      >
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 위험 점수 */}
                <div className="text-right flex-shrink-0">
                  <div className={cn(
                    'text-2xl font-bold',
                    project.riskScore >= 80 ? 'text-red-600' :
                    project.riskScore >= 50 ? 'text-orange-600' : 'text-slate-900'
                  )}>
                    {project.riskScore}
                  </div>
                  <div className="text-xs text-slate-500">위험 점수</div>
                </div>
              </div>

              {/* 진행률 바 */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>진행률</span>
                  <span>{Math.round(project.completionRate * 100)}%</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      project.completionRate < 0.3 ? 'bg-red-500' :
                      project.completionRate < 0.5 ? 'bg-orange-500' : 'bg-blue-500'
                    )}
                    style={{ width: `${project.completionRate * 100}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 더보기 */}
      {projects.length > 5 && (
        <div className="px-5 py-3 bg-slate-50 text-center">
          <Link
            href="/projects?filter=risk"
            className="text-sm text-red-600 hover:text-red-700"
          >
            +{projects.length - 5}개 더 보기
          </Link>
        </div>
      )}
    </div>
  );
}
