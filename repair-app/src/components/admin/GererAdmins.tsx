import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  XCircle,
  Phone,
  Mail,
  Calendar,
  Filter,
  Check,
} from "lucide-react";
import { supabase } from "../../supabase-client";
import { useNavigate } from "react-router-dom";
import ModernSelect from "../ModernSelect";

interface Admin {
  id: number;
  nom_admin: string;
  telephone: string;
  email: string;
  password: string;
  created_at?: string;
  user_id?: string;
  isSub?: boolean;
}

interface Toast {
  id: number;
  type: "success" | "error" | "warning";
  message: string;
}

interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function GererAdmins({
  id_atelier,
  id_admin,
  isSubAdmin,
}: {
  id_atelier: number | null;
  id_admin: number | null;
  isSubAdmin: boolean;
}) {
  id_admin;
  const [fetchedAdmins, setFetchedAdmins] = useState<Admin[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
  });
  const [profiles, setProfiles] = useState<
    { email: string; online: boolean; last_login?: string }[]
  >([]);
  const [cardGridCols, setCardGridCols] = useState(
    "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  );
  const [filterOnlineInput, setFilterOnlineInput] = useState<string>("");
  const navigate = useNavigate();

  const fetchAdmins = async () => {
    const { error, data } = await supabase
      .from("admins")
      .select("*")
      .eq("id_atelier", id_atelier);
    if (error) {
      console.error("Erreur lors de l'affichage des administrateurs :", error);
      return;
    }
    setFetchedAdmins(data);
  };
  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("email, online, last_login");
    if (!error && data) setProfiles(data);
  };

  useEffect(() => {
    function updateGridCols() {
      const ratio = window.devicePixelRatio || 1;
      let cols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
      if (ratio <= 0.9) {
        cols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
      } else if (ratio > 0.9 && ratio <= 1.45) {
        cols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      } else if (ratio > 1.65 && ratio <= 1.95) {
        cols = "grid-cols-1 md:grid-cols-2";
      } else if (ratio > 2.0) {
        cols = "grid-cols-1";
      }
      setCardGridCols(cols);
    }
    updateGridCols();
    window.addEventListener("resize", updateGridCols);
    return () => window.removeEventListener("resize", updateGridCols);
  }, []);

  useEffect(() => {
    fetchAdmins();
    fetchProfiles();
  }, []);

  // Toast functions
  const showToast = (
    type: "success" | "error" | "warning",
    message: string
  ) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Confirmation dialog functions
  const showConfirmDialog = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setConfirmDialog((prev) => ({ ...prev, isOpen: false })),
    });
  };

  const SupprimerAdmin = async (id: number) => {
    showConfirmDialog(
      "Supprimer l'administrateur",
      "Êtes-vous sûr de vouloir supprimer cet administrateur ? Cette action est irréversible.",
      async () => {
        const { error } = await supabase.from("admins").delete().eq("id", id);
        if (error) {
          console.error("Erreur lors de la suppression de l'administrateur");
          showToast(
            "error",
            "Erreur lors de la suppression de l'administrateur"
          );
          return;
        }
        showToast("success", "Administrateur supprimé avec succès !");
        fetchAdmins();
      }
    );
  };

  // Helper to check if admin is online
  const isAdminOnline = (email: string) => {
    const profile = profiles.find((p) => p.email === email);
    return profile?.online ?? false;
  };
  // Helper to get last_login for an admin
  const getAdminLastLogin = (email: string) => {
    const profile = profiles.find((p) => p.email === email);
    return profile?.last_login || null;
  };

  // Helper to format 'depuis' string for last_login
  const formatSince = (dateString: string) => {
    if (!dateString) return "";
    const now = new Date();
    const last = new Date(dateString);
    const diffMs = now.getTime() - last.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);
    const diffW = Math.floor(diffD / 7);
    const diffM = Math.floor(diffD / 30);
    const diffY = Math.floor(diffD / 365);
    if (diffMin < 1) return "à l'instant";
    if (diffMin === 1) return "1 min";
    if (diffMin < 60) return `${diffMin} min`;
    if (diffH === 1) return "1 heure";
    if (diffH < 24) return `${diffH} heures`;
    if (diffD === 1) return "1 jour";
    if (diffD < 7) return `${diffD} jours`;
    if (diffW === 1) return "1 semaine";
    if (diffW < 4) return `${diffW} semaines`;
    if (diffM === 1) return "1 mois";
    if (diffM < 12) return `${diffM} mois`;
    if (diffY === 1) return "1 an";
    return `${diffY} ans`;
  };

  // Filter admins based on search and online status
  const filteredAdmins = fetchedAdmins.filter((admin) => {
    const matchesSearch =
      admin.nom_admin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.telephone.includes(searchTerm) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesOnline = true;
    if (filterOnlineInput && filterOnlineInput !== "Tous") {
      if (filterOnlineInput === "En ligne") {
        matchesOnline = isAdminOnline(admin.email);
      } else if (filterOnlineInput === "Hors ligne") {
        matchesOnline = !isAdminOnline(admin.email);
      }
    }
    return matchesSearch && matchesOnline;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-2 sm:right-4 z-50 space-y-2 max-w-[calc(100vw-1rem)] sm:max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center p-3 sm:p-4 rounded-lg shadow-lg transition-all duration-300 w-full ${
              toast.type === "success"
                ? "bg-green-50 border border-green-200"
                : toast.type === "error"
                ? "bg-red-50 border border-red-200"
                : "bg-orange-50 border border-orange-200"
            }`}
          >
            <div className="flex-shrink-0 mr-2 sm:mr-3">
              {toast.type === "success" && (
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              )}
              {toast.type === "error" && (
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
              )}
              {toast.type === "warning" && (
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-xs sm:text-sm font-medium break-words ${
                  toast.type === "success"
                    ? "text-green-800"
                    : toast.type === "error"
                    ? "text-red-800"
                    : "text-orange-800"
                }`}
              >
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className={`ml-2 sm:ml-3 text-gray-400 hover:text-gray-600 flex-shrink-0 ${
                toast.type === "success"
                  ? "hover:text-green-600"
                  : toast.type === "error"
                  ? "hover:text-red-600"
                  : "hover:text-orange-600"
              }`}
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm sm:max-w-md">
            <div className="p-4 sm:p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 break-words">
                    {confirmDialog.title}
                  </h3>
                </div>
              </div>
              <div className="mb-4 sm:mb-6">
                <p className="text-sm text-gray-500 break-words">
                  {confirmDialog.message}
                </p>
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
                <button
                  onClick={confirmDialog.onCancel}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-blue-600 truncate">
                Administrateurs
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Gérez vos administrateurs
              </p>
            </div>
            {isSubAdmin === false && (
              <button
                onClick={() => navigate("/admins/ajouter")}
                className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="whitespace-nowrap">
                  Ajouter un Administrateur
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                  Total Administrateurs
                </p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                  {fetchedAdmins.length}
                </p>
              </div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-600 rounded"></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                  En ligne
                </p>
                <p className="text-xl sm:text-2xl font-semibold text-green-600">
                  {fetchedAdmins.filter((a) => isAdminOnline(a.email)).length}
                </p>
              </div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                  Hors ligne
                </p>
                <p className="text-xl sm:text-2xl font-semibold text-red-500">
                  {fetchedAdmins.filter((a) => !isAdminOnline(a.email)).length}
                </p>
              </div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                <X className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 mb-4 sm:mb-6">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <div className="space-y-3 sm:space-y-4">
              {/* Search Bar */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher un administrateur..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm sm:text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filter Row */}
              <ModernSelect
                options={["Tous", "En ligne", "Hors ligne"]}
                value={filterOnlineInput}
                onChange={(value) => setFilterOnlineInput(value as string)}
                placeholder="Tous"
                searchPlaceholder="Filtrer par statut"
                icon={<Filter className="inline h-4 w-4 text-gray-500" />}
                label="Filtrer par statut"
                required
              />

              {/* Active Filters Summary */}
              {filterOnlineInput && filterOnlineInput !== "Tous" && (
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">
                      Filtres actifs:
                    </span>
                    <span className="inline-flex items-center px-2 py-1 bg-green-50 text-gray-900 text-xs font-medium rounded-full">
                      {filterOnlineInput}
                      <button
                        onClick={() => setFilterOnlineInput("")}
                        className="ml-1 text-green-700 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modern Profile Cards */}
          <div className="p-4">
            {filteredAdmins.length === 0 ? (
              <div className="min-h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun administrateur trouvé
                  </h3>
                  <p className="text-sm text-gray-500">
                    Ajustez vos filtres ou ajoutez un nouvel administrateur
                  </p>
                </div>
              </div>
            ) : (
              <div className={`grid ${cardGridCols} gap-6`}>
                {filteredAdmins.map((admin) => (
                  <div
                    key={admin.id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-400 overflow-hidden group relative"
                  >
                    {/* Header Background */}
                    <div className="h-16 bg-white relative">
                      {/* Action buttons */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isSubAdmin === false && (
                          <button
                            onClick={() => SupprimerAdmin(admin.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Profile Content */}
                    <div className="px-4 pb-4 -mt-6 relative">
                      {/* Profile Picture */}
                      <div
                        className={`w-16 h-16 bg-white rounded-full  ${
                          isAdminOnline(admin.email)
                            ? "border-4 border-green-500"
                            : "border-0 border-gray-400"
                        } flex items-center justify-center mb-3`}
                      >
                        <div className="w-full h-full bg-yellow-300 rounded-full flex items-center justify-center text-white text-lg font-bold">
                          {admin.nom_admin.charAt(0).toUpperCase()}
                        </div>
                      </div>

                      {/* Name and Status */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 text-lg truncate">
                            {admin.nom_admin}
                          </h3>
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              isAdminOnline(admin.email)
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }`}
                            title={
                              isAdminOnline(admin.email)
                                ? "En ligne"
                                : "Hors ligne"
                            }
                          />
                        </div>
                        <p className="text-gray-500 text-sm">
                          @{admin.nom_admin.toLowerCase().replace(/\s+/g, "")}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex gap-4 mb-3 text-sm">
                        <div>
                          <span className="text-gray-500 ml-1">Statut</span>

                          {isAdminOnline(admin.email) ? (
                            <span className="font-bold text-green-500">
                              &nbsp; En ligne
                            </span>
                          ) : (
                            <span className="font-bold text-gray-500">
                              &nbsp; Hors ligne
                              {getAdminLastLogin(admin.email) && (
                                <span className="text-xs text-gray-400 ml-1">
                                  depuis{" "}
                                  {formatSince(getAdminLastLogin(admin.email)!)}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{admin.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span className="truncate">{admin.telephone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span className="truncate">
                            Créé le{" "}
                            {admin.created_at
                              ? new Date(admin.created_at).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredAdmins.length > 0 && (
            <div className="bg-gray-50 px-3 sm:px-6 py-3 border-t border-gray-200">
              <div className="text-xs sm:text-sm text-gray-700">
                Affichage de{" "}
                <span className="font-medium">{filteredAdmins.length}</span>{" "}
                administrateur(s) sur{" "}
                <span className="font-medium">{fetchedAdmins.length}</span>{" "}
                total
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GererAdmins;
