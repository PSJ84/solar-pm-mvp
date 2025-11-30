// apps/web/components/dashboard/ExpiringDocuments.tsx
'use client';

import Link from 'next/link';
import { FileWarning, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExpiringDocumentItem } from '@/lib/api';

interface ExpiringDocumentsProps {
  documents: ExpiringDocumentItem[];
}

export function ExpiringDocuments({ documents }: ExpiringDocumentsProps) {
  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <FileWarning className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900">만료 임박 문서</h3>
            <p className="text-sm text-amber-700">30일 내 {documents.length}건 만료 예정</p>
          </div>
        </div>
        <Link
          href="/documents?filter=expiring"
          className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
        >
          전체 보기
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 문서 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {documents.slice(0, 6).map((doc) => {
          const isUrgent = doc.daysUntilExpiry <= 7;
          const isWarning = doc.daysUntilExpiry <= 14;
          
          return (
            <Link
              key={doc.id}
              href={`/projects/${doc.projectId}?doc=${doc.id}`}
              className={cn(
                'block p-4 rounded-lg border transition-all hover:shadow-md',
                isUrgent
                  ? 'border-red-200 bg-red-50 hover:border-red-300'
                  : isWarning
                  ? 'border-amber-200 bg-amber-50 hover:border-amber-300'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
            >
              {/* 파일명 */}
              <p className="font-medium text-slate-900 truncate">{doc.fileName}</p>
              
              {/* 프로젝트명 */}
              <p className="text-sm text-slate-500 truncate mt-1">{doc.projectName}</p>
              
              {/* 문서 유형 */}
              {doc.docType && (
                <span className="inline-block px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded mt-2">
                  {doc.docType}
                </span>
              )}
              
              {/* 만료일 */}
              <div className={cn(
                'flex items-center gap-1 mt-3 text-sm font-medium',
                isUrgent ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-slate-600'
              )}>
                <Calendar className="h-3.5 w-3.5" />
                {isUrgent ? (
                  <span>D-{doc.daysUntilExpiry} 긴급!</span>
                ) : (
                  <span>D-{doc.daysUntilExpiry}</span>
                )}
                {doc.expiryDate && (
                  <span className="text-slate-400 font-normal ml-1">
                    ({new Date(doc.expiryDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })})
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* 더보기 */}
      {documents.length > 6 && (
        <div className="px-5 py-3 bg-slate-50 text-center border-t border-slate-100">
          <Link
            href="/documents?filter=expiring"
            className="text-sm text-amber-600 hover:text-amber-700"
          >
            +{documents.length - 6}건 더 보기
          </Link>
        </div>
      )}
    </div>
  );
}
