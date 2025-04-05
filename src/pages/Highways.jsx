
import React, { useState, useEffect, useRef } from "react";
import { Camera } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  Trash2,
  PenIcon,
  Play,
  Pause,
  Camera as CameraIcon,
  Settings,
  RotateCw,
  AlertCircle,
  RefreshCw,
  Clock,
  Pencil,
  Save,
  X,
  CheckCircle2
} from "lucide-react";
import { Vehicle } from "@/api/entities";
import { format } from "date-fns";
import { ImageProcessor } from "../components/capture/ImageProcessor";

export default function Highways() {
  const [cameras, setCameras] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewCameraModal, setShowNewCameraModal] = useState(false);
  const [newCameraData, setNewCameraData] = useState({
    name: "",
    url: "",
    location: "",
    highway: "",
    km: "",
    active: true,
    process_automatically: true,
    high_quality: true,
    auto_capture: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [currentCamera, setCurrentCamera] = useState(null);
  const [newCamera, setNewCamera] = useState({
    name: "",
    url: "",
    location: "",
    highway: "",
    km: "",
    active: true,
    process_automatically: true,
    high_quality: true,
    auto_capture: false,
  });
  const [recentPhotos, setRecentPhotos] = useState({});
  const [processing, setProcessing] = useState(false);
  const [processedCamera, setProcessedCamera] = useState(null);
  const [globalSettings, setGlobalSettings] = useState({
    process_automatically: true,
    high_quality: true,
    auto_capture_interval: 5
  });

  const [processingCamera, setProcessingCamera] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editingCameraId, setEditingCameraId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const inputRef = useRef(null);
  const autoIntervals = useRef({});

  const initializeNewCamera = () => {
    const nextNumber = cameras
      .map(cam => {
        const match = cam.name.match(/^CAM(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0)
      .reduce((max, num) => Math.max(max, num), 0) + 1;

    setNewCameraData({
      name: `CAM${nextNumber}`,
      url: "",
      location: "",
      highway: "",
      km: "",
      active: true,
      process_automatically: globalSettings.process_automatically,
      high_quality: globalSettings.high_quality,
      auto_capture: false
    });
    setShowNewCameraModal(true);
  };

  const handleCreateCamera = async () => {
    if (!newCameraData.name || !newCameraData.url) {
      setError("Nome e URL são obrigatórios");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await Camera.create(newCameraData);
      setShowNewCameraModal(false);
      loadCameras(); // Reload the camera list
    } catch (err) {
      console.error("Error creating camera:", err);
      setError("Falha ao criar câmera. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Focus input when editing starts
  useEffect(() => {
    if (editingCameraId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCameraId, editingField]);

  // Clear success message after delay
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  useEffect(() => {
    loadCameras();
    return () => {
      clearAllAutoCaptures();
    };
  }, []);

  useEffect(() => {
    setupAutoCaptures();
  }, [cameras]);

  const clearAllAutoCaptures = () => {
    Object.values(autoIntervals.current).forEach(interval => {
      clearInterval(interval);
    });
    autoIntervals.current = {};
  };

  const setupAutoCaptures = () => {
    clearAllAutoCaptures();

    cameras.forEach(camera => {
      if (camera.active && camera.auto_capture) {
        const interval = setInterval(() => {
          captureFromCamera(camera);
        }, (globalSettings.auto_capture_interval || 5) * 60 * 1000);

        autoIntervals.current[camera.id] = interval;
      }
    });
  };

  const generateNextCameraName = () => {
    const cameraNumbers = cameras
      .map(cam => {
        const match = cam.name.match(/^CAM(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0);

    if (cameraNumbers.length === 0) return "CAM1";

    const nextNumber = Math.max(...cameraNumbers) + 1;
    return `CAM${nextNumber}`;
  };

  const handleAddCamera = async () => {
    try {
      const camera = await Camera.create(newCamera);
      setAddDialogOpen(false);
      setNewCamera({
        name: generateNextCameraName(),
        url: "",
        location: "",
        highway: "",
        km: "",
        active: true,
        process_automatically: globalSettings.process_automatically,
        high_quality: globalSettings.high_quality,
        auto_capture: false
      });
      await loadCameras();
    } catch (error) {
      console.error("Erro ao adicionar câmera:", error);
      setError("Falha ao adicionar câmera. Verifique os dados e tente novamente.");
    }
  };

  const loadCameras = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await Camera.list();
      
      // Update CAM1 and CAM2 URLs to the test images
      const updatedCameras = data.map(camera => {
        if (camera.name === "CAM1") {
          return {
            ...camera,
            url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwOWGGVOkc57zjRVw20-ne19vBFoHkMXNJxQ&usqp=CAU"
          };
        }
        if (camera.name === "CAM2") {
          return {
            ...camera,
            url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzNgg-OVZY7nqP-IhFM-ptHfjKqSyBeBrfK0ZmUpn7lA5WdE21HdT_Qp4&s=10"
          };
        }
        return camera;
      });
      
      // Update cameras in database
      for (const camera of data) {
        if (camera.name === "CAM1" || camera.name === "CAM2") {
          try {
            await Camera.update(camera.id, {
              ...camera,
              url: camera.name === "CAM1" 
                ? "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwOWGGVOkc57zjRVw20-ne19vBFoHkMXNJxQ&usqp=CAU"
                : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzNgg-OVZY7nqP-IhFM-ptHfjKqSyBeBrfK0ZmUpn7lA5WdE21HdT_Qp4&s=10"
            });
          } catch (err) {
            console.error(`Error updating ${camera.name} URL:`, err);
          }
        }
      }
      
      setCameras(updatedCameras || []);

      const photosMap = {};
      if (Array.isArray(updatedCameras)) {
        for (const camera of updatedCameras) {
          try {
            const photos = await Vehicle.filter({
              capture_source: camera.id,
              deleted: false
            }, "-capture_date", 8);
            photosMap[camera.id] = photos || [];
          } catch (err) {
            console.error(`Erro ao carregar fotos para câmera ${camera.id}:`, err);
            photosMap[camera.id] = [];
          }
        }
      }
      setRecentPhotos(photosMap);
    } catch (error) {
      console.error("Erro ao carregar câmeras:", error);
      setError("Falha ao carregar dados das câmeras. Tente novamente.");
      setCameras([]);
    } finally {
      setIsLoading(false);
    }
  };

  const captureFromCamera = async (camera) => {
    if (processing) return;

    try {
      setProcessing(true);
      setProcessedCamera(camera);
      setError(null);

      if (!camera || !camera.url) {
        throw new Error("URL da câmera inválida");
      }

      const result = await ImageProcessor.captureImage(camera.url);
    
      if (!result || !result.success) {
        throw new Error("Falha ao capturar imagem");
      }

      let vehiclesToCreate = [];
      if (camera.process_automatically) {
        const processedData = await ImageProcessor.processImage({
          image_url: result.image_url
        }, {
          high_quality: camera.high_quality
        });

        if (processedData.vehicles && processedData.vehicles.length > 0) {
          vehiclesToCreate = processedData.vehicles.map(vehicle => ({
            ...vehicle,
            image_url: processedData.image_url,
            capture_date: new Date().toISOString(),
            capture_source: camera.id,
            send_status: "pending",
            deleted: false
          }));
        }
      }

      // Always create at least one record even if no vehicles detected
      if (vehiclesToCreate.length === 0) {
        vehiclesToCreate.push({
          type: "unknown",
          view: "front",
          plate: null,
          image_url: result.image_url,
          capture_date: new Date().toISOString(),
          capture_source: camera.id,
          send_status: "pending",
          deleted: false
        });
      }

      // Save vehicles to database
      for (const vehicle of vehiclesToCreate) {
        await Vehicle.create(vehicle);
      }

      // Update camera's last capture time
      await Camera.update(camera.id, {
        ...camera,
        last_capture: new Date().toISOString()
      });

      await loadCameras();

    } catch (error) {
      console.error("Erro ao capturar da câmera:", error);
      setError(`Falha ao capturar da câmera ${camera.name}: ${error.message}`);
    } finally {
      setProcessing(false);
      setProcessedCamera(null);
    }
  };

  const handleEditCamera = (camera) => {
    setCurrentCamera({ ...camera });
    setEditDialogOpen(true);
  };

  const saveEditedCamera = async () => {
    if (!currentCamera) return;
    
    setError(null);
    
    try {
      // Validate required fields
      if (!currentCamera.name || !currentCamera.name.trim()) {
        setError("Nome da câmera é obrigatório");
        return;
      }
      
      if (!currentCamera.url || !currentCamera.url.trim()) {
        setError("URL da câmera é obrigatória");
        return;
      }
      
      // Perform the update
      await Camera.update(currentCamera.id, {
        ...currentCamera,
        name: currentCamera.name.trim(),
        url: currentCamera.url.trim(),
        location: currentCamera.location?.trim() || "",
        highway: currentCamera.highway?.trim() || "",
        km: currentCamera.km?.trim() || ""
      });
      
      setEditDialogOpen(false);
      setCurrentCamera(null);
      await loadCameras();
    } catch (error) {
      console.error("Erro ao atualizar câmera:", error);
      setError("Falha ao atualizar câmera. Verifique os dados e tente novamente.");
    }
  };

  const handleDeleteCamera = (camera) => {
    setCurrentCamera(camera);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCamera = async () => {
    if (!currentCamera) return;

    try {
      await Camera.delete(currentCamera.id);
      setDeleteDialogOpen(false);
      setCurrentCamera(null);
      await loadCameras();
    } catch (error) {
      console.error("Erro ao excluir câmera:", error);
      setError("Falha ao excluir câmera. Tente novamente.");
    }
  };

  const toggleCameraStatus = async (camera) => {
    try {
      await Camera.update(camera.id, {
        ...camera,
        active: !camera.active
      });
      await loadCameras();
    } catch (error) {
      console.error("Erro ao atualizar status da câmera:", error);
      setError("Falha ao alterar status da câmera. Tente novamente.");
    }
  };

  const toggleAutoCapture = async (camera) => {
    try {
      await Camera.update(camera.id, {
        ...camera,
        auto_capture: !camera.auto_capture
      });
      await loadCameras();
    } catch (error) {
      console.error("Erro ao atualizar modo de captura da câmera:", error);
      setError("Falha ao alterar modo de captura da câmera. Tente novamente.");
    }
  };

  const openAddDialog = () => {
    setNewCamera({
      name: generateNextCameraName(),
      url: "",
      location: "",
      highway: "",
      km: "",
      active: true,
      process_automatically: globalSettings.process_automatically,
      high_quality: globalSettings.high_quality,
      auto_capture: false
    });
    setAddDialogOpen(true);
  };

  const loadCameraPhotos = async (cameraId) => {
    try {
      const photos = await Vehicle.filter({
        capture_source: cameraId,
        deleted: false
      }, "-capture_date", 8);
      setRecentPhotos(prevPhotos => ({
        ...prevPhotos,
        [cameraId]: photos || []
      }));
    } catch (err) {
      console.error(`Erro ao carregar fotos para câmera ${cameraId}:`, err);
      setRecentPhotos(prevPhotos => ({
        ...prevPhotos,
        [cameraId]: []
      }));
    }
  };

  const handleCapture = async (camera) => {
    if (!camera || !camera.url) {
      console.error("URL da câmera inválida");
      return;
    }

    setProcessingCamera(camera.id);
    setError(null);

    try {
      // Ensure ImageProcessor is properly initialized
      if (!ImageProcessor || typeof ImageProcessor.captureImage !== 'function') {
        throw new Error("Processador de imagem não está pronto");
      }

      const result = await ImageProcessor.captureImage(camera.url);
      if (result && result.success) {
        await loadCameras();
      }
    } catch (error) {
      console.error("Erro ao capturar da câmera:", error);
      setError(`Erro ao capturar imagem da câmera ${camera.name}: ${error.message}`);
    } finally {
      setProcessingCamera(null);
    }
  };

  // Function to start editing a field
  const startEditing = (camera, field) => {
    setEditingCameraId(camera.id);
    setEditingField(field);
    
    // Set the initial value based on field type
    if (field === 'url') {
      setEditingValue(camera.url || "");
    } else if (field === 'location') {
      setEditingValue(camera.location || "");
    } else if (field === 'process_automatically') {
      setEditingValue(camera.process_automatically);
    } else if (field === 'high_quality') {
      setEditingValue(camera.high_quality);
    }
  };

  // Function to cancel editing
  const handleCancelEdit = () => {
    setEditingCameraId(null);
    setEditingField(null);
    setEditingValue("");
  };

  const handleSaveEdit = async (camera) => {
    if (!editingField || !editingCameraId) return;
    
    setIsSaving(true);
    try {
      const updatedCamera = { ...camera };
      
      switch (editingField) {
        case 'url':
          updatedCamera.url = editingValue;
          break;
        case 'location':
          updatedCamera.location = editingValue;
          break;
        case 'process_automatically':
          updatedCamera.process_automatically = typeof editingValue === 'boolean' ? editingValue : editingValue === 'true';
          break;
        case 'high_quality':
          updatedCamera.high_quality = typeof editingValue === 'boolean' ? editingValue : editingValue === 'true';
          break;
      }
      
      await Camera.update(camera.id, updatedCamera);
      
      setCameras(prev => 
        prev.map(c => c.id === camera.id ? { ...c, ...updatedCamera } : c)
      );

      // Reset editing state
      setEditingCameraId(null);
      setEditingField(null);
      setEditingValue("");
      setSaveSuccess(true);
    } catch (error) {
      console.error(`Error updating camera ${editingField}:`, error);
      setError(`Failed to save changes. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const renderEditableField = (camera, field, label, currentValue, type = 'text') => {
    const isEditing = editingCameraId === camera.id && editingField === field;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{label}</Label>
          {isEditing ? (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCancelEdit()}
                disabled={isSaving}
                className="h-6 w-6"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSaveEdit(camera)}
                disabled={isSaving}
                className="h-6 w-6"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => startEditing(camera, field)}
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {isEditing ? (
          type === 'switch' ? (
            <Switch
              checked={editingValue}
              onCheckedChange={(checked) => {
                setEditingValue(checked);
                handleSaveEdit({ ...camera, [field]: checked });
              }}
            />
          ) : (
            <Input
              ref={inputRef}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveEdit(camera);
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancelEdit();
                }
              }}
              onBlur={() => handleSaveEdit(camera)}
              className="h-8"
              autoFocus
            />
          )
        ) : (
          <div className="text-sm truncate">
            {type === 'switch' ? (
              <Switch
                checked={currentValue}
                disabled
              />
            ) : (
              currentValue || "Não definido"
            )}
          </div>
        )}
      </div>
    );
  };

  // Handle keyboard input
  const handleKeyDown = (e, camera) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(camera);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    if (e.target.type === 'checkbox') {
      setEditingValue(e.target.checked);
    } else {
      setEditingValue(e.target.value);
    }
  };
  
  // Handle toggle change for switches
  const handleToggleChange = (checked) => {
    setEditingValue(checked);
  };

  const ImageCaptureProcess = ({ camera }) => {
    const [capturing, setCapturing] = useState(false);
    const [captureError, setCaptureError] = useState(null);
    const [lastCapture, setLastCapture] = useState(null);

    const handleManualCapture = async () => {
      setCapturing(true);
      setCaptureError(null);

      try {
        if (!camera || !camera.url) {
          throw new Error("URL da câmera inválida");
        }

        const result = await ImageProcessor.captureImage(camera.url);

        if (result && result.success) {
          setLastCapture(new Date());
        } else {
          throw new Error("Falha ao capturar imagem");
        }
      } catch (error) {
        console.error("Erro ao capturar imagem:", error);
        setCaptureError(error.message || "Falha ao capturar a imagem.");
      } finally {
        setCapturing(false);
      }
    };

    return (
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualCapture}
          disabled={capturing}
          className="gap-2"
        >
          {capturing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Capturando...
            </>
          ) : (
            <>
              <CameraIcon className="h-4 w-4" />
              Capturar Agora
            </>
          )}
        </Button>

        {captureError && (
          <div className="mt-2 text-sm text-destructive">
            Erro: {captureError}
          </div>
        )}

        {lastCapture && (
          <div className="mt-2 text-sm text-muted-foreground">
            Última captura: {format(lastCapture, "dd/MM/yyyy HH:mm:ss")}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Rodovias</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setSettingsDialogOpen(true)}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            Configurações
          </Button>
          <Button
            onClick={initializeNewCamera}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Câmera
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/20 text-destructive p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : cameras.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CameraIcon className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Nenhuma câmera encontrada</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Comece adicionando uma nova câmera para monitorar veículos.
              </p>
              <Button
                onClick={openAddDialog}
                className="mt-4"
              >
                Adicionar Câmera
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cameras.map((camera) => (
            <Card key={camera.id} className="group">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-bold">
                    {camera.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditCamera(camera)}
                      className="h-8 w-8"
                    >
                      <PenIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCamera(camera)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {camera.location || camera.highway || "Localização não definida"}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Camera control buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCapture(camera)}
                    disabled={processingCamera === camera.id}
                    className="gap-2"
                  >
                    {processingCamera === camera.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CameraIcon className="h-4 w-4" />
                        Capturar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAutoCapture(camera)}
                    className="gap-2"
                  >
                    {camera.auto_capture ? (
                      <>
                        <Pause className="h-4 w-4" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Iniciar
                      </>
                    )}
                  </Button>
                </div>

                {/* Editable fields */}
                <div className="space-y-3">
                  {renderEditableField(camera, 'url', 'URL', camera.url)}
                  {renderEditableField(camera, 'location', 'Local', camera.location)}
                  {renderEditableField(
                    camera,
                    'process_automatically',
                    'Processamento',
                    camera.process_automatically,
                    'switch'
                  )}
                  {renderEditableField(
                    camera,
                    'high_quality',
                    'Qualidade',
                    camera.high_quality,
                    'switch'
                  )}
                </div>

                {/* Last capture info */}
                {camera.last_capture && (
                  <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                    Última captura: {format(new Date(camera.last_capture), "dd/MM/yyyy HH:mm")}
                  </div>
                )}

                {recentPhotos[camera.id]?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Capturas Recentes</h4>
                    <ScrollArea className="whitespace-nowrap">
                      <div className="flex space-x-2 pb-1">
                        {recentPhotos[camera.id].map((photo) => (
                          <div
                            key={photo.id}
                            className="aspect-video w-20 md:w-24 rounded bg-muted relative overflow-hidden shrink-0"
                          >
                            <img
                              src={photo.image_url || "https://via.placeholder.com/100x60?text=No+Image"}
                              alt="Captura"
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Câmera</DialogTitle>
            <DialogDescription>
              Adicione uma nova câmera para monitoramento de veículos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Câmera</Label>
              <Input
                placeholder="Ex: Câmera Norte"
                value={newCamera.name}
                onChange={(e) =>
                  setNewCamera({ ...newCamera, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>URL da Câmera</Label>
              <Input
                placeholder="http://..."
                value={newCamera.url}
                onChange={(e) =>
                  setNewCamera({ ...newCamera, url: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rodovia</Label>
                <Input
                  placeholder="Ex: BR-101"
                  value={newCamera.highway}
                  onChange={(e) =>
                    setNewCamera({ ...newCamera, highway: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>KM</Label>
                <Input
                  placeholder="Ex: 235"
                  value={newCamera.km}
                  onChange={(e) =>
                    setNewCamera({ ...newCamera, km: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Localização</Label>
              <Input
                placeholder="Ex: Próximo ao posto de gasolina"
                value={newCamera.location}
                onChange={(e) =>
                  setNewCamera({ ...newCamera, location: e.target.value })
                }
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="process_automatically">Processamento Automático</Label>
                <Switch
                  id="process_automatically"
                  checked={newCamera.process_automatically}
                  onCheckedChange={(checked) =>
                    setNewCamera({
                      ...newCamera,
                      process_automatically: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="high_quality">Alta Qualidade</Label>
                <Switch
                  id="high_quality"
                  checked={newCamera.high_quality}
                  onCheckedChange={(checked) =>
                    setNewCamera({ ...newCamera, high_quality: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="auto_capture">Captura Automática</Label>
                <Switch
                  id="auto_capture"
                  checked={newCamera.auto_capture}
                  onCheckedChange={(checked) =>
                    setNewCamera({ ...newCamera, auto_capture: checked })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddCamera}>Adicionar Câmera</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Câmera</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias nos dados da câmera.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="bg-destructive/20 text-destructive p-3 rounded-md flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          {currentCamera && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Câmera *</Label>
                <Input
                  id="name"
                  value={currentCamera.name}
                  onChange={(e) => setCurrentCamera({ 
                    ...currentCamera, 
                    name: e.target.value 
                  })}
                  placeholder="Ex: CAM1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="url">URL da Câmera *</Label>
                <Input
                  id="url"
                  value={currentCamera.url}
                  onChange={(e) => setCurrentCamera({ 
                    ...currentCamera, 
                    url: e.target.value 
                  })}
                  placeholder="https://api.example.com/camera"
                />
                <p className="text-sm text-muted-foreground">
                  URL completa ou endereço de acesso à câmera
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="highway">Rodovia</Label>
                  <Input
                    id="highway"
                    value={currentCamera.highway || ""}
                    onChange={(e) => setCurrentCamera({ 
                      ...currentCamera, 
                      highway: e.target.value 
                    })}
                    placeholder="Ex: BR-101"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="km">KM</Label>
                  <Input
                    id="km"
                    value={currentCamera.km || ""}
                    onChange={(e) => setCurrentCamera({ 
                      ...currentCamera, 
                      km: e.target.value 
                    })}
                    placeholder="Ex: 235"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  value={currentCamera.location || ""}
                  onChange={(e) => setCurrentCamera({ 
                    ...currentCamera, 
                    location: e.target.value 
                  })}
                  placeholder="Ex: Anchieta Sentido Litoral"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="process_automatically">Processamento Automático</Label>
                    <p className="text-xs text-muted-foreground">
                      Processa automaticamente as imagens capturadas
                    </p>
                  </div>
                  <Switch
                    id="process_automatically"
                    checked={currentCamera.process_automatically}
                    onCheckedChange={(checked) =>
                      setCurrentCamera({ ...currentCamera, process_automatically: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="high_quality">Alta Qualidade</Label>
                    <p className="text-xs text-muted-foreground">
                      Usa processamento em alta resolução
                    </p>
                  </div>
                  <Switch
                    id="high_quality"
                    checked={currentCamera.high_quality}
                    onCheckedChange={(checked) =>
                      setCurrentCamera({ ...currentCamera, high_quality: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto_capture">Captura Automática</Label>
                    <p className="text-xs text-muted-foreground">
                      Captura imagens automaticamente em intervalo definido
                    </p>
                  </div>
                  <Switch
                    id="auto_capture"
                    checked={currentCamera.auto_capture}
                    onCheckedChange={(checked) =>
                      setCurrentCamera({ ...currentCamera, auto_capture: checked })
                    }
                  />
                </div>
              </div>

              {currentCamera.last_capture && (
                <div className="pt-2 border-t">
                  <h4 className="text-sm font-medium">Última Captura</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(currentCamera.last_capture), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                </div>
              )}

              {currentCamera.id && (
                <div className="pt-2 border-t">
                  <h4 className="text-sm font-medium mb-2">Teste de Captura</h4>
                  <ImageCaptureProcess camera={currentCamera} />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false);
              setError(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={saveEditedCamera}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Câmera</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta câmera? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {currentCamera && (
            <div className="py-4">
              <div className="p-4 rounded-lg bg-muted">
                <h4 className="font-medium">{currentCamera.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentCamera.highway} - KM {currentCamera.km}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentCamera.location}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCamera}>
              Excluir Câmera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurações Globais</DialogTitle>
            <DialogDescription>
              Defina as configurações padrão para novas câmeras.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Processamento Automático</Label>
                <p className="text-sm text-muted-foreground">
                  Processa automaticamente as imagens das novas câmeras
                </p>
              </div>
              <Switch
                checked={globalSettings.process_automatically}
                onCheckedChange={(checked) =>
                  setGlobalSettings({
                    ...globalSettings,
                    process_automatically: checked,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Alta Qualidade</Label>
                <p className="text-sm text-muted-foreground">
                  Usa processamento em alta qualidade para novas câmeras
                </p>
              </div>
              <Switch
                checked={globalSettings.high_quality}
                onCheckedChange={(checked) =>
                  setGlobalSettings({
                    ...globalSettings,
                    high_quality: checked,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Intervalo de Captura Automática (minutos)</Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={globalSettings.auto_capture_interval}
                onChange={(e) =>
                  setGlobalSettings({
                    ...globalSettings,
                    auto_capture_interval: parseInt(e.target.value) || 5,
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Tempo entre capturas automáticas para câmeras configuradas
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSettingsDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewCameraModal} onOpenChange={setShowNewCameraModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova Câmera</DialogTitle>
            <DialogDescription>
              Adicione uma nova câmera ao sistema de monitoramento.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-destructive/20 text-destructive p-3 rounded-md flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="camera-name">Nome *</Label>
              <Input
                id="camera-name"
                value={newCameraData.name}
                onChange={(e) => setNewCameraData({ ...newCameraData, name: e.target.value })}
                placeholder="CAM4"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="camera-url">URL *</Label>
              <Input
                id="camera-url"
                value={newCameraData.url}
                onChange={(e) => setNewCameraData({ ...newCameraData, url: e.target.value })}
                placeholder="http://..."
              />
              <p className="text-sm text-muted-foreground">
                URL da câmera ou endpoint de captura
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="camera-location">Local</Label>
              <Input
                id="camera-location"
                value={newCameraData.location}
                onChange={(e) => setNewCameraData({ ...newCameraData, location: e.target.value })}
                placeholder="Ex: Entrada principal"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="camera-highway">Rodovia</Label>
                <Input
                  id="camera-highway"
                  value={newCameraData.highway || ""}
                  onChange={(e) => setNewCameraData({ ...newCameraData, highway: e.target.value })}
                  placeholder="Ex: BR-101"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="camera-km">KM</Label>
                <Input
                  id="camera-km"
                  value={newCameraData.km || ""}
                  onChange={(e) => setNewCameraData({ ...newCameraData, km: e.target.value })}
                  placeholder="Ex: 235"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Processamento Automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Processa automaticamente as imagens capturadas
                  </p>
                </div>
                <Switch
                  checked={newCameraData.process_automatically}
                  onCheckedChange={(checked) =>
                    setNewCameraData({ ...newCameraData, process_automatically: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Alta Qualidade</Label>
                  <p className="text-sm text-muted-foreground">
                    Usa processamento em alta resolução
                  </p>
                </div>
                <Switch
                  checked={newCameraData.high_quality}
                  onCheckedChange={(checked) =>
                    setNewCameraData({ ...newCameraData, high_quality: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto_capture">Captura Automática</Label>
                  <p className="text-xs text-muted-foreground">
                    Captura imagens automaticamente em intervalo definido
                  </p>
                </div>
                <Switch
                  id="auto_capture"
                  checked={newCameraData.auto_capture}
                  onCheckedChange={(checked) =>
                    setNewCameraData({ ...newCameraData, auto_capture: checked })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewCameraModal(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCamera}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Criar Câmera
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
