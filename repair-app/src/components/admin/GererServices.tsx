import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Check,
  X,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign,
} from "lucide-react";
import { supabase } from "../../supabase-client";
import { useNavigate } from "react-router-dom";
import ModernSelect from "../ModernSelect";

interface Service {
  id: number;
  nom_service: string;
  active: boolean;
  created_at?: string;
  prix_service: number;
  id_atelier?: number;
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

function GererServices({ id_atelier }: { id_atelier: number | null }) {
  const navigate = useNavigate();
  const [fetchedServices, setFetchedServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Replace select with input for filter
  const [filterActiveInput, setFilterActiveInput] = useState("");
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

  const filterOptions = [
    "Tous les services",
    "Services Disponibles",
    "Services Non Disponibles",
  ];

  const AfficherLesServices = async () => {
    if (!id_atelier) return;
    const { error, data } = await supabase
      .from("services")
      .select("*")
      .eq("id_atelier", id_atelier);
    if (error) {
      console.error("Erreur lors de l'affichage des services :", error);
      return;
    }
    setFetchedServices(data);
  };

  useEffect(() => {
    if (id_atelier) {
      AfficherLesServices();
    }
  }, [id_atelier]);

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

  const SupprimerService = async (id: number) => {
    showConfirmDialog(
      "Supprimer le service",
      "Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible.",
      async () => {
        const { error } = await supabase.from("services").delete().eq("id", id);
        if (error) {
          console.error("Erreur lors de la suppression de service");
          showToast("error", "Erreur lors de la suppression du service");
          return;
        }
        showToast("success", "Service supprimé avec succès !");
        AfficherLesServices();
      }
    );
  };

  // Filtering logic
  const filteredServices = fetchedServices.filter((service) => {
    const matchesSearch = service.nom_service
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    let matchesFilter = true;
    if (filterActiveInput && filterActiveInput !== "Tous les services") {
      if (
        filterActiveInput.toLowerCase().includes("disponible") &&
        !filterActiveInput.toLowerCase().includes("non disponible")
      ) {
        matchesFilter = service.active;
      } else if (filterActiveInput.toLowerCase().includes("non disponible")) {
        matchesFilter = !service.active;
      }
    }

    // Price filtering
    let matchPrixMin = true;
    if (filterPrixMin && service.prix_service) {
      const minPrix = parseFloat(filterPrixMin);
      matchPrixMin = service.prix_service >= minPrix;
    }

    let matchPrixMax = true;
    if (filterPrixMax && service.prix_service) {
      const maxPrix = parseFloat(filterPrixMax);
      matchPrixMax = service.prix_service <= maxPrix;
    }

    return matchesSearch && matchesFilter && matchPrixMin && matchPrixMax;
  });

  const activeCount = fetchedServices.filter((s) => s.active).length;
  const inactiveCount = fetchedServices.filter((s) => !s.active).length;

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
              <h1 className="text-2xl font-bold text-blue-600">Services</h1>
              <p className="text-sm text-gray-500 mt-1">
                Gérez vos services et leur disponibilité
              </p>
            </div>
            <button
              onClick={() => navigate("/services/ajouter")}
              className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Ajouter un Service</span>
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
                  Total Services
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {fetchedServices.length}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">
                  Services Disponibles
                </p>
                <p className="text-2xl font-semibold text-green-600">
                  {activeCount}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">
                  Services Non Disponibles
                </p>
                <p className="text-2xl font-semibold text-red-500">
                  {inactiveCount}
                </p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <X className="w-4 h-4 text-red-500" />
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
                  placeholder="Rechercher un service..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {/* Filter Row */}
              <ModernSelect
                options={filterOptions}
                value={filterActiveInput}
                onChange={(value) => setFilterActiveInput(value as string)}
                placeholder="Tous les services"
                searchPlaceholder="Rechercher un service"
                icon={<Filter className="inline h-4 w-4 text-gray-500" />}
                label="Filtrer par service"
                required
              />

              {/* Price Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {/* Active Filters Summary */}
              {(!!filterActiveInput &&
                filterActiveInput !== "Tous les services") ||
              !!filterPrixMin ||
              !!filterPrixMax ? (
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">
                      Filtres actifs:
                    </span>
                    {filterActiveInput &&
                      filterActiveInput !== "Tous les services" && (
                        <span className="inline-flex items-center px-2 py-1 bg-green-50 text-gray-900 text-xs font-medium rounded-full">
                          {filterActiveInput}
                          <button
                            onClick={() => setFilterActiveInput("")}
                            className="ml-1 text-green-700 hover:text-red-500"
                            title="Effacer le filtre de disponibilité"
                            aria-label="Effacer le filtre de disponibilité"
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

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de création
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredServices.length > 0 ? (
                  filteredServices.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {
                          <div className="text-sm font-medium text-gray-900">
                            {service.nom_service}
                          </div>
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              service.active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-500"
                            }`}
                          >
                            {service.active ? "Disponible" : "Non Disponible"}
                          </span>
                        }
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div
                          className="text-xs sm:text-sm text-gray-900 truncate max-w-[100px] sm:max-w-none"
                          title={service.prix_service?.toString()}
                        >
                          {typeof service.prix_service === "number"
                            ? service.prix_service.toFixed(3) + " DT"
                            : "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {service.created_at
                          ? new Date(service.created_at).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() =>
                                navigate("/services/modifier", {
                                  state: { service },
                                })
                              }
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => SupprimerService(service.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        }
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Aucun service trouvé</p>
                        <p className="text-sm">
                          Ajustez vos filtres ou ajoutez un nouveau service
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {filteredServices.length > 0 && (
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Affichage de{" "}
                <span className="font-medium">{filteredServices.length}</span>{" "}
                service(s) sur{" "}
                <span className="font-medium">{fetchedServices.length}</span>{" "}
                total
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GererServices;
