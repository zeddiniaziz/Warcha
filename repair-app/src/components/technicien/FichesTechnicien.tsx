import { useEffect, useState } from "react";
import {
  Search,
  Edit2,
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
  ClipboardEdit,
} from "lucide-react";
import { supabase } from "../../supabase-client";
import { useNavigate } from "react-router-dom";
import ModernSelect from "../ModernSelect";
import qr from "../GenerateQr";

// --- Interfaces ---
interface Fiche {
  id: number;
  id_client: number; 
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

interface Client {
  id: number;
  nom_client: string;
  telephone: string;
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
  id?: number;
  nom_technicien: string;
  user_id?: string; // Added user_id to the interface
}

interface Piece {
  id: number;
  nom_piece: string;
}

interface Service {
  id: number;
  nom_service: string;
}

interface Toast {
  id: number;
  type: "success" | "error" | "warning";
  message: string;
}

// --- Helpers ---
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

const etatOptions = ["En attente", "En cours", "Terminé", "Livré"];

// --- Main Component ---
function FichesTechnicien() {
  const navigate = useNavigate();
  const [fiches, setFiches] = useState<Fiche[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [marques, setMarques] = useState<Marque[]>([]);
  const [typesProduits, setTypesProduits] = useState<TypeProduit[]>([]);
  const [technicien, setTechnicien] = useState<Technicien | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);pieces
  const [services, setServices] = useState<Service[]>([]);services
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEtatInput, setFilterEtatInput] = useState("");
  const [filterDateReception, setFilterDateReception] = useState("");
  const [filterDateEnlevement, setFilterDateEnlevement] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [cardGridCols, setCardGridCols] = useState(
    "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  );

  // --- Responsive grid ---
  useEffect(() => {
    function updateGridCols() {
      const ratio = window.devicePixelRatio || 1;
      let cols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
      if (ratio <= 0.9)
        cols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
      else if (ratio > 0.9 && ratio <= 1.45)
        cols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      else if (ratio > 1.65 && ratio <= 1.95)
        cols = "grid-cols-1 md:grid-cols-2";
      else if (ratio > 2.0) cols = "grid-cols-1";
      setCardGridCols(cols);
    }
    updateGridCols();
    window.addEventListener("resize", updateGridCols);
    return () => window.removeEventListener("resize", updateGridCols);
  }, []);

  // --- Fetch current technicien based on logged-in user ---
  useEffect(() => {
    async function fetchCurrentTechnicien() {
      try {
        // Get current user session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          console.error("No user session found");
          return;
        }

        // Find technicien record that matches the current user's ID
        const { data: technicienData, error } = await supabase
          .from("techniciens")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (error) {
          console.error("Error fetching technicien:", error);
          return;
        }

        if (technicienData) {
          setTechnicien(technicienData);
        } else {
          console.error("No technicien found for current user");
        }
      } catch (err) {
        console.error("Error in fetchCurrentTechnicien:", err);
      }
    }

    fetchCurrentTechnicien();
  }, []);

  // --- Fetch all data ---
  useEffect(() => {
    if (!technicien) return;
    async function fetchAll() {
      if (!technicien || technicien.id == null) return;

      try {
        const [fichesRes, marquesRes, typesRes, piecesRes, servicesRes, clientsRes] =
          await Promise.all([
            supabase
              .from("fiches")
              .select("*")
              .eq("technicien_id", technicien.id),
            supabase.from("marques").select("*"),
            supabase.from("familles_produits").select("*"),
            supabase.from("pieces").select("*"),
            supabase.from("services").select("*"),
            supabase.from("clients").select("*"),
          ]);

        if (fichesRes.error) {
          console.error("Error fetching fiches:", fichesRes.error);
        }
        if (marquesRes.error) {
          console.error("Error fetching marques:", marquesRes.error);
        }
        if (typesRes.error) {
          console.error("Error fetching types:", typesRes.error);
        }
        if (piecesRes.error) {
          console.error("Error fetching pieces:", piecesRes.error);
        }
        if (servicesRes.error) {
          console.error("Error fetching services:", servicesRes.error);
        }

        setFiches(fichesRes.data || []);
        setMarques(marquesRes.data || []);
        setTypesProduits(typesRes.data || []);
        setPieces(piecesRes.data || []);
        setServices(servicesRes.data || []);
        setClients(clientsRes.data || []);
      } catch (err) {
        console.error("Error in fetchAll:", err);
      }
    }
    fetchAll();
  }, [technicien]);

  // --- Helpers ---
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
  const getClientName = (id?: number | null) => {
    if (!id) return "";
    const c = clients.find((client) => client.id === id);
    return c ? c.nom_client : "";
  }; 
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

  // --- Card Edit Handler: Route to ModifierFichesTechnicien with state ---
  const handleEdit = (fiche: Fiche) => {
    navigate("/sectionTechnicien/modifier", { state: { fiche } });
  };

  // --- Filtered fiches ---
  const filteredFiches = fiches.filter((fiche) => {
    const matchSearch =
      getClientName(fiche.id_client).toLowerCase().includes(searchTerm.toLowerCase()) ||
      fiche.telephone.includes(searchTerm) ||
      fiche.code_barre?.toLowerCase().includes(searchTerm.toLowerCase()); 
    let matchEtat = true;
    if (
      filterEtatInput &&
      filterEtatInput !== "Toutes les fiches" &&
      filterEtatInput !== "all"
    ) {
      matchEtat = fiche.etat
        .toLowerCase()
        .includes(filterEtatInput.toLowerCase());
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

  // --- Stats ---
  const totalFiches = fiches.length;
  const totalTerminees = fiches.filter((f) => f.etat === "Terminé").length;
  const totalPasTerminees = fiches.filter((f) => f.etat !== "Terminé").length;

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
              onClick={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
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

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-blue-600 truncate">
                Mes Fiches à traiter
              </h1>
              <h4 className="text-lg sm:text-lg font-medium text-gray-600 truncate">
                Bonjour Mr {technicien?.nom_technicien || "..."}
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Gérez vos fiches, mettez à jour l'état, les pièces, services et
                diagnostic.
              </p>
            </div>
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
                    Ajustez votre recherche.
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
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Mettre à jour"
                          >
                            <Edit2 className="w-4 h-4" />
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
                        <p className="text-sm text-gray-600">
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
                          {technicien?.nom_technicien}
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
                    {/* Diagnostic */}
                    <div className="px-4 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <ClipboardEdit className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Diagnostic:
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-sm text-gray-800 min-h-[40px]">
                        {fiche.diagnostic || (
                          <span className="text-gray-400">
                            Aucun diagnostic
                          </span>
                        )}
                      </div>
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

export default FichesTechnicien;
