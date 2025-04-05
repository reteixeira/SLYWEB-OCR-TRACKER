
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Camera, 
  Truck, 
  Car, 
  Motorcycle, 
  Clock,
  Calendar,
  ArrowUpRight,
  Loader2
} from "lucide-react";

export default function StatsCards({ stats, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium bg-muted h-4 w-24 rounded"></CardTitle>
              <div className="h-4 w-4 bg-muted rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 bg-muted w-12 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Capturas",
      value: stats.total || 0,
      icon: <Camera className="h-4 w-4 text-muted-foreground" />,
      description: "Todas as capturas",
      trend: "up"
    },
    {
      title: "Caminhões",
      value: stats.trucks || 0,
      icon: <Truck className="h-4 w-4 text-muted-foreground" />,
      description: "Caminhões capturados",
      trend: "up"
    },
    {
      title: "Carros",
      value: stats.cars || 0,
      icon: <Car className="h-4 w-4 text-muted-foreground" />,
      description: "Carros capturados",
      trend: "neutral"
    },
    {
      title: "Motos",
      value: stats.motorcycles || 0,
      icon: <Motorcycle className="h-4 w-4 text-muted-foreground" />,
      description: "Motos capturadas",
      trend: "up"
    },
    {
      title: "Pendentes",
      value: stats.pending || 0,
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
      description: "Aguardando envio",
      trend: "down"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
