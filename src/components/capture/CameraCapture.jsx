import React from 'react';
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

export default function CameraCapture({ onCapture }) {
  const [isCapturing, setIsCapturing] = React.useState(false);
  const videoRef = React.useRef(null);
  const streamRef = React.useRef(null);

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Erro ao iniciar câmera:", error);
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCapturing(false);
  };

  const captureImage = () => {
    if (!videoRef.current) return;
    
    // Criar canvas do mesmo tamanho do vídeo
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    // Desenhar frame atual no canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    // Converter para blob
    canvas.toBlob((blob) => {
      if (blob) {
        // Criar arquivo a partir do blob
        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
        onCapture(file);
      }
      
      // Parar câmera após captura
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  // Limpar referências ao desmontar
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (!isCapturing) {
    return (
      <Button onClick={startCamera} variant="default" className="w-full">
        <Camera className="w-4 h-4 mr-2" />
        Ativar Câmera
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg overflow-hidden bg-black relative aspect-video">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={stopCamera} 
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button 
          onClick={captureImage} 
          className="flex-1 gap-2"
        >
          <Camera className="w-4 h-4" />
          Capturar
        </Button>
      </div>
    </div>
  );
}