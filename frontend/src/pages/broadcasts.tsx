import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Sidebar } from '../components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Search, CheckCircle, Clock, XCircle, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f8fafc;
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: 260px;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding-left: calc(260px + 2rem);
`;

const ContentCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }

  th {
    font-weight: 600;
    color: #475569;
    background: #f8fafc;
    position: sticky;
    top: 0;
  }
`;

export default function BroadcastsPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  
  // Create Tab State
  const [campaignName, setCampaignName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);

  // History Tab State
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchJobs();
    }
  }, [activeTab]);

  useEffect(() => {
    const filtered = users.filter(user => 
      (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       user.phone?.includes(searchTerm))
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/panel/wa-users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('maria_session')}`,
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Filtrar apenas usuários ativos que passaram da triagem inicial
        const activeUsers = data.filter((u: any) => 
          u.status === 'active'
        );
        setUsers(activeUsers);
      }
    } catch (err) {
      toast.error('Erro ao carregar usuários.');
    }
  };

  const fetchJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const response = await fetch('/api/broadcast/jobs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('maria_session')}`,
        }
      });
      if (response.ok) {
        const data = await response.json();
        setJobs(data.data || []);
      }
    } catch (err) {
      toast.error('Erro ao carregar campanhas.');
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleSubmit = async () => {
    if (!campaignName.trim() || !messageText.trim()) {
      toast.error('Preencha o nome da campanha e a mensagem.');
      return;
    }
    if (selectedUserIds.size === 0) {
      toast.error('Selecione pelo menos um destinatário.');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/broadcast/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('maria_session')}`,
        },
        body: JSON.stringify({
          name: campaignName,
          message_text: messageText,
          user_ids: Array.from(selectedUserIds),
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Disparo agendado com sucesso!');
        setCampaignName('');
        setMessageText('');
        setSelectedUserIds(new Set());
        setActiveTab('history');
      } else {
        toast.error(data.error || 'Erro ao agendar disparo.');
      }
    } catch (err) {
      toast.error('Erro na requisição de disparo.');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1 w-max"><CheckCircle size={14}/> Concluído</span>;
      case 'pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-1 w-max"><Clock size={14}/> Pendente</span>;
      case 'processing': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1 w-max"><Clock size={14}/> Processando</span>;
      case 'cancelled': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-1 w-max"><XCircle size={14}/> Cancelado</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">{status}</span>;
    }
  };

  return (
    <PageContainer>
      <Sidebar />
      <MainContent>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Disparos em Massa</h1>
            <p className="text-gray-500 mt-1">Crie e gerencie campanhas de mensagens para seus fiéis.</p>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <Button 
            variant={activeTab === 'create' ? 'default' : 'outline'}
            onClick={() => setActiveTab('create')}
            className={activeTab === 'create' ? 'bg-[#002D6E]' : ''}
          >
            <Send size={16} className="mr-2" />
            Novo Disparo
          </Button>
          <Button 
            variant={activeTab === 'history' ? 'default' : 'outline'}
            onClick={() => setActiveTab('history')}
            className={activeTab === 'history' ? 'bg-[#002D6E]' : ''}
          >
            <Clock size={16} className="mr-2" />
            Histórico de Campanhas
          </Button>
        </div>

        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <ContentCard>
                <h2 className="text-xl font-semibold mb-4 text-[#002D6E]">Configurar Mensagem</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Campanha (Interno)</label>
                    <Input 
                      placeholder="Ex: Convite Retiro 2026" 
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
                    <div className="text-xs text-gray-500 mb-2">
                      Dica: Use <b>{'{nome}'}</b> para incluir o nome da pessoa. Use formatação de WhatsApp (*negrito*, _itálico_).
                    </div>
                    <Textarea 
                      placeholder="Olá {nome}, temos uma novidade para você..." 
                      rows={10}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800">
                    <strong>Atenção:</strong> Os disparos são enviados com intervalo de segurança (1 msg/seg) para proteger o número de bloqueios.
                  </div>

                  <Button 
                    className="w-full bg-[#D4AF37] hover:bg-[#B3932F] text-[#002D6E] font-bold"
                    onClick={handleSubmit}
                    disabled={isSending}
                  >
                    {isSending ? 'Agendando...' : `Disparar para ${selectedUserIds.size} contato(s)`}
                  </Button>
                </div>
              </ContentCard>
            </div>

            <div className="lg:col-span-2">
              <ContentCard>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-[#002D6E]">
                    Selecionar Destinatários ({selectedUserIds.size} de {filteredUsers.length})
                  </h2>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input 
                      className="pl-9" 
                      placeholder="Buscar contato..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="overflow-y-auto max-h-[600px] border rounded-lg">
                  <Table>
                    <thead>
                      <tr>
                        <th className="w-12">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                            checked={selectedUserIds.size > 0 && selectedUserIds.size === filteredUsers.length}
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th>Nome</th>
                        <th>Telefone</th>
                        <th>Status</th>
                        <th>Plano</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleUserSelection(user.id)}>
                          <td>
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                              checked={selectedUserIds.has(user.id)}
                              onChange={() => {}} // Handle handled by tr click
                            />
                          </td>
                          <td className="font-medium text-gray-900">{user.name || 'Sem nome'}</td>
                          <td className="text-gray-500">{user.phone}</td>
                          <td>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                              {user.status}
                            </span>
                          </td>
                          <td>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              user.subscription_tier === 'premium' ? 'bg-purple-100 text-purple-700' :
                              user.subscription_tier === 'basic' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {user.subscription_tier || 'free'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-500">
                            Nenhum contato encontrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </ContentCard>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <ContentCard>
            <h2 className="text-xl font-semibold mb-4 text-[#002D6E]">Histórico de Campanhas</h2>
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <th>Campanha</th>
                    <th>Progresso</th>
                    <th>Status</th>
                    <th>Data de Criação</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(job => (
                    <tr key={job.id}>
                      <td className="font-medium text-gray-900">{job.name}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden w-32">
                            <div 
                              className="h-full bg-blue-600 rounded-full" 
                              style={{ width: `${job.total_recipients > 0 ? (job.processed_count / job.total_recipients) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 font-medium w-16 text-right">
                            {job.processed_count} / {job.total_recipients}
                          </span>
                        </div>
                      </td>
                      <td>{getStatusBadge(job.status)}</td>
                      <td className="text-gray-500">
                        {format(new Date(job.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </td>
                    </tr>
                  ))}
                  {jobs.length === 0 && !isLoadingJobs && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-500">
                        Nenhuma campanha de disparo realizada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </ContentCard>
        )}
      </MainContent>
    </PageContainer>
  );
}
