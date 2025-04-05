import React, { useState, useEffect } from "react";
import { Vehicle } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Camera, Truck, Car, Clock, AlertCircle, 
  Loader2 
} from "lucide-react";

export default function IndexPage() {
  const [recentCaptures, setRecentCaptures] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    trucks: 0,
    cars: 0,
    pending: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const captures = await Vehicle.list("-capture_date", 5);
      setRecentCaptures(captures.filter(c => !c.deleted));

      const allCaptures = await Vehicle.list();
      const activeCaptures = allCaptures.filter(c => !c.deleted);
      setStats({
        total: activeCaptures.length,
        trucks: activeCaptures.filter(c => c.type === "truck").length,
        cars: activeCaptures.filter(c => c.type === "car").length,
        pending: activeCaptures.filter(c => c.send_status === "pending").length
      });
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Falha ao carregar dados. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Principal</h1>
        <Link to={createPageUrl("Capture")}>
          <Button className="gap-2">
            <Camera className="w-4 h-4" />
            Nova Captura
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-destructive/20 p-4 rounded-lg flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Capturas</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Caminhões</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trucks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Carros</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cars}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Capturas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCaptures.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Camera className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Nenhuma captura recente encontrada</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.href = createPageUrl("Capture")}
                >
                  Fazer Nova Captura
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentCaptures.map((capture) => (
                  <div key={capture.id} className="bg-muted/50 rounded-lg p-4">
                    <p className="font-medium">{capture.plate || "Placa não detectada"}</p>
                    <p className="text-sm text-muted-foreground">
                      {capture.type === "truck" ? "Caminhão" : "Carro"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}