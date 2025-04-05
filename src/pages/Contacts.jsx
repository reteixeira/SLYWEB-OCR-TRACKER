import React, { useState, useEffect } from "react";
import { Contact } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Phone,
  UserPlus,
  Trash2,
  PenSquare,
  Loader2,
  Search,
  AlertCircle,
  Phone as PhoneIcon,
  AtSign,
  Map,
  Bell,
  Check,
  X,
  Send,
  AlertTriangle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testMessageDialogOpen, setTestMessageDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    whatsapp: true,
    email: "",
    active: true,
    notification_preferences: {
      cars: true,
      trucks: true,
      buses: true,
      vans: true
    },
    highways: []
  });
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    loadData();
    checkLocation();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Carregar usuário atual
      const userData = await User.me();
      setUser(userData);
      
      // Carregar contatos
      const contactsData = await Contact.list();
      setContacts(contactsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError("Falha ao carregar contatos. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const checkLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            last_updated: new Date().toISOString()
          };
          setUserLocation(locationData);
        },
        (error) => {
          console.warn("Erro ao obter localização:", error);
        }
      );
    }
  };

  const handleAddContact = async () => {
    try {
      // Validar número de telefone
      const phoneRegex = /^\+?[0-9]{10,15}$/;
      if (!phoneRegex.test(newContact.phone.replace(/\D/g, ''))) {
        setError("Número de telefone inválido. Use formato com DDD.");
        return;
      }
      
      // Adicionar localização se disponível
      const contactToAdd = {...newContact};
      if (userLocation) {
        contactToAdd.last_location = userLocation;
      }
      
      // Criar contato
      await Contact.create(contactToAdd);
      await loadData();
      setAddDialogOpen(false);
      setNewContact({
        name: "",
        phone: "",
        whatsapp: true,
        email: "",
        active: true,
        notification_preferences: {
          cars: true,
          trucks: true,
          buses: true,
          vans: true
        },
        highways: []
      });
    } catch (error) {
      console.error("Erro ao adicionar contato:", error);
      setError("Falha ao adicionar contato. Tente novamente.");
    }
  };

  const handleEditContact = (contact) => {
    setSelectedContact(contact);
    setEditDialogOpen(true);
  };

  const saveEditedContact = async () => {
    if (!selectedContact) return;
    
    try {
      await Contact.update(selectedContact.id, selectedContact);
      await loadData();
      setEditDialogOpen(false);
      setSelectedContact(null);
    } catch (error) {
      console.error("Erro ao atualizar contato:", error);
      setError("Falha ao atualizar contato. Tente novamente.");
    }
  };

  const handleDeleteContact = (contact) => {
    setSelectedContact(contact);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteContact = async () => {
    if (!selectedContact) return;
    
    try {
      await Contact.delete(selectedContact.id);
      await loadData();
      setDeleteDialogOpen(false);
      setSelectedContact(null);
    } catch (error) {
      console.error("Erro ao excluir contato:", error);
      setError("Falha ao excluir contato. Tente novamente.");
    }
  };

  const handleTestMessage = (contact) => {
    setSelectedContact(contact);
    setTestMessageDialogOpen(true);
  };

  const sendTestMessage = async () => {
    if (!selectedContact) return;
    
    try {
      // Aqui enviaria uma mensagem de teste via WhatsApp
      // Simulação apenas
      setTimeout(() => {
        setTestMessageDialogOpen(false);
        setSelectedContact(null);
      }, 2000);
    } catch (error) {
      console.error("Erro ao enviar mensagem de teste:", error);
      setError("Falha ao enviar mensagem de teste. Tente novamente.");
    }
  };

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(search.toLowerCase()) ||
    contact.phone.includes(search) ||
    (contact.email && contact.email.toLowerCase().includes(search.toLowerCase()))
  );

  const formatPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
    }
    return phone;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Contatos para Notificações</h1>
        <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Novo Contato
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/20 p-4 rounded-lg flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-auto" 
            onClick={() => setError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filtrar Contatos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Contatos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Nenhum contato encontrado</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {search ? "Tente uma busca diferente ou " : ""}
                adicione um novo contato para receber notificações.
              </p>
              <Button 
                onClick={() => setAddDialogOpen(true)} 
                className="mt-4"
              >
                Adicionar Contato
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell>{formatPhone(contact.phone)}</TableCell>
                      <TableCell>{contact.email || "-"}</TableCell>
                      <TableCell>
                        {contact.whatsapp ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <Check className="w-4 h-4" />
                            <span>Sim</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-400">
                            <X className="w-4 h-4" />
                            <span>Não</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          contact.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {contact.active ? "Ativo" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTestMessage(contact)}
                          disabled={!contact.active || !contact.whatsapp}
                          title="Enviar mensagem de teste"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditContact(contact)}
                          title="Editar contato"
                        >
                          <PenSquare className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteContact(contact)}
                          className="text-destructive"
                          title="Excluir contato"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Adicionar Contato */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Contato</DialogTitle>
            <DialogDescription>
              Adicione um novo contato para receber notificações de veículos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={newContact.name}
                onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                placeholder="Nome do contato"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone</Label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="phone"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                    placeholder="(00) 00000-0000"
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                    placeholder="email@exemplo.com"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <div className="text-sm text-muted-foreground">
                  O número possui WhatsApp?
                </div>
              </div>
              <Switch
                id="whatsapp"
                checked={newContact.whatsapp}
                onCheckedChange={(checked) => setNewContact({...newContact, whatsapp: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="active">Status</Label>
                <div className="text-sm text-muted-foreground">
                  Contato ativo para receber notificações
                </div>
              </div>
              <Switch
                id="active"
                checked={newContact.active}
                onCheckedChange={(checked) => setNewContact({...newContact, active: checked})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Preferências de Notificação</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pref_cars" className="text-sm">Carros</Label>
                  <Switch
                    id="pref_cars"
                    checked={newContact.notification_preferences.cars}
                    onCheckedChange={(checked) => setNewContact({
                      ...newContact, 
                      notification_preferences: {
                        ...newContact.notification_preferences,
                        cars: checked
                      }
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="pref_trucks" className="text-sm">Caminhões</Label>
                  <Switch
                    id="pref_trucks"
                    checked={newContact.notification_preferences.trucks}
                    onCheckedChange={(checked) => setNewContact({
                      ...newContact, 
                      notification_preferences: {
                        ...newContact.notification_preferences,
                        trucks: checked
                      }
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="pref_buses" className="text-sm">Ônibus</Label>
                  <Switch
                    id="pref_buses"
                    checked={newContact.notification_preferences.buses}
                    onCheckedChange={(checked) => setNewContact({
                      ...newContact, 
                      notification_preferences: {
                        ...newContact.notification_preferences,
                        buses: checked
                      }
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="pref_vans" className="text-sm">Vans</Label>
                  <Switch
                    id="pref_vans"
                    checked={newContact.notification_preferences.vans}
                    onCheckedChange={(checked) => setNewContact({
                      ...newContact, 
                      notification_preferences: {
                        ...newContact.notification_preferences,
                        vans: checked
                      }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddContact}>
              Adicionar Contato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Editar Contato */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Contato</DialogTitle>
            <DialogDescription>
              Atualize as informações do contato selecionado.
            </DialogDescription>
          </DialogHeader>
          {selectedContact && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_name">Nome Completo</Label>
                <Input
                  id="edit_name"
                  value={selectedContact.name}
                  onChange={(e) => setSelectedContact({...selectedContact, name: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_phone">Telefone</Label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="edit_phone"
                      value={selectedContact.phone}
                      onChange={(e) => setSelectedContact({...selectedContact, phone: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit_email">E-mail</Label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="edit_email"
                      type="email"
                      value={selectedContact.email || ""}
                      onChange={(e) => setSelectedContact({...selectedContact, email: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="edit_whatsapp">WhatsApp</Label>
                  <div className="text-sm text-muted-foreground">
                    O número possui WhatsApp?
                  </div>
                </div>
                <Switch
                  id="edit_whatsapp"
                  checked={selectedContact.whatsapp}
                  onCheckedChange={(checked) => setSelectedContact({...selectedContact, whatsapp: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="edit_active">Status</Label>
                  <div className="text-sm text-muted-foreground">
                    Contato ativo para receber notificações
                  </div>
                </div>
                <Switch
                  id="edit_active"
                  checked={selectedContact.active}
                  onCheckedChange={(checked) => setSelectedContact({...selectedContact, active: checked})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Preferências de Notificação</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit_pref_cars" className="text-sm">Carros</Label>
                    <Switch
                      id="edit_pref_cars"
                      checked={selectedContact.notification_preferences?.cars}
                      onCheckedChange={(checked) => setSelectedContact({
                        ...selectedContact, 
                        notification_preferences: {
                          ...selectedContact.notification_preferences,
                          cars: checked
                        }
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit_pref_trucks" className="text-sm">Caminhões</Label>
                    <Switch
                      id="edit_pref_trucks"
                      checked={selectedContact.notification_preferences?.trucks}
                      onCheckedChange={(checked) => setSelectedContact({
                        ...selectedContact, 
                        notification_preferences: {
                          ...selectedContact.notification_preferences,
                          trucks: checked
                        }
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit_pref_buses" className="text-sm">Ônibus</Label>
                    <Switch
                      id="edit_pref_buses"
                      checked={selectedContact.notification_preferences?.buses}
                      onCheckedChange={(checked) => setSelectedContact({
                        ...selectedContact, 
                        notification_preferences: {
                          ...selectedContact.notification_preferences,
                          buses: checked
                        }
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit_pref_vans" className="text-sm">Vans</Label>
                    <Switch
                      id="edit_pref_vans"
                      checked={selectedContact.notification_preferences?.vans}
                      onCheckedChange={(checked) => setSelectedContact({
                        ...selectedContact, 
                        notification_preferences: {
                          ...selectedContact.notification_preferences,
                          vans: checked
                        }
                      })}
                    />
                  </div>
                </div>
              </div>
              
              {selectedContact.last_location && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Map className="w-4 h-4" />
                    Última Localização
                  </Label>
                  <div className="p-2 bg-muted rounded text-sm">
                    <p>Latitude: {selectedContact.last_location.latitude}</p>
                    <p>Longitude: {selectedContact.last_location.longitude}</p>
                    {selectedContact.last_location.last_updated && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Atualizado em: {format(new Date(selectedContact.last_location.last_updated), "dd/MM/yyyy HH:mm")}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveEditedContact}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Excluir Contato */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Contato</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {selectedContact && (
            <div className="bg-muted p-4 rounded-lg my-4">
              <p className="font-medium">{selectedContact.name}</p>
              <p className="text-sm text-muted-foreground">{formatPhone(selectedContact.phone)}</p>
              {selectedContact.email && (
                <p className="text-sm text-muted-foreground">{selectedContact.email}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteContact}
            >
              Excluir Contato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/*Dialog de Mensagem de Teste */}
      <Dialog open={testMessageDialogOpen} onOpenChange={setTestMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Mensagem de Teste</DialogTitle>
            <DialogDescription>
              Enviar uma mensagem de teste via WhatsApp para este contato?
            </DialogDescription>
          </DialogHeader>
          {selectedContact && (
            <div className="py-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="bg-green-100 p-2 rounded-full">
                  <Phone className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">{selectedContact.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPhone(selectedContact.phone)}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setTestMessageDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={sendTestMessage}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              Enviar Mensagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}