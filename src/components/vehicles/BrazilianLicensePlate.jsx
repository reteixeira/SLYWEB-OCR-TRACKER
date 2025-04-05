import React from "react";

const PlateTypes = {
  MERCOSUL: "mercosul",
  STANDARD: "standard"
};

export const detectPlateType = (plate) => {
  if (!plate) return PlateTypes.STANDARD;
  const cleanPlate = plate.replace(/[\s-]/g, "").toUpperCase();
  
  // Padrão Mercosul: 3 letras + 1 número + 1 letra + 2 números (ex: ABC1D23)
  if (/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(cleanPlate)) {
    return PlateTypes.MERCOSUL;
  }
  
  // Padrão antigo: 3 letras + 4 números (ex: ABC1234)
  return PlateTypes.STANDARD;
};

export default function BrazilianLicensePlate({ plate, size = "medium", className = "", isMotorcycle = false }) {
  if (!plate || plate === "Não Detectada" || plate === "Placa Não Detectada") {
    // Exibir mensagem de placa não detectada
    return (
      <div className={`bg-yellow-100 text-yellow-800 px-3 py-2 text-sm rounded-md text-center ${className}`}>
        Placa Não Detectada
      </div>
    );
  }
  
  const plateType = detectPlateType(plate);
  const cleanPlate = plate.replace(/[\s-]/g, "").toUpperCase();
  
  const sizes = {
    small: {
      container: "w-36 sm:w-48 h-12 sm:h-16",
      text: "text-lg sm:text-xl"
    },
    medium: {
      container: "w-48 sm:w-72 h-16 sm:h-24",
      text: "text-xl sm:text-2xl"
    },
    large: {
      container: "w-64 sm:w-96 h-20 sm:h-32", 
      text: "text-2xl sm:text-3xl"
    }
  };
  
  const sizeClass = sizes[size] || sizes.medium;

  // Se for motocicleta, usar sempre a placa de moto
  if (isMotorcycle) {
    return (
      <div className={`${sizeClass.container} relative ${className}`}>
        <div className="relative w-full h-full">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/ca29ad_image.png"
            alt="Placa Moto"
            className="w-full h-full object-contain"
          />
          
          {/* Para a placa de moto, sempre dividimos em duas linhas */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div 
              className={`font-bold text-black ${sizeClass.text}`}
              style={{ 
                fontFamily: "'Cargo Two SF', sans-serif",
                letterSpacing: "0.1em",
                marginBottom: "-5px",
                paddingTop: "5px"
              }}
            >
              {cleanPlate.substring(0, 3)}
            </div>
            <div 
              className={`font-bold text-black ${sizeClass.text}`}
              style={{ 
                fontFamily: "'Cargo Two SF', sans-serif",
                letterSpacing: "0.1em",
                paddingBottom: "5px"
              }}
            >
              {cleanPlate.substring(3)}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Para outros veículos que não são motos
  if (plateType === PlateTypes.MERCOSUL) {
    return (
      <div className={`${sizeClass.container} relative ${className}`}>
        <div className="relative w-full h-full">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/976dae_image.png"
            alt="Placa Mercosul"
            className="w-full h-full object-contain"
          />
          
          <div 
            className={`absolute inset-0 flex items-center justify-center font-bold text-black ${sizeClass.text}`}
            style={{ 
              fontFamily: "'Cargo Two SF', sans-serif",
              paddingTop: "5px",
              paddingLeft: "10px",
              letterSpacing: "0.1em",
              fontSize: "calc(150% + 0.8vw)",
              direction: "rtl",
              paddingRight: "10%",
              paddingLeft: "20%"
            }}
          >
            {cleanPlate}
          </div>
        </div>
      </div>
    );
  }

  // Placa antiga (padrão) para carros e outros veículos
  return (
    <div className={`${sizeClass.container} relative border border-black ${className}`}>
      {/* Faixa preta superior */}
      <div className="h-1/4 bg-black flex items-center justify-center">
        <span className="text-white text-xs">SP-SÃO PAULO</span>
      </div>
      
      {/* Área principal cinza */}
      <div className="h-3/4 bg-gray-200 flex items-center justify-center"
           style={{
             backgroundImage: "linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)",
             backgroundSize: "4px 4px",
             backgroundPosition: "0 0, 0 2px, 2px -2px, -2px 0px"
           }}>
        <div 
          className={`font-bold ${sizeClass.text} tracking-wider`}
          style={{ 
            fontFamily: "'Cargo Two SF', sans-serif",
          }}
        >
          {cleanPlate.slice(0, 3)}-{cleanPlate.slice(3)}
        </div>
      </div>
    </div>
  );
}