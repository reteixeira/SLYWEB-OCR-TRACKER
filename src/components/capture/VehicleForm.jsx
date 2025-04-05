
import React from "react";
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
import { Car, Truck, Phone, Globe, Mail } from "lucide-react";
import { BrazilianLicensePlate } from "../vehicles/BrazilianLicensePlate";

export default function VehicleForm({ vehicle, onChange, disabled }) {
  const handleChange = (field, value) => {
    onChange({
      ...vehicle,
      [field]: value,
    });
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="aspect-video rounded-lg overflow-hidden bg-muted/50">
            <img
              src={vehicle.image_url || "https://placehold.co/800x600/gray/white?text=Imagem+não+disponível"}
              alt="Veículo"
              className="w-full h-full object-contain"
            />
          </div>
          
          {vehicle.plate && (
            <div className="flex justify-center py-2">
              <BrazilianLicensePlate 
                plate={vehicle.plate} 
                size="medium" 
                isMotorcycle={vehicle.type === "motorcycle"}
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Veículo</Label>
            <Select
              value={vehicle.type || "car"}
              onValueChange={(value) => handleChange("type", value)}
              disabled={disabled}
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
                <SelectItem value="motorcycle">
                  <div className="flex items-center gap-2">
                    🏍️ Moto
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Placa</Label>
            <Input
              value={vehicle.plate || ""}
              onChange={(e) => handleChange("plate", e.target.value.toUpperCase())}
              placeholder="ABC1234 ou ABC1D23"
              disabled={disabled}
              className="font-mono"
            />
          </div>

          {vehicle.type === "truck" && (
            <>
              <div className="border-t my-4"></div>
              <div className="space-y-2">
                <Label>Nome da Empresa</Label>
                <Input
                  value={vehicle.company_name || ""}
                  onChange={(e) => handleChange("company_name", e.target.value)}
                  placeholder="Nome da empresa"
                  disabled={disabled}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      value={formatPhoneNumber(vehicle.company_phone)}
                      onChange={(e) =>
                        handleChange("company_phone", e.target.value)
                      }
                      placeholder="(00) 00000-0000"
                      className="pl-10"
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      value={formatWebsite(vehicle.company_website)}
                      onChange={(e) =>
                        handleChange("company_website", e.target.value)
                      }
                      placeholder="www.empresa.com.br"
                      className="pl-10"
                      disabled={disabled}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    value={vehicle.company_email || ""}
                    onChange={(e) =>
                      handleChange("company_email", e.target.value)
                    }
                    placeholder="contato@empresa.com.br"
                    className="pl-10"
                    disabled={disabled}
                    type="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Slogan</Label>
                <Input
                  value={vehicle.company_slogan || ""}
                  onChange={(e) =>
                    handleChange("company_slogan", e.target.value)
                  }
                  placeholder="Slogan da empresa"
                  disabled={disabled}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
