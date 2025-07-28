import { useEffect, useState } from "react";
import { supabase } from "../../supabase-client";
import {
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  CheckCircle,
  AlertCircle,
  XCircle,
  CreditCard,
  Plus,
  Filter,
  DollarSign,
  Calendar,
  User,
  Phone,
  Eye,
  QrCode,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import ModernSelect from "../ModernSelect";

interface Paiement {
  id: number;
  fiche_id: number;
  date: string;
  methode: string;
  note: string;
  montant: number;
}

interface Fiche {
  id: number;
  code_barre: string;
  id_client: number;
  montant_total: number;
  montant_paye: number;
}

interface Client {
  id: number;
  nom_client: string;
  telephone: string;
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

interface PaiementsModal {
  isOpen: boolean;
  fiche: Fiche | null;
  paiements: Paiement[];
}

const methodesList = [
  "espèce",
  "chèque",
  "virement",
  "carte bancaire",
  "autre",
];

function GererPaiements({ id_atelier }: { id_atelier: number | null }) {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [fiches, setFiches] = useState<Fiche[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMethode, setFilterMethode] = useState("");
  const [filterPrixMin, setFilterPrixMin] = useState("");
  const [filterPrixMax, setFilterPrixMax] = useState("");
  const [filterDateDebut, setFilterDateDebut] = useState("");
  const [filterDateFin, setFilterDateFin] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
  });
  const [paiementsModal, setPaiementsModal] = useState<PaiementsModal>({
    isOpen: false,
    fiche: null,
    paiements: [],
  });

  // Stats
  const totalMontant = fiches.reduce(
    (sum, f) => sum + (f.montant_total || 0),
    0
  );
  const totalPaye = fiches.reduce((sum, f) => sum + (f.montant_paye || 0), 0);
  const totalNonPaye = Number((totalMontant - totalPaye).toFixed(3));

  // Fetch data
  const fetchPaiements = async () => {
    const { data, error } = await supabase.from("paiements").select("*").eq("id_atelier", id_atelier);
    if (!error) setPaiements(data || []);
  };
  const fetchFiches = async () => {
    const { data, error } = await supabase
      .from("fiches")
      .select("id, code_barre, id_client, montant_total, montant_paye")
      .eq("id_atelier", id_atelier);
    if (!error) setFiches(data || []);
  };
  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("id, nom_client, telephone")
      .eq("id_atelier", id_atelier);
    if (!error) setClients(data || []);
  };

  useEffect(() => {
    fetchPaiements();
    fetchFiches();
    fetchClients();
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

  // Paiements modal functions
  const showPaiementsModal = (fiche: Fiche, paiements: Paiement[]) => {
    setPaiementsModal({
      isOpen: true,
      fiche,
      paiements,
    });
  };

  const closePaiementsModal = () => {
    setPaiementsModal((prev) => ({ ...prev, isOpen: false }));
  };

  // CRUD

  const SupprimerPaiement = async (id: number) => {
    showConfirmDialog(
      "Supprimer le paiement",
      "Êtes-vous sûr de vouloir supprimer ce paiement ? Cette action est irréversible.",
      async () => {
        const { error } = await supabase
          .from("paiements")
          .delete()
          .eq("id", id);
        if (error) {
          showToast("error", "Erreur lors de la suppression !");
          return;
        }
        showToast("success", "Paiement supprimé avec succès !");
        fetchPaiements();
        fetchFiches();
      }
    );
  };

  // Helpers
  const getFiche = (fiche_id: number) => fiches.find((f) => f.id === fiche_id);
  const getClientName = (id_client?: number) => {
    if (!id_client) return "";
    const c = clients.find((client) => client.id === id_client);
    return c ? c.nom_client : "";
  };
  const getClientPhone = (id_client?: number) => {
    if (!id_client) return "";
    const c = clients.find((client) => client.id === id_client);
    return c ? c.telephone : "";
  };

  // Filtered paiements (search + méthode + prix + date)
  const filteredPaiements = paiements.filter((p) => {
    const fiche = getFiche(p.fiche_id);
    const clientName = fiche ? getClientName(fiche.id_client) : "";
    const matchSearch =
      (clientName.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (fiche?.code_barre?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (p.methode?.toLowerCase() || "").includes(searchTerm.toLowerCase());

    let matchMethode = true;
    if (
      filterMethode &&
      filterMethode !== "Toutes les méthodes" &&
      filterMethode !== "all"
    ) {
      matchMethode = p.methode?.toLowerCase() === filterMethode.toLowerCase();
    }

    // Price filtering
    let matchPrixMin = true;
    if (filterPrixMin && p.montant) {
      const minPrix = parseFloat(filterPrixMin);
      matchPrixMin = p.montant >= minPrix;
    }

    let matchPrixMax = true;
    if (filterPrixMax && p.montant) {
      const maxPrix = parseFloat(filterPrixMax);
      matchPrixMax = p.montant <= maxPrix;
    }

    // Date filtering
    let matchDateDebut = true;
    if (filterDateDebut && p.date) {
      const filterDate = new Date(filterDateDebut);
      const paiementDate = new Date(p.date);
      matchDateDebut = paiementDate >= filterDate;
    }

    let matchDateFin = true;
    if (filterDateFin && p.date) {
      const filterDate = new Date(filterDateFin);
      const paiementDate = new Date(p.date);
      matchDateFin = paiementDate <= filterDate;
    }

    return (
      matchSearch &&
      matchMethode &&
      matchPrixMin &&
      matchPrixMax &&
      matchDateDebut &&
      matchDateFin
    );
  });

  // Group filtered paiements by fiche_id
  const paiementsByFiche: { [ficheId: number]: Paiement[] } = {};
  filteredPaiements.forEach((p) => {
    if (!paiementsByFiche[p.fiche_id]) paiementsByFiche[p.fiche_id] = [];
    paiementsByFiche[p.fiche_id].push(p);
  });

  const navigate = useNavigate();
  const location = useLocation();
  const searchCodeBarre = location.state?.searchCodeBarre || "";
  useEffect(() => {
    if (searchCodeBarre) {
      setSearchTerm(searchCodeBarre);
    }
  }, [searchCodeBarre]);
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

      {/* Paiements Modal */}
      {paiementsModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 sm:w-6 sm:h-6 text-blue-700" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 break-words">
                      Paiements - {paiementsModal.fiche?.code_barre}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {getClientName(paiementsModal.fiche?.id_client)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closePaiementsModal}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                {paiementsModal.paiements.map((paiement) => (
                  <div
                    key={paiement.id}
                    className="flex items-center justify-between bg-white rounded-lg border border-gray-300 px-4 py-3 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 text-sm">
                        {paiement.montant} DT
                      </span>
                      <span className="text-xs text-gray-500">
                        {paiement.date
                          ? new Date(paiement.date).toLocaleString()
                          : "-"}
                      </span>
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-md w-fit mt-1">
                        {paiement.methode}
                      </span>
                      {paiement.note && (
                        <span className="text-xs text-gray-400 italic mt-1">
                          {paiement.note}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          closePaiementsModal();
                          navigate("/paiements/modifier_paiement", {
                            state: { paiement },
                          });
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                        title="Modifier le paiement"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          closePaiementsModal();
                          SupprimerPaiement(paiement.id);
                        }}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Supprimer le paiement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
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
                Paiements
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Liste des paiements par fiche
              </p>
            </div>
            <button
              onClick={() => navigate("/paiements/ajouter_paiement")}
              className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Ajouter un Paiement</span>
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
                Total à payer
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                {totalMontant.toFixed(3)} DT
              </p>
            </div>
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
              <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                Payé
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-green-600">
                {totalPaye.toFixed(3)} DT
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
                Non payé
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-red-500">
                {totalNonPaye.toFixed(3)} DT
              </p>
            </div>
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
              <X className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 mt-4 mb-4">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <div className="space-y-3 sm:space-y-4">
              {/* Search Bar */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher un paiement..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {/* Filter Row */}
              <ModernSelect
                options={methodesList}
                value={filterMethode}
                onChange={(value) => setFilterMethode(value as string)}
                placeholder="Toutes les méthodes"
                searchPlaceholder="Rechercher une méthode"
                icon={<Filter className="inline h-4 w-4 text-gray-500" />}
                label="Filtrer par méthode"
                required
              />
              {/* Price and Date Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Prix Min Filter */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center flex-shrink-0 mr-3">
                      <DollarSign className="w-4 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                        Prix minimum
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.000"
                      value={filterPrixMin}
                      onChange={(e) => setFilterPrixMin(e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors duration-200 text-sm bg-white hover:border-gray-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
                    />
                    {filterPrixMin && (
                      <button
                        onClick={() => setFilterPrixMin("")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200 z-10 bg-white"
                        title="Effacer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                {/* Prix Max Filter */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center flex-shrink-0 mr-3">
                      <DollarSign className="w-4 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                        Prix maximum
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
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
                        title="Effacer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                {/* Date Debut Filter */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center flex-shrink-0 mr-3">
                      <Calendar className="w-4 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                        Date début
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors duration-200 text-sm bg-white hover:border-gray-400"
                      value={filterDateDebut}
                      onChange={(e) => setFilterDateDebut(e.target.value)}
                    />
                    {filterDateDebut && (
                      <button
                        onClick={() => setFilterDateDebut("")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200 z-10 bg-white"
                        title="Effacer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                {/* Date Fin Filter */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center mb-3">
                    <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center flex-shrink-0 mr-3">
                      <Calendar className="w-4 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                        Date fin
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors duration-200 text-sm bg-white hover:border-gray-400"
                      value={filterDateFin}
                      onChange={(e) => setFilterDateFin(e.target.value)}
                    />
                    {filterDateFin && (
                      <button
                        onClick={() => setFilterDateFin("")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200 z-10 bg-white"
                        title="Effacer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {/* Active Filters Summary */}
              {(filterMethode && filterMethode !== "Toutes les méthodes") ||
              filterPrixMin ||
              filterPrixMax ||
              filterDateDebut ||
              filterDateFin ? (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">
                      Filtres actifs:
                    </span>
                    {filterMethode &&
                      filterMethode !== "Toutes les méthodes" && (
                        <span className="inline-flex items-center px-2 py-1 bg-green-50 text-gray-900 text-xs font-medium rounded-full">
                          {filterMethode}
                          <button
                            onClick={() => setFilterMethode("")}
                            className="ml-1 text-green-700 hover:text-red-500"
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
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {filterDateDebut && (
                      <span className="inline-flex items-center px-2 py-1 bg-green-50 text-gray-900 text-xs font-medium rounded-full">
                        Début: {filterDateDebut}
                        <button
                          onClick={() => setFilterDateDebut("")}
                          className="ml-1 text-green-700 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {filterDateFin && (
                      <span className="inline-flex items-center px-2 py-1 bg-green-50 text-gray-900 text-xs font-medium rounded-full">
                        Fin: {filterDateFin}
                        <button
                          onClick={() => setFilterDateFin("")}
                          className="ml-1 text-green-700 hover:text-red-500"
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
          {/* Cards per fiche */}
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
            <div
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`}
            >
              {Object.keys(paiementsByFiche).length === 0 ? (
                <div className="min-h-[300px] flex items-center justify-center col-span-full">
                  <div className="text-center">
                    <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucun paiement trouvé
                    </h3>
                    <p className="text-sm text-gray-500">
                      Ajustez votre recherche ou vos filtres
                    </p>
                  </div>
                </div>
              ) : (
                Object.entries(paiementsByFiche).map(
                  ([ficheId, fichePaiements]) => {
                    const fiche = fiches.find((f) => f.id === Number(ficheId));
                    if (!fiche) return null;
                    return (
                      <div
                        key={fiche.id}
                        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-400 overflow-hidden group flex flex-col"
                      >
                        {/* Header with Status */}
                        <div className="p-4 border-b border-gray-300 bg-white min-h-[100px]">
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-full inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium bg-blue-700 text-white shadow-sm">
                              <QrCode className="w-6 h-6" />
                              {fiche.code_barre}
                            </div>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <User className="w-4 h-4 text-gray-500 mt-0.5" />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 mb-2">
                                {getClientName(fiche.id_client)}
                              </div>
                              <div className="flex items-center gap-2 text-gray-700 -ml-6">
                                <Phone className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">
                                  {getClientPhone(fiche.id_client)}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">
                                  {fiche.montant_total - fiche.montant_paye !==
                                  0 ? (
                                    <span className="text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-md w-fit mt-1">
                                      impayé
                                    </span>
                                  ) : (
                                    <span className="text-green-500 font-bold bg-green-50 px-2 py-0.5 rounded-md w-fit mt-1">
                                      Payé
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Paiements List */}
                        <div className="p-4 bg-white flex-1 flex flex-col gap-3">
                          {fichePaiements.slice(0, 1).map((paiement) => (
                            <div
                              key={paiement.id}
                              className="flex items-center justify-between bg-white rounded-lg border border-gray-300 px-4 py-3 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex flex-col">
                                <span className="font-semibold text-gray-900 text-sm">
                                  {paiement.montant} DT
                                </span>
                                <span className="text-xs text-gray-500">
                                  {paiement.date
                                    ? new Date(paiement.date).toLocaleString()
                                    : "-"}
                                </span>
                                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-md w-fit mt-1">
                                  {paiement.methode}
                                </span>
                                {paiement.note && (
                                  <span className="text-xs text-gray-400 italic mt-1">
                                    {paiement.note}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    navigate("/paiements/modifier_paiement", {
                                      state: { paiement },
                                    })
                                  }
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                  title="Modifier le paiement"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => SupprimerPaiement(paiement.id)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                  title="Supprimer le paiement"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {fichePaiements.length > 1 && (
                            <button
                              onClick={() =>
                                showPaiementsModal(fiche, fichePaiements)
                              }
                              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-gray-600 font-semibold text-sm hover:bg-gray-300 transition-colors shadow-sm hover:bg-opacity-50"
                            >
                              <Eye className="w-4 h-4" />
                              Voir tous les paiements ({fichePaiements.length})
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GererPaiements;
