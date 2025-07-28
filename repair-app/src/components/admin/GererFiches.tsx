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
  Check,
  Wrench,
  Clock,
  Package,
  User,
  Phone,
  Calendar,
  CreditCard,
  Eye,
  Printer,
} from "lucide-react";
import { supabase } from "../../supabase-client";
import ModernSelect from "../ModernSelect";
import qr from "../GenerateQr";
import FicheReceipt from "./FicheReceipt";
import ReactDOMServer from "react-dom/server";

interface Fiche {
  id: number;
  id_client: number | null;
  telephone: string;
  code_barre: string;
  marque_id: number | null;
  type_produit_id: number | null;
  modele: string;
  diagnostic: string;
  etat: string;
  technicien_id: number | null;
  date_reception: string | null;
  date_enlevement: string | null;
  created_at?: string;
  montant_total?: number;
  montant_paye?: number;
}

interface Marque {
  id: number;
  nom: string;
}

interface TypeProduit {
  id: number;
  type: string;
}

interface Technicien {
  id: number;
  nom_technicien: string;
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

function formatDateTime(dateString: string | null) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return (
    <>
      <span>
        {dd}-{mm}-{yyyy}
      </span>
      <br />
      <span className="text-xs text-gray-500">
        à {hh}:{min}
      </span>
    </>
  );
}

function GererFiches({ id_atelier, nom_atelier }: { id_atelier: number | null, nom_atelier: string | null }) {
  const navigate = useNavigate();
  const [fiches, setFiches] = useState<Fiche[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [marques, setMarques] = useState<Marque[]>([]);
  const [typesProduits, setTypesProduits] = useState<TypeProduit[]>([]);
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEtatInput, setFilterEtatInput] = useState("");
  const [filterDateReception, setFilterDateReception] = useState("");
  const [filterDateEnlevement, setFilterDateEnlevement] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
  });
  const [cardGridCols, setCardGridCols] = useState(
    "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  );

  const etatOptions = [
    "En attente",
    "En cours",
    "Terminé",
    "Livré",
    "payée",
    "Non payée",
  ];

  // --- Professional: Responsive grid based on zoom/scale ---
  useEffect(() => {
    function updateGridCols() {
      // Use devicePixelRatio and window.innerWidth to estimate zoom
      // (Not perfect, but works for most browsers)
      const ratio = window.devicePixelRatio || 1;
      // 1 = 100%, <1 = zoomed out, >1 = zoomed in
      let cols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

      if (ratio <= 0.9) {
        // <= 90% zoom: 4 cards
        cols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
      } else if (ratio > 0.9 && ratio <= 1.45) {
        // 100% to 125% zoom: 3 cards
        cols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      } else if (ratio > 1.65 && ratio <= 1.95) {
        // 125% to 150% zoom: 2 cards
        cols = "grid-cols-1 md:grid-cols-2";
      } else if (ratio > 2.0) {
        // > 150% zoom: 1 card
        cols = "grid-cols-1";
      }

      setCardGridCols(cols);
    }

    updateGridCols();
    window.addEventListener("resize", updateGridCols);
    return () => window.removeEventListener("resize", updateGridCols);
  }, []);

  // Fetch all data
  const fetchFiches = async () => {
    const { data, error } = await supabase
      .from("fiches")
      .select("*")
      .eq("id_atelier", id_atelier);
    if (!error) setFiches(data || []);
  };
  const fetchMarques = async () => {
    const { data, error } = await supabase.from("marques").select("*");
    if (!error) setMarques(data || []);
  };
  const fetchTypesProduits = async () => {
    const { data, error } = await supabase
      .from("familles_produits")
      .select("*");
    if (!error) setTypesProduits(data || []);
  };
  const fetchTechniciens = async () => {
    const { data, error } = await supabase
      .from("techniciens")
      .select("*")
      .eq("id_atelier", id_atelier);
    if (!error) setTechniciens(data || []);
  };
  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id_atelier", id_atelier);
    if (!error) setClients(data || []);
  };
  useEffect(() => {
    fetchFiches();
    fetchMarques();
    fetchTypesProduits();
    fetchTechniciens();
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

  const SupprimerFiche = async (id: number) => {
    showConfirmDialog(
      "Supprimer la fiche",
      "Êtes-vous sûr de vouloir supprimer cette fiche ? Cette action est irréversible.",
      async () => {
        const { error } = await supabase.from("fiches").delete().eq("id", id);
        if (error) {
          showToast("error", "Erreur lors de la suppression !");
          return;
        }
        showToast("success", "Fiche supprimée avec succès !");
        fetchFiches();
      }
    );
  };

  // Helpers
  const getMarqueName = (id?: number | null) => {
    if (!id) return "";
    const m = marques.find((marque) => marque.id === id);
    return m ? m.nom : "";
  };
  const getTypeProduitName = (id?: number | null) => {
    if (!id) return "";
    const t = typesProduits.find((type) => type.id === id);
    return t ? t.type : "";
  };
  const getTechnicienName = (id?: number | null) => {
    if (!id) return "";
    const t = techniciens.find((tech) => tech.id === id);
    return t ? t.nom_technicien : "";
  };
  const getClientName = (id?: number | null) => {
    if (!id) return "";
    const c = clients.find((client) => client.id === id);
    return c ? c.nom_client : "";
  };

  // Stats
  const totalFiches = fiches.length;
  const totalTerminees = fiches.filter((f) => f.etat === "Terminé").length;
  const totalPasTerminees = fiches.filter((f) => f.etat !== "Terminé").length;

  // Filtered fiches (search + état + dates + payment status)
  const filteredFiches = fiches.filter((fiche) => {
    const matchSearch =
      fiche.id_client?.toString().includes(searchTerm) ||
      fiche.telephone.includes(searchTerm) ||
      fiche.code_barre?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchEtat = true;
    if (
      filterEtatInput &&
      filterEtatInput !== "Toutes les fiches" &&
      filterEtatInput !== "all"
    ) {
      if (
        filterEtatInput.toLowerCase() === "non payée" ||
        filterEtatInput.toLowerCase() === "non paye" ||
        filterEtatInput.toLowerCase() === "non payé"
      ) {
        matchEtat =
          (fiche.montant_total || 0) - (fiche.montant_paye || 0) !== 0;
      } else if (
        filterEtatInput.toLowerCase() === "payée" ||
        filterEtatInput.toLowerCase() === "paye" ||
        filterEtatInput.toLowerCase() === "payé"
      ) {
        matchEtat =
          (fiche.montant_total || 0) - (fiche.montant_paye || 0) === 0;
      } else {
        matchEtat = fiche.etat
          .toLowerCase()
          .includes(filterEtatInput.toLowerCase());
      }
    }

    // Date filtering
    let matchDateReception = true;
    if (filterDateReception && fiche.date_reception) {
      const filterDate = new Date(filterDateReception);
      const receptionDate = new Date(fiche.date_reception);
      matchDateReception =
        receptionDate.toDateString() === filterDate.toDateString();
    }

    let matchDateEnlevement = true;
    if (filterDateEnlevement && fiche.date_enlevement) {
      const filterDate = new Date(filterDateEnlevement);
      const enlevementDate = new Date(fiche.date_enlevement);
      matchDateEnlevement =
        enlevementDate.toDateString() === filterDate.toDateString();
    }

    return (
      matchSearch && matchEtat && matchDateReception && matchDateEnlevement
    );
  });

  // Send fiche data to ModifierFiche via navigation state
  const handleEdit = (fiche: Fiche) => {
    navigate("/fiches/modifier", { state: { fiche } });
  };

  // Print handler for receipt ticket (new window approach)
  const handlePrintFiche = (fiche: Fiche) => {
    const client = getClientName(fiche.id_client);
    const marque = getMarqueName(fiche.marque_id);
    const typeProduit = getTypeProduitName(fiche.type_produit_id);
    const technicien = getTechnicienName(fiche.technicien_id);

    const receiptHtml = ReactDOMServer.renderToString(
      <FicheReceipt 
        fiche={fiche}
        client={client}
        marque={marque}
        typeProduit={typeProduit}
        technicien={technicien}
        nom_atelier={nom_atelier ?? ""}
      />
    );

    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Ticket de Réparation</title>
            <style>
              body { background: #fff; margin: 0; padding: 0; }
              .receipt-ticket { width: 320px; margin: 40px auto; font-family: monospace; font-size: 14px; background: #fff; padding: 16px; }
              @media print {
                body { background: #fff !important; }
                .receipt-ticket { box-shadow: none !important; border: none !important; }
              }
            </style>
          </head>
          <body>
            <div class="receipt-ticket">
              ${receiptHtml}
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() { window.close(); };
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // --- Card helpers ---
  const getStatusIcon = (etat: string) => {
    switch (etat) {
      case "En attente":
        return <Clock className="w-4 h-4" />;
      case "En cours":
        return <Wrench className="w-4 h-4" />;
      case "Terminé":
        return <CheckCircle className="w-4 h-4" />;
      case "Livré":
        return <Package className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (etat: string) => {
    switch (etat) {
      case "En attente":
        return "bg-red-50 text-red-700 border-red-200";
      case "En cours":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Terminé":
        return "bg-green-50 text-green-700 border-green-200";
      case "Livré":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getPaymentStatus = (total?: number, paid?: number) => {
    const remaining = (total ?? 0) - (paid ?? 0);
    return remaining === 0 ? "Payé" : "Impayé";
  };

  const getPaymentColor = (total?: number, paid?: number) => {
    const remaining = (total ?? 0) - (paid ?? 0);
    return remaining === 0
      ? "text-green-600 bg-green-50"
      : "text-red-600 bg-red-50";
  };
  // --- Add this handler for paiement button ---
  const handleAjouterPaiement = (
    code_barre: string,
    paiementInfo: { total: number; paye: number; restant: number }
  ) => {
    navigate("/paiements/ajouter_paiement", {
      state: { code_barre, paiementInfo },
    });
  };
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
                Mes Fiches
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Gérez vos Fiches
              </p>
            </div>
            <button
              onClick={() => navigate("/fiches/ajouter")}
              className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Ajouter une fiche</span>
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
                Total Fiches
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                {totalFiches}
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
                Terminées
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-green-600">
                {totalTerminees}
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
                Pas terminées
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-red-500">
                {totalPasTerminees}
              </p>
            </div>
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
              <X className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Search Bar */}
        <div className="bg-white rounded-lg border border-gray-200 mb-4 sm:mb-6">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher une fiche..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm sm:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Professional Filter Section */}
            <div className="bg-white py-4 px-1">
              {/* <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Filter className="w-5 h-5 mr-2 text-gray-600" />
                Filtres
              </h3>
              <button
                onClick={() => {
                  setFilterEtatInput("");
                  setFilterDateReception("");
                  setFilterDateEnlevement("");
                }}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                Réinitialiser
              </button>
            </div> */}

              {/* Filter Content */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center flex-shrink-0 mr-3">
                      <Filter className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                        Filtrer par état
                      </p>
                    </div>
                  </div>
                  <div className="w-full">
                    <ModernSelect
                      options={etatOptions}
                      value={filterEtatInput}
                      onChange={(value) => setFilterEtatInput(value as string)}
                      placeholder="Toutes les fiches"
                      searchPlaceholder="Rechercher une fiche..."
                      compact={true}
                    />
                  </div>
                </div>

                {/* Date Reception Filter */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center flex-shrink-0 mr-3">
                      <Calendar className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                        Date réception
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors duration-200 text-sm bg-white hover:border-gray-400"
                      value={filterDateReception}
                      onChange={(e) => setFilterDateReception(e.target.value)}
                    />
                    {filterDateReception && (
                      <button
                        onClick={() => setFilterDateReception("")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200 z-10 bg-white"
                        title="Effacer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Date Enlevement Filter */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center mb-3">
                    <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center flex-shrink-0 mr-3">
                      <Calendar className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                        Date enlèvement
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors duration-200 text-sm bg-white hover:border-gray-400"
                      value={filterDateEnlevement}
                      onChange={(e) => setFilterDateEnlevement(e.target.value)}
                    />
                    {filterDateEnlevement && (
                      <button
                        onClick={() => setFilterDateEnlevement("")}
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
              {(filterEtatInput ||
                filterDateReception ||
                filterDateEnlevement) && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">
                      Filtres actifs:
                    </span>
                    {filterEtatInput && (
                      <span className="inline-flex items-center px-2 py-1 bg-green-50 text-gray-900 text-xs font-medium rounded-full">
                        {filterEtatInput}
                        <button
                          onClick={() => setFilterEtatInput("")}
                          className="ml-1 text-green-700 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {filterDateReception && (
                      <span className="inline-flex items-center px-2 py-1 bg-green-50 text-gray-900 text-xs font-medium rounded-full">
                        Réception: {filterDateReception}
                        <button
                          onClick={() => setFilterDateReception("")}
                          className="ml-1 text-green-700 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {filterDateEnlevement && (
                      <span className="inline-flex items-center px-2 py-1 bg-green-50 text-gray-900 text-xs font-medium rounded-full">
                        Enlèvement: {filterDateEnlevement}
                        <button
                          onClick={() => setFilterDateEnlevement("")}
                          className="ml-1 text-green-700 hover:text-red-500"
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

          {/* --- Modern Card Grid --- */}
          <div className="p-4">
            {filteredFiches.length === 0 ? (
              <div className="min-h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucune fiche trouvée
                  </h3>
                  <p className="text-sm text-gray-500">
                    Ajustez votre recherche ou ajoutez une nouvelle fiche
                  </p>
                </div>
              </div>
            ) : (
              <div className={`grid ${cardGridCols} gap-6`}>
                {filteredFiches.map((fiche) => (
                  <div
                    key={fiche.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-400 overflow-hidden group"
                  >
                    {/* Header with Status */}
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                            fiche.etat
                          )}`}
                        >
                          {getStatusIcon(fiche.etat)}
                          {fiche.etat}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(fiche)}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => SupprimerFiche(fiche.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <button
                            className="printOne p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Imprimer"
                            onClick={() => handlePrintFiche(fiche)}
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-xl shadow-lg border border-blue-500/20 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                          <div className="bg-white p-2 rounded-lg shadow-inner">
                            <img
                              src={qr(fiche.code_barre)}
                              id="qrImg"
                              className="w-12 h-12 object-contain"
                            ></img>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-medium text-blue-100 mb-1 uppercase tracking-wide">
                              Code-QR
                            </div>
                            <div className="font-mono text-base font-semibold tracking-wider">
                              {fiche.code_barre}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Client Info */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900 truncate">
                            {getClientName(fiche.id_client)}
                          </p>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Phone className="w-3 h-3" />
                            {fiche.telephone}
                          </div>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500 uppercase">
                            Produit
                          </span>
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {getMarqueName(fiche.marque_id)}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900">
                          {fiche.modele}
                        </p>
                        <p className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {getTypeProduitName(fiche.type_produit_id)}
                        </p>
                      </div>

                      {/* Technician */}
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Technicien:
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {getTechnicienName(fiche.technicien_id)}
                        </span>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="flex items-center gap-1 text-gray-500 mb-1">
                            <Calendar className="w-3 h-3" />
                            <span className="text-xs">Réception</span>
                          </div>
                          <p className="font-medium text-gray-900">
                            {formatDateTime(fiche.date_reception)}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-gray-500 mb-1">
                            <Calendar className="w-3 h-3" />
                            <span className="text-xs">Enlèvement</span>
                          </div>
                          <p className="font-medium text-gray-900">
                            {formatDateTime(fiche.date_enlevement)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">
                            Paiement
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentColor(
                            fiche.montant_total,
                            fiche.montant_paye
                          )}`}
                        >
                          {getPaymentStatus(
                            fiche.montant_total,
                            fiche.montant_paye
                          )}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-semibold text-gray-900">
                            {typeof fiche.montant_total === "number"
                              ? `${fiche.montant_total.toFixed(3)} DT`
                              : "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payé:</span>
                          <span className="font-semibold text-green-600">
                            {typeof fiche.montant_paye === "number"
                              ? `${fiche.montant_paye.toFixed(3)} DT`
                              : "0 DT"}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-gray-200">
                          <span className="text-gray-600">Restant:</span>
                          <span
                            className={`font-semibold ${
                              (fiche.montant_total ?? 0) -
                                (fiche.montant_paye ?? 0) ===
                              0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {(
                              (fiche.montant_total ?? 0) -
                              (fiche.montant_paye ?? 0)
                            ).toFixed(3)}{" "}
                            DT
                          </span>
                        </div>
                      </div>

                      {/* Ajouter Paiement Button */}
                      {(fiche.montant_total ?? 0) -
                        (fiche.montant_paye ?? 0) !==
                        0 && (
                        <button
                          onClick={() =>
                            handleAjouterPaiement(fiche.code_barre, {
                              total: fiche.montant_total ?? 0,
                              paye: fiche.montant_paye ?? 0,
                              restant:
                                (fiche.montant_total ?? 0) -
                                (fiche.montant_paye ?? 0),
                            })
                          }
                          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-gray-600 font-semibold text-sm hover:bg-gray-300 transition-colors shadow-sm hover:bg-opacity-50"
                        >
                          <CreditCard className="w-4 h-4" />
                          Ajouter paiement
                        </button>
                      )}
                      {(fiche.montant_total ?? 0) -
                        (fiche.montant_paye ?? 0) ===
                        0 && (
                        <button
                          onClick={() =>
                            navigate("/paiements", {
                              state: { searchCodeBarre: fiche.code_barre },
                            })
                          }
                          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-gray-600 font-semibold text-sm hover:bg-gray-300 transition-colors shadow-sm hover:bg-opacity-50"
                        >
                          <Eye className="w-4 h-4" />
                          Voir paiements
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GererFiches;
