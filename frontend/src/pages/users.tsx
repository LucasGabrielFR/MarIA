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
  DialogTrigger 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LucideUserPlus, LucideTrash2, LucideMoreVertical, LucideMail, LucideShield, LucideLoader2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<any>(null);

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
      const data = await apiRequest('/admin/users');
      setUsers(data);
    } catch (error: any) {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = currentUser?.email === 'lucasgabriel@acutistech.com.br';

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <MainLayout 
      title="Gestão de Usuários" 
      subtitle="Gerencie os administradores que possuem acesso ao painel da MarIA."
    >
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-72">
          <Input 
            placeholder="Buscar por nome ou e-mail..." 
            className="pl-10 h-11 bg-white border-slate-200 rounded-xl"
          />
          <LucideMail className="absolute left-3 top-3 text-slate-400 h-5 w-5" />
        </div>

        {isSuperAdmin && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="h-11 px-6 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-lg shadow-blue-100 flex gap-2">
                <LucideUserPlus size={18} />
                Convidar Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-slate-800">Convidar Administrador</DialogTitle>
                <DialogDescription className="text-slate-500 font-medium pt-2">
                  Um convite será enviado para o e-mail informado para que o novo administrador configure sua senha.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700 font-bold ml-1">Nome Completo</Label>
                  <Input id="name" placeholder="Ex: João da Silva" className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-bold ml-1">E-mail</Label>
                  <Input id="email" type="email" placeholder="email@exemplo.com" className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-slate-700 font-bold ml-1">Cargo / Papel</Label>
                  <select id="role" className="w-full h-12 rounded-xl bg-slate-50 border border-slate-100 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="admin">Administrador Padrão</option>
                    <option value="superadmin">Superadministrador</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full h-12 bg-primary text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-100">
                  Enviar Convite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
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
                <TableHead className="font-bold text-slate-600">Data de Cadastro</TableHead>
                <TableHead className="font-bold text-slate-600 text-right px-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
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
                        "rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-wider",
                        user.role === 'superadmin' 
                          ? "bg-amber-100 text-amber-700 border-amber-200" 
                          : "bg-blue-100 text-primary border-blue-200"
                      )}>
                        {user.role === 'superadmin' ? (
                          <LucideShield size={10} className="mr-1 inline" />
                        ) : null}
                        {user.role}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 font-medium">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-9 w-9 p-0 rounded-full hover:bg-slate-100">
                          <LucideMoreVertical size={18} className="text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl p-2 w-48">
                        <DropdownMenuItem className="rounded-lg flex gap-2 font-medium cursor-pointer">
                          <LucideMail size={16} /> Ver Atividade
                        </DropdownMenuItem>
                        {isSuperAdmin && user.role !== 'superadmin' && (
                          <DropdownMenuItem className="rounded-lg flex gap-2 font-medium text-red-500 focus:text-red-500 focus:bg-red-50 cursor-pointer">
                            <LucideTrash2 size={16} /> Remover Acesso
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-500 font-medium">
                    Nenhum administrador encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </MainLayout>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
