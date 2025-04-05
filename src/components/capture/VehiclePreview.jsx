
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Send, X, Car, Truck, Phone, Globe, Mail, Share2, AlertCircle, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import BrazilianLicensePlate from "../vehicles/BrazilianLicensePlate";
import CompanyInfoLookup from "./CompanyInfoLookup";

export default function VehiclePreview({ data, onSave, onCancel, onClose, isProcessing, viewOnly, inlineView, onImageClick }) {
  const safeData = data || {
    image_url: "",
    plate: "",
    type: "car",
    capture_date: new Date().toISOString()
  };
  
  const [editedData, setEditedData] = useState(safeData);
  const [imageError, setImageError] = useState(false);
  const [isFetchingCompanyInfo, setIsFetchingCompanyInfo] = useState(false);
  const [companyInfoLookupMessage, setCompanyInfoLookupMessage] = useState("");

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    const numbers = (phone || "").replace(/\D/g, '');
    if (numbers.length === 11) {
      return `(${numbers.slice(0,2)}) ${numbers.slice(2,7)}-${numbers.slice(7)}`;
    }
    if (numbers.length === 10) {
      return `(${numbers.slice(0,2)}) ${numbers.slice(2,6)}-${numbers.slice(6)}`;
    }
    return phone;
  };

  const formatWebsite = (website) => {
    if (!website) return "";
    if (!website.startsWith('http://') && !website.startsWith('https://')) {
      return `https://${website}`;
    }
    return website;
  };

  const shareViaWhatsApp = () => {
    const phone = "5511998899933"; // Número atualizado
    
    let message = `*Veículo Capturado*\n`;
    message += `Placa: ${editedData.plate || "N/A"}\n`;
    message += `Tipo: ${editedData.type === "truck" ? "Caminhão" : "Carro"}\n`;
    
    if (editedData.type === "truck" && editedData.company_name) {
      message += `\n*Informações da Empresa*\n`;
      message += `Nome: ${editedData.company_name || "N/A"}\n`;
      
      if (editedData.company_phone) 
        message += `Telefone: ${editedData.company_phone}\n`;
        
      if (editedData.company_website)
        message += `Website: ${editedData.company_website}\n`;
        
      if (editedData.company_email)
        message += `Email: ${editedData.company_email}\n`;
    }
    
    message += `\nData da Captura: ${format(new Date(editedData.capture_date), "dd/MM/yyyy 'às' HH:mm")}\n`;
    message += `\nImagem: ${editedData.image_url}\n`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleDelete = () => {
    if (onClose) {
      onClose('delete');
    }
  };

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

  const lookupCompanyInfo = async (companyName) => {
    if (!companyName || companyName === "-") return;
    
    setIsFetchingCompanyInfo(true);
    setCompanyInfoLookupMessage("Buscando informações da empresa...");
    
    try {
      const companyInfo = await CompanyInfoLookup.lookupCompanyInfo(companyName);
      
      if (companyInfo) {
        setEditedData(prev => ({
          ...prev,
          company_cpfCnpj: companyInfo.company_cpfCnpj || prev.company_cpfCnpj,
          company_phone: companyInfo.company_phone || prev.company_phone,
          company_address: companyInfo.company_address || prev.company_address,
          company_website: companyInfo.company_website || prev.company_website,
          company_email: companyInfo.company_email || prev.company_email
        }));
        setCompanyInfoLookupMessage("Informações da empresa encontradas!");
      } else {
        setCompanyInfoLookupMessage("Nenhuma informação adicional encontrada.");
      }
    } catch (error) {
      console.error("Error looking up company info:", error);
      setCompanyInfoLookupMessage("Erro ao buscar informações.");
    } finally {
      // Clear the message after a delay
      setTimeout(() => {
        setCompanyInfoLookupMessage("");
        setIsFetchingCompanyInfo(false);
      }, 3000);
    }
  };

  // Attempt to look up company info when company name changes and we don't have a CNPJ yet
  useEffect(() => {
    if (
      editedData.company_name && 
      editedData.type === "truck" && 
      !editedData.company_cpfCnpj && 
      !viewOnly && 
      !isFetchingCompanyInfo
    ) {
      lookupCompanyInfo(editedData.company_name);
    }
  }, [editedData.company_name, editedData.type]);

  return (
    <Card className={inlineView ? "border-0 shadow-none" : "mt-6"}>
      {!inlineView && (
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {viewOnly ? "Detalhes do Veículo" : "Confirmar Dados do Veículo"}
            </span>
            {viewOnly && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="aspect-video rounded-lg overflow-hidden bg-muted relative max-h-[200px] md:max-h-none">
              <img
                src={editedData.image_url || "https://placehold.co/800x600/gray/white?text=Imagem+não+disponível"}
                alt="Veículo"
                onClick={() => viewOnly && onImageClick && onImageClick(editedData.image_url)}
                style={viewOnly ? {cursor: 'zoom-in'} : {}}
                onError={handleImageError}
                className="w-full h-full object-contain"
              />
              {viewOnly && !imageError && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  Clique para ampliar
                </div>
              )}
              {imageError && (
                <div className="absolute inset-0 flex items-center justify-center flex-col bg-muted/50">
                  <AlertCircle className="w-10 h-10 text-yellow-500 mb-2" />
                  <p className="text-sm text-center px-2">Imagem indisponível</p>
                </div>
              )}
            </div>
            
            {editedData.plate && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                <p className="text-sm font-medium text-muted-foreground">Placa Detectada</p>
                <div className="flex justify-center py-2">
                  <BrazilianLicensePlate plate={editedData.plate} size="medium" />
                </div>
              </div>
            )}
            
            {viewOnly && (
              <Button 
                onClick={shareViaWhatsApp} 
                className="w-full mt-4 gap-2"
                variant="outline"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar via WhatsApp
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Veículo</Label>
              <Select
                value={editedData.type || "car"}
                onValueChange={(value) => handleInputChange("type", value)}
                disabled={viewOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      Carro
                    </div>
                  </SelectItem>
                  <SelectItem value="truck">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Caminhão
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Placa</Label>
              <Input
                value={editedData.plate || ""}
                onChange={(e) => handleInputChange("plate", e.target.value.toUpperCase())}
                placeholder="ABC-1234"
                disabled={viewOnly}
                className="font-mono"
              />
            </div>

            {editedData.type === "truck" && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome da Empresa</Label>
                    <div className="relative">
                      <Input
                        value={editedData.company_name || ""}
                        onChange={(e) => {
                          handleInputChange("company_name", e.target.value);
                        }}
                        placeholder="Nome da empresa"
                        disabled={viewOnly || isFetchingCompanyInfo}
                      />
                      {isFetchingCompanyInfo && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {companyInfoLookupMessage && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {companyInfoLookupMessage}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>CPF/CNPJ</Label>
                    <div className="relative">
                      <Input
                        value={formatCpfCnpj(editedData.company_cpfCnpj || "")}
                        onChange={(e) =>
                          handleInputChange("company_cpfCnpj", e.target.value.replace(/\D/g, ''))
                        }
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        disabled={viewOnly || isFetchingCompanyInfo}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Endereço</Label>
                    <Input
                      value={editedData.company_address || ""}
                      onChange={(e) =>
                        handleInputChange("company_address", e.target.value)
                      }
                      placeholder="Endereço da empresa"
                      disabled={viewOnly || isFetchingCompanyInfo}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          value={formatPhoneNumber(editedData.company_phone)}
                          onChange={(e) =>
                            handleInputChange("company_phone", e.target.value)
                          }
                          placeholder="(00) 00000-0000"
                          className="pl-10"
                          disabled={viewOnly || isFetchingCompanyInfo}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          value={formatWebsite(editedData.company_website)}
                          onChange={(e) =>
                            handleInputChange("company_website", e.target.value)
                          }
                          placeholder="www.empresa.com.br"
                          className="pl-10"
                          disabled={viewOnly || isFetchingCompanyInfo}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        value={editedData.company_email || ""}
                        onChange={(e) =>
                          handleInputChange("company_email", e.target.value)
                        }
                        placeholder="contato@empresa.com.br"
                        className="pl-10"
                        disabled={viewOnly || isFetchingCompanyInfo}
                        type="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Slogan</Label>
                    <Input
                      value={editedData.company_slogan || ""}
                      onChange={(e) =>
                        handleInputChange("company_slogan", e.target.value)
                      }
                      placeholder="Slogan da empresa"
                      disabled={viewOnly || isFetchingCompanyInfo}
                    />
                  </div>
                </div>
              </>
            )}
            
            {viewOnly && editedData.capture_date && (
              <div className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Data de captura: {format(new Date(editedData.capture_date), "dd/MM/yyyy 'às' HH:mm")}
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: <span className={`font-medium ${editedData.send_status === "sent" ? "text-green-600" : "text-amber-600"}`}>
                    {editedData.send_status === "sent" ? "Enviado" : "Pendente"}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      {viewOnly ? (
        <CardFooter className="flex gap-2">
          <Button 
            onClick={shareViaWhatsApp} 
            className="gap-2 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar
          </Button>
          
          <Button
            variant="outline"
            onClick={() => onClose()}
          >
            Fechar Detalhes
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="gap-1 ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            Apagar
          </Button>
        </CardFooter>
      ) : (
        <CardFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => onSave(editedData)}
            disabled={isProcessing}
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            Salvar
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
