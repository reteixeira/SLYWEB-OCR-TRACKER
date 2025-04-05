import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, History } from "lucide-react";
import { format } from "date-fns";

export default function BackupSystem() {
    const [lastBackup, setLastBackup] = useState(new Date());
    
    const createBackup = async () => {
        const backupData = {
            timestamp: new Date().toISOString(),
            version: "1.0",
            entities: {
                name: "VeiculoOCR Backup",
                date: format(new Date(), "dd/MM/yyyy HH:mm:ss"),
                structure: {
                    entities: [
                        "Vehicle (Veículos e capturas)",
                        "Camera (Câmeras de monitoramento)",
                        "Contact (Contatos para notificações)",
                        "UserExtended (Extensão de dados do usuário)"
                    ],
                    pages: [
                        "Dashboard (Principal)",
                        "Capture (Captura de veículos)",
                        "History (Histórico de capturas)",
                        "Highways (Gestão de rodovias/câmeras)",
                        "Contacts (Gestão de contatos)",
                        "Admin (Administração)"
                    ],
                    components: [
                        "Capture Components",
                        "Dashboard Components",
                        "UI Components"
                    ],
                    features: [
                        "Captura e OCR de veículos",
                        "Gestão de câmeras",
                        "Processamento de imagens",
                        "Sistema de notificações",
                        "Histórico com filtros",
                        "Gestão de lixeira",
                        "Tema claro/escuro",
                        "Layout responsivo"
                    ]
                },
                changelog: {
                    latest: {
                        date: new Date().toISOString(),
                        added: [
                            "Opção para expandir múltiplos detalhes",
                            "Configurações de visualização",
                            "Preview inline de detalhes",
                            "Sistema de backup automático"
                        ],
                        modified: [
                            "Visualização de detalhes",
                            "Formatação de dados",
                            "Sistema de expansão",
                            "Interface do usuário"
                        ],
                        fixed: [
                            "Exibição de detalhes",
                            "Sistema de temas",
                            "Responsividade",
                            "Performance"
                        ]
                    }
                }
            }
        };

        // Aqui você pode implementar a lógica real de backup
        // Por exemplo, salvando em localStorage ou fazendo download

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `veiculoocr-backup-${format(new Date(), "dd-MM-yyyy-HH-mm")}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        setLastBackup(new Date());
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Sistema de Backup
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Último backup:</p>
                        <p className="font-medium">{format(lastBackup, "dd/MM/yyyy HH:mm")}</p>
                    </div>
                    <div className="space-x-2">
                        <Button
                            onClick={createBackup}
                            className="gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Fazer Backup
                        </Button>
                        <Button
                            variant="outline"
                            className="gap-2"
                        >
                            <Upload className="w-4 h-4" />
                            Restaurar
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}