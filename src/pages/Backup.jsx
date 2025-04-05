import React from 'react';
import { User } from '@/api/entities';
import { Vehicle } from '@/api/entities';
import { Camera } from '@/api/entities';
import { Contact } from '@/api/entities';
import { UserExtended } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, Save, AlertTriangle } from "lucide-react";
import AdminAccessCheck from '@/components/AdminAccessCheck';

export default function BackupPage() {
  const handleExportData = async () => {
    try {
      // Coletar dados de todas as entidades
      const vehicles = await Vehicle.list();
      const cameras = await Camera.list();
      const contacts = await Contact.list();
      const users = await User.list();
      const userExtended = await UserExtended.list();

      // Criar objeto com todos os dados
      const backupData = {
        timestamp: new Date().toISOString(),
        system_version: "1.0",
        admin_email: "armazemneno@gmail.com",
        entities: {
          vehicles,
          cameras,
          contacts,
          users,
          userExtended
        },
        schemas: {
          Vehicle: await Vehicle.schema(),
          Camera: await Camera.schema(),
          Contact: await Contact.schema(),
          UserExtended: await UserExtended.schema()
        }
      };

      // Converter para JSON e criar arquivo para download
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Criar nome do arquivo com data
      const date = new Date().toISOString().split('T')[0];
      const filename = `veiculoOCR_backup_${date}.json`;

      // Criar link de download e clicar automaticamente
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar backup:', error);
      alert('Erro ao gerar backup. Verifique o console para mais detalhes.');
    }
  };

  return (
    <AdminAccessCheck>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Backup do Sistema</h1>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              Backup e Restauração
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800">Informações Importantes</h3>
                  <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                    <li>O backup inclui todas as configurações e dados do sistema</li>
                    <li>Mantenha o arquivo de backup em local seguro</li>
                    <li>Recomenda-se fazer backup regularmente</li>
                    <li>O administrador principal (armazemneno@gmail.com) deve guardar uma cópia</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Download className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                    <h3 className="text-lg font-medium mb-2">Exportar Backup</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Baixe uma cópia completa dos dados do sistema
                    </p>
                    <Button onClick={handleExportData} className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Fazer Download do Backup
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto mb-3 text-purple-600" />
                    <h3 className="text-lg font-medium mb-2">Restaurar Backup</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Para restaurar um backup, contate o suporte técnico
                    </p>
                    <Button variant="outline" disabled className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Restaurar Backup
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-sm text-gray-500 mt-6">
              <p>Dados incluídos no backup:</p>
              <ul className="list-disc list-inside mt-2">
                <li>Configurações de câmeras</li>
                <li>Histórico de capturas de veículos</li>
                <li>Lista de contatos e preferências</li>
                <li>Dados de usuários e permissões</li>
                <li>Configurações do sistema</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminAccessCheck>
  );
}