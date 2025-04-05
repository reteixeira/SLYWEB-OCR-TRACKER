
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, X, Car, Truck } from "lucide-react";
import VehicleForm from "./VehicleForm";

export default function MultiVehiclePreview({ vehicles, onSave, onCancel, isProcessing }) {
  // Garantir que vehicles seja sempre um array válido com valores padrão
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  
  const [selectedVehicles, setSelectedVehicles] = useState(
    safeVehicles.map(() => true)
  );
  const [activeTab, setActiveTab] = useState("0");
  
  // Array para armazenar os veículos atualizados
  const [updatedVehicles, setUpdatedVehicles] = useState([...safeVehicles]);

  const toggleVehicleSelection = (index) => {
    setSelectedVehicles(prev => {
      const newSelected = [...prev];
      newSelected[index] = !newSelected[index];
      return newSelected;
    });
  };

  const handleVehicleChange = (index, updatedVehicle) => {
    setUpdatedVehicles(prev => {
      const newVehicles = [...prev];
      newVehicles[index] = updatedVehicle;
      return newVehicles;
    });
  };

  const handleSave = () => {
    const vehiclesToSave = updatedVehicles.filter((_, index) => selectedVehicles[index]);
    onSave(vehiclesToSave);
  };

  // Se não houver veículos, mostrar mensagem
  if (safeVehicles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nenhum veículo detectado</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Não foi possível detectar veículos na imagem.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={onCancel}>Voltar</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {safeVehicles.length > 1 
                ? `${safeVehicles.length} veículos detectados` 
                : "1 veículo detectado"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between px-4 py-2 bg-muted rounded-lg">
              <p className="text-sm font-medium">Selecione os veículos que deseja salvar</p>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                    <Car className="w-3 h-3 mr-1" /> Carros: {safeVehicles.filter(v => v.type === "car").length}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                    <Truck className="w-3 h-3 mr-1" /> Caminhões: {safeVehicles.filter(v => v.type === "truck").length}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                    Moto: {safeVehicles.filter(v => v.type === "motorcycle").length}
                  </Badge>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full flex">
                {safeVehicles.map((vehicle, index) => (
                  <TabsTrigger key={index} value={index.toString()} className="flex-1">
                    <div className="flex items-center gap-2">
                      {selectedVehicles[index] ? (
                        <Checkbox checked={true} className="mr-1" />
                      ) : (
                        <span className="w-4 h-4 rounded-sm border mr-1 flex-shrink-0" />
                      )}
                      {vehicle.type === "motorcycle" ? (
                        <span>🏍️</span>
                      ) : vehicle.type === "truck" ? (
                        <Truck className="w-4 h-4" />
                      ) : (
                        <Car className="w-4 h-4" />
                      )}
                      <span>
                        {vehicle.company_name || vehicle.plate || `Veículo ${index + 1}`}
                      </span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>

              {safeVehicles.map((vehicle, index) => (
                <TabsContent key={index} value={index.toString()} className="mt-4">
                  <div className="flex items-center justify-between mb-4 p-2 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={selectedVehicles[index]} 
                        onCheckedChange={() => toggleVehicleSelection(index)}
                        id={`select-vehicle-${index}`}
                      />
                      <label 
                        htmlFor={`select-vehicle-${index}`}
                        className="text-sm font-medium cursor-pointer flex items-center gap-1"
                      >
                        {selectedVehicles[index] 
                          ? "Selecionado para salvar" 
                          : "Clique para selecionar"}
                      </label>
                    </div>
                  </div>
                  
                  <VehicleForm 
                    vehicle={updatedVehicles[index]} 
                    onChange={(updatedVehicle) => handleVehicleChange(index, updatedVehicle)}
                    disabled={!selectedVehicles[index]} 
                  />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isProcessing || !selectedVehicles.some(selected => selected)}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              Salvar {selectedVehicles.filter(Boolean).length} veículo(s)
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
