// apps/web/app/dashboard/layout.tsx
import { ReactNode } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  FolderKanban, 
  FileText, 
  Bell,
  Settings,
  Sun
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/projects', label: '프로젝트', icon: FolderKanban },
  { href: '/templates', label: '템플릿', icon: FileText },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 상단 네비게이션 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 로고 */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <Sun className="h-8 w-8 text-solar-500" />
              <span className="font-bold text-xl text-slate-900">Solar PM</span>
            </Link>

            {/* 메인 네비게이션 */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* 우측 아이콘 */}
            <div className="flex items-center gap-2">
              <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              </button>
              <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
                <Settings className="h-5 w-5" />
              </button>
              <div className="h-8 w-8 bg-solar-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                PM
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
