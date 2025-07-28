import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  HandCoins,
} from "lucide-react";
import { supabase } from "../../supabase-client";
import { useNavigate } from "react-router-dom";

// Types for joined data
interface AbonnementAtelier {
  id: number;
  created_at?: string;
  date_debut?: string;
  date_fin?: string;
  id_atelier: number;
  id_abonnement: number;
  is_paid: boolean;
  duree?: number;
  prix_paye?: number;
  // Joined fields
  atelier?: {
    nom_atelier: string;
    id_admin: number;
    admin?: {
      nom_admin: string;
    };
  };
  abonnement?: {
    nom: string;
    prix: number;
  };
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

function GererAteliers() {
  const navigate = useNavigate();
  const [fetchedAteliers, setFetchedAteliers] = useState<AbonnementAtelier[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");
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

  // Fetch abonnement_atelier with joins
  const fetchAteliers = async () => {
    const { data, error } = await supabase.from("abonnement_atelier").select(
      `
        *,
        ateliers (
          nom_atelier,
          id_admin,
          admins!ateliers_id_admin_fkey (
            nom_admin
          )
        ),
        abonnements (
          nom,
          prix
        )
      `
    );
    if (error) {
      console.error("Erreur lors de l'affichage des ateliers :", error);
      return;
    }
    // Map joined fields for easier access
    const mapped = (data as any[]).map((row) => ({
      ...row,
      atelier: {
        ...row.ateliers,
        admin: row.ateliers?.admins?.[0] || row.ateliers?.admins, // admins is an array
      },
      abonnement: row.abonnements,
    }));
    setFetchedAteliers(mapped);
  };

  useEffect(() => {
    fetchAteliers();
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

  const supprimerAtelier = async (id: number) => {
    showConfirmDialog(
      "Supprimer l'abonnement atelier",
      "Êtes-vous sûr de vouloir supprimer cet abonnement atelier ? Cette action est irréversible.",
      async () => {
        const { error } = await supabase
          .from("abonnement_atelier")
          .delete()
          .eq("id", id);
        if (error) {
          console.error(
            "Erreur lors de la suppression de l'abonnement atelier"
          );
          showToast(
            "error",
            "Erreur lors de la suppression de l'abonnement atelier"
          );
          return;
        }
        showToast("success", "Abonnement atelier supprimé avec succès !");
        fetchAteliers();
      }
    );
  };

  // Filtering logic
  const filteredAteliers = fetchedAteliers.filter((item) => {
    const matchesSearch =
      (item.atelier?.nom_atelier?.toLowerCase() ?? "").includes(
        searchTerm.toLowerCase()
      ) ||
      (item.abonnement?.nom?.toLowerCase() ?? "").includes(
        searchTerm.toLowerCase()
      );

    // Price filtering (on prix_paye)
    let matchPrixMin = true;
    if (filterPrixMin && item.prix_paye != null) {
      const minPrix = parseFloat(filterPrixMin);
      matchPrixMin = item.prix_paye >= minPrix;
    }

    let matchPrixMax = true;
    if (filterPrixMax && item.prix_paye != null) {
      const maxPrix = parseFloat(filterPrixMax);
      matchPrixMax = item.prix_paye <= maxPrix;
    }

    return matchesSearch && matchPrixMin && matchPrixMax;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`fixed top-4 right-4 z-50 flex items-center px-4 py-3 rounded-lg shadow-lg ${
            toast.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 mr-2" />
          )}
          <span
            className={`text-sm font-medium ${
              toast.type === "success" ? "text-green-800" : "text-red-800"
            }`}
          >
            {toast.message}
          </span>
          <button
            className="ml-3 text-gray-400 hover:text-gray-600"
            onClick={() =>
              setToasts((prev) => prev.filter((t) => t.id !== toast.id))
            }
          >
            ×
          </button>
        </div>
      ))}
      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {confirmDialog.title}
                  </h3>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-sm text-gray-500">{confirmDialog.message}</p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={confirmDialog.onCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
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
              <h1 className="text-2xl font-bold text-blue-600">Les Ateliers</h1>
              <p className="text-sm text-gray-500 mt-1">Gérez vos Ateliers</p>
            </div>
            <button
              onClick={() => navigate("/superAdmin/Ateliers/ajouter")}
              className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Ajouter un Atelier</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">
                  Total Abonnements Ateliers
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {fetchedAteliers.length}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 mb-4 sm:mb-6">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <div className="space-y-3 sm:space-y-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher un atelier ou abonnement..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Price Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <DollarSign className="w-4 h-5 text-gray-600 mr-2" />
                    Prix payé minimum
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
                    Prix payé maximum
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors duration-200 text-sm bg-white hover:border-gray-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
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

              {/* Active Filters Summary for price only */}
              {(!!filterPrixMin || !!filterPrixMax) && (
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">
                      Filtres actifs:
                    </span>
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
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Atelier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Propriétaire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Abonnement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix payé
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payé
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date début
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date fin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Restant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créé le
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAteliers.length > 0 ? (
                  filteredAteliers.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.atelier?.nom_atelier || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.atelier?.admin?.nom_admin || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.abonnement?.nom || "-"}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div
                          className="text-xs sm:text-sm text-gray-900 truncate max-w-[100px] sm:max-w-none"
                          title={item.prix_paye?.toString()}
                        >
                          {typeof item.prix_paye === "number"
                            ? item.prix_paye.toFixed(3) + " DT"
                            : "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full ${
                            item.is_paid
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.is_paid ? "Oui" : "Non"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.date_debut
                          ? new Date(item.date_debut).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.date_fin
                          ? new Date(item.date_fin).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.date_fin && item.date_debut
                          ? (() => {
                              const start = new Date(item.date_debut);
                              const end = new Date(item.date_fin);

                              let months =
                                (end.getFullYear() - start.getFullYear()) * 12 +
                                (end.getMonth() - start.getMonth());
                              let days = end.getDate() - start.getDate();

                              if (days < 0) {
                                // go back one month and calculate remaining days
                                months--;
                                const prevMonth = new Date(
                                  end.getFullYear(),
                                  end.getMonth(),
                                  0
                                );
                                days += prevMonth.getDate();
                              }

                              let result = "";
                              if (months > 0) result += `${months} mois`;
                              if (days > 0)
                                result += `${months > 0 ? " et " : ""}${days} ${
                                  days === 1 ? "jr" : "jrs"
                                }`;
                              return result || "-";
                            })()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() =>
                              navigate("/superAdmin/Ateliers/modifier", {
                                state: { abonnementAtelier: item },
                              })
                            }
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => supprimerAtelier(item.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              navigate(
                                "/superAdmin/Ateliers/ModifierAboAtelier",
                                {
                                  state: { abonnementAtelier: item },
                                }
                              )
                            }
                            className="text-green-600 hover:text-gren-900 p-1"
                            title="ModifierAboAtelier"
                          >
                            <HandCoins className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Aucun abonnement atelier trouvé</p>
                        <p className="text-sm">
                          Ajustez vos filtres ou ajoutez un nouvel abonnement
                          atelier
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {filteredAteliers.length > 0 && (
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Affichage de{" "}
                <span className="font-medium">{filteredAteliers.length}</span>{" "}
                Abonnement(s) Atelier sur{" "}
                <span className="font-medium">{fetchedAteliers.length}</span>{" "}
                total
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GererAteliers;
