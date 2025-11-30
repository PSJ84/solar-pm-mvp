// apps/web/components/dashboard/ProjectList.tsx
'use client';

import Link from 'next/link';
import { MapPin, Zap, ChevronRight, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn, STATUS_LABELS, getProgressColor } from '@/lib/utils';
import type { Project } from '@/types';
import { projectsApi } from '@/lib/api';

export function ProjectList() {
  const { data: projects, isLoading, isError } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await projectsApi.getAll();
      return res.data;
    },
    staleTime: 30 * 1000,
  });

  return (
    <div className="space-y-4">
      {/* 프로젝트 추가 버튼 */}
      <Link
        href="/projects/new"
        className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
      >
        <Plus className="h-5 w-5" />
        <span className="font-medium">새 프로젝트 만들기</span>
      </Link>

      {/* 상태 영역 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse h-40"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-4">
          프로젝트 목록을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
        </div>
      ) : !projects || projects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-600">
          아직 프로젝트가 없습니다. 상단의 "새 프로젝트 만들기" 버튼으로 프로젝트를 추가해 보세요.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const statusConfig = STATUS_LABELS[project.status];

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-slate-300 transition-all group"
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
            {project.name}
          </h3>
          {project.address && (
            <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{project.address}</span>
            </div>
          )}
        </div>
        {statusConfig && (
          <span
            className={cn(
              'px-2 py-1 text-xs font-medium rounded-full flex-shrink-0',
              statusConfig.color
            )}
          >
            {statusConfig.label}
          </span>
        )}
      </div>

      {/* 용량 */}
      {project.capacityKw && (
        <div className="flex items-center gap-1 text-sm text-slate-600 mb-4">
          <Zap className="h-3.5 w-3.5 text-yellow-500" />
          <span>{project.capacityKw.toLocaleString()} kW</span>
        </div>
      )}

      {/* 진행률 */}
      <div>
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-slate-600">진행률</span>
          <span className="font-medium text-slate-900">{project.progress}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              getProgressColor(project.progress)
            )}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* 하단 */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-500">
          최근 수정: {new Date(project.updatedAt).toLocaleDateString('ko-KR')}
        </span>
        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  );
}
