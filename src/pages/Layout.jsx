

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Camera, LayoutDashboard, History, Sun, Moon, LogOut, Menu, Waypoints, AlertCircle, UserCog, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Layout({ children }) {
  const [theme, setTheme] = useState("light");
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    loadUser();
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error("Não autenticado");
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const isActive = (path) => {
    if (!location || !location.pathname) return false;
    return location.pathname === path;
  };

  const safeCreatePageUrl = (pageName) => {
    try {
      return createPageUrl(pageName) || "/";
    } catch (error) {
      console.error(`Erro ao criar URL para página ${pageName}:`, error);
      return "/";
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className={theme}>
      <style>{`
        :root {
          --background: 0 0% 100%;
          --foreground: 222.2 84% 4.9%;
          --card: 0 0% 100%;
          --card-foreground: 222.2 84% 4.9%;
          --popover: 0 0% 100%;
          --popover-foreground: 222.2 84% 4.9%;
          --primary: 221.2 83.2% 53.3%;
          --primary-foreground: 210 40% 98%;
          --secondary: 210 40% 96.1%;
          --secondary-foreground: 222.2 47.4% 11.2%;
          --muted: 210 40% 96.1%;
          --muted-foreground: 215.4 16.3% 46.9%;
          --accent: 210 40% 96.1%;
          --accent-foreground: 222.2 47.4% 11.2%;
          --destructive: 0 84.2% 60.2%;
          --destructive-foreground: 210 40% 98%;
          --border: 214.3 31.8% 91.4%;
          --input: 214.3 31.8% 91.4%;
          --ring: 221.2 83.2% 53.3%;
          --success: 142.1 76.2% 36.3%;
        }

        .dark {
          --background: 222.2 84% 4.9%;
          --foreground: 210 40% 98%;
          --card: 222.2 84% 4.9%;
          --card-foreground: 210 40% 98%;
          --popover: 222.2 84% 4.9%;
          --popover-foreground: 210 40% 98%;
          --primary: 217.2 91.2% 59.8%;
          --primary-foreground: 222.2 47.4% 11.2%;
          --secondary: 217.2 32.6% 17.5%;
          --secondary-foreground: 210 40% 98%;
          --muted: 217.2 32.6% 17.5%;
          --muted-foreground: 215 20.2% 65.1%;
          --accent: 217.2 32.6% 17.5%;
          --accent-foreground: 210 40% 98%;
          --destructive: 0 62.8% 30.6%;
          --destructive-foreground: 210 40% 98%;
          --border: 217.2 32.6% 17.5%;
          --input: 217.2 32.6% 17.5%;
          --ring: 224.3 76.3% 48%;
          --success: 142.1 76.2% 36.3%;
        }
        
        /* Importar fonte Montserrat para placas */
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap');
      `}</style>

      <div className="min-h-screen bg-background text-foreground">
        <nav className="border-b sticky top-0 z-40 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <span className="text-xl font-bold tracking-tight">SLYWEB® CAM</span>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    to="/"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isActive("/")
                        ? "border-b-2 border-primary text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:border-b-2 hover:border-gray-300"
                    }`}
                  >
                    <div className="w-5 flex justify-center">
                      <LayoutDashboard className="w-4 h-4" />
                    </div>
                    <span className="ml-2">Principal</span>
                  </Link>
                  <Link
                    to={safeCreatePageUrl("Capture")}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isActive(safeCreatePageUrl("Capture"))
                        ? "border-b-2 border-primary text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:border-b-2 hover:border-gray-300"
                    }`}
                  >
                    <div className="w-5 flex justify-center">
                      <Camera className="w-4 h-4" />
                    </div>
                    <span className="ml-2">Captura</span>
                  </Link>
                  <div className="relative group">
                    <Link
                      to={safeCreatePageUrl("History")}
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                        isActive(safeCreatePageUrl("History"))
                          ? "border-b-2 border-red-500 text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:border-b-2 hover:border-gray-300"
                      }`}
                    >
                      <div className="w-5 flex justify-center">
                        <History className="w-4 h-4" />
                      </div>
                      <span className="ml-2">Histórico</span>
                    </Link>

                    <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-background border hidden group-hover:block z-50">
                      <div className="py-1">
                        <Link
                          to={safeCreatePageUrl("Highways")}
                          className="block px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center"
                        >
                          <div className="w-5 flex justify-center">
                            <Waypoints className="w-4 h-4" />
                          </div>
                          <span className="ml-2">Rodovias</span>
                        </Link>
                        <Link
                          to={safeCreatePageUrl("Contacts")}
                          className="block px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center"
                        >
                          <div className="w-5 flex justify-center">
                            <Phone className="w-4 h-4" />
                          </div>
                          <span className="ml-2">Contatos</span>
                        </Link>
                        <Link
                          to={safeCreatePageUrl("Admin")}
                          className="block px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center"
                        >
                          <div className="w-5 flex justify-center">
                            <UserCog className="w-4 h-4" />
                          </div>
                          <span className="ml-2">Admin</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="mr-2"
                  title={theme === "light" ? "Modo escuro" : "Modo claro"}
                >
                  {theme === "light" ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                </Button>
                
                {user ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm hidden md:inline">{user.full_name || user.email}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => User.logout()}
                      className="gap-2 hidden md:flex"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => User.login()} className="hidden md:flex">Entrar</Button>
                )}

                <div className="md:hidden relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  
                  {mobileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-card border z-50">
                      <div className="py-1">
                        <Link
                          to="/"
                          className={`flex items-center p-3 rounded-lg ${
                            isActive("/")
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted"
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <div className="w-6 flex justify-center">
                            <LayoutDashboard className="w-5 h-5" />
                          </div>
                          <span className="ml-3 font-medium">Principal</span>
                        </Link>

                        <Link
                          to={safeCreatePageUrl("Capture")}
                          className={`flex items-center p-3 rounded-lg ${
                            isActive(safeCreatePageUrl("Capture"))
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted"
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <div className="w-6 flex justify-center">
                            <Camera className="w-5 h-5" />
                          </div>
                          <span className="ml-3 font-medium">Captura</span>
                        </Link>

                        <Link
                          to={safeCreatePageUrl("History")}
                          className={`flex items-center p-3 rounded-lg ${
                            isActive(safeCreatePageUrl("History"))
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted"
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <div className="w-6 flex justify-center">
                            <History className="w-5 h-5" />
                          </div>
                          <span className="ml-3 font-medium">Histórico</span>
                        </Link>

                        <div className="pl-9 space-y-2 pt-2 pb-2 border-l border-muted ml-3">
                          <Link
                            to={safeCreatePageUrl("Highways")}
                            className={`flex items-center p-3 rounded-lg ${
                              isActive(safeCreatePageUrl("Highways"))
                                ? "bg-primary/10 text-primary"
                                : "text-foreground hover:bg-muted"
                            }`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <div className="w-6 flex justify-center">
                              <Waypoints className="w-5 h-5" />
                            </div>
                            <span className="ml-3 font-medium">Rodovias</span>
                          </Link>

                          <Link
                            to={safeCreatePageUrl("Contacts")}
                            className={`flex items-center p-3 rounded-lg ${
                              isActive(safeCreatePageUrl("Contacts"))
                                ? "bg-primary/10 text-primary"
                                : "text-foreground hover:bg-muted"
                            }`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <div className="w-6 flex justify-center">
                              <Phone className="w-5 h-5" />
                            </div>
                            <span className="ml-3 font-medium">Contatos</span>
                          </Link>

                          <Link
                            to={safeCreatePageUrl("Admin")}
                            className={`flex items-center p-3 rounded-lg ${
                              isActive(safeCreatePageUrl("Admin"))
                                ? "bg-primary/10 text-primary"
                                : "text-foreground hover:bg-muted"
                            }`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <div className="w-6 flex justify-center">
                              <UserCog className="w-5 h-5" />
                            </div>
                            <span className="ml-3 font-medium">Admin</span>
                          </Link>
                        </div>
                        
                        <div className="border-t mt-2 pt-2">
                          {user ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                User.logout();
                                setMobileMenuOpen(false);
                              }}
                              className="w-full justify-start px-3 py-2"
                            >
                              <LogOut className="w-4 h-4 mr-2" />
                              Sair
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                User.login();
                                setMobileMenuOpen(false);
                              }}
                              className="w-full justify-start px-3 py-2"
                            >
                              Entrar
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              toggleTheme();
                              setMobileMenuOpen(false);
                            }}
                            className="w-full justify-start px-3 py-2"
                          >
                            {theme === "light" ? (
                              <>
                                <Moon className="h-4 w-4 mr-2" />
                                <span>Modo escuro</span>
                              </>
                            ) : (
                              <>
                                <Sun className="h-4 w-4 mr-2" />
                                <span>Modo claro</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

