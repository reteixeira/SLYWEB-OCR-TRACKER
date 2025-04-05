
import React, { useState, useEffect } from "react";
import { Vehicle } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { 
  Camera, 
  Truck, 
  Car, 
  Clock, 
  AlertCircle, 
  Loader2, 
  Eye, 
  Trash2, 
  Send, 
  Check
} from "lucide-react";
import VehiclePreview from "../components/capture/VehiclePreview";
import ImageViewer from "../components/media/ImageViewer";
import BrazilianLicensePlate from "../components/vehicles/BrazilianLicensePlate";
import { User } from "@/api/entities";
import { UserExtended } from "@/api/entities";

export default function Dashboard() {
  const [recentCaptures, setRecentCaptures] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    trucks: 0,
    cars: 0,
    motorcycles: 0,
    pending: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedVehicleId, setExpandedVehicleId] = useState(null);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [userData, setUserData] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Carregar dados do usuário atual
      const user = await User.me();
      setUserData(user);
      
      const userExtended = await UserExtended.filter({ email: user.email });
      const permissions = userExtended.length > 0 ? userExtended[0].permissions : null;
      setUserPermissions(permissions);
      
      const isAdmin = user.role === 'admin' || (permissions && permissions.admin);
      const canViewAllCaptures = isAdmin || (permissions && permissions.view_all_captures);
      
      // Carregar capturas com base nas permissões
      let captures;
      try {
        if (canViewAllCaptures) {
          // Administradores ou usuários com permissão especial veem tudo
          captures = await Vehicle.list("-capture_date", 15);
        } else {
          // Usuários comuns veem apenas suas próprias capturas
          captures = await Vehicle.filter({ created_by: user.email }, "-capture_date", 15);
        }
        
        const processedCaptures = captures
          .filter(c => !c.deleted)
          .map(capture => ({
            ...capture,
            image_url: capture.image_url || "https://placehold.co/800x600/gray/white?text=Imagem+não+disponível"
          }));
        setRecentCaptures(processedCaptures);

        // Calcular estatísticas com base nas permissões
        let allCaptures;
        if (canViewAllCaptures) {
          allCaptures = await Vehicle.list();
        } else {
          allCaptures = await Vehicle.filter({ created_by: user.email });
        }
        
        const activeCaptures = allCaptures.filter(c => !c.deleted);
        setStats({
          total: activeCaptures.length,
          trucks: activeCaptures.filter(c => c.type === "truck").length,
          cars: activeCaptures.filter(c => c.type === "car").length,
          motorcycles: activeCaptures.filter(c => c.type === "motorcycle").length,
          pending: activeCaptures.filter(c => c.send_status === "pending").length
        });
      } catch (err) {
        console.error("Erro ao carregar veículos:", err);
        setError("Falha ao carregar veículos. Tente novamente mais tarde.");
      }
    } catch (err) {
      console.error("Erro ao carregar dados do usuário:", err);
      setError("Falha ao carregar dados do usuário. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVehicleExpansion = (vehicleId) => {
    setExpandedVehicleId(prev => prev === vehicleId ? null : vehicleId);
  };

  const handleDelete = (vehicle) => {
    setVehicleToDelete(vehicle);
    setDeleteDialogOpen(true);
  };

  const markAsDeleted = async () => {
    if (!vehicleToDelete) return;
    setIsDeleting(true);
    try {
      await Vehicle.update(vehicleToDelete.id, {
        ...vehicleToDelete,
        deleted: true,
        deleted_date: new Date().toISOString()
      });
      await loadData();
      setExpandedVehicleId(null);
      
      if (imageViewerOpen) {
        setImageViewerOpen(false);
      }
    } catch (err) {
      console.error("Erro ao mover para lixeira:", err);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
    }
  };

  const shareVehicleViaWhatsApp = async (vehicle) => {
    const phone = "5511998899933";
    
    let message = `*Veículo Capturado*\n`;
    message += `Placa: ${vehicle.plate || "N/A"}\n`;
    message += `Tipo: ${
      vehicle.type === "truck" ? "Caminhão" : 
      vehicle.type === "car" ? "Carro" : 
      vehicle.type === "motorcycle" ? "Moto" : "Outro"
    }\n`;
    
    if (vehicle.type === "truck" && vehicle.company_name && vehicle.company_name !== "-") {
      message += `\n*Informações da Empresa*\n`;
      message += `Nome: ${vehicle.company_name}\n`;
      
      if (vehicle.company_phone && vehicle.company_phone !== "-") 
        message += `Telefone: ${vehicle.company_phone}\n`;
        
      if (vehicle.company_website && vehicle.company_website !== "-")
        message += `Website: ${vehicle.company_website}\n`;
        
      if (vehicle.company_email && vehicle.company_email !== "-")
        message += `Email: ${vehicle.company_email}\n`;
    }
    
    message += `\nData da Captura: ${format(new Date(vehicle.capture_date), "dd/MM/yyyy 'às' HH:mm")}\n`;
    message += `\nImagem: ${vehicle.image_url}\n`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    
    try {
      await Vehicle.update(vehicle.id, {
        ...vehicle,
        send_status: "sent"
      });
      loadData();
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Principal</h1>
        <Link to={createPageUrl("Capture")}>
          <Button className="gap-2">
            <Camera className="w-4 h-4" />
            Nova Captura
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-destructive/20 p-4 rounded-lg flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Capturas</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Caminhões</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trucks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Carros</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cars}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Motos</CardTitle>
            <span className="text-muted-foreground">🏍️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.motorcycles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Capturas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCaptures.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Camera className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Nenhuma captura recente encontrada</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.href = createPageUrl("Capture")}
                >
                  Fazer Nova Captura
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentCaptures.map((capture) => (
                  <React.Fragment key={capture.id}>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-24 h-24 rounded overflow-hidden bg-muted cursor-pointer relative"
                          onClick={() => {
                            setSelectedImage(capture.image_url);
                            setImageViewerOpen(true);
                          }}
                        >
                          <img 
                            src={capture.image_url}
                            alt="Veículo capturado"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = "https://placehold.co/800x600/gray/white?text=Imagem+não+disponível";
                            }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                            Clique para ampliar
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline justify-between">
                            <div>
                              <p className="font-medium">
                                {capture.plate || "Placa não detectada"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(capture.capture_date), "dd/MM/yyyy 'às' HH:mm")}
                                {" - "}
                                {capture.type === "truck" ? "Caminhão" : 
                                 capture.type === "car" ? "Carro" : 
                                 capture.type === "motorcycle" ? "Moto" : "Outro"}
                              </p>
                              <p className="text-xs font-medium text-primary mt-1">
                                {capture.created_by 
                                  ? capture.created_by.split('@')[0].replace(/[^a-zA-Z]/g, '').toUpperCase()
                                  : "-"}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  if (capture.send_status === "pending") {
                                    shareVehicleViaWhatsApp(capture);
                                  }
                                }}
                                className={`inline-flex items-center p-1.5 rounded-full text-xs ${
                                  capture.send_status === "sent"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                }`}
                                title={capture.send_status === "sent" ? "Enviado" : "Clique para enviar"}
                              >
                                {capture.send_status === "sent" ? 
                                  <Check className="w-3.5 h-3.5" /> : 
                                  <Send className="w-3.5 h-3.5" />
                                }
                              </button>
                              <button
                                onClick={() => toggleVehicleExpansion(capture.id)}
                                className="p-1.5 rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200"
                                title="Ver detalhes"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(capture)}
                                className="p-1.5 rounded-full bg-red-100 text-red-800 hover:bg-red-200"
                                title="Apagar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {expandedVehicleId === capture.id && (
                      <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-muted/30 rounded-lg p-6 -mt-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-1">
                            <div className="flex flex-col gap-4">
                              <div 
                                className="aspect-video rounded-lg overflow-hidden bg-muted relative cursor-pointer"
                                onClick={() => {
                                  setSelectedImage(capture.image_url);
                                  setImageViewerOpen(true);
                                }}
                              >
                                <img
                                  src={capture.image_url || "https://placehold.co/400x300/gray"}
                                  alt="Veículo"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                  Clique para ampliar
                                </div>
                              </div>
                              
                              <div className="flex justify-between">
                                <div className="flex justify-center">
                                  <BrazilianLicensePlate 
                                    plate={capture.plate || "Não detectada"} 
                                    size="medium" 
                                    isMotorcycle={capture.type === "motorcycle"}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="md:col-span-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              <div>
                                <h3 className="text-lg font-medium mb-3">Informações do Veículo</h3>
                                <div className="space-y-3">
                                  <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Tipo</span>
                                    <span className="font-medium flex items-center gap-1">
                                      {capture.type === "truck" ? 
                                        <><Truck className="w-4 h-4" /> Caminhão</> : 
                                        capture.type === "car" ?
                                        <><Car className="w-4 h-4" /> Carro</> :
                                        capture.type === "motorcycle" ?
                                        <span className="flex items-center gap-1">🏍️ Moto</span> :
                                        "Outro"
                                      }
                                    </span>
                                  </div>
                                  <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Data de Captura</span>
                                    <span className="font-medium">
                                      {format(new Date(capture.capture_date), "dd/MM/yyyy 'às' HH:mm")}
                                    </span>
                                  </div>
                                  <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Status</span>
                                    <span className={`font-medium ${
                                      capture.send_status === "sent" 
                                      ? "text-green-600" 
                                      : "text-amber-600"
                                    }`}>
                                      {capture.send_status === "sent" ? "Enviado" : "Pendente"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {capture.type === "truck" && capture.company_name && capture.company_name !== "-" && (
                                <div>
                                  <h3 className="text-lg font-medium mb-3">Informações da Empresa</h3>
                                  <div className="space-y-3">
                                    <div className="flex justify-between border-b pb-2">
                                      <span className="text-muted-foreground">Nome</span>
                                      <span className="font-medium">{capture.company_name}</span>
                                    </div>
                                    
                                    {capture.company_cpfCnpj && (
                                      <div className="flex justify-between border-b pb-2">
                                        <span className="text-muted-foreground">CPF/CNPJ</span>
                                        <span className="font-medium font-mono">{formatCpfCnpj(capture.company_cpfCnpj)}</span>
                                      </div>
                                    )}
                                    
                                    {capture.company_address && (
                                      <div className="flex justify-between border-b pb-2">
                                        <span className="text-muted-foreground">Endereço</span>
                                        <span className="font-medium">{capture.company_address}</span>
                                      </div>
                                    )}
                                    
                                    {capture.company_phone && capture.company_phone !== "-" && (
                                      <div className="flex justify-between border-b pb-2">
                                        <span className="text-muted-foreground">Telefone</span>
                                        <a 
                                          href={`tel:${capture.company_phone}`} 
                                          className="font-medium text-primary hover:underline"
                                        >
                                          {capture.company_phone}
                                        </a>
                                      </div>
                                    )}
                                    
                                    {capture.company_website && capture.company_website !== "-" && (
                                      <div className="flex justify-between border-b pb-2">
                                        <span className="text-muted-foreground">Website</span>
                                        <a 
                                          href={capture.company_website} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="font-medium text-primary hover:underline"
                                        >
                                          {capture.company_website.replace(/(https?:\/\/)?(www\.)?/i, '')}
                                        </a>
                                      </div>
                                    )}
                                    
                                    {capture.company_email && capture.company_email !== "-" && (
                                      <div className="flex justify-between border-b pb-2">
                                        <span className="text-muted-foreground">Email</span>
                                        <a 
                                          href={`mailto:${capture.company_email}`}
                                          className="font-medium text-primary hover:underline"
                                        >
                                          {capture.company_email}
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-4 flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => toggleVehicleExpansion(null)}
                              >
                                Fechar Detalhes
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(capture)}
                                className="gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Apagar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover para lixeira</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja mover este item para a lixeira? 
              Você poderá restaurá-lo ou excluí-lo permanentemente depois.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-4 p-2 bg-muted/50 rounded-lg my-4">
            {vehicleToDelete && (
              <>
                <div className="h-16 w-16 relative rounded-lg overflow-hidden">
                  <img
                    src={vehicleToDelete.image_url}
                    alt="Veículo"
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <p className="font-medium">{vehicleToDelete.plate || "Sem placa"}</p>
                  {vehicleToDelete.company_name && vehicleToDelete.company_name !== "-" && (
                    <p className="text-sm text-muted-foreground">{vehicleToDelete.company_name}</p>
                  )}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={markAsDeleted}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {isDeleting ? "Movendo..." : "Mover para Lixeira"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageViewer
        imageUrl={selectedImage}
        isOpen={imageViewerOpen}
        onClose={(action) => {
          if (action === 'delete') {
            const vehicleToDelete = recentCaptures.find(c => c.image_url === selectedImage);
            if (vehicleToDelete) {
              handleDelete(vehicleToDelete);
            }
          }
          setImageViewerOpen(false);
        }}
      />
    </div>
  );

  // Helper function to format CPF/CNPJ
  function formatCpfCnpj(value) {
    if (!value) return "";
    const digits = value.replace(/\D/g, '');
    
    // Format as CPF (if 11 digits)
    if (digits.length === 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    
    // Format as CNPJ (if 14 digits)
    if (digits.length === 14) {
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    
    // Otherwise return as is
    return digits;
  }
}
