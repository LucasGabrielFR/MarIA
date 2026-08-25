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
    <div className="flex bg-slate-50 min-h-screen font-sans antialiased">
      <Sidebar />
      
      <main className="flex-1 ml-[260px] flex flex-col">
        <div className="flex-1 p-8 pb-4 flex flex-col">
          <header className="mb-10 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{title}</h2>
              {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-4">
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

          <div className="flex-1">
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
