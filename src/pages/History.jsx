
import React, { useState, useEffect } from "react";
import { Vehicle } from "@/api/entities";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Car,
  Truck,
  RefreshCw,
  Trash2,
  Eye,
  Check,
  X,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";
import VehiclePreview from "../components/capture/VehiclePreview";
import ImageViewer from "../components/media/ImageViewer";
import CompanyInfoLookup from "../components/capture/CompanyInfoLookup";
import BrazilianLicensePlate from "@/components/vehicles/BrazilianLicensePlate";

export default function History() {
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [expandedVehicleId, setExpandedVehicleId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [editedPlate, setEditedPlate] = useState("");
  
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    user: "all"
  });

  const [uniqueUsers, setUniqueUsers] = useState([]);

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    // Extract unique users from vehicles
    const users = [...new Set(vehicles.map(v => v.created_by))].filter(Boolean);
    setUniqueUsers(users);
  }, [vehicles]);

  const sortedVehicles = vehicles.filter(v => !v.deleted);

  const filteredVehicles = sortedVehicles.filter(vehicle => {
    const typeMatch = filters.type === "all" || vehicle.type === filters.type;
    const statusMatch = filters.status === "all" || vehicle.send_status === filters.status;
    const userMatch = filters.user === "all" || vehicle.created_by === filters.user;
    return typeMatch && statusMatch && userMatch;
  });

  const loadVehicles = async () => {
    setIsLoading(true);
    try {
      const fetchedVehicles = await Vehicle.list("-capture_date");
      setVehicles(fetchedVehicles);
    } catch (error) {
      console.error("Erro ao carregar veículos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (vehicle) => {
    try {
      await Vehicle.update(vehicle.id, { ...vehicle, deleted: true });
      loadVehicles();
    } catch (error) {
      console.error("Erro ao deletar veículo:", error);
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
      // Update vehicle status and refresh local state immediately
      const updatedVehicle = { ...vehicle, send_status: "sent" };
      await Vehicle.update(vehicle.id, updatedVehicle);
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  };

  const toggleVehicleExpansion = (vehicleId) => {
    setExpandedVehicleId(prev => prev === vehicleId ? null : vehicleId);
  };

  // Helper function to format CPF/CNPJ
  const formatCpfCnpj = (value) => {
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
  };

  // Function to attempt looking up a CNPJ when a company name is clicked
  const handleCompanyClick = async (vehicle) => {
    if (!vehicle.company_name || vehicle.company_cpfCnpj) return;
    
    try {
      // Use our new CompanyInfoLookup service
      const companyInfo = await CompanyInfoLookup.lookupCompanyInfo(vehicle.company_name);
      
      if (companyInfo) {
        // Update the vehicle with found information
        await Vehicle.update(vehicle.id, {
          ...vehicle,
          company_cpfCnpj: companyInfo.company_cpfCnpj || null,
          company_phone: companyInfo.company_phone || vehicle.company_phone,
          company_address: companyInfo.company_address || null,
          company_website: companyInfo.company_website || vehicle.company_website,
          company_email: companyInfo.company_email || vehicle.company_email
        });
      } else {
        // If no info found via API, fall back to the mock approach
        const searchQuery = encodeURIComponent(`${vehicle.company_name} CNPJ`);
        window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
        
        // Create a mock CNPJ based on company name length (only for demo purposes)
        const mockCnpj = vehicle.company_name.length > 10 
          ? "12345678000199" 
          : "98765432000198";
        
        await Vehicle.update(vehicle.id, {
          ...vehicle,
          company_cpfCnpj: mockCnpj
        });
      }
      
      // Refresh the vehicle list
      loadVehicles();
    } catch (error) {
      console.error("Error looking up company info:", error);
    }
  };

  const handleEditPlate = (vehicle) => {
    setEditingVehicleId(vehicle.id);
    setEditedPlate(vehicle.plate || "");
  };

  const handleSavePlate = async (vehicle) => {
    try {
      await Vehicle.update(vehicle.id, { ...vehicle, plate: editedPlate });
      setEditingVehicleId(null);
      loadVehicles();
    } catch (error) {
      console.error("Erro ao atualizar placa:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingVehicleId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Histórico de Capturas</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectionMode(!selectionMode);
            if (selectionMode) setSelectedVehicles([]);
          }}
          className="gap-2"
        >
          {selectionMode ? (
            <>
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Cancelar</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">Selecionar</span>
            </>
          )}
        </Button>
      </div>

      {/* Restore Filter Bar */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select
            value={filters.type}
            onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de Veículo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="truck">Caminhões</SelectItem>
              <SelectItem value="car">Carros</SelectItem>
              <SelectItem value="motorcycle">Motos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="sent">Enviado</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select
            value={filters.user}
            onValueChange={(value) => setFilters(prev => ({ ...prev, user: value }))}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Usuários</SelectItem>
              {uniqueUsers.map(user => (
                <SelectItem key={user} value={user}>
                  {user.split('@')[0].toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-muted/50">
              <TableHead className="w-[50px]">
                {selectionMode && (
                  <Checkbox
                    checked={filteredVehicles.length > 0 && filteredVehicles.every(v => selectedVehicles.includes(v))}
                    onCheckedChange={(checked) => {
                      setSelectedVehicles(checked ? [...filteredVehicles] : []);
                    }}
                  />
                )}
              </TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Nenhum veículo encontrado com os filtros selecionados
                </TableCell>
              </TableRow>
            ) : (
              filteredVehicles.map((vehicle) => (
                <React.Fragment key={vehicle.id}>
                  <TableRow className="hover:bg-muted/50">
                    <TableCell>
                      {selectionMode ? (
                        <Checkbox
                          checked={selectedVehicles.includes(vehicle)}
                          onCheckedChange={(checked) => {
                            setSelectedVehicles(prev => 
                              checked 
                                ? [...prev, vehicle]
                                : prev.filter(v => v.id !== vehicle.id)
                            );
                          }}
                        />
                      ) : (
                        <div 
                          className="w-10 h-10 rounded overflow-hidden bg-muted cursor-pointer"
                          onClick={() => {
                            setSelectedImage(vehicle.image_url);
                            setImageViewerOpen(true);
                          }}
                        >
                          <img
                            src={vehicle.image_url}
                            alt="Veículo"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = "https://placehold.co/60x60/gray/white?text=N/A";
                            }}
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(vehicle.capture_date), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell 
                      className="cursor-pointer hover:text-primary"
                      onClick={() => toggleVehicleExpansion(vehicle.id)}
                    >
                      {vehicle.created_by 
                        ? vehicle.created_by.split('@')[0].toUpperCase()
                        : "-"}
                    </TableCell>
                    <TableCell 
                      className="cursor-pointer hover:text-primary"
                      onClick={() => toggleVehicleExpansion(vehicle.id)}
                    >
                      <div className="flex items-center gap-2">
                        {vehicle.type === "truck" ? (
                          <div className="flex items-center">
                            <Truck className="w-4 h-4 text-blue-500 mr-1" />
                            <span>Caminhão</span>
                          </div>
                        ) : vehicle.type === "car" ? (
                          <div className="flex items-center">
                            <Car className="w-4 h-4 text-green-500 mr-1" />
                            <span>Carro</span>
                          </div>
                        ) : vehicle.type === "motorcycle" ? (
                          <div className="flex items-center">
                            <span>🏍️</span>
                            <span className="ml-1">Moto</span>
                          </div>
                        ) : (
                          "Outro"
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingVehicleId === vehicle.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            value={editedPlate}
                            onChange={(e) => setEditedPlate(e.target.value)}
                            className="w-24"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSavePlate(vehicle)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCancelEdit}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className="cursor-pointer hover:text-primary"
                            onClick={() => toggleVehicleExpansion(vehicle.id)}
                          >
                            {vehicle.plate || "-"}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditPlate(vehicle)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-4 h-4"
                            >
                              <path d="M5.43 14.57a1 1 0 000 1.42l1.16 1.16a1 1 0 001.42 0l2.93-2.93a1 1 0 000-1.42l-1.16-1.16a1 1 0 00-1.42 0l-2.93 2.93zm4.24-4.24a1 1 0 000 1.42l1.16 1.16a1 1 0 001.42 0l2.93-2.93a1 1 0 000-1.42l-1.16-1.16a1 1 0 00-1.42 0l-2.93 2.93zM12.41 5.41a2 2 0 00-2.83 0l-7.17 7.17a2 2 0 000 2.83l7.17 7.17a2 2 0 002.83 0l7.17-7.17a2 2 0 000-2.83l-7.17-7.17z" />
                            </svg>
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {vehicle.company_name && vehicle.company_name !== "-" ? (
                        <button 
                          onClick={() => handleCompanyClick(vehicle)}
                          className="text-primary hover:underline text-left"
                        >
                          {vehicle.company_name}
                        </button>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        className={`h-8 px-3 rounded-full ${
                          vehicle.send_status === "sent" 
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                        }`}
                        onClick={() => shareVehicleViaWhatsApp(vehicle)}
                      >
                        {vehicle.send_status === "sent" ? "Enviado" : "Pendente"}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleVehicleExpansion(vehicle.id)}
                          className="hover:bg-muted"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(vehicle)}
                          className="hover:bg-muted text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {expandedVehicleId === vehicle.id && (
                    <TableRow>
                      <TableCell colSpan={8} className="p-0">
                        <div className="p-6 bg-muted/30">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1">
                              <div className="flex flex-col gap-4">
                                {/* This is the image container we need to fix for mobile */}
                                <div 
                                  className="aspect-video rounded-lg overflow-hidden bg-muted relative cursor-pointer max-h-[200px] md:max-h-none"
                                  onClick={() => {
                                    setSelectedImage(vehicle.image_url);
                                    setImageViewerOpen(true);
                                  }}
                                >
                                  <img
                                    src={vehicle.image_url || "https://placehold.co/400x300/gray"}
                                    alt="Veículo"
                                    className="w-full h-full object-contain"
                                  />
                                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                    Clique para ampliar
                                  </div>
                                </div>
                                
                                <div className="flex justify-between">
                                  <div className="flex justify-center">
                                    <BrazilianLicensePlate 
                                      plate={vehicle.plate || "Não detectada"} 
                                      size="medium" 
                                      isMotorcycle={vehicle.type === "motorcycle"}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="md:col-span-2">
                              <h3 className="text-lg font-semibold mb-4">Detalhes do Veículo</h3>
                              <div className="space-y-2">
                                <div>
                                  <strong>Data da Captura:</strong> {format(new Date(vehicle.capture_date), "dd/MM/yyyy HH:mm")}
                                </div>
                                <div>
                                  <strong>Usuário:</strong> {vehicle.created_by ? vehicle.created_by.split('@')[0].toUpperCase() : "-"}
                                </div>
                                <div>
                                  <strong>Tipo:</strong> {
                                    vehicle.type === "truck" ? "Caminhão" :
                                    vehicle.type === "car" ? "Carro" :
                                    vehicle.type === "motorcycle" ? "Moto" : "Outro"
                                  }
                                </div>
                                <div>
                                  <strong>Placa:</strong> {vehicle.plate || "-"}
                                </div>
                                <div>
                                  <strong>Empresa:</strong> {vehicle.company_name || "-"}
                                </div>
                                {vehicle.company_cpfCnpj && (
                                  <div>
                                    <strong>CPF/CNPJ:</strong> {formatCpfCnpj(vehicle.company_cpfCnpj)}
                                  </div>
                                )}
                                {vehicle.company_phone && (
                                  <div>
                                    <strong>Telefone da Empresa:</strong> {vehicle.company_phone}
                                  </div>
                                )}
                                {vehicle.company_website && (
                                  <div>
                                    <strong>Website da Empresa:</strong> {vehicle.company_website}
                                  </div>
                                )}
                                {vehicle.company_email && (
                                  <div>
                                    <strong>Email da Empresa:</strong> {vehicle.company_email}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ImageViewer
        imageUrl={selectedImage}
        isOpen={imageViewerOpen}
        onClose={(action) => {
          if (action === 'delete') {
            const vehicleToDelete = filteredVehicles.find(v => v.image_url === selectedImage);
            if (vehicleToDelete) {
              handleDelete(vehicleToDelete);
            }
          }
          setImageViewerOpen(false);
        }}
      />

      {selectedVehicles.length > 0 && selectionMode && (
        <div className="fixed bottom-4 right-4 z-10">
          <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4 flex items-center gap-4">
            <div>
              <span className="font-medium">{selectedVehicles.length}</span> veículos selecionados
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                const ids = selectedVehicles.map(v => v.id).join(',');
                window.open(createPageUrl(`ReportPreview?ids=${ids}`), '_blank');
              }}
            >
              Gerar Relatório
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
