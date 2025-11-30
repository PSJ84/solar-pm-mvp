// apps/web/components/dashboard/SummaryCards.tsx
'use client';

import { FolderKanban, CheckSquare, AlertTriangle, CalendarClock } from 'lucide-react';
import type { DashboardFullSummary } from '@/lib/api';

interface SummaryCardsProps {
  stats?: DashboardFullSummary['stats'];
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  // 데이터가 없으면 기본값 사용
  const data = stats || {
    totalProjects: 0,
    inProgressProjects: 0,
    totalMyTasks: 0,
    completedMyTasks: 0,
    todayDueCount: 0,
    riskProjectCount: 0,
  };

  const pendingTasks = data.totalMyTasks - data.completedMyTasks;

  const cards = [
    {
      title: '전체 프로젝트',
      value: data.totalProjects,
      sub: `${data.inProgressProjects}개 진행중`,
      icon: FolderKanban,
      color: 'bg-blue-500',
    },
    {
      title: '내 태스크',
      value: data.totalMyTasks,
      sub: `${pendingTasks}개 대기`,
      icon: CheckSquare,
      color: 'bg-green-500',
    },
    {
      title: '오늘 마감',
      value: data.todayDueCount,
      sub: '건',
      icon: CalendarClock,
      color: data.todayDueCount > 0 ? 'bg-orange-500' : 'bg-slate-400',
    },
    {
      title: '지연 위험',
      value: data.riskProjectCount,
      sub: '프로젝트',
      icon: AlertTriangle,
      color: data.riskProjectCount > 0 ? 'bg-red-500' : 'bg-slate-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-600">{card.title}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {card.value}
                <span className="text-sm font-normal text-slate-500 ml-1">
                  {card.sub}
                </span>
              </p>
            </div>
            <div className={`p-2 rounded-lg ${card.color}`}>
              <card.icon className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
