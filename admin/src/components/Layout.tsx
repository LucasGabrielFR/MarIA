import { Link, Outlet, useLocation } from 'react-router-dom';
import { Users, BarChart3, Settings, LogOut, ShieldCheck } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const navigation = [
    { name: 'Usuários', href: '/', icon: Users },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Configurações', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-neutral-950 border-r border-neutral-800 flex flex-col">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black font-bold">
            M
          </div>
          <span className="text-xl font-bold tracking-tight text-white">MarIA Admin</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-black font-semibold shadow-lg shadow-white/5'
                    : 'text-neutral-500 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-800">
          <div className="bg-neutral-900/50 rounded-xl p-3 mb-4 border border-neutral-800">
            <div className="flex items-center space-x-2 text-xs text-neutral-500 mb-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Sistema Online</span>
            </div>
            <div className="text-[10px] text-neutral-600 truncate">v1.0.0-n8n-ready</div>
          </div>
          <button className="flex items-center space-x-3 px-3 py-2.5 w-full rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
