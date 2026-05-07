import styled from 'styled-components';
import { LayoutDashboard, MessageSquare, Settings, Users, Database } from 'lucide-react';

const SidebarContainer = styled.aside`
  background: linear-gradient(180deg, #002D6E 0%, #0047AB 100%);
  color: white;
  width: 260px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
  z-index: 50;
`;

const NavItem = styled.div<{ $active?: boolean }>`
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

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(4px);
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
  return (
    <SidebarContainer>
      <LogoSection>
        <img src="/maria_logo_premium.png" alt="MarIA Logo" />
        <h1>MarIA Admin</h1>
      </LogoSection>
      
      <nav className="flex-1">
        <NavItem $active>
          <LayoutDashboard size={20} />
          <span className="font-medium">Dashboard</span>
        </NavItem>
        <NavItem>
          <MessageSquare size={20} />
          <span className="font-medium">Conversas</span>
        </NavItem>
        <NavItem>
          <Users size={20} />
          <span className="font-medium">Usuários</span>
        </NavItem>
        <NavItem>
          <Database size={20} />
          <span className="font-medium">Dados e Logs</span>
        </NavItem>
      </nav>

      <div className="mt-auto pt-6 border-t border-blue-800">
        <NavItem>
          <Settings size={20} />
          <span className="font-medium">Configurações</span>
        </NavItem>
      </div>
    </SidebarContainer>
  );
}
