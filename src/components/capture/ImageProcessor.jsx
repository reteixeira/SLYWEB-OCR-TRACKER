import { UploadFile, InvokeLLM, GenerateImage } from "@/api/integrations";

const captureImage = async (cameraUrl) => {
  try {
    if (!cameraUrl) {
      throw new Error("URL da câmera não definida");
    }

    console.log("Tentando capturar imagem de:", cameraUrl);

    // For demo/test purposes, use sample images
    let imageUrl;
    try {
      // Generate a simulated capture using AI
      const result = await GenerateImage({
        prompt: `Fotografia de veículo em rodovia, vista frontal de uma câmera de monitoramento. 
                Imagem realista de veículo em movimento em uma estrada, 
                placa visível, dia claro.`
      });
      
      imageUrl = result.url;
    } catch (err) {
      console.warn("Falha ao gerar imagem com IA, usando imagem de teste:", err);
      // Fallback to test images
      imageUrl = "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&auto=format&fit=crop";
    }

    return {
      success: true,
      image_url: imageUrl,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Erro ao capturar imagem:", error);
    throw error;
  }
};

const processImage = async (imageData, options = {}) => {
  try {
    const { high_quality = true } = options;
    
    if (!imageData || !imageData.image_url) {
      throw new Error("Dados da imagem inválidos");
    }

    // Use LLM to detect vehicles in the image
    const detectionResponse = await InvokeLLM({
      prompt: `Analise esta imagem e identifique todos os veículos presentes.
      Para cada veículo detectado, identifique:
      1. Tipo do veículo (car, truck, bus, van)
      2. Ângulo da captura (front, rear)
      3. Placa do veículo (se visível)
      4. Nome da empresa (para veículos comerciais)`,
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
                  enum: ["car", "truck", "bus", "van"]
                },
                view: {
                  type: "string",
                  enum: ["front", "rear"]
                },
                plate: { 
                  type: ["string", "null"]
                },
                company_name: { 
                  type: ["string", "null"]
                }
              },
              required: ["type", "view"]
            }
          }
        },
        required: ["vehicles"]
      },
      file_urls: imageData.image_url
    });

    return {
      success: true,
      image_url: imageData.image_url,
      vehicles: detectionResponse.vehicles,
      processed: true,
      processing_quality: high_quality ? "high" : "standard",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Erro ao processar imagem:", error);
    throw error;
  }
};

// Export as a proper object with methods
const ImageProcessor = {
  captureImage,
  processImage
};

export { ImageProcessor };
export default ImageProcessor;