import React from 'react'
import { Sidebar } from './sidebar'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"


interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const [user, setUser] = React.useState<any>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('maria_sidebar_collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('maria_sidebar_collapsed', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  React.useEffect(() => {
    const isAffiliateRoute = window.location.pathname.includes('affiliate');
    const storedUser = isAffiliateRoute ? localStorage.getItem('maria_affiliate_user') : localStorage.getItem('maria_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const getInitials = (nameOrEmail: string) => {
    return nameOrEmail ? nameOrEmail.substring(0, 2).toUpperCase() : 'UI';
  };

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans antialiased overflow-x-hidden w-full">
      <Sidebar collapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebar} />
      
      <main className={`flex-1 min-w-0 w-full overflow-x-hidden flex flex-col transition-all duration-300 ${
        isSidebarCollapsed ? 'ml-[78px]' : 'ml-[260px]'
      }`}>
        <div className="flex-1 p-6 lg:p-8 pb-4 flex flex-col min-w-0 w-full">
          <header className="mb-8 flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs cursor-pointer flex-shrink-0"
                title={isSidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral (ganhar espaço)"}
              >
                {isSidebarCollapsed ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m14 9 3 3-3 3"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m16 15-3-3 3-3"/></svg>
                )}
              </button>
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">{title}</h2>
                {subtitle && <p className="text-slate-500 mt-0.5 text-xs lg:text-sm font-medium">{subtitle}</p>}
              </div>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">{user?.name || user?.email || 'Usuário'}</p>
                <p className="text-xs text-slate-500 font-medium bg-blue-50 text-primary px-2 py-0.5 rounded-full inline-block">
                  {user?.role === 'affiliate' ? 'Afiliado' : user?.email === 'lucasgabriel@acutistech.com.br' ? 'Superadmin' : 'Admin'}
                </p>
              </div>
              <Avatar className="h-10 w-10 border-2 border-primary/20 p-0.5">
                <AvatarFallback className="bg-primary text-white font-bold">{getInitials(user?.name || user?.email)}</AvatarFallback>
              </Avatar>
            </div>
          </header>

          <div className="flex-1 min-w-0 w-full">
            {children}
          </div>

          <footer className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-400 text-sm font-medium">
            <p>© {new Date().getFullYear()} copy by AcutisTech/MarIA</p>
            <p className="bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">v{import.meta.env.VITE_APP_VERSION}</p>
          </footer>
        </div>
      </main>
    </div>
  )
}
