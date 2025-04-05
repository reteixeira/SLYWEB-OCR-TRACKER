import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Image as ImageIcon, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { captureImage, processImage } from '@/components/capture/ImageProcessor';

/**
 * Componente para fazer uma captura de teste de uma câmera específica
 */
export default function ImageCaptureProcess({ camera, onSuccess }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState("idle"); // idle, capturing, success, error

  const handleCapture = async () => {
    setIsCapturing(true);
    setError(null);
    setStep("capturing");
    
    try {
      console.log("Iniciando captura de teste para câmera:", camera.name);
      
      // Tenta capturar imagem da câmera
      const imageData = await captureImage(camera);
      console.log("Captura bem sucedida:", imageData);
      
      setCapturedImage(imageData);
      setStep("success");
      
      if (onSuccess) {
        onSuccess(imageData);
      }
    } catch (err) {
      console.error("Erro na captura:", err);
      setError(err.message || "Falha ao capturar imagem");
      setStep("error");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="space-y-4">
      {step === "idle" && (
        <Button 
          onClick={handleCapture} 
          disabled={isCapturing}
          className="w-full"
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          Testar Captura
        </Button>
      )}
      
      {step === "capturing" && (
        <div className="flex flex-col items-center justify-center py-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Capturando imagem...</p>
        </div>
      )}
      
      {step === "success" && capturedImage && (
        <div className="space-y-4">
          <div className="p-2 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span>Captura realizada com sucesso</span>
          </div>
          
          <div className="aspect-video rounded-lg overflow-hidden bg-black relative">
            <img 
              src={capturedImage.image_url} 
              alt="Imagem capturada" 
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setCapturedImage(null);
                setStep("idle");
              }}
              className="flex-1"
            >
              Capturar Novamente
            </Button>
            {onSuccess && (
              <Button className="flex-1">
                Continuar
              </Button>
            )}
          </div>
        </div>
      )}
      
      {step === "error" && (
        <div className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error || "Ocorreu um erro na captura"}</span>
          </div>
          
          <Button 
            onClick={() => {
              setError(null);
              setStep("idle");
            }}
            variant="outline"
          >
            Tentar Novamente
          </Button>
        </div>
      )}
    </div>
  );
}