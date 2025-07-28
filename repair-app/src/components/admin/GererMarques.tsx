import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  XCircle,
  Edit2,
} from "lucide-react";
import { supabase } from "../../supabase-client";

interface Marque {
  id: number;
  nom: string;
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

function GererMarques({ id_atelier }: { id_atelier: number | null }) {
  const navigate = useNavigate();
  const [marques, setMarques] = useState<Marque[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  // Fetch all marques
  const fetchMarques = async () => {
    const { data, error } = await supabase.from("marques").select("*").eq("id_atelier", id_atelier);
    if (!error) setMarques(data || []);
  };

  useEffect(() => {
    fetchMarques();
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

  const SupprimerMarque = async (id: number) => {
    showConfirmDialog(
      "Supprimer la marque",
      "Êtes-vous sûr de vouloir supprimer cette marque ? Cette action est irréversible.",
      async () => {
        const { error } = await supabase.from("marques").delete().eq("id", id);
        if (error) {
          showToast("error", "Erreur lors de la suppression !");
          return;
        }
        showToast("success", "Marque supprimée avec succès !");
        fetchMarques();
      }
    );
  };

  // Pass marque to ModifierMarque
  const handleEdit = (marque: Marque) => {
    navigate("/marques/modifier", { state: { marque } });
  };

  // Filtered marques (search)
  const filteredMarques = marques.filter((marque) =>
    (marque.nom?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  // Stats
  const totalMarques = marques.length;

  return (
    <div className="min-h-screen bg-gray-50">
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
                Marques
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Gérez vos marques
              </p>
            </div>
            <button
              onClick={() => navigate("/marques/ajouter")}
              className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Ajouter une Marque</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                Total Marques
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                {totalMarques}
              </p>
            </div>
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-600 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Search Bar */}
        <div className="bg-white rounded-lg border border-gray-200 mb-4 sm:mb-6">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <div className="relative w-full sm:w-1/2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher une marque..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom Marque
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMarques.length > 0 ? (
                  filteredMarques.map((marque) => (
                    <tr key={marque.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div
                          className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none"
                          title={marque.nom}
                        >
                          {marque.nom}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                        <div className="flex justify-end space-x-1 sm:space-x-2">
                          <button
                            onClick={() => handleEdit(marque)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Modifier"
                          >
                            <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => SupprimerMarque(marque.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-3 py-8 text-center">
                      <div className="text-gray-500">
                        <Search className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm sm:text-base">
                          Aucune marque trouvée
                        </p>
                        <p className="text-xs sm:text-sm mt-1">
                          Ajustez votre recherche ou ajoutez une nouvelle marque
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GererMarques;