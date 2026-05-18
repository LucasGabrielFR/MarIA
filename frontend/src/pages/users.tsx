import React from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card } from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  LucideUserPlus, 
  LucideTrash2, 
  LucideMoreVertical, 
  LucideShield, 
  LucideLoader2, 
  LucideEdit2, 
  LucideX, 
  LucideHistory, 
  LucideSearch,
  LucideKeyRound
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'
import { Navigate } from 'react-router-dom'

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  requires_password_change?: boolean;
  created_at: string;
}

interface ActivityLog {
  id: string;
  admin_id: string;
  admin_email: string;
  admin_name: string;
  action: string;
  details: any;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Modals & Drawer States
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteName, setInviteName] = React.useState('');
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState('admin');
  const [isInviting, setIsInviting] = React.useState(false);

  const [editOpen, setEditOpen] = React.useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = React.useState<AdminUser | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editRole, setEditRole] = React.useState('admin');
  const [editPassword, setEditPassword] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);

  const [activityDrawerOpen, setActivityDrawerOpen] = React.useState(false);
  const [selectedUserForActivity, setSelectedUserForActivity] = React.useState<AdminUser | null>(null);
  const [activities, setActivities] = React.useState<ActivityLog[]>([]);
  const [loadingActivities, setLoadingActivities] = React.useState(false);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('maria_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem('maria_user');
      const requesterId = storedUser ? JSON.parse(storedUser)?.id : '';
      
      const data = await apiRequest('/admin/users', {
        headers: { 'x-admin-id': requesterId }
      });
      setUsers(data);
    } catch (error: any) {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) {
      toast.error('Preencha o nome e o e-mail');
      return;
    }

    setIsInviting(true);
    try {
      const data = await apiRequest('/admin/admins', {
        method: 'POST',
        headers: { 'x-admin-id': currentUser?.id || '' },
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          role: inviteRole
        })
      });

      toast.success(`Administrador ${data.name} convidado com sucesso! Senha inicial: MarIA123`);
      setInviteOpen(false);
      setInviteName('');
      setInviteEmail('');
      setInviteRole('admin');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao convidar administrador');
    } finally {
      setIsInviting(false);
    }
  };

  const openEditModal = (user: AdminUser) => {
    setSelectedUserForEdit(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditPassword('');
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;

    if (!editName) {
      toast.error('O nome não pode ficar vazio');
      return;
    }

    setIsEditing(true);
    try {
      const payload: any = {
        name: editName,
        role: editRole
      };
      if (editPassword) {
        payload.password = editPassword;
      }

      await apiRequest(`/admin/admins/${selectedUserForEdit.id}`, {
        method: 'PATCH',
        headers: { 'x-admin-id': currentUser?.id || '' },
        body: JSON.stringify(payload)
      });

      toast.success('Administrador atualizado com sucesso!');
      setEditOpen(false);
      setSelectedUserForEdit(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao editar administrador');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (user.id === currentUser?.id) {
      toast.error('Você não pode excluir a si mesmo.');
      return;
    }

    if (!confirm(`Tem certeza que deseja remover o acesso do administrador ${user.name}?`)) {
      return;
    }

    try {
      await apiRequest(`/admin/admins/${user.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-id': currentUser?.id || '' }
      });

      toast.success('Administrador removido com sucesso!');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover administrador');
    }
  };

  const openActivityDrawer = async (user: AdminUser) => {
    setSelectedUserForActivity(user);
    setActivityDrawerOpen(true);
    setLoadingActivities(true);
    setActivities([]);

    try {
      const data = await apiRequest(`/admin/activities?targetId=${user.id}`, {
        headers: { 'x-admin-id': currentUser?.id || '' }
      });
      setActivities(data);
    } catch (error: any) {
      toast.error('Erro ao carregar atividades');
    } finally {
      setLoadingActivities(false);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      login: "Realizou login",
      change_password: "Alterou senha de acesso",
      create_admin: "Convidou novo administrador",
      edit_admin: "Atualizou dados de admin",
      delete_admin: "Removeu administrador",
      update_setting: "Alterou parâmetro global",
      clear_cache: "Limpou cache de IA",
      toggle_maintenance: "Alternou modo manutenção",
      sync_exchange: "Atualizou câmbio USD",
      clear_user_data: "Resetou dados de fiel",
      update_subscription: "Atualizou plano de fiel",
      update_user_settings: "Pausou ou limitou fiel",
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete') || action.includes('clear')) return 'bg-red-100 text-red-700 border-red-200';
    if (action.includes('create') || action.includes('login') || action.includes('change')) return 'bg-green-100 text-green-700 border-green-200';
    if (action.includes('update') || action.includes('toggle')) return 'bg-blue-100 text-primary border-blue-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    if (!name) return 'US';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // Safe check for superadmin route access
  const storedUser = localStorage.getItem('maria_user');
  const sessionUser = storedUser ? JSON.parse(storedUser) : null;
  if (sessionUser && sessionUser.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <MainLayout 
      title="Gestão de Administradores" 
      subtitle="Gerencie as contas administrativas da MarIA, acompanhe atividades em tempo real e defina privilégios."
    >
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div className="relative w-full max-w-sm">
          <Input 
            placeholder="Buscar por nome ou e-mail..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-white border-slate-200 rounded-xl"
          />
          <LucideSearch className="absolute left-3 top-3 text-slate-400 h-5 w-5" />
        </div>

        <Button 
          onClick={() => setInviteOpen(true)}
          className="h-11 px-6 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-lg shadow-blue-100 flex gap-2"
        >
          <LucideUserPlus size={18} />
          Convidar Administrador
        </Button>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/60 rounded-[2rem] overflow-hidden bg-white">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
            <LucideLoader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-medium">Carregando administradores...</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="w-[300px] font-bold text-slate-600 px-6 h-14">Administrador</TableHead>
                <TableHead className="font-bold text-slate-600">Cargo</TableHead>
                <TableHead className="font-bold text-slate-600">Primeiro Login</TableHead>
                <TableHead className="font-bold text-slate-600">Data de Cadastro</TableHead>
                <TableHead className="font-bold text-slate-600 text-right px-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors border-slate-100 group">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-11 w-11 border-2 border-slate-100 transition-all group-hover:border-primary/20">
                        <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-base">{user.name}</span>
                        <span className="text-sm text-slate-500 font-medium">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        "rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-wider border",
                        user.role === 'superadmin' 
                          ? "bg-amber-50 text-amber-700 border-amber-200" 
                          : "bg-blue-50 text-primary border-blue-200"
                      )}>
                        {user.role === 'superadmin' ? (
                          <LucideShield size={10} className="mr-1 inline" />
                        ) : null}
                        {user.role === 'superadmin' ? 'Super Admin' : 'Admin Padrão'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.requires_password_change ? (
                      <Badge className="bg-amber-100 text-amber-800 border border-amber-200 rounded-full font-bold text-[10px] uppercase tracking-wider">
                        Pendente
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 border border-green-200 rounded-full font-bold text-[10px] uppercase tracking-wider">
                        Realizado
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600 font-medium">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" className="h-9 w-9 p-0 rounded-full hover:bg-slate-100">
                          <LucideMoreVertical size={18} className="text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl p-2 w-48 bg-white">
                        <DropdownMenuItem 
                          onClick={() => openActivityDrawer(user)}
                          className="rounded-lg flex gap-2 font-medium cursor-pointer py-2 hover:bg-slate-50"
                        >
                          <LucideHistory size={16} /> Ver Atividade
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openEditModal(user)}
                          className="rounded-lg flex gap-2 font-medium cursor-pointer py-2 hover:bg-slate-50"
                        >
                          <LucideEdit2 size={16} /> Editar Cadastro
                        </DropdownMenuItem>
                        {user.id !== currentUser?.id && (
                          <DropdownMenuItem 
                            onClick={() => handleDelete(user)}
                            className="rounded-lg flex gap-2 font-medium text-red-500 focus:text-red-500 focus:bg-red-50 cursor-pointer py-2"
                          >
                            <LucideTrash2 size={16} /> Remover Acesso
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-400 font-medium">
                    Nenhum administrador encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Convite de Administrador Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl bg-white p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-slate-900 tracking-tight">Convidar Administrador</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium pt-2">
              Cadastre um novo usuário com acesso administrativo. A senha padrão inicial será <strong className="text-slate-800">MarIA123</strong> e o primeiro login exigirá alteração obrigatória.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite}>
            <div className="grid gap-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 font-bold ml-1">Nome Completo</Label>
                <Input 
                  id="name" 
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Ex: João da Silva" 
                  className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all text-base" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-bold ml-1">E-mail</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@exemplo.com" 
                  className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all text-base" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-700 font-bold ml-1">Cargo / Papel</Label>
                <select 
                  id="role" 
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 px-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="admin">Admin Padrão</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setInviteOpen(false)}
                className="h-12 rounded-xl font-bold text-base"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isInviting}
                className="h-12 bg-primary text-white rounded-xl font-bold text-base shadow-xl shadow-blue-100 flex-1"
              >
                {isInviting ? 'Convidando...' : 'Convidar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edição de Administrador Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { if (!open) setSelectedUserForEdit(null); setEditOpen(open); }}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl bg-white p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-slate-900 tracking-tight">Editar Administrador</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium pt-2">
              Altere o nome, cargo ou redefina a senha de acesso da conta de <strong className="text-slate-800">{selectedUserForEdit?.email}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="grid gap-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="editName" className="text-slate-700 font-bold ml-1">Nome Completo</Label>
                <Input 
                  id="editName" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ex: João da Silva" 
                  className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all text-base" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRole" className="text-slate-700 font-bold ml-1">Cargo / Papel</Label>
                <select 
                  id="editRole" 
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  disabled={selectedUserForEdit?.id === currentUser?.id}
                  className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 px-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                >
                  <option value="admin">Admin Padrão</option>
                  <option value="superadmin">Super Admin</option>
                </select>
                {selectedUserForEdit?.id === currentUser?.id && (
                  <p className="text-[11px] text-slate-400 mt-1 font-medium ml-1">Você não pode alterar o seu próprio cargo por motivos de segurança.</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <Label htmlFor="editPassword" className="text-slate-700 font-bold">Forçar Nova Senha</Label>
                  <span className="text-xs text-slate-400 font-medium">Opcional</span>
                </div>
                <div className="relative">
                  <Input 
                    id="editPassword" 
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all text-base pl-10" 
                  />
                  <LucideKeyRound className="absolute left-3 top-3.5 text-slate-400 h-5 w-5" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium ml-1">Deixe em branco para manter a senha atual.</p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditOpen(false)}
                className="h-12 rounded-xl font-bold text-base"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isEditing}
                className="h-12 bg-primary text-white rounded-xl font-bold text-base shadow-xl shadow-blue-100 flex-1"
              >
                {isEditing ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Activity Timeline Drawer */}
      {activityDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end transition-opacity duration-300">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setActivityDrawerOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-white/20">
                  <AvatarFallback className="bg-white/10 text-white font-bold">
                    {getInitials(selectedUserForActivity?.name || '')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-extrabold text-lg leading-tight">{selectedUserForActivity?.name}</h3>
                  <p className="text-xs text-blue-200 font-medium">{selectedUserForActivity?.email}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setActivityDrawerOpen(false)}
                className="rounded-full h-8 w-8 hover:bg-white/10 text-white hover:text-white"
              >
                <LucideX size={20} />
              </Button>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-center gap-2 text-slate-800 font-extrabold text-base mb-2">
                <LucideHistory className="h-5 w-5 text-primary" />
                Histórico de Auditoria
              </div>

              {loadingActivities ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                  <LucideLoader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="font-medium">Carregando atividades...</p>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-16 text-slate-400 font-medium space-y-2">
                  <p className="text-base font-bold text-slate-600">Nenhuma atividade registrada</p>
                  <p className="text-sm">As ações administrativas realizadas por este usuário aparecerão aqui.</p>
                </div>
              ) : (
                <div className="relative border-l border-slate-200 ml-3 pl-6 space-y-6">
                  {activities.map((activity) => (
                    <div key={activity.id} className="relative group">
                      {/* Dot icon */}
                      <span className="absolute -left-[31px] top-1 bg-white border border-slate-200 rounded-full p-1.5 shadow-sm group-hover:border-primary/50 transition-colors">
                        <span className="block h-2 w-2 rounded-full bg-primary" />
                      </span>

                      {/* Content */}
                      <div className="bg-slate-50/50 group-hover:bg-slate-50 transition-all rounded-2xl border border-slate-100 p-4 space-y-2">
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 text-sm">
                            {getActionLabel(activity.action)}
                          </span>
                          <Badge className={cn("text-[9px] font-bold rounded-full px-2 py-0.5 border uppercase", getActionColor(activity.action))}>
                            {activity.action}
                          </Badge>
                        </div>

                        {activity.details && (
                          <div className="bg-white/80 border border-slate-100 rounded-xl p-3 text-xs text-slate-600 font-mono overflow-x-auto max-h-32">
                            {typeof activity.details === 'object' ? (
                              <pre className="whitespace-pre-wrap">{JSON.stringify(activity.details, null, 2)}</pre>
                            ) : (
                              <span>{activity.details}</span>
                            )}
                          </div>
                        )}

                        <div className="text-[11px] text-slate-400 font-bold">
                          {new Date(activity.created_at).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

