// apps/web/app/projects/page.tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';

// 프로젝트 목록은 대시보드에 통합되어 있으므로 리다이렉트
export default function ProjectsPage() {
  redirect('/dashboard');
}
