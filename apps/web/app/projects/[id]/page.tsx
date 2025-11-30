// apps/web/app/projects/[id]/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Share2, 
  MapPin, 
  Zap, 
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  FileText,
  ChevronRight,
  Copy,
  Loader2
} from 'lucide-react';
import { cn, STATUS_LABELS, formatRelativeTime, getProgressColor } from '@/lib/utils';
import { projectsApi } from '@/lib/api';

// MVP: Mock 데이터
const mockProject = {
  id: 'p1',
  name: '충남 서산 태양광 발전소',
  address: '충청남도 서산시 운산면',
  capacityKw: 998.5,
  status: 'in_progress',
  progress: 45,
  totalTasks: 24,
  completedTasks: 11,
  stages: [
    {
      id: 's1',
      template: { id: 't1', name: '사업타당성 검토', order: 1 },
      status: 'completed',
      tasks: [
        { id: 'task1', title: '부지 현장 조사', status: 'completed', isMandatory: true, dueDate: '2024-10-01' },
        { id: 'task2', title: '일사량 분석', status: 'completed', isMandatory: true, dueDate: '2024-10-05' },
        { id: 'task3', title: '계통연계 검토', status: 'completed', isMandatory: true, dueDate: '2024-10-10' },
      ],
    },
    {
      id: 's2',
      template: { id: 't2', name: '발전사업허가', order: 2 },
      status: 'completed',
      tasks: [
        { id: 'task4', title: '발전사업허가 신청서 작성', status: 'completed', isMandatory: true, dueDate: '2024-10-20' },
        { id: 'task5', title: '사업계획서 제출', status: 'completed', isMandatory: true, dueDate: '2024-10-25' },
        { id: 'task6', title: '허가서 수령', status: 'completed', isMandatory: true, dueDate: '2024-11-01' },
      ],
    },
    {
      id: 's3',
      template: { id: 't3', name: '개발행위허가', order: 3 },
      status: 'active',
      tasks: [
        { id: 'task7', title: '개발행위허가 신청', status: 'in_progress', isMandatory: true, dueDate: '2024-11-25' },
        { id: 'task8', title: '환경영향평가', status: 'pending', isMandatory: false, dueDate: '2024-12-01' },
        { id: 'task9', title: '농지전용 신청', status: 'pending', isMandatory: false, dueDate: '2024-12-10' },
      ],
    },
    {
      id: 's4',
      template: { id: 't4', name: '착공신고', order: 4 },
      status: 'pending',
      tasks: [
        { id: 'task10', title: '착공계 제출', status: 'pending', isMandatory: true, dueDate: '2025-01-10' },
        { id: 'task11', title: '공사업체 선정', status: 'pending', isMandatory: true, dueDate: '2025-01-05' },
      ],
    },
  ],
};

const mockActivityLog = [
  { id: 'h1', action: 'status_changed', comment: '상태 변경: 대기 → 진행중', user: { name: '김태양' }, task: { title: '개발행위허가 신청' }, createdAt: '2024-11-20T09:30:00' },
  { id: 'h2', action: 'completed', comment: '태스크 완료', user: { name: '박발전' }, task: { title: '허가서 수령' }, createdAt: '2024-11-18T14:20:00' },
  { id: 'h3', action: 'comment', comment: '서류 보완 요청 접수', user: { name: '김태양' }, task: { title: '사업계획서 제출' }, createdAt: '2024-11-15T11:00:00' },
];

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [activeStage, setActiveStage] = useState(mockProject.stages[2].id);
  const [isCloning, setIsCloning] = useState(false);
  const project = mockProject;

  const activeStageData = project.stages.find((s) => s.id === activeStage);

  // [v1.1] 프로젝트 복제 핸들러
  const handleCloneProject = async () => {
    if (isCloning) return;
    
    const confirmed = window.confirm(
      `"${project.name}" 프로젝트를 복제하시겠습니까?\n\n` +
      `- 단계와 태스크 구조가 복제됩니다.\n` +
      `- 문서와 사진은 복제되지 않습니다.\n` +
      `- 마감일은 초기화됩니다.`
    );
    
    if (!confirmed) return;

    setIsCloning(true);
    try {
      const response = await projectsApi.clone(params.id);
      alert(`프로젝트가 복제되었습니다!\n새 프로젝트: ${response.data.name}`);
      router.push(`/projects/${response.data.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || '프로젝트 복제에 실패했습니다.');
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{project.name}</h1>
                <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {project.address}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-yellow-500" />
                    {project.capacityKw} kW
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* 진행률 */}
              <div className="text-right hidden sm:block">
                <div className="text-sm text-slate-600">진행률</div>
                <div className="font-bold text-slate-900">{project.progress}%</div>
              </div>
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                <div
                  className={cn('h-full rounded-full', getProgressColor(project.progress))}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              {/* 공유 버튼 */}
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">공유</span>
              </button>
              {/* [v1.1] 복제 버튼 */}
              <button 
                onClick={handleCloneProject}
                disabled={isCloning}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCloning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{isCloning ? '복제 중...' : '복제'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* 좌측: 단계 탭 */}
          <div className="w-64 flex-shrink-0 hidden lg:block">
            <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-28">
              <h3 className="font-semibold text-slate-900 mb-3">프로젝트 단계</h3>
              <nav className="space-y-1">
                {project.stages.map((stage) => {
                  const isActive = stage.id === activeStage;
                  const completedTasks = stage.tasks.filter((t) => t.status === 'completed').length;
                  
                  return (
                    <button
                      key={stage.id}
                      onClick={() => setActiveStage(stage.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {stage.status === 'completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : stage.status === 'active' ? (
                          <Clock className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-300" />
                        )}
                        <span className="text-sm font-medium">{stage.template.name}</span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {completedTasks}/{stage.tasks.length}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* 중앙: 태스크 테이블 */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">
                  {activeStageData?.template.name} - 태스크 목록
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {activeStageData?.tasks.map((task) => {
                  const statusConfig = STATUS_LABELS[task.status];
                  
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                    >
                      {/* 상태 체크박스/아이콘 */}
                      <button className="flex-shrink-0">
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : task.status === 'in_progress' ? (
                          <Clock className="h-5 w-5 text-blue-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-300 hover:text-slate-400" />
                        )}
                      </button>

                      {/* 태스크 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'font-medium',
                            task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900'
                          )}>
                            {task.title}
                          </span>
                          {task.isMandatory && (
                            <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                              필수
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(task.dueDate).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>

                      {/* 첨부 아이콘 */}
                      <div className="flex items-center gap-2 text-slate-400">
                        <button className="p-1.5 hover:bg-slate-100 rounded">
                          <ImageIcon className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 hover:bg-slate-100 rounded">
                          <FileText className="h-4 w-4" />
                        </button>
                      </div>

                      {/* 상태 배지 */}
                      <span
                        className={cn(
                          'px-2.5 py-1 text-xs font-medium rounded-full',
                          statusConfig.color
                        )}
                      >
                        {statusConfig.label}
                      </span>

                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 우측: 활동 로그 (MVP #30) */}
          <div className="w-80 flex-shrink-0 hidden xl:block">
            <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-28">
              <h3 className="font-semibold text-slate-900 mb-4">최근 활동</h3>
              <div className="space-y-4">
                {mockActivityLog.map((log) => (
                  <div key={log.id} className="flex gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-slate-600">
                        {log.user.name[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900">
                        <span className="font-medium">{log.user.name}</span>
                        <span className="text-slate-500">님이 </span>
                        <span className="font-medium">{log.task.title}</span>
                      </p>
                      <p className="text-sm text-slate-600 mt-0.5">{log.comment}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatRelativeTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                전체 활동 보기
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
