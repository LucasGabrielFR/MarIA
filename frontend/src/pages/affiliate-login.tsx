import React, { useState } from 'react';
import styled from 'styled-components';
import { LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { API_URL } from '../lib/api';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8fafc;
`;

const LoginCard = styled.div`
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  text-align: center;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  color: #64748b;
  text-align: center;
  margin-bottom: 32px;
  font-size: 14px;
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #334155;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #0047AB;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #0047AB;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #003380;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

export default function AffiliateLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/affiliate/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, pass: password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Usuário ou senha inválidos.');
      }

      const data = await response.json();
      
      // Salva dados locais com chave isolada para não conflitar com o admin
      localStorage.setItem('maria_affiliate_user', JSON.stringify(data.user));
      localStorage.setItem('maria_affiliate_token', data.token);

      toast.success('Login realizado com sucesso!');
      navigate('/affiliate-dashboard');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <LoginCard>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: '#0047AB', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <LogIn size={24} />
          </div>
        </div>
        <Title>Portal do Afiliado</Title>
        <Subtitle>Acesse seu painel para ver suas comissões.</Subtitle>

        <form onSubmit={handleLogin}>
          <InputGroup>
            <Label>Usuário</Label>
            <Input 
              type="text" 
              placeholder="Digite seu usuário" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </InputGroup>
          <InputGroup>
            <Label>Senha</Label>
            <Input 
              type="password" 
              placeholder="Digite sua senha" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </InputGroup>
          <Button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar no Painel'}
          </Button>
        </form>
      </LoginCard>
    </Container>
  );
}
