import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ZoomIn, ZoomOut, Repeat, X, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function ImageViewer({ imageUrl, isOpen, onClose }) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [imageError, setImageError] = useState(false);
  
  const imageRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setImageError(false);
    }
  }, [isOpen]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setStartPosition({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - startPosition.x,
        y: e.clientY - startPosition.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (scale > 1 && e.touches.length === 1) {
      setIsDragging(true);
      setStartPosition({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && scale > 1 && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - startPosition.x,
        y: e.touches[0].clientY - startPosition.y
      });
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    if (scale === 1) {
      setScale(2);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-[90vw] w-full max-h-[90vh] h-full p-0 overflow-hidden">
        <div className="relative w-full h-full bg-black/90 flex flex-col">
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={handleZoomIn}
              className="bg-black/50 text-white hover:bg-black/70"
              disabled={imageError}
            >
              <ZoomIn size={20} />
            </Button>
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={handleZoomOut}
              className="bg-black/50 text-white hover:bg-black/70"
              disabled={imageError}
            >
              <ZoomOut size={20} />
            </Button>
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={handleRotate}
              className="bg-black/50 text-white hover:bg-black/70"
              disabled={imageError}
            >
              <Repeat size={20} />
            </Button>
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={() => onClose()}
              className="bg-black/50 text-white hover:bg-black/70"
            >
              <X size={20} />
            </Button>
          </div>

          <div className="absolute top-4 left-4 z-10">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => onClose('delete')}
              className="bg-red-500 hover:bg-red-600 gap-1"
            >
              <Trash2 size={16} />
              Apagar
            </Button>
          </div>

          <div 
            className="flex-1 flex items-center justify-center overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'default' }}
          >
            {imageError ? (
              <div className="text-center p-6 bg-muted/20 rounded-lg">
                <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Imagem indisponível</h3>
                <p className="text-muted-foreground">
                  Não foi possível carregar a imagem solicitada.
                </p>
              </div>
            ) : (
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Imagem ampliada"
                className="max-w-full max-h-full object-contain select-none"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                }}
                onDoubleClick={handleDoubleClick}
                onError={handleImageError}
                draggable="false"
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}