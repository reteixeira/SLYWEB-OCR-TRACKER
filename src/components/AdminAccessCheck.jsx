import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { UserExtended } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Lock, ShieldAlert } from "lucide-react";

export default function AdminAccessCheck({ children }) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  
  useEffect(() => {
    checkUserAccess();
  }, []);
  
  const checkUserAccess = async () => {
    try {
      const user = await User.me();
      
      // Verificar se o usuário é administrador
      if (user.role === 'admin') {
        setHasAccess(true);
        setLoading(false);
        return;
      }
      
      // Verificar permissões estendidas
      const extendedData = await UserExtended.filter({ email: user.email });
      if (extendedData.length > 0 && extendedData[0].permissions?.admin) {
        setHasAccess(true);
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error("Erro ao verificar acesso:", error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-muted h-12 w-12 flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-muted-foreground opacity-50" />
          </div>
          <div className="h-4 bg-muted rounded w-24 mb-3"></div>
          <div className="h-3 bg-muted rounded w-32"></div>
        </div>
      </div>
    );
  }
  
  if (!hasAccess) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <div className="text-center max-w-md mx-auto space-y-4">
            <div className="bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta área. Esta página é reservada para administradores do sistema.
            </p>
            <div className="bg-muted p-4 rounded-lg text-left mt-4 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                Se você precisar de acesso a esta área, entre em contato com o administrador do sistema.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.href = createPageUrl('Dashboard')}
              className="mt-4 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para a Página Principal
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return children;
}