import styled from 'styled-components';
import { LayoutDashboard, MessageSquare, Settings, Users, Database, LogOut, Brain, Calendar, DollarSign, GitFork } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const SidebarContainer = styled.aside`
  background: linear-gradient(180deg, #002D6E 0%, #0047AB 100%);
  color: white;
  width: 260px;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
  z-index: 50;
`;

const NavItemLink = styled(Link)<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.$active ? 'rgba(212, 175, 55, 0.2)' : 'transparent'};
  color: ${props => props.$active ? '#D4AF37' : '#E2E8F0'};
  margin-bottom: 8px;
  text-decoration: none;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(4px);
    color: white;
  }
`;

const LogoSection = styled.div`
  margin-bottom: 3rem;
  display: flex;
  align-items: center;
  gap: 12px;
  
  img {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: 1px solid rgba(212, 175, 55, 0.5);
    object-fit: cover;
  }

  h1 {
    font-size: 1.4rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    background: linear-gradient(45deg, #FFF, #D4AF37);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

export function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('maria_session');
    localStorage.removeItem('maria_user');
  };

  const userStr = localStorage.getItem('maria_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = user?.role === 'superadmin' || user?.email === 'lucasgabriel@acutistech.com.br';

  return (
    <SidebarContainer>
      <LogoSection>
        <img src="/maria_logo_premium.png" alt="MarIA Logo" />
        <h1>MarIA Admin</h1>
      </LogoSection>
      
      <nav className="flex-1">
        <NavItemLink to="/dashboard" $active={isActive('/dashboard')}>
          <LayoutDashboard size={20} />
          <span className="font-medium">Dashboard</span>
        </NavItemLink>
        <NavItemLink to="/wa-users" $active={isActive('/wa-users')}>
          <MessageSquare size={20} />
          <span className="font-medium">Gestão de Fiéis</span>
        </NavItemLink>
        <NavItemLink to="/finance" $active={isActive('/finance')}>
          <DollarSign size={20} />
          <span className="font-medium">Financeiro</span>
        </NavItemLink>
        {isSuperAdmin && (
          <NavItemLink to="/users" $active={isActive('/users')}>
            <Users size={20} />
            <span className="font-medium">Administradores</span>
          </NavItemLink>
        )}
        <NavItemLink to="/logs" $active={isActive('/logs')}>
          <Database size={20} />
          <span className="font-medium">Dados e Logs</span>
        </NavItemLink>
      </nav>

      <div className="mt-auto space-y-2 pt-6 border-t border-blue-800">
        <NavItemLink to="/ai-settings" $active={isActive('/ai-settings')}>
          <Brain size={20} />
          <span className="font-medium">Parametrização IA</span>
        </NavItemLink>
        <NavItemLink to="/flows" $active={isActive('/flows')}>
          <GitFork size={20} />
          <span className="font-medium">Fluxos Automáticos</span>
        </NavItemLink>
        <NavItemLink to="/prayers" $active={isActive('/prayers')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M11 6.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5Z"/><path d="M12 11.5v3"/></svg>
          <span className="font-medium">Orações</span>
        </NavItemLink>
        <NavItemLink to="/daily-content" $active={isActive('/daily-content')}>
          <Calendar size={20} />
          <span className="font-medium">Conteúdo Diário</span>
        </NavItemLink>
        <NavItemLink to="/settings" $active={isActive('/settings')}>
          <Settings size={20} />
          <span className="font-medium">Configurações</span>
        </NavItemLink>
        <NavItemLink to="/" onClick={handleLogout} className="text-red-300 hover:text-red-100 hover:bg-red-900/20">
          <LogOut size={20} />
          <span className="font-medium">Sair</span>
        </NavItemLink>
      </div>
    </SidebarContainer>
  );
}
