import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { UserExtended } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle,
  Edit,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Save,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
  X,
} from "lucide-react";
import AdminAccessCheck from "../components/AdminAccessCheck";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await User.me();
        setCurrentUserEmail(user.email);
        setIsAdmin(user.role === 'admin');
        setCurrentUser(user);
      } catch (error) {
        console.error("Erro ao carregar usuário atual:", error);
      }
    };
    
    loadCurrentUser();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const usersData = await User.list();
      
      // Carregar dados estendidos de cada usuário
      const usersWithExtendedData = await Promise.all(
        usersData.map(async (user) => {
          try {
            const extendedData = await UserExtended.filter({ email: user.email });
            return {
              ...user,
              extended: extendedData[0] || { permissions: {} }
            };
          } catch (error) {
            console.error(`Erro ao carregar dados estendidos para ${user.email}:`, error);
            return {
              ...user,
              extended: { permissions: {} }
            };
          }
        })
      );
      
      setUsers(usersWithExtendedData);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      setError("Falha ao carregar usuários. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser({
      ...user,
      extended: {
        ...user.extended,
        permissions: {
          ...user.extended.permissions,
        }
      }
    });
    setEditDialogOpen(true);
  };

  const handlePermissionChange = (permission, value) => {
    setEditingUser(prev => ({
      ...prev,
      extended: {
        ...prev.extended,
        permissions: {
          ...prev.extended.permissions,
          [permission]: value
        }
      }
    }));
  };

  const saveUserPermissions = async () => {
    if (!editingUser) return;
    
    setSaveLoading(true);
    try {
      const { extended } = editingUser;
      
      // Verificar se já existe um registro para o usuário
      const existingExtended = await UserExtended.filter({ email: editingUser.email });
      
      if (existingExtended && existingExtended.length > 0) {
        // Atualizar registro existente
        await UserExtended.update(existingExtended[0].id, {
          ...existingExtended[0],
          permissions: extended.permissions
        });
      } else {
        // Criar novo registro
        await UserExtended.create({
          email: editingUser.email,
          permissions: extended.permissions
        });
      }
      
      await loadUsers();
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Erro ao salvar permissões:", error);
      setError("Falha ao salvar permissões. Tente novamente mais tarde.");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <AdminAccessCheck>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Administração</h1>
        </div>

        {error && (
          <div className="bg-destructive/20 p-4 rounded-lg flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        <Tabs defaultValue="users">
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2">
              <Shield className="w-4 h-4" />
              Permissões
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Usuários do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead>Ver Capturas</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.full_name || "Nome não definido"}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.role === "admin" ? (
                              <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1 w-fit">
                                <ShieldCheck className="w-3 h-3" />
                                Admin
                              </Badge>
                            ) : user.extended?.permissions?.admin ? (
                              <Badge className="bg-indigo-100 text-indigo-800 flex items-center gap-1 w-fit">
                                <Shield className="w-3 h-3" />
                                Admin
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1 w-fit">
                                Usuário
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.role === "admin" || user.extended?.permissions?.view_all_captures ? (
                              <Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                                <Eye className="w-3 h-3" />
                                Todas
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                                <EyeOff className="w-3 h-3" />
                                Próprias
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              className="gap-1"
                            >
                              <UserCog className="w-3.5 h-3.5" />
                              Permissões
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Permissões</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Tipos de Permissões
                    </h3>
                    <ul className="space-y-2 mt-4">
                      <li className="flex items-start gap-2">
                        <Badge className="mt-0.5 bg-blue-100 text-blue-800">Admin</Badge>
                        <span>Acesso total ao sistema, pode gerenciar usuários e configurações</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge className="mt-0.5 bg-green-100 text-green-800">Ver Todas as Capturas</Badge>
                        <span>Permite ao usuário visualizar capturas de todos os usuários do sistema</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge className="mt-0.5 bg-purple-100 text-purple-800">Gerenciar Câmeras</Badge>
                        <span>Permite configurar câmeras e definir parâmetros de captura automática</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge className="mt-0.5 bg-amber-100 text-amber-800">Gerenciar Contatos</Badge>
                        <span>Permite adicionar e editar contatos para compartilhamento de capturas</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 text-yellow-700">
                    <div className="flex gap-2">
                      <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">Nota de Segurança</h4>
                        <p className="text-sm mt-1">
                          Conceda permissões apenas aos usuários que realmente precisam. 
                          Em particular, a permissão para ver capturas de todos os usuários 
                          deve ser concedida com cautela.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de Edição de Permissões */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Permissões do Usuário</DialogTitle>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 pb-2 border-b">
                <div className="bg-primary/10 text-primary w-10 h-10 rounded-full flex items-center justify-center">
                  {editingUser.full_name ? editingUser.full_name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <h3 className="font-medium">{editingUser.full_name || "Usuário"}</h3>
                  <p className="text-sm text-muted-foreground">{editingUser.email}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Permissões do Usuário</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <Label htmlFor="admin-perm">Permissões de Administrador</Label>
                    </div>
                    <Switch 
                      id="admin-perm"
                      checked={editingUser.extended?.permissions?.admin || false}
                      onCheckedChange={(checked) => handlePermissionChange("admin", checked)}
                      disabled={editingUser.role === "admin"}
                    />
                  </div>
                  
                  {editingUser.role === "admin" && (
                    <p className="text-xs text-muted-foreground ml-6">
                      Este usuário já é administrador do sistema
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-green-600" />
                    <Label htmlFor="view-all-perm">Ver Capturas de Todos os Usuários</Label>
                  </div>
                  <Switch 
                    id="view-all-perm"
                    checked={
                      editingUser.role === "admin" || 
                      editingUser.extended?.permissions?.view_all_captures || 
                      false
                    }
                    onCheckedChange={(checked) => handlePermissionChange("view_all_captures", checked)}
                    disabled={editingUser.role === "admin"}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCog className="w-4 h-4 text-purple-600" />
                    <Label htmlFor="manage-cameras-perm">Gerenciar Câmeras</Label>
                  </div>
                  <Switch 
                    id="manage-cameras-perm"
                    checked={
                      editingUser.role === "admin" || 
                      editingUser.extended?.permissions?.manage_cameras || 
                      false
                    }
                    onCheckedChange={(checked) => handlePermissionChange("manage_cameras", checked)}
                    disabled={editingUser.role === "admin"}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-600" />
                    <Label htmlFor="manage-contacts-perm">Gerenciar Contatos</Label>
                  </div>
                  <Switch 
                    id="manage-contacts-perm"
                    checked={
                      editingUser.role === "admin" || 
                      editingUser.extended?.permissions?.manage_contacts || 
                      false
                    }
                    onCheckedChange={(checked) => handlePermissionChange("manage_contacts", checked)}
                    disabled={editingUser.role === "admin"}
                  />
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={saveLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={saveUserPermissions}
              disabled={saveLoading}
              className="gap-2"
            >
              {saveLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar Permissões
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminAccessCheck>
  );
}