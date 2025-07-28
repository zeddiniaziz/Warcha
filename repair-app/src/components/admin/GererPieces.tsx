import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
  XCircle,
  DollarSign,
} from "lucide-react";
import { supabase } from "../../supabase-client";
import ModernSelect from "../ModernSelect";

interface Familles_Pieces {
  id: number;
  type: string;
  active: boolean;
}

interface Piece {
  id: number;
  nom_piece: string;
  type: number;
  prix_achat: number;
  prix_vente: number;
  qte_stock?: number;
  created_at?: string;
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

function GererPieces({ id_atelier }: { id_atelier: number | null }) {
  const navigate = useNavigate();
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [famillesPieces, setFamillesPieces] = useState<Familles_Pieces[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterPrixMin, setFilterPrixMin] = useState("");
  const [filterPrixMax, setFilterPrixMax] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  // Fetch all data
  const fetchPieces = async () => {
    const { data, error } = await supabase.from("pieces").select("*").eq("id_atelier", id_atelier);
    if (!error) setPieces(data || []);
  };
  const fetchFamillesPieces = async () => {
    const { data, error } = await supabase.from("familles_pieces").select("*").eq("id_atelier", id_atelier).eq("active", true);
    if (!error) setFamillesPieces(data || []);
  };

  useEffect(() => {
    fetchPieces();
    fetchFamillesPieces();
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

  const SupprimerPiece = async (id: number) => {
    showConfirmDialog(
      "Supprimer la pièce",
      "Êtes-vous sûr de vouloir supprimer cette pièce ? Cette action est irréversible.",
      async () => {
        const { error } = await supabase.from("pieces").delete().eq("id", id);
        if (error) {
          showToast("error", "Erreur lors de la suppression !");
          return;
        }
        showToast("success", "Pièce supprimée avec succès !");
        fetchPieces();
      }
    );
  };

  // Helpers
  const getTypePiece = (id?: number | null) => {
    if (!id) return "";
    const tp = famillesPieces.find((tp) => tp.id === id);
    return tp ? tp.type : "";
  };

  // Filtered pieces (search + type + price)
  const filteredPieces = pieces.filter((piece) => {
    const matchSearch =
      (piece.nom_piece?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (getTypePiece(piece.type)?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (piece.prix_achat?.toString() || "").includes(searchTerm) ||
      (piece.prix_vente?.toString() || "").includes(searchTerm);

    let matchType = true;
    if (filterType && filterType !== "Tous les types" && filterType !== "all") {
      matchType =
        getTypePiece(piece.type)?.toLowerCase() === filterType.toLowerCase();
    }

    let matchPrixMin = true;
    if (filterPrixMin && piece.prix_vente) {
      const minPrix = parseFloat(filterPrixMin);
      matchPrixMin = piece.prix_vente >= minPrix;
    }
    let matchPrixMax = true;
    if (filterPrixMax && piece.prix_vente) {
      const maxPrix = parseFloat(filterPrixMax);
      matchPrixMax = piece.prix_vente <= maxPrix;
    }

    return matchSearch && matchType && matchPrixMin && matchPrixMax;
  });

  // Stats
  const formatNumber = (number: number) =>
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    })
      .format(number)
      .replace(",", ".");

  const totalPieces = pieces.length;
  const totalPrixAchat = pieces.reduce(
    (sum, p) =>
      sum +
      (typeof p.prix_achat === "number" && typeof p.qte_stock === "number"
        ? p.prix_achat * p.qte_stock
        : 0),
    0
  );
  const totalPrixVente = pieces.reduce(
    (sum, p) =>
      sum +
      (typeof p.prix_vente === "number" && typeof p.qte_stock === "number"
        ? p.prix_vente * p.qte_stock
        : 0),
    0
  );

  const totalQteStock = pieces.reduce(
    (sum, p) => sum + (typeof p.qte_stock === "number" ? p.qte_stock : 0),
    0
  );

  // Send piece data to ModifierPiece via navigation state
  const handleEdit = (piece: Piece) => {
    navigate("/pieces/modifier", { state: { piece } });
  };

  // Type options for filter
  const typeOptions = famillesPieces.map((f) => f.type);

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
                Mes Pièces
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Gérez vos pièces en stock
              </p>
            </div>
            <button
              onClick={() => navigate("/pieces/ajouter")}
              className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Ajouter une Pièce</span>
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
                Total Pièces
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                {totalPieces}
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                  {totalQteStock} Pièces en stock
                </p>
              </p>
            </div>
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-600 rounded"></div>
            </div>
          </div>
        </div>
        {/* Total Prix Achat */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                Total Prix Achat
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                {formatNumber(totalPrixAchat)} DT
              </p>
            </div>
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-300 rounded"></div>
            </div>
          </div>
        </div>
        {/* Total Prix Vente */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                Total Prix Vente
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                {formatNumber(totalPrixVente)} DT
              </p>
            </div>
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-600 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Search Bar & Filter */}
        <div className="bg-white rounded-lg border border-gray-200 mb-4 sm:mb-6">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <div className="space-y-3 sm:space-y-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher une pièce..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm sm:text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="mt-3 w-full">
                <ModernSelect
                  options={typeOptions}
                  value={filterType}
                  onChange={(value) => setFilterType(value as string)}
                  placeholder="Tous les types"
                  searchPlaceholder="Rechercher un type"
                  icon={<Filter className="inline h-4 w-4 text-gray-500" />}
                  label="Filtrer par type"
                  required
                />
              </div>
              {/* Price Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <DollarSign className="w-4 h-5 text-gray-600 mr-2" />
                    Prix minimum
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="0.000"
                      value={filterPrixMin}
                      onChange={(e) => setFilterPrixMin(e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg  transition-colors duration-200 text-sm bg-white hover:border-gray-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
                    />
                    {filterPrixMin && (
                      <button
                        onClick={() => setFilterPrixMin("")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200 z-10 bg-white"
                        title="Effacer le filtre de prix minimum"
                        aria-label="Effacer le filtre de prix minimum"
                        type="button"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <DollarSign className="w-4 h-5 text-gray-600 mr-2" />
                    Prix maximum
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="0.000"
                      value={filterPrixMax}
                      onChange={(e) => setFilterPrixMax(e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg  transition-colors duration-200 text-sm bg-white hover:border-gray-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
                    />
                    {filterPrixMax && (
                      <button
                        onClick={() => setFilterPrixMax("")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200 z-10 bg-white"
                        title="Effacer le filtre de prix maximum"
                        aria-label="Effacer le filtre de prix maximum"
                        type="button"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Filters Summary */}
              {(filterType &&
                filterType !== "Tous les types" &&
                filterType !== "all") ||
              filterPrixMin ||
              filterPrixMax ? (
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">
                      Filtres actifs:
                    </span>
                    {filterType &&
                      filterType !== "Tous les types" &&
                      filterType !== "all" && (
                        <span className="inline-flex items-center px-2 py-1 bg-green-50 text-gray-900 text-xs font-medium rounded-full">
                          {filterType}
                          <button
                            onClick={() => setFilterType("")}
                            className="ml-1 text-green-700 hover:text-red-500"
                            title="Effacer le filtre de type"
                            aria-label="Effacer le filtre de type"
                            type="button"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                    {filterPrixMin && (
                      <span className="inline-flex items-center px-2 py-1 bg-green-50 text-gray-900 text-xs font-medium rounded-full">
                        Prix min: {filterPrixMin} DT
                        <button
                          onClick={() => setFilterPrixMin("")}
                          className="ml-1 text-green-700 hover:text-red-500"
                          title="Effacer le filtre de prix minimum"
                          aria-label="Effacer le filtre de prix minimum"
                          type="button"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {filterPrixMax && (
                      <span className="inline-flex items-center px-2 py-1 bg-green-50 text-gray-900 text-xs font-medium rounded-full">
                        Prix max: {filterPrixMax} DT
                        <button
                          onClick={() => setFilterPrixMax("")}
                          className="ml-1 text-green-700 hover:text-red-500"
                          title="Effacer le filtre de prix maximum"
                          aria-label="Effacer le filtre de prix maximum"
                          type="button"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom Pièce
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix Achat
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix Vente
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date De Création
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPieces.length > 0 ? (
                filteredPieces.map((piece) => (
                  <tr key={piece.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div
                        className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none"
                        title={piece.nom_piece}
                      >
                        {piece.nom_piece}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 max-w-[100px] sm:max-w-none truncate">
                        {getTypePiece(piece.type)}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div
                        className="text-xs sm:text-sm text-gray-900 truncate max-w-[100px] sm:max-w-none"
                        title={piece.prix_achat?.toString()}
                      >
                        {typeof piece.prix_achat === "number"
                          ? piece.prix_achat.toFixed(3) + " DT"
                          : "-"}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div
                        className="text-xs sm:text-sm text-gray-900 truncate max-w-[100px] sm:max-w-none"
                        title={piece.prix_vente?.toString()}
                      >
                        {typeof piece.prix_vente === "number"
                          ? piece.prix_vente.toFixed(3) + " DT"
                          : "-"}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div
                        className="text-xs sm:text-sm text-gray-900 truncate max-w-[100px] sm:max-w-none"
                        title={piece.qte_stock?.toString()}
                      >
                        {typeof piece.qte_stock === "number"
                          ? piece.qte_stock
                          : "-"}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div
                        className="text-xs sm:text-sm text-gray-900 truncate max-w-[120px] sm:max-w-none"
                        title={piece.created_at}
                      >
                        {piece.created_at
                          ? new Date(piece.created_at).toLocaleString()
                          : "-"}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                      <div className="flex justify-end space-x-1 sm:space-x-2">
                        <button
                          onClick={() => handleEdit(piece)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Modifier"
                        >
                          <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => SupprimerPiece(piece.id)}
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
                  <td colSpan={6} className="px-3 py-8 text-center">
                    <div className="text-gray-500">
                      <Search className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm sm:text-base">
                        Aucune pièce trouvée
                      </p>
                      <p className="text-xs sm:text-sm mt-1">
                        Ajustez votre recherche ou ajoutez une nouvelle pièce
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
  );
}

export default GererPieces;
