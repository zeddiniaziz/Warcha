import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  Navigate,
} from "react-router-dom";
import {
  Menu,
  X,
  Home,
  Users,
  ChevronRight,
  Plus,
  NotepadText,
  CreditCard,
  Box,
  LogOut,
  Wrench,
  UserCog2Icon,
  ShieldUser,
  ChartColumn,
  HandCoins,
  Building2,
} from "lucide-react";
import GererAteliers from "./components/superAdmin/GererAteliers";

// Admin when login
import Dashboard from "./components/admin/Dashboard";
// Gerer Services
import GererServices from "./components/admin/GererServices";
import AjouterService from "./components/admin/AjouterService";
import ModifierService from "./components/admin/ModifierService";

// Gerer Techniciens
import GererTechnicien from "./components/admin/GererTechnicien";
import AjouterTechnicien from "./components/admin/AjouterTechnicien";
import ModifierTechnicien from "./components/admin/ModifierTechnicien";

// Gerer Fiches
import GererFiches from "./components/admin/GererFiches";
import AjouterFiche from "./components/admin/AjouterFiche";
import ModifierFiche from "./components/admin/ModifierFiche";

// Gerer Paiements
import GererPaiements from "./components/admin/GererPaiements";
import AjouterPaiement from "./components/admin/AjouterPaiement";

// Gerer Stock
import GererStock from "./components/admin/GererStock";

// Gerer Pieces
import GererPieces from "./components/admin/GererPieces";
import AjouterPiece from "./components/admin/AjouterPiece";
import ModifierPiece from "./components/admin/ModifierPiece";

// Gerer Categories
import GererCategories from "./components/admin/GererCategories";
import AjouterCategorie from "./components/admin/AjouterCategorie";
import ModifierCategorie from "./components/admin/ModifierCategorie";

// Gerer Marques
import GererMarques from "./components/admin/GererMarques";
import AjouterMarque from "./components/admin/AjouterMarque";
import ModifierMarque from "./components/admin/ModifierMarque";

// Gerer Categories Produits
import GererCategoriesProduits from "./components/admin/GererCategoriesProduits";
import AjouterCategorieProduit from "./components/admin/AjouterCategorieProduit";
import ModifierCategorieProduit from "./components/admin/ModifierCategorieProduit";

// technicien when login
import FichesTechnicien from "./components/technicien/FichesTechnicien";
import ModifierFichesTechnicien from "./components/technicien/ModifierFichesTechnicien";

// Auth
import { Auth } from "./components/auth";
import { supabase } from "./supabase-client";
import ProtectedRoute from "./components/ProtectedRoute";
import { SyncLoader } from "react-spinners";
import GererClient from "./components/admin/GererClient";
import AjouterClient from "./components/admin/AjouterClient";
import ModifierClient from "./components/admin/ModifierClient";
import ConsulterFichesClients from "./components/client/ConsulterFichesClients";
import DetailsFicheClient from "./components/client/DetailsFicheClient";
import AjouterAdmin from "./components/admin/AjouterAdmin";
import GererAdmins from "./components/admin/GererAdmins";
import ModifierPaiement from "./components/admin/ModifierPaiement";
import MainAdminRoute from "./components/MainAdminRoute";
import GererAdminsAteliers from "./components/superAdmin/GererAdminsAteliers";
import AjouterAdminAtelier from "./components/superAdmin/AjouterAdminAtelier";
import GererAbonnements from "./components/superAdmin/GererAbonnements";
import AjouterAtelier from "./components/superAdmin/AjouterAtelier";
import ModifierAtelier from "./components/superAdmin/ModifierAtelier";
import SuperAdminDashboard from "./components/superAdmin/SaDashboard";

import LandingPage from "./components/landing-page";
import ModifierAboAtelier from "./components/superAdmin/ModifierAboAtelier";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  hasSubmenu?: boolean;
  submenu?: {
    id: string;
    icon: React.ReactNode;
    label: string;
    path: string;
  }[];
}

// Main App Layout Component
function AppLayout({
  session,
  handleLogout,
  id_atelier,
  id_admin,
  isSubAdmin,
  nom_atelier,
}: {
  session: any;
  handleLogout: () => void;
  id_atelier: number | null;
  id_admin: number | null;
  isSubAdmin: boolean;
  nom_atelier: string | null;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  var w = window.innerWidth;
  // var h = window.innerHeight;
  var collapsed = false;
  if (w > 768) {
    collapsed = true;
  }
  const [sidebarCollapsed, setSidebarCollapsed] = useState(collapsed);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [shouldAnimateItems, setShouldAnimateItems] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  //fetch user role
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState<boolean>(true);
  const [roleError, setRoleError] = useState<string | null>(null);

  const fetchUserRole = async () => {
    setRoleLoading(true);
    setRoleError(null);

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Error fetching user role:", error);
        setRoleError("Erreur lors du chargement du rôle utilisateur");
        setUserRole(null);
        return;
      }

      if (data && data.length > 0) {
        setUserRole(data[0].role);
      } else {
        // User has no role assigned
        setRoleError("Aucun rôle attribué à cet utilisateur");
        setUserRole(null);
      }
    } catch (err) {
      console.error("Unexpected error fetching user role:", err);
      setRoleError("Erreur inattendue lors du chargement du rôle");
      setUserRole(null);
    } finally {
      setRoleLoading(false);
    }
  };

  useEffect(() => {
    setUserRole(null); // Reset role on session change
    setRoleLoading(true);
    setRoleError(null);
    fetchUserRole();
    // eslint-disable-next-line
  }, [session]);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (roleLoading) {
        setRoleError("Délai d'attente dépassé. Veuillez rafraîchir la page.");
        setRoleLoading(false);
      }
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timeout);
  }, [roleLoading]);
  const location = useLocation();

  // Animate sidebar items on mount (page reload)
  useEffect(() => {
    setShouldAnimateItems(true);
    const timeout = setTimeout(() => setShouldAnimateItems(false), 1200);
    return () => clearTimeout(timeout);
  }, []);

  // Hide open submenu when sidebar is closed
  useEffect(() => {
    if (!sidebarOpen && !sidebarCollapsed) {
      setOpenSubmenu(null);
    }
  }, [sidebarOpen, sidebarCollapsed]);

  // Sidebar items based on role
  const sidebarItems: SidebarItem[] =
    userRole === "super_admin"
      ? [
          {
            id: "superAdminDashboard",
            label: "Tableau de bord",
            icon: <ChartColumn className="w-5 h-5" />,
            path: "/superAdmin/Dashboard",
          },
          {
            id: "ateliers",
            label: "Les Ateliers",
            icon: <Building2 className="w-5 h-5" />,
            path: "/superAdmin/Ateliers",
            hasSubmenu: true,
            submenu: [
              {
                id: "ajouter-atelier",
                icon: <Plus className="w-5 h-5" />,
                label: "Ajouter Atelier",
                path: "/superAdmin/Ateliers/ajouter",
              },
            ],
          },
          {
            id: "admins-ateliers",
            label: "Administrateurs",
            icon: <ShieldUser className="w-5 h-5" />,
            path: "/superAdmin/admins-ateliers",
            hasSubmenu: true,
            submenu: [
              {
                id: "ajouter-admin-atelier",
                icon: <Plus className="w-5 h-5" />,
                label: "Ajouter Administrateur",
                path: "/superAdmin/admins-ateliers/ajouter",
              },
            ],
          },
          {
            id: "abonnements",
            label: "Abonnements",
            icon: <HandCoins className="w-5 h-5" />,
            path: "/superAdmin/abonnements",
          },
        ]
      : userRole === "technicien"
      ? [
          {
            id: "sectionTechnicien",
            label: "Section Technicien",
            icon: <Users className="w-5 h-5" />,
            path: "/sectionTechnicien",
          },
        ]
      : userRole === "admin"
      ? [
          {
            id: "dashboard",
            label: "Tableau de bord",
            icon: <Home className="w-5 h-5" />,
            path: "/dashboard",
          },
          {
            id: "services",
            label: "Services",
            icon: <Wrench className="w-5 h-5" />,
            path: "/services",
            hasSubmenu: true,
            submenu: [
              {
                id: "ajouter-service",
                icon: <Plus className="w-5 h-5" />,
                label: "Ajouter Service",
                path: "/services/ajouter",
              },
            ],
          },
          {
            id: "techniciens",
            label: "Techniciens",
            icon: <UserCog2Icon className="w-5 h-5" />,
            path: "/techniciens",
            hasSubmenu: true,
            submenu: [
              {
                id: "ajouter-technicien",
                icon: <Plus className="w-5 h-5" />,
                label: "Ajouter Technicien",
                path: "/techniciens/ajouter",
              },
            ],
          },
          {
            id: "clients",
            label: "Clients",
            icon: <Users className="w-5 h-5" />,
            path: "/clients",
            hasSubmenu: true,
            submenu: [
              {
                id: "ajouter-client",
                icon: <Plus className="w-5 h-5" />,
                label: "Ajouter Clinet",
                path: "/clients/ajouter",
              },
            ],
          },
          {
            id: "admins",
            label: "Administrateurs",
            icon: <ShieldUser className="w-5 h-5" />,
            path: "/admins",
            hasSubmenu: true,
            submenu: [
              {
                id: "ajouter-admin",
                icon: <Plus className="w-5 h-5" />,
                label: "Ajouter Administrateur",
                path: "/admins/ajouter",
              },
            ],
          },
          {
            id: "fiches",
            label: "Mes Fiches",
            icon: <NotepadText className="w-5 h-5" />,
            path: "/fiches",
            hasSubmenu: true,
            submenu: [
              {
                id: "ajouter-fiche",
                icon: <Plus className="w-5 h-5" />,
                label: "Ajouter Fiche",
                path: "/fiches/ajouter",
              },
            ],
          },
          {
            id: "paiements",
            label: "Paiements",
            icon: <CreditCard className="w-5 h-5" />,
            path: "/paiements",
            hasSubmenu: true,
            submenu: [
              {
                id: "ajouter-paiement",
                icon: <CreditCard className="w-5 h-5" />,
                label: "Ajouter Paiement",
                path: "/paiements/ajouter_paiement",
              },
            ],
          },
          {
            id: "stock",
            label: "Stock",
            icon: <Box className="w-5 h-5" />,
            path: "/stock",
          },
        ]
      : userRole === "client"
      ? [
          {
            id: "sectionClient",
            label: "Mes Fiches",
            icon: <NotepadText className="w-5 h-5" />,
            path: "/sectionClient",
          },
        ]
      : [];

  // Prevent rendering sidebar/routes until userRole is loaded or error occurs
  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="mb-6">
            <SyncLoader />
          </div>
          <div className="text-xl font-semibold text-gray-700 mb-2">
            Vérification des permissions...
          </div>
          <div className="text-sm text-gray-500">
            Chargement de votre profil utilisateur
          </div>
        </div>
      </div>
    );
  }

  // Show error if user has no role
  if (roleError || !userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md mx-auto text-center shadow-lg">
          <div className="text-red-600 mb-6">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            Problème d'accès
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {roleError ||
              "Aucun rôle attribué à votre compte. Veuillez contacter votre administrateur."}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setRoleLoading(true);
                setRoleError(null);
                fetchUserRole();
              }}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Réessayer
            </button>
            <button
              onClick={handleLogout}
              className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  const toggleSidebar = () => {
    const wasOpen = sidebarOpen;
    setSidebarOpen(!sidebarOpen);

    // Only animate items when opening the sidebar
    if (!wasOpen) {
      setShouldAnimateItems(true);
      setTimeout(() => setShouldAnimateItems(false), 4000);
    }
  };

  const toggleSidebarCollapse = () => {
    const wasCollapsed = sidebarCollapsed;
    setSidebarCollapsed(!sidebarCollapsed);

    if (wasCollapsed) {
      setShouldAnimateItems(true);
      setTimeout(() => setShouldAnimateItems(false), 1200);
    }
  };

  const handleItemClick = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const getCurrentPageTitle = (): React.ReactNode => {
    const currentItem = sidebarItems.find(
      (item) => item.path === location.pathname
    );
    if (currentItem) {
      return (
        <span className="flex items-center gap-2">
          <span className="text-blue-700">{currentItem.icon}</span>
          <span className="text-gray-700">{currentItem.label}</span>
        </span>
      );
    }

    // Check submenus
    for (const item of sidebarItems) {
      if (item.submenu) {
        const subItem = item.submenu.find(
          (sub) => sub.path === location.pathname
        );
        if (subItem) {
          return (
            <span className="flex items-center gap-2">
              <span className="text-blue-700">{subItem.icon}</span>
              <span className="text-gray-800">{subItem.label}</span>
            </span>
          );
        }
      }
    }

    return "Modification";
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      <style>
        {`
          @keyframes slideIn {
            0% {
              opacity: 0;
              transform: translateX(-30px);
            }
            100% {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes briefcasePulse {
            0% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.1);
              box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
            }
            100% {
              transform: scale(1);
            }
          }
          .animate-slide-in {
            animation: slideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
          .submenu-transition {
            transition: max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s;
          }
          @keyframes sidebarSlideIn {
            0% { opacity: 0; transform: translateX(-40px); }
            100% { opacity: 1; transform: translateX(0); }
          }
          .sidebar-slide-in {
            animation: sidebarSlideIn 0.2s cubic-bezier(0.4,0,0.2,1);
          }
        `}
      </style>
      <div className="flex h-screen bg-gray-100 relative">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {sidebarCollapsed && hoveredItem && (
          <div
            className="fixed px-3 py-2 bg-gray-900 text-white text-sm rounded-md shadow-lg whitespace-nowrap pointer-events-none z-[9999]"
            style={{
              left: "72px",
              top: (() => {
                const el = document.querySelector(
                  `[data-item-id="${hoveredItem}"]`
                );
                if (!el) return "0px";
                const rect = el.getBoundingClientRect();
                return `${rect.top + (rect.height || 0) / 2 - 16}px`;
              })(),
            }}
          >
            {sidebarItems.find((item) => item.id === hoveredItem)?.label}
            <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
          </div>
        )}

        <div
          className={`
          fixed md:static inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-all duration-400 ease-in-out flex flex-col
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }
          ${sidebarCollapsed ? "w-16" : "w-64"}
          ${sidebarOpen ? "sidebar-slide-in" : ""}
        `}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <div
              className={`flex items-center ${
                sidebarCollapsed ? "justify-center w-full" : "space-x-3"
              }`}
            >
              <button
                onClick={toggleSidebarCollapse}
                className="mb-4"
                title={sidebarCollapsed ? "Développer le menu" : "Admin Panel"}
              >
                {sidebarCollapsed ? (
                  <Menu className="w-5 h-5 text-gray-500" />
                ) : null}
              </button>
              {!sidebarCollapsed && (
                <h2
                  className={`text-lg font-semibold text-gray-800 mb-2  ${
                    shouldAnimateItems ? "animate-slide-in" : ""
                  }`}
                >
                  {nom_atelier ? `${nom_atelier}` : "Super Admin"}
                </h2>
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleSidebarCollapse}
                  className="hidden md:block p-2 rounded-lg hover:bg-gray-50 hover:opacity-50 transition-colors"
                  title="Réduire le menu"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={toggleSidebar}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {sidebarItems.map((item, index) => (
                <li key={item.id} className="relative">
                  <div className="flex items-center">
                    <Link
                      to={item.path}
                      data-item-id={item.id}
                      onClick={handleItemClick}
                      onMouseEnter={() =>
                        sidebarCollapsed && setHoveredItem(item.id)
                      }
                      onMouseLeave={() =>
                        sidebarCollapsed && setHoveredItem(null)
                      }
                      className={`
                        group w-full flex items-center px-3 py-2.5 rounded-lg text-left
                        transition-all duration-200 ease-in-out relative
                        ${
                          isActiveRoute(item.path)
                            ? "text-blue-700 border-r-2 border-blue-700"
                            : "text-gray-700 hover:bg-gray-50 hover:opacity-50 hover:text-gray-700"
                        }
                        ${
                          sidebarCollapsed
                            ? "justify-center"
                            : "justify-between"
                        }
                        ${sidebarCollapsed ? "opacity-80" : "opacity-100"}
                        ${
                          shouldAnimateItems &&
                          (sidebarOpen || !sidebarCollapsed)
                            ? "animate-slide-in"
                            : ""
                        }
                      `}
                      style={{
                        transitionProperty:
                          "background, color, box-shadow, transform, opacity",
                        animationDelay:
                          shouldAnimateItems &&
                          (sidebarOpen || !sidebarCollapsed)
                            ? `${index * 30}ms`
                            : "0ms",
                      }}
                    >
                      <div
                        className={`flex items-center ${
                          sidebarCollapsed
                            ? "justify-center w-full"
                            : "space-x-3"
                        }`}
                      >
                        <span
                          className={`
                            ${
                              isActiveRoute(item.path)
                                ? "text-blue-700"
                                : "text-gray-500"
                            }
                            transition-colors duration-200
                          `}
                        >
                          {item.icon}
                        </span>
                        {!sidebarCollapsed && (
                          <span className="font-medium">{item.label}</span>
                        )}
                      </div>
                    </Link>
                    {!sidebarCollapsed && item.hasSubmenu && (
                      <button
                        type="button"
                        className={`ml-2 p-1 rounded hover:bg-gray-100 transition-colors ${
                          openSubmenu === item.id ? "rotate-90" : ""
                        }`}
                        onClick={() =>
                          setOpenSubmenu(
                            openSubmenu === item.id ? null : item.id
                          )
                        }
                        aria-label="Toggle submenu"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-400 transition-transform duration-200" />
                      </button>
                    )}
                  </div>
                  {!sidebarCollapsed && item.submenu && (
                    <ul
                      className={`ml-6 mt-1 space-y-1 submenu-transition ${
                        openSubmenu === item.id
                          ? "max-h-40 opacity-100"
                          : "max-h-0 opacity-0 pointer-events-none"
                      }`}
                      style={{ transitionProperty: "max-height, opacity" }}
                    >
                      {item.submenu.map((sub) => (
                        <li key={sub.id}>
                          <Link
                            to={sub.path}
                            className={`flex items-center px-3 py-2 rounded-lg text-sm ${
                              isActiveRoute(sub.path)
                                ? "rounded-lg border-r-2 border-blue-700 text-blue-700"
                                : "hover:opacity-50 hover:bg-gray-50 hover:text-gray-700 transition-colors text-gray-600"
                            }`}
                            onClick={handleItemClick}
                          >
                            <div
                              className={`flex items-center ${
                                sidebarCollapsed
                                  ? "justify-center w-full"
                                  : "space-x-3"
                              }`}
                            >
                              <span
                                className={`
                            ${
                              isActiveRoute(item.path)
                                ? "text-gray-700"
                                : "text-blue-700"
                            }
                            transition-colors duration-200
                          `}
                              >
                                {sub.icon}
                              </span>
                              {!sidebarCollapsed && (
                                <span className="font-medium">{sub.label}</span>
                              )}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {!sidebarCollapsed && (
            <div className="p-4 border-t border-gray-200 flex-shrink-0">
              <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {session.user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {session.user.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {session.user.email}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="ml-1 bg-white shadow-sm border-b border-gray-200 w-full px-2 sm:px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleSidebar}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>
                <div className="hidden md:block">
                  <h1 className="text-xl font-semibold">
                    {getCurrentPageTitle()}
                  </h1>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <LogOut className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Routes>
              {userRole === "super_admin" ? (
                <>
                  <Route
                    path="/superAdmin/Dashboard"
                    element={
                      <div className="px-1">
                        <SuperAdminDashboard />
                      </div>
                    }
                  />
                  <Route
                    path="/superAdmin/admins-ateliers"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <GererAdminsAteliers />
                      </div>
                    }
                  />
                  <Route
                    path="/superAdmin/admins-ateliers/ajouter"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <AjouterAdminAtelier />
                      </div>
                    }
                  />
                  <Route
                    path="/superAdmin/abonnements"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <GererAbonnements />
                      </div>
                    }
                  />
                  <Route
                    path="/superAdmin/Ateliers"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <GererAteliers />
                      </div>
                    }
                  />
                  <Route
                    path="/superAdmin/Ateliers/ajouter"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <AjouterAtelier />
                      </div>
                    }
                  />
                  <Route
                    path="/superAdmin/Ateliers/ModifierAboAtelier"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <ModifierAboAtelier />
                      </div>
                    }
                  />
                  <Route
                    path="/superAdmin/Ateliers/modifier"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <ModifierAtelier />
                      </div>
                    }
                  />
                  <Route
                    path="*"
                    element={<Navigate to="/superAdmin/Dashboard" replace />}
                  />
                </>
              ) : userRole === "client" ? (
                <>
                  <Route
                    path="/sectionClient"
                    element={
                      <div className="px-1">
                        <ConsulterFichesClients />
                      </div>
                    }
                  />
                  <Route
                    path="/sectionClient/details"
                    element={
                      <div className="px-1">
                        <DetailsFicheClient />
                      </div>
                    }
                  />
                  {/* Redirect all other routes to /sectionClient */}
                  <Route
                    path="*"
                    element={<Navigate to="/sectionClient" replace />}
                  />
                </>
              ) : userRole === "technicien" ? (
                <>
                  <Route
                    path="/sectionTechnicien"
                    element={
                      <div className="px-1">
                        <FichesTechnicien />
                      </div>
                    }
                  />
                  <Route
                    path="/sectionTechnicien/modifier"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <ModifierFichesTechnicien />
                      </div>
                    }
                  />
                  {/* Redirect all other routes to /sectionTechnicien */}
                  <Route
                    path="*"
                    element={<Navigate to="/sectionTechnicien" replace />}
                  />
                </>
              ) : userRole === "admin" ? (
                <>
                  <Route
                    path="/dashboard"
                    element={
                      <div className="px-1">
                        <Dashboard id_atelier={id_atelier} />
                      </div>
                    }
                  />
                  <Route
                    path="/services"
                    element={
                      <div className="px-1">
                        <GererServices id_atelier={id_atelier} />
                      </div>
                    }
                  />
                  <Route
                    path="/services/ajouter"
                    element={
                      <div className="ml-1 p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1 bg-white h-screen">
                        <AjouterService id_atelier={id_atelier} />
                      </div>
                    }
                  />
                  <Route
                    path="/services/modifier"
                    element={
                      <div className="ml-1 p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1 bg-white h-screen">
                        <ModifierService />
                      </div>
                    }
                  />
                  <Route
                    path="/techniciens"
                    element={
                      <div className="px-1">
                        <GererTechnicien id_atelier={id_atelier} />
                      </div>
                    }
                  />
                  <Route
                    path="/techniciens/ajouter"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <AjouterTechnicien id_atelier={id_atelier} />
                      </div>
                    }
                  />
                  <Route
                    path="/techniciens/modifier"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <ModifierTechnicien id_atelier={id_atelier} />
                      </div>
                    }
                  />
                  <Route
                    path="/clients"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <GererClient id_atelier={id_atelier} />
                      </div>
                    }
                  />
                  <Route
                    path="/clients/ajouter"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <AjouterClient id_atelier={id_atelier} />
                      </div>
                    }
                  />
                  <Route
                    path="/clients/modifier"
                    element={
                      <div className="ml-1 p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1 bg-white h-screen">
                        <ModifierClient />
                      </div>
                    }
                  />
                  <Route
                    path="/admins"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <GererAdmins
                          id_atelier={id_atelier}
                          id_admin={id_admin}
                          isSubAdmin={isSubAdmin}
                        />
                      </div>
                    }
                  />
                  <Route
                    path="/admins/ajouter"
                    element={
                      <MainAdminRoute isSubAdmin={isSubAdmin}>
                        <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                          <AjouterAdmin id_atelier={id_atelier} />
                        </div>
                      </MainAdminRoute>
                    }
                  />
                  <Route
                    path="/fiches"
                    element={
                      <div className="px-1">
                        <GererFiches
                          id_atelier={id_atelier}
                          nom_atelier={nom_atelier}
                        />
                      </div>
                    }
                  />
                  <Route
                    path="/fiches/ajouter"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <AjouterFiche id_atelier={id_atelier} />
                      </div>
                    }
                  />
                  <Route
                    path="/fiches/modifier"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <ModifierFiche id_atelier={id_atelier} />
                      </div>
                    }
                  />

                  <Route
                    path="/paiements"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <GererPaiements id_atelier={id_atelier} />
                      </div>
                    }
                  />
                  <Route
                    path="/paiements/ajouter_paiement"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <AjouterPaiement id_atelier={id_atelier} />
                      </div>
                    }
                  />
                  <Route
                    path="/paiements/modifier_paiement"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <ModifierPaiement id_atelier={id_atelier} />
                      </div>
                    }
                  />
                  <Route
                    path="/stock"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <GererStock id_atelier={id_atelier} />
                      </div>
                    }
                  />
                  <Route
                    path="/pieces"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <GererPieces id_atelier={id_atelier} />
                      </div>
                    }
                  />
                  <Route
                    path="/pieces/ajouter"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <AjouterPiece id_atelier={id_atelier} />
                      </div>
                    }
                  />
                  <Route
                    path="/pieces/modifier"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <ModifierPiece id_atelier={id_atelier} />
                      </div>
                    }
                  />
                  <Route
                    path="/categories_pieces"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <GererCategories id_atelier={id_atelier} />
                      </div>
                    }
                  />
                  <Route
                    path="/categories_pieces/ajouter"
                    element={
                      <div className="ml-1 p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1 bg-white h-full w-auto">
                        <AjouterCategorie id_atelier={id_atelier} />
                      </div>
                    }
                  />
                  <Route
                    path="/categories_pieces/modifier"
                    element={
                      <div className="ml-1 p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1 bg-white h-full w-auto">
                        <ModifierCategorie />
                      </div>
                    }
                  />
                  <Route
                    path="/categories_produits"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <GererCategoriesProduits id_atelier={id_atelier} />
                      </div>
                    }
                  />
                  <Route
                    path="/categories_produits/ajouter"
                    element={
                      <div className="ml-1 p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1 bg-white h-full w-auto">
                        <AjouterCategorieProduit id_atelier={id_atelier} />
                      </div>
                    }
                  />
                  <Route
                    path="/categories_produits/modifier"
                    element={
                      <div className="ml-1 p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1 bg-white h-full w-auto">
                        <ModifierCategorieProduit />
                      </div>
                    }
                  />
                  <Route
                    path="/marques"
                    element={
                      <div className="ml-1 bg-white p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1">
                        <GererMarques id_atelier={id_atelier} />
                      </div>
                    }
                  />
                  <Route
                    path="/marques/ajouter"
                    element={
                      <div className="ml-1 p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1 bg-white h-full w-auto">
                        <AjouterMarque id_atelier={id_atelier} />
                      </div>
                    }
                  />
                  <Route
                    path="/marques/modifier"
                    element={
                      <div className="ml-1 p-1 lg:mr-1 md:mr-1 sm:mr-1 xs:mr-1 bg-white h-full w-auto">
                        <ModifierMarque />
                      </div>
                    }
                  />

                  <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </>
              ) : userRole === "client" ? (
                <>
                  <Route
                    path="/sectionClient"
                    element={
                      <div className="px-1">
                        <ConsulterFichesClients />
                      </div>
                    }
                  />
                  <Route
                    path="/sectionClient/details"
                    element={
                      <div className="px-1">
                        <DetailsFicheClient />
                      </div>
                    }
                  />
                  <Route
                    path="*"
                    element={<Navigate to="/sectionClient" replace />}
                  />
                </>
              ) : null}
            </Routes>
          </main>
        </div>
      </div>
    </>
  );
}

// Main App Component with Router
function App() {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState<boolean>(true);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  logoutLoading;
  const [logoutError, setLogoutError] = useState<string | null>(null);
  logoutError;
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [id_atelier, setIdAtelier] = useState<number | null>(null);
  const [nom_atelier, setNomAtelier] = useState<string | null>("");
  const [id_admin, setIdAdmin] = useState<number | null>(null);
  const [isSubAdmin, setIsSubAdmin] = useState(false);
  useEffect(() => {
    const fetchAtelierInfo = async () => {
      if (!session?.user?.email) return;
      let currentIdAtelier = null;

      if (userRole === "admin") {
        const { data, error } = await supabase
          .from("admins")
          .select("id, id_atelier, isSub")
          .eq("email", session.user.email)
          .single();
        if (error) {
          console.error(
            "Erreur lors de la récupération de l'id de l'admin :",
            error
          );
          return;
        }
        setIdAdmin(data?.id);
        currentIdAtelier = data?.id_atelier;
        setIdAtelier(currentIdAtelier);
        setIsSubAdmin(data?.isSub);

        // Fetch nom_atelier for admin
        if (currentIdAtelier) {
          const { data: atelierData } = await supabase
            .from("ateliers")
            .select("nom_atelier")
            .eq("id", currentIdAtelier)
            .single();
          setNomAtelier(atelierData?.nom_atelier ?? "");
        } else {
          setNomAtelier(null);
        }
      } else if (userRole === "client") {
        const { data: clientData } = await supabase
          .from("clients")
          .select("id_atelier")
          .eq("email", session.user.email)
          .single();
        currentIdAtelier = clientData?.id_atelier;
        setIdAtelier(currentIdAtelier);

        if (currentIdAtelier) {
          const { data: atelierData } = await supabase
            .from("ateliers")
            .select("nom_atelier")
            .eq("id", currentIdAtelier)
            .single();
          setNomAtelier(atelierData?.nom_atelier ?? "");
        } else {
          setNomAtelier(null);
        }
      } else if (userRole === "technicien") {
        const { data: techData } = await supabase
          .from("techniciens")
          .select("id_atelier")
          .eq("email", session.user.email)
          .single();
        currentIdAtelier = techData?.id_atelier;
        setIdAtelier(currentIdAtelier);

        if (currentIdAtelier) {
          const { data: atelierData } = await supabase
            .from("ateliers")
            .select("nom_atelier")
            .eq("id", currentIdAtelier)
            .single();
          setNomAtelier(atelierData?.nom_atelier ?? "");
        } else {
          setNomAtelier(null);
        }
      } else {
        setIdAtelier(null);
        setNomAtelier(null);
      }

      // Check abonnement_atelier for is_paid
      if (userRole && userRole !== "super_admin" && currentIdAtelier) {
        const { data: abData, error: abError } = await supabase
          .from("abonnement_atelier")
          .select("id")
          .eq("id_atelier", currentIdAtelier)
          .eq("is_paid", true)
          .single();

        if (abError || !abData) {
          // Block access if no paid abonnement
          setRoleError(
            "Votre abonnement n'est pas actif. Veuillez contacter l'administration ou régler votre paiement."
          );
          setUserRole(null);
        }
      }
    };
    fetchAtelierInfo();
  }, [session?.user?.email, userRole]);

  // Logout handler: set online=false for the current user, then sign out
  const handleLogout = async () => {
    setLogoutLoading(true);
    setLogoutError(null);
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      const userEmail = currentSession?.user?.email;
      if (userEmail) {
        await supabase
          .from("profiles")
          .update({ online: false })
          .eq("email", userEmail);
      }
      await supabase.auth.signOut();
    } catch (err) {
      setLogoutError("Erreur lors de la déconnexion.");
    } finally {
      setLogoutLoading(false);
    }
  };

  const fetchUserRole = async () => {
    if (!session?.user) {
      setRoleLoading(false);
      return;
    }

    setRoleLoading(true);
    setRoleError(null);

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Error fetching user role:", error);
        setRoleError("Erreur lors du chargement du rôle utilisateur");
        setUserRole(null);
        return;
      }

      if (data && data.length > 0) {
        setUserRole(data[0].role);
      } else {
        // User has no role assigned
        setRoleError("Aucun rôle attribué à cet utilisateur");
        setUserRole(null);
      }
    } catch (err) {
      console.error("Unexpected error fetching user role:", err);
      setRoleError("Erreur inattendue lors du chargement du rôle");
      setUserRole(null);
    } finally {
      setRoleLoading(false);
    }
  };

  const fetchSession = async () => {
    setSessionLoading(true);
    try {
      const currentSession = await supabase.auth.getSession();
      setSession(currentSession.data.session);
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setUserRole(null);
    setRoleLoading(true);
    setRoleError(null);
    fetchUserRole();
  }, [session]);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (roleLoading) {
        setRoleError("Délai d'attente dépassé. Veuillez rafraîchir la page.");
        setRoleLoading(false);
      }
    }, 5000); // 5 seconds timeout

    return () => clearTimeout(timeout);
  }, [roleLoading]);

  // Set initial load complete after session and role are loaded
  useEffect(() => {
    if (!sessionLoading && !roleLoading) {
      // Add a small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setInitialLoadComplete(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [sessionLoading, roleLoading]);

  // Show loading during initial app load
  if (!initialLoadComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="mb-6">
            <SyncLoader />
          </div>
          <div className="text-xl font-semibold text-gray-700 mb-2">
            Chargement de l'application...
          </div>
          <div className="text-sm text-gray-500">
            Veuillez patienter pendant que nous initialisons votre session
          </div>
        </div>
      </div>
    );
  }

  // Show loading while fetching role (only after initial load)
  if (session && roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-5 h-5 border-4 border-blue-600 rounded-full animate-spin"></div>
          </div>
          <div className="text-xl font-semibold text-gray-700 mb-2">
            Vérification des permissions...
          </div>
          <div className="text-sm text-gray-500">
            Chargement de votre profil utilisateur
          </div>
        </div>
      </div>
    );
  }

  // Show error if user has no role (only after initial load)
  if (session && (roleError || !userRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md mx-auto text-center shadow-lg">
          <div className="text-red-600 mb-6">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            Problème d'accès
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {roleError ||
              "Aucun rôle attribué à votre compte. Veuillez contacter votre administrateur."}
          </p>
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Landing Page Route */}
        <Route path="/bienvenue" element={<LandingPage />} />

        {/* Public Route */}
        <Route
          path="/login"
          element={
            session ? (
              <Navigate
                to={
                  userRole === "technicien"
                    ? "/sectionTechnicien"
                    : "/dashboard"
                }
                replace
              />
            ) : (
              <Auth />
            )
          }
        />

        {/* If no session, redirect all other routes to landing page */}
        {!session && (
          <Route path="*" element={<Navigate to="/bienvenue" replace />} />
        )}

        {/* Protected Routes */}
        <Route element={<ProtectedRoute session={session} />}>
          <Route
            path="/*"
            element={
              <AppLayout
                session={session}
                handleLogout={handleLogout}
                id_atelier={id_atelier}
                id_admin={id_admin}
                isSubAdmin={isSubAdmin}
                nom_atelier={nom_atelier}
              />
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
