import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
  Wrench,
  Clock,
  Package,
  User,
  Phone,
  Calendar,
  CreditCard,
  Eye,
} from "lucide-react";
import { supabase } from "../../supabase-client";
import ModernSelect from "../ModernSelect";
import qr from "../GenerateQr";

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

const etatOptions = [
  "En attente",
  "En cours",
  "Terminé",
  "Livré",
  "payée",
  "Non payée",
];

function ConsulterFichesClients() {
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
  const [cardGridCols, setCardGridCols] = useState(
    "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  );
  const [currentClientId, setCurrentClientId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  currentClientId;

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

  // Fetch current client id and their fiches
  useEffect(() => {
    const fetchClientAndFiches = async () => {
      setLoading(true);
      // 1. Get current user session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }
      // 2. Get client record for this user
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id, nom_client, telephone")
        .eq("user_id", userId)
        .single();
      if (clientError || !clientData) {
        setLoading(false);
        return;
      }
      setCurrentClientId(clientData.id);
      setClients([clientData]);
      // 3. Fetch only fiches for this client
      const { data: fichesData, error: fichesError } = await supabase
        .from("fiches")
        .select("*")
        .eq("id_client", clientData.id);
      if (!fichesError) setFiches(fichesData || []);
      setLoading(false);
    };
    fetchClientAndFiches();
    // Fetch other data (marques, types, techniciens)
    const fetchOtherData = async () => {
      const { data: marquesData } = await supabase.from("marques").select("*");
      setMarques(marquesData || []);
      const { data: typesData } = await supabase
        .from("familles_produits")
        .select("*");
      setTypesProduits(typesData || []);
      const { data: techsData } = await supabase
        .from("techniciens")
        .select("*");
      setTechniciens(techsData || []);
    };
    fetchOtherData();
  }, []);

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

  // Filtered fiches (search + état + dates)
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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-blue-600 truncate">
                Mes Fiches
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Consultez vos Fiches
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
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
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
            <div className="bg-white py-4 px-1">
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
            </div>
          </div>

          {/* --- Modern Card Grid --- */}
          <div className="p-4">
            {loading ? (
              <div className="min-h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-500">Chargement des fiches...</p>
                </div>
              </div>
            ) : filteredFiches.length === 0 ? (
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
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (fiche.montant_total ?? 0) -
                              (fiche.montant_paye ?? 0) ===
                            0
                              ? "text-green-600 bg-green-50"
                              : "text-red-600 bg-red-50"
                          }`}
                        >
                          {(fiche.montant_total ?? 0) -
                            (fiche.montant_paye ?? 0) ===
                          0
                            ? "Payé"
                            : "Impayé"}
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

                      {/* Voir détails Button */}
                      <button
                        onClick={() =>
                          navigate("/sectionClient/details", {
                            state: { ficheId: fiche.id },
                          })
                        }
                        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-gray-600 font-semibold text-sm hover:bg-gray-300 transition-colors shadow-sm hover:bg-opacity-50"
                      >
                        
                        <Eye className="w-4 h-4" />
                        Voir détails
                      </button>
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

export default ConsulterFichesClients;
