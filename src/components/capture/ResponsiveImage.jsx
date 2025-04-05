import React, { useState } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

export default function ResponsiveImage({ 
  src, 
  alt = "Imagem", 
  className = "", 
  onClick = null,
  maxHeight = "300px",
  containerClassName = ""
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageClick = (e) => {
    if (onClick) {
      onClick(e);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div 
      className={`relative overflow-hidden rounded-lg bg-muted ${containerClassName}`}
      style={{
        maxHeight: isExpanded ? 'none' : maxHeight,
        transition: 'max-height 0.3s ease-in-out'
      }}
    >
      {!imageError ? (
        <>
          <img
            src={src}
            alt={alt}
            className={`w-full h-auto object-contain ${className} ${isExpanded ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
            onClick={handleImageClick}
            onError={handleImageError}
            style={{
              maxHeight: isExpanded ? 'none' : maxHeight,
              objectFit: 'cover',
              objectPosition: 'center'
            }}
          />
          
          <div className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5">
            {isExpanded ? (
              <ZoomOut size={16} />
            ) : (
              <ZoomIn size={16} />
            )}
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
            Clique para expandir
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full min-h-[120px] bg-muted text-muted-foreground text-sm p-4 text-center">
          Imagem indisponível
        </div>
      )}
    </div>
  );
}