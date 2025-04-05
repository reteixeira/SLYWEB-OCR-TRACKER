
import React, { useState, useEffect } from "react";
import { Vehicle } from "@/api/entities";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Printer, Car, Truck } from "lucide-react";
import BrazilianLicensePlate from "../components/vehicles/BrazilianLicensePlate";

export default function ReportPreview() {
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSelectedVehicles();
  }, []);

  const loadSelectedVehicles = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const ids = urlParams.get('ids')?.split(',') || [];
      
      if (ids.length === 0) {
        setVehicles([]);
        setIsLoading(false);
        return;
      }

      const allVehicles = await Vehicle.list();
      const selectedVehicles = allVehicles.filter(v => ids.includes(v.id));
      setVehicles(selectedVehicles);
    } catch (error) {
      console.error("Error loading vehicles:", error);
    } finally {
      setIsLoading(false);
    }
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

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (vehicles.length === 0) {
    return <div className="p-8 text-center">Nenhum veículo selecionado para o relatório.</div>;
  }

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Relatório de Veículos</h1>
        <p className="text-gray-600 mb-6">Total: {vehicles.length} veículos</p>
        <Button 
          onClick={() => window.print()}
          className="print:hidden gap-2"
        >
          <Printer className="w-4 h-4" />
          Imprimir Relatório
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="bg-white rounded-lg border p-4 print:break-inside-avoid">
            <div className="space-y-4">
              <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={vehicle.image_url || "https://placehold.co/400x300/gray/white?text=Sem+imagem"}
                  alt="Veículo"
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-center">
                  <BrazilianLicensePlate 
                    plate={vehicle.plate || "Placa Não Detectada"}
                    size="small"
                    isMotorcycle={vehicle.type === "motorcycle"}
                  />
                </div>

                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-gray-600">Data da Captura</span>
                    <span className="font-medium">
                      {format(new Date(vehicle.capture_date), "dd/MM/yyyy HH:mm")}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-gray-600">Usuário</span>
                    <span className="font-medium">
                      {vehicle.created_by?.split('@')[0].toUpperCase()}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-gray-600">Tipo</span>
                    <span className="font-medium flex items-center gap-2">
                      {vehicle.type === "truck" && <Truck className="w-4 h-4 text-blue-500" />}
                      {vehicle.type === "car" && <Car className="w-4 h-4 text-green-500" />}
                      {vehicle.type === "motorcycle" && <span>🏍️</span>}
                      {vehicle.type === "truck" ? "Caminhão" : 
                       vehicle.type === "car" ? "Carro" : 
                       vehicle.type === "motorcycle" ? "Moto" : "Outro"}
                    </span>
                  </div>

                  {vehicle.company_name && vehicle.company_name !== "-" && (
                    <div className="flex justify-between py-1.5 border-b">
                      <span className="text-gray-600">Empresa</span>
                      <span className="font-medium">{vehicle.company_name}</span>
                    </div>
                  )}

                  {vehicle.company_cpfCnpj && (
                    <div className="flex justify-between py-1.5 border-b">
                      <span className="text-gray-600">CPF/CNPJ</span>
                      <span className="font-medium font-mono">{formatCpfCnpj(vehicle.company_cpfCnpj)}</span>
                    </div>
                  )}

                  {vehicle.company_address && (
                    <div className="flex justify-between py-1.5 border-b">
                      <span className="text-gray-600">Endereço</span>
                      <span className="font-medium">{vehicle.company_address}</span>
                    </div>
                  )}

                  {vehicle.company_phone && vehicle.company_phone !== "-" && (
                    <div className="flex justify-between py-1.5 border-b">
                      <span className="text-gray-600">Telefone</span>
                      <span className="font-medium">{vehicle.company_phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          body { 
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
          @page {
            size: A4;
            margin: 2cm;
          }
        }
      `}</style>
    </div>
  );
}
