import { useState } from 'react';
import styled from 'styled-components';
import { LayoutDashboard, MessageSquare, Settings, Users, Database, LogOut, Brain, Calendar, CalendarClock, DollarSign, GitFork, Megaphone, ChevronDown, ChevronRight, Send, Wrench, Handshake } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarContainerProps {
  $collapsed?: boolean;
}

const SidebarContainer = styled.aside<SidebarContainerProps>`
  background: linear-gradient(180deg, #002D6E 0%, #0047AB 100%);
  color: white;
  width: ${props => props.$collapsed ? '78px' : '260px'};
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  padding: ${props => props.$collapsed ? '1.25rem 0.5rem' : '1.5rem'};
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
  z-index: 50;
  transition: width 0.3s ease, padding 0.3s ease;
`;

const NavItemLink = styled(Link)<{ $active?: boolean; $collapsed?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${props => props.$collapsed ? 'center' : 'flex-start'};
  gap: 12px;
  padding: ${props => props.$collapsed ? '12px' : '12px 16px'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.$active ? 'rgba(212, 175, 55, 0.2)' : 'transparent'};
  color: ${props => props.$active ? '#D4AF37' : '#E2E8F0'};
  margin-bottom: 8px;
  text-decoration: none;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: ${props => props.$collapsed ? 'scale(1.05)' : 'translateX(4px)'};
    color: white;
  }
`;

const LogoSection = styled.div<{ $collapsed?: boolean }>`
  margin-bottom: ${props => props.$collapsed ? '1.5rem' : '2.5rem'};
  display: flex;
  align-items: center;
  justify-content: ${props => props.$collapsed ? 'center' : 'space-between'};
  gap: 10px;
  
  .logo-info {
    display: flex;
    align-items: center;
    gap: 12px;
    overflow: hidden;
  }

  img {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    border: 1px solid rgba(212, 175, 55, 0.5);
    object-fit: cover;
    flex-shrink: 0;
  }

  h1 {
    font-size: 1.3rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    background: linear-gradient(45deg, #FFF, #D4AF37);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    white-space: nowrap;
    display: ${props => props.$collapsed ? 'none' : 'block'};
  }
`;

const CollapseToggleButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #E2E8F0;
  border-radius: 8px;
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }
`;

const MenuGroup = styled.div<{ $active?: boolean; $collapsed?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${props => props.$collapsed ? 'center' : 'space-between'};
  padding: ${props => props.$collapsed ? '12px' : '12px 16px'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.05)' : 'transparent'};
  color: #E2E8F0;
  margin-bottom: 4px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
  
  .group-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
`;

const SubMenu = styled.div<{ $isOpen: boolean; $collapsed?: boolean }>`
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  flex-direction: column;
  padding-left: ${props => props.$collapsed ? '0' : '1.5rem'};
  margin-bottom: 8px;
  
  ${NavItemLink} {
    padding: ${props => props.$collapsed ? '10px 0' : '10px 16px'};
    font-size: 0.95rem;
    margin-bottom: 4px;
    justify-content: ${props => props.$collapsed ? 'center' : 'flex-start'};
  }
`;

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('maria_session');
    localStorage.removeItem('maria_user');
    localStorage.removeItem('maria_affiliate_user');
    localStorage.removeItem('maria_affiliate_token');
  };

  const isAffiliateRoute = location.pathname.includes('affiliate');
  const userStr = isAffiliateRoute ? localStorage.getItem('maria_affiliate_user') : localStorage.getItem('maria_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = user?.role === 'superadmin' || user?.email === 'lucasgabriel@acutistech.com.br';
  const isAffiliate = user?.role === 'affiliate' || isAffiliateRoute;

  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (menu: string) => {
    setOpenMenus(prev => 
      prev.includes(menu) ? prev.filter(m => m !== menu) : [...prev, menu]
    );
  };

  const isMenuOpen = (menu: string) => openMenus.includes(menu);

  return (
    <SidebarContainer $collapsed={collapsed}>
      <LogoSection $collapsed={collapsed}>
        <div className="logo-info">
          <img src="/maria_logo_premium.png" alt="MarIA Logo" title={isAffiliate ? 'MarIA Afiliados' : 'MarIA Admin'} />
          <h1>{isAffiliate ? 'MarIA Afiliados' : 'MarIA Admin'}</h1>
        </div>
        {onToggleCollapse && (
          <CollapseToggleButton
            onClick={onToggleCollapse}
            title={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          >
            {collapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronDown size={16} className="-rotate-90" />
            )}
          </CollapseToggleButton>
        )}
      </LogoSection>
      
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        <nav>
          {isAffiliate ? (
            <NavItemLink to="/affiliate-dashboard" $active={isActive('/affiliate-dashboard')} $collapsed={collapsed} title="Meu Painel">
              <LayoutDashboard size={20} />
              <span className={`font-medium ${collapsed ? 'hidden' : 'inline'}`}>Meu Painel</span>
            </NavItemLink>
          ) : (
            <>
              <NavItemLink to="/dashboard" $active={isActive('/dashboard')} $collapsed={collapsed} title="Dashboard">
                <LayoutDashboard size={20} />
                <span className={`font-medium ${collapsed ? 'hidden' : 'inline'}`}>Dashboard</span>
              </NavItemLink>
              
              <NavItemLink to="/wa-users" $active={isActive('/wa-users')} $collapsed={collapsed} title="Gestão de Fiéis">
                <MessageSquare size={20} />
                <span className={`font-medium ${collapsed ? 'hidden' : 'inline'}`}>Gestão de Fiéis</span>
              </NavItemLink>

              {/* Grupo: Disparos de Mensagens */}
              <MenuGroup onClick={() => toggleMenu('disparos')} $active={isMenuOpen('disparos')} $collapsed={collapsed} title="Disparos">
                <div className="group-left">
                  <Send size={20} />
                  <span className={`font-medium ${collapsed ? 'hidden' : 'inline'}`}>Disparos</span>
                </div>
                {!collapsed && (isMenuOpen('disparos') ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
              </MenuGroup>
              <SubMenu $isOpen={isMenuOpen('disparos')} $collapsed={collapsed}>
                <NavItemLink to="/broadcasts" $active={isActive('/broadcasts')} $collapsed={collapsed} title="Disparos em Massa">
                  <Megaphone size={18} />
                  <span className={`font-medium ${collapsed ? 'hidden' : 'inline'}`}>Em Massa</span>
                </NavItemLink>
                <NavItemLink to="/scheduled-messages" $active={isActive('/scheduled-messages')} $collapsed={collapsed} title="Disparos Agendados (IA)">
                  <CalendarClock size={18} />
                  <span className={`font-medium ${collapsed ? 'hidden' : 'inline'}`}>Agendadas (IA)</span>
                </NavItemLink>
              </SubMenu>

              {/* Grupo: Ferramentas */}
              <MenuGroup onClick={() => toggleMenu('ferramentas')} $active={isMenuOpen('ferramentas')} $collapsed={collapsed} title="Ferramentas">
                <div className="group-left">
                  <Wrench size={20} />
                  <span className={`font-medium ${collapsed ? 'hidden' : 'inline'}`}>Ferramentas</span>
                </div>
                {!collapsed && (isMenuOpen('ferramentas') ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
              </MenuGroup>
              <SubMenu $isOpen={isMenuOpen('ferramentas')} $collapsed={collapsed}>
                <NavItemLink to="/finance" $active={isActive('/finance')} $collapsed={collapsed} title="Financeiro">
                  <DollarSign size={18} />
                  <span className={`font-medium ${collapsed ? 'hidden' : 'inline'}`}>Financeiro</span>
                </NavItemLink>
                <NavItemLink to="/affiliates" $active={isActive('/affiliates')} $collapsed={collapsed} title="Afiliados">
                  <Handshake size={18} />
                  <span className={`font-medium ${collapsed ? 'hidden' : 'inline'}`}>Afiliados</span>
                </NavItemLink>
                {isSuperAdmin && (
                  <NavItemLink to="/users" $active={isActive('/users')} $collapsed={collapsed} title="Administradores">
                    <Users size={18} />
                    <span className={`font-medium ${collapsed ? 'hidden' : 'inline'}`}>Administradores</span>
                  </NavItemLink>
                )}
                <NavItemLink to="/logs" $active={isActive('/logs')} $collapsed={collapsed} title="Dados e Logs">
                  <Database size={18} />
                  <span className={`font-medium ${collapsed ? 'hidden' : 'inline'}`}>Dados e Logs</span>
                </NavItemLink>
              </SubMenu>

              {/* Grupo: Configurações */}
              <MenuGroup onClick={() => toggleMenu('configuracoes')} $active={isMenuOpen('configuracoes')} $collapsed={collapsed} title="Configurações">
                <div className="group-left">
                  <Settings size={20} />
                  <span className={`font-medium ${collapsed ? 'hidden' : 'inline'}`}>Configurações</span>
                </div>
                {!collapsed && (isMenuOpen('configuracoes') ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
              </MenuGroup>
              <SubMenu $isOpen={isMenuOpen('configuracoes')} $collapsed={collapsed}>
                <NavItemLink to="/ai-settings" $active={isActive('/ai-settings')} $collapsed={collapsed} title="Parametrização IA">
                  <Brain size={18} />
                  <span className={`font-medium ${collapsed ? 'hidden' : 'inline'}`}>Parametrização IA</span>
                </NavItemLink>
                <NavItemLink to="/flows" $active={isActive('/flows')} $collapsed={collapsed} title="Fluxos Automáticos">
                  <GitFork size={18} />
                  <span className={`font-medium ${collapsed ? 'hidden' : 'inline'}`}>Fluxos Automáticos</span>
                </NavItemLink>
                <NavItemLink to="/prayers" $active={isActive('/prayers')} $collapsed={collapsed} title="Orações">
                  <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M11 6.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5Z"/><path d="M12 11.5v3"/></svg>
                  <span className={`font-medium ${collapsed ? 'hidden' : 'inline'}`}>Orações</span>
                </NavItemLink>
                <NavItemLink to="/daily-content" $active={isActive('/daily-content')} $collapsed={collapsed} title="Conteúdo Diário">
                  <Calendar size={18} />
                  <span className={`font-medium ${collapsed ? 'hidden' : 'inline'}`}>Conteúdo Diário</span>
                </NavItemLink>
                <NavItemLink to="/settings" $active={isActive('/settings')} $collapsed={collapsed} title="Configurações Gerais">
                  <Settings size={18} />
                  <span className={`font-medium ${collapsed ? 'hidden' : 'inline'}`}>Config. Gerais</span>
                </NavItemLink>
                <NavItemLink to="/plans" $active={isActive('/plans')} $collapsed={collapsed} title="Planos e Preços">
                  <DollarSign size={18} />
                  <span className={`font-medium ${collapsed ? 'hidden' : 'inline'}`}>Planos e Preços</span>
                </NavItemLink>
              </SubMenu>
            </>
          )}
        </nav>
      </div>

      <div className="mt-auto pt-4 border-t border-blue-800">
        <NavItemLink to="/" onClick={handleLogout} $collapsed={collapsed} title="Sair do Sistema" className="text-red-300 hover:text-red-100 hover:bg-red-900/20 mb-0">
          <LogOut size={20} />
          <span className={`font-medium ${collapsed ? 'hidden' : 'inline'}`}>Sair</span>
        </NavItemLink>
      </div>
    </SidebarContainer>
  );
}
