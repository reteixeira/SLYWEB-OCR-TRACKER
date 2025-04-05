
import React, { useState, useRef, useEffect } from "react";
import { Vehicle } from "@/api/entities";
import { UploadFile, InvokeLLM } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Camera, Upload, Loader2, AlertCircle, Trash2 } from "lucide-react";
import CameraCapture from "../components/capture/CameraCapture";
import MultiVehiclePreview from "../components/capture/MultiVehiclePreview";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

export default function Capture() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedVehicles, setDetectedVehicles] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [processingStep, setProcessingStep] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const fileInputRef = useRef(null);

  const [detailedVehicle, setDetailedVehicle] = useState(null);
  const [isDetailedView, setIsDetailedView] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showFileList, setShowFileList] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const openCamera = urlParams.get("openCamera");
    
    if (openCamera === "true" && fileInputRef.current) {
      if (/Mobi|Android/i.test(navigator.userAgent)) {
        try {
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
              stream.getTracks().forEach(track => track.stop());
              const cameraButtons = document.querySelectorAll('button');
              const cameraButton = Array.from(cameraButtons).find(button => 
                button.textContent.includes('Câmera') || 
                button.textContent.includes('Camera') || 
                button.innerHTML.includes('camera')
              );
              
              if (cameraButton) {
                cameraButton.click();
              }
            })
            .catch(err => {
              console.error("Erro ao acessar câmera:", err);
            });
        } catch (error) {
          console.error("Erro ao tentar acessar a câmera:", error);
        }
      }
    }
  }, []);

  const processImage = async (file) => {
    try {
      setProcessingStep(`Fazendo upload da imagem ${file.name}...`);
      const { file_url } = await UploadFile({ file });
      
      setProcessingStep(`Analisando imagem e detectando veículos em ${file.name}...`);
      const detectionResponse = await InvokeLLM({
        prompt: `Você é um especialista em reconhecimento óptico de caracteres (OCR) para veículos.
      
      Analise cuidadosamente esta imagem e identifique TODOS os veículos distintos presentes nela.
      
      Para cada veículo detectado:
      1. Identifique o tipo do veículo:
         - 'car' (carro de passeio)
         - 'truck' (caminhão/veículo comercial)
         - 'motorcycle' (motocicleta)
      
      2. Se for possível, extraia a placa no formato brasileiro.
         - Para motos, preste atenção ao formato da placa Mercosul que possui 3 letras na parte superior e 4 caracteres na parte inferior (ex: FBK7D55)
           Ou no formato antigo com 3 letras e 4 números (ex: ABC1234)
      
      3. Se for um caminhão, extraia o nome da empresa do contêiner ou cabine.
      
      4. Para placas de formato Mercosul, identifique o tipo como "mercosul", caso contrário, use "standard"
      
      IMPORTANTE: Você deve retornar um ARRAY de objetos, onde cada objeto representa um veículo distinto. 
      Se houver contêineres de empresas diferentes na imagem, cada um deve ser tratado como um caminhão separado.
      
      Retorne o array mesmo que encontre apenas um veículo.
      
      IMPORTANTE: Para motos, preste atenção redobrada e identifique com precisão.`,
        response_json_schema: {
          type: "object",
          properties: {
            vehicles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { 
                    type: "string", 
                    enum: ["car", "truck", "motorcycle"],
                    description: "Tipo do veículo (carro, caminhão ou motocicleta)"
                  },
                  plate: { 
                    type: ["string", "null"],
                    description: "Placa do veículo no formato brasileiro"
                  },
                  plate_type: {
                    type: ["string", "null"],
                    enum: ["standard", "mercosul"],
                    description: "Tipo de placa (padrão ou Mercosul)"
                  },
                  company_name: { 
                    type: ["string", "null"],
                    description: "Nome da empresa (para caminhões)"
                  }
                },
                required: ["type"]
              }
            }
          },
          required: ["vehicles"]
        },
        file_urls: file_url
      });

      const filteredVehicles = detectionResponse.vehicles.filter(vehicle => {
        if (vehicle.type === "truck") return true; 
        if (vehicle.type === "car" && vehicle.plate) return true;
        if (vehicle.type === "motorcycle" && vehicle.plate) return true;
        return false; 
      });

      const enhancedVehicles = [];
      
      for (const vehicle of filteredVehicles) {
        let enhancedVehicle = {
          ...vehicle,
          image_url: file_url,
          capture_date: new Date().toISOString(),
          send_status: "pending",
          company_phone: null,
          company_website: null,
          company_email: null,
          company_slogan: null
        };

        if (vehicle.type === "truck" && vehicle.company_name) {
          setProcessingStep(`Buscando informações sobre a empresa: ${vehicle.company_name}...`);
          
          try {
            const companyInfo = await InvokeLLM({
              prompt: `Busque informações sobre a empresa "${vehicle.company_name}".
              
              Forneça as seguintes informações:
              1. Website oficial da empresa
              2. Telefone de contato principal (formato internacional)
              3. Email de contato principal
              4. Slogan ou lema da empresa
              5. Uma breve descrição (2-3 frases) sobre a empresa
              
              Se alguma informação não estiver disponível, retorne null para aquele campo.`,
              response_json_schema: {
                type: "object",
                properties: {
                  company_phone: { type: ["string", "null"] },
                  company_website: { type: ["string", "null"] },
                  company_email: { type: ["string", "null"] },
                  company_slogan: { type: ["string", "null"] },
                  company_description: { type: ["string", "null"] }
                }
              },
              add_context_from_internet: true
            });
            
            enhancedVehicle = {
              ...enhancedVehicle,
              ...companyInfo,
              company_info_source: "web"
            };
          } catch (error) {
            console.error(`Erro ao buscar informações da empresa ${vehicle.company_name}:`, error);
          }
        }
        
        enhancedVehicles.push(enhancedVehicle);
      }

      return enhancedVehicles;
    } catch (error) {
      console.error("Erro ao processar imagem:", error);
      throw error;
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []).filter(file => file.type.startsWith('image/'));
    
    if (files.length === 0) {
      setErrorMessage("Por favor, selecione arquivos de imagem válidos.");
      return;
    }

    // Processar imagens diretamente ao invés de mostrar lista
    processMultipleImages(files);
    
    // Limpar input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processMultipleImages = async (files) => {
    setIsProcessing(true);
    setErrorMessage("");
    setTotalFiles(files.length);
    setCurrentFileIndex(0);
    setProcessingProgress(0);
    setDetectedVehicles([]);
    
    try {
      let allVehicles = [];
      
      for (let i = 0; i < files.length; i++) {
        setCurrentFileIndex(i + 1);
        setProcessingProgress(Math.floor((i / files.length) * 100));
        
        try {
          const vehiclesFromFile = await processImage(files[i]);
          allVehicles = [...allVehicles, ...vehiclesFromFile];
        } catch (error) {
          console.error(`Erro ao processar arquivo ${files[i].name}:`, error);
        }
      }
      
      setProcessingProgress(100);
      
      if (allVehicles.length === 0) {
        setErrorMessage("Nenhum veículo válido detectado nas imagens. Apenas caminhões sem placa ou carros com placa são processados.");
      } else {
        setDetectedVehicles(allVehicles);
      }
    } catch (error) {
      console.error("Erro ao processar imagens:", error);
      setErrorMessage("Não foi possível processar uma ou mais imagens. Tente novamente.");
    } finally {
      setProcessingStep("");
      setIsProcessing(false);
      setSelectedFiles([]);
      setShowFileList(false);
    }
  };

  const handleSaveVehicles = async (selectedVehicles) => {
    setIsProcessing(true);
    try {
      for (const vehicle of selectedVehicles) {
        await Vehicle.create(vehicle);
      }
      navigate(createPageUrl("History"));
    } catch (error) {
      console.error("Erro ao salvar veículos:", error);
      setErrorMessage("Erro ao salvar os dados. Tente novamente.");
    }
    setIsProcessing(false);
  };

  const handleVehicleAction = (action, vehicle) => {
    if (action === 'delete') {
      setVehicleToDelete(vehicle);
      setDeleteDialogOpen(true);
    }
    setIsDetailedView(false);
  };

  const deleteVehicle = async () => {
    if (!vehicleToDelete) return;
    
    setIsDeleting(true);
    try {
      // Remove it from the local state
      setDetectedVehicles(prev => prev.filter(v => v !== vehicleToDelete));
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Erro ao excluir veículo:", error);
      setErrorMessage("Erro ao excluir veículo. Tente novamente.");
    } finally {
      setIsDeleting(false);
      setVehicleToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Nova Captura</h1>

      {errorMessage && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <p>{errorMessage}</p>
        </div>
      )}

      {detectedVehicles.length === 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="text-center">
              <Camera className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold mb-4">Usar Câmera</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Capture imagens de veículos diretamente com a câmera do dispositivo
              </p>
              <CameraCapture onCapture={(file) => processMultipleImages([file])} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold mb-4">Upload de Imagens</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Faça upload de uma ou mais imagens de veículos do seu dispositivo
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                multiple
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                disabled={isProcessing}
              >
                Selecionar Arquivos
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <MultiVehiclePreview
          vehicles={detectedVehicles}
          onSave={handleSaveVehicles}
          onCancel={() => setDetectedVehicles([])}
          isProcessing={isProcessing}
          onDelete={handleVehicleAction}
        />
      )}

      {/* Modal de processamento */}
      {isProcessing && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="text-center bg-card p-6 rounded-lg shadow-lg max-w-md w-full">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium">Processando...</p>
            {totalFiles > 1 && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Arquivo {currentFileIndex} de {totalFiles}</span>
                  <span>{processingProgress}%</span>
                </div>
                <Progress value={processingProgress} className="h-2" />
              </div>
            )}
            {processingStep && (
              <p className="text-sm text-muted-foreground mt-2">
                {processingStep}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apagar item</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja apagar este item?
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
              onClick={deleteVehicle}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {isDeleting ? "Apagando..." : "Apagar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
