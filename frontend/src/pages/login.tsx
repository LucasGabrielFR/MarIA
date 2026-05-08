import React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import styled from 'styled-components'
import { LucideShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { apiRequest } from '@/lib/api'

const SplitContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  min-height: 100vh;
  
  @media (min-width: 1024px) {
    grid-template-columns: 1.2fr 1fr;
  }
`;

const ImageSection = styled.div`
  position: relative;
  background-image: url('/maria_sacred_digital_login.png');
  background-size: cover;
  background-position: center;
  display: none;
  
  @media (min-width: 1024px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(0, 71, 171, 0.8) 0%, rgba(212, 175, 55, 0.2) 100%);
    backdrop-filter: blur(2px);
  }
`;

const GlassQuote = styled.div`
  position: relative;
  z-index: 10;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 3rem;
  border-radius: 2.5rem;
  max-width: 80%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  
  h1 {
    font-family: 'Outfit', sans-serif;
    font-size: 2.5rem;
    color: white;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 1.5rem;
    text-shadow: 0 2px 10px rgba(0,0,0,0.2);
  }
  
  p {
    color: rgba(255, 255, 255, 0.9);
    font-size: 1.1rem;
    font-style: italic;
    border-left: 3px solid var(--secondary);
    padding-left: 1.5rem;
  }
`;

const FormSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: #f8fafc;
`;

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, pass: password }),
      });

      toast.success(`Bem-vindo, ${data.user.email}!`);
      
      // Armazena a sessão
      localStorage.setItem('maria_session', JSON.stringify(data.session));
      localStorage.setItem('maria_user', JSON.stringify(data.user));

      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao realizar login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SplitContainer>
      <ImageSection>
        <GlassQuote>
          <h1>MarIA</h1>
          <p>"Faça-se em mim segundo a vossa palavra."</p>
          <div className="mt-8 flex items-center gap-2 text-white/60 text-xs tracking-widest uppercase">
            <span className="h-px w-8 bg-white/20"></span>
            Assistente Teológica e Acolhedora
          </div>
        </GlassQuote>
      </ImageSection>

      <FormSection>
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start mb-6">
              <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200">
                <LucideShieldCheck className="text-white h-8 w-8" />
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Painel de Acesso</h2>
            <p className="text-slate-500 font-medium">Insira suas credenciais para gerenciar a MarIA.</p>
          </div>

          <Card className="p-8 border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-bold ml-1">E-mail</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com" 
                  className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white transition-all text-lg"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <Label htmlFor="password" title="password" className="text-slate-700 font-bold">Senha</Label>
                  <a href="#" className="text-sm font-bold text-primary hover:underline">Esqueceu?</a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white transition-all text-lg"
                />
              </div>
              
              <div className="pt-2">
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl text-lg font-bold shadow-xl shadow-blue-100 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
                >
                  {isLoading ? 'Autenticando...' : 'Entrar no Sistema'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </FormSection>
    </SplitContainer>
  );
}
