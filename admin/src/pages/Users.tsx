import React, { useEffect, useState } from 'react';
import { Users as UsersIcon, Search, Filter, MoreVertical, CreditCard } from 'lucide-react';
import { api } from '../lib/api';

interface User {
  id: string;
  phone: string;
  name: string | null;
  status: string;
  credits: number;
  created_at: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-neutral-900 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Usuários</h1>
            <p className="text-neutral-400 mt-1">Gerencie os fiéis e acompanhe o status de triagem.</p>
          </div>
          <div className="flex space-x-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input 
                type="text" 
                placeholder="Buscar por telefone ou nome..." 
                className="bg-neutral-800 border border-neutral-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary w-64"
              />
            </div>
            <button className="bg-neutral-800 border border-neutral-700 p-2 rounded-lg hover:bg-neutral-700 transition-colors">
              <Filter className="w-5 h-5 text-neutral-400" />
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="bg-neutral-800/50 border border-neutral-800 rounded-2xl overflow-hidden backdrop-blur-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/50">
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Usuário</th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Créditos</th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Criado em</th>
                  <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-white font-medium">
                          {user.name?.[0] || user.phone[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{user.name || 'Sem nome'}</div>
                          <div className="text-xs text-neutral-500">{user.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {user.status === 'active' ? 'Ativo' : 'Triagem'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-sm text-neutral-300">
                        <CreditCard className="w-4 h-4 text-neutral-500" />
                        <span>{user.credits}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-400">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-neutral-500 hover:text-white transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="p-12 text-center text-neutral-500">
                Nenhum usuário encontrado.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
