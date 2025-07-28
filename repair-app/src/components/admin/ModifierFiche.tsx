import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../supabase-client";
import {
  User,
  Phone,
  Barcode,
  Package,
  Wrench,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Cpu,
  DollarSign,
} from "lucide-react";
import ModernSelect from "../ModernSelect";

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
interface Service {
  id: number;
  nom_service: string;
  active: boolean;
  prix_service: number;
  created_at?: string;
}
interface Piece {
  id: number;
  nom: string;
  type: number;
  prix_achat: number;
  prix_vente: number;
}
interface Client {
  id: number;
  nom_client: string;
  telephone: string;
  email: string;
}
interface Fiche {
  id: number;
  id_client: number; // <-- use id_client instead of nom_client
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
  id_service?: number;
  id_piece?: number;
  montant_total?: number;
  montant_paye?: number;
  montant_restant?: number;
}

const etatOptions = ["En attente", "En cours", "Terminé", "Livré"];

// Helper to format date for datetime-local input
function formatDateForInput(dateString: string | null | undefined) {
  if (!dateString) return "";
  // Handles both ISO and "YYYY-MM-DD HH:mm:ss" formats
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes())
  );
}

const ModifierFiche: React.FC<{ id_atelier: number | null }> = ({ id_atelier }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();

  // Try to get fiche from navigation state
  const ficheFromState = location.state?.fiche as Fiche | undefined;
  const [editFiche, setEditFiche] = useState<Fiche | null>(
    ficheFromState || null
  );
  const [loading, setLoading] = useState(!ficheFromState && !!params.id);

  // Data for selects/autocomplete
  const [marques, setMarques] = useState<Marque[]>([]);
  const [typesProduits, setTypesProduits] = useState<TypeProduit[]>([]);
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [prixService, setPrixService] = useState<number>(0);
  prixService;
  const [prixPiece, setPrixPiece] = useState<number>(0);
  prixPiece;
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [errors, setErrors] = useState<Partial<Fiche>>({});

  // For autocomplete
  const [marqueInput, setMarqueInput] = useState("");
  const [typeProduitInput, setTypeProduitInput] = useState("");
  const [technicienInput, setTechnicienInput] = useState("");
  const [etatInput, setEtatInput] = useState("");
  const [serviceInput, setServiceInput] = useState("");
  const [pieceInput, setPieceInput] = useState("");
  serviceInput;
  pieceInput;
  // --- State for multi-select ---
  const [selectedServices, setSelectedServices] = useState<
    { id: number; name: string; price: number }[]
  >([]);
  const [selectedPieces, setSelectedPieces] = useState<
    { id: number; name: string; price: number }[]
  >([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientInput, setClientInput] = useState("");

  // Fetch fiche by ID if not in state (for direct URL access)
  useEffect(() => {
    if (!editFiche && params.id) {
      setLoading(true);
      supabase
        .from("fiches")
        .select("*")
        .eq("id", params.id)
        .single()
        .then(({ data }) => {
          if (data) setEditFiche(data);
          setLoading(false);
        });
    }
    // eslint-disable-next-line
  }, [params.id]);

  // If no fiche, show error and redirect
  useEffect(() => {
    if (!editFiche && !loading) {
      navigate("/fiches");
    }
  }, [editFiche, loading, navigate]);

  // Fetch data for selects/autocomplete
  useEffect(() => {
    fetchClients(); // <-- ensure clients are fetched on mount
    const fetchAll = async () => {
      const { data: marquesData } = await supabase.from("marques").select("*").eq("id_atelier", id_atelier);
      setMarques(marquesData || []);
      const { data: typesData } = await supabase
        .from("familles_produits")
        .select("id, type")
        .eq("id_atelier", id_atelier);
      setTypesProduits(typesData || []);
      const { data: techsData } = await supabase
        .from("techniciens")
        .select("id, nom_technicien")
        .eq("id_atelier", id_atelier);
      setTechniciens(techsData || []);
      const { data: servicesData } = await supabase
        .from("services")
        .select("id, nom_service, active, prix_service, created_at")
        .eq("id_atelier", id_atelier);
      setServices(servicesData || []);
      const { data: piecesData } = await supabase
        .from("pieces")
        .select("id, nom_piece, type, prix_achat, prix_vente")
        .eq("id_atelier", id_atelier);
      setPieces(
        (piecesData || []).map((p: any) => ({
          id: p.id,
          nom: p.nom_piece,
          type: p.type,
          prix_achat: p.prix_achat,
          prix_vente: p.prix_vente,
        }))
      );
    };
    fetchAll();
  }, []);

  // Fetch clients
  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("id, nom_client, telephone, email")
      .eq("id_atelier", id_atelier);
    if (!error) setClients(data || []);
  };

  // --- Fetch fiche_services and fiche_pieces on load ---
  useEffect(() => {
    if (!editFiche) return;
    const fetchFicheDetails = async () => {
      const { data: ficheServices } = await supabase
        .from("fiche_services")
        .select("service_id, montant")
        .eq("fiche_id", editFiche.id);
      const { data: fichePieces } = await supabase
        .from("fiche_pieces")
        .select("piece_id, prix")
        .eq("fiche_id", editFiche.id);
      setSelectedServices(
        (ficheServices || [])
          .map((fs: any) => {
            const service = services.find((s) => s.id === fs.service_id);
            return service
              ? { id: service.id, name: service.nom_service, price: fs.montant }
              : null;
          })
          .filter(Boolean) as { id: number; name: string; price: number }[]
      );
      setSelectedPieces(
        (fichePieces || [])
          .map((fp: any) => {
            const piece = pieces.find((p) => p.id === fp.piece_id);
            return piece
              ? { id: piece.id, name: piece.nom, price: fp.prix }
              : null;
          })
          .filter(Boolean) as { id: number; name: string; price: number }[]
      );
    };
    fetchFicheDetails();
    // eslint-disable-next-line
  }, [editFiche, services, pieces]);

  // Set initial inputs for autocomplete fields when data is loaded
  useEffect(() => {
    if (
      editFiche &&
      marques.length &&
      typesProduits.length &&
      techniciens.length &&
      services.length &&
      pieces.length
    ) {
      setMarqueInput(
        marques.find((m) => m.id === editFiche.marque_id)?.nom || ""
      );
      setTypeProduitInput(
        typesProduits.find((t) => t.id === editFiche.type_produit_id)?.type ||
          ""
      );
      setTechnicienInput(
        techniciens.find((t) => t.id === editFiche.technicien_id)
          ?.nom_technicien || ""
      );
      setEtatInput(editFiche.etat || "");
      setServiceInput(
        services.find((s) => s.id === editFiche.id_service)?.nom_service || ""
      );
      setPieceInput(pieces.find((p) => p.id === editFiche.id_piece)?.nom || "");
      setPrixService(
        services.find((s) => s.id === editFiche.id_service)?.prix_service || 0
      );
      setPrixPiece(
        pieces.find((p) => p.id === editFiche.id_piece)?.prix_vente || 0
      );
    }
    // eslint-disable-next-line
  }, [editFiche, marques, typesProduits, techniciens, services, pieces]);

  // Set initial client input when data is loaded
  useEffect(() => {
    if (editFiche && clients.length) {
      const found = clients.find((c) => c.id === editFiche.id_client);
      setClientInput(found ? `${found.nom_client} (${found.telephone})` : "");
    }
  }, [editFiche, clients]);

  // Update prixService when id_service changes
  useEffect(() => {
    if (editFiche?.id_service) {
      const service = services.find((s) => s.id === editFiche.id_service);
      setPrixService(service?.prix_service || 0);
    } else {
      setPrixService(0);
    }
  }, [editFiche?.id_service, services]);

  // Update prixPiece when id_piece changes
  useEffect(() => {
    if (editFiche?.id_piece) {
      const piece = pieces.find((p) => p.id === editFiche.id_piece);
      setPrixPiece(piece?.prix_vente || 0);
    } else {
      setPrixPiece(0);
    }
  }, [editFiche?.id_piece, pieces]);

  // --- Multi-select handlers ---
  const handleServiceSelect = (names: string[]) => {
    setSelectedServices((prev) => {
      const newSelected = names
        .map((name) => {
          const service = services.find((s) => s.nom_service === name);
          const existing = prev.find((s) => s.id === service?.id);
          return service
            ? {
                id: service.id,
                name: service.nom_service,
                price: existing ? existing.price : service.prix_service,
              }
            : null;
        })
        .filter(Boolean) as { id: number; name: string; price: number }[];
      return newSelected;
    });
  };
  const handlePieceSelect = (names: string[]) => {
    setSelectedPieces((prev) => {
      const newSelected = names
        .map((name) => {
          const piece = pieces.find((p) => p.nom === name);
          const existing = prev.find((p) => p.id === piece?.id);
          return piece
            ? {
                id: piece.id,
                name: piece.nom,
                price: existing ? existing.price : piece.prix_vente,
              }
            : null;
        })
        .filter(Boolean) as { id: number; name: string; price: number }[];
      return newSelected;
    });
  };
  const handleServicePriceChange = (id: number, price: number) => {
    setSelectedServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, price } : s))
    );
  };
  const handlePiecePriceChange = (id: number, price: number) => {
    setSelectedPieces((prev) =>
      prev.map((p) => (p.id === id ? { ...p, price } : p))
    );
  };
  const handleRemoveService = (id: number) => {
    setSelectedServices((prev) => prev.filter((s) => s.id !== id));
  };
  const handleRemovePiece = (id: number) => {
    setSelectedPieces((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClientSelect = (value: string) => {
    setClientInput(value);
    const found = clients.find(
      (c) => `${c.nom_client} (${c.telephone})` === value
    );
    if (found) {
      setEditFiche((prev) =>
        prev
          ? { ...prev, id_client: found.id, telephone: found.telephone || "" }
          : prev
      );
    } else {
      setEditFiche((prev) =>
        prev ? { ...prev, id_client: 0, telephone: "" } : prev
      );
    }
    if (errors.id_client)
      setErrors((prev) => ({ ...prev, id_client: undefined }));
  };

  // --- Total calculation ---
  const total =
    selectedServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0) +
    selectedPieces.reduce((sum, p) => sum + (Number(p.price) || 0), 0);

  // Handle input changes
  const handleInputChange = (
    field: keyof Fiche,
    value: string | number | null | undefined
  ) => {
    setEditFiche((prev) => (prev ? { ...prev, [field]: value } : prev));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Update function
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFiche) return;

    // Basic validation
    const newErrors: Partial<Fiche> = {};
    if (!editFiche.id_client || editFiche.id_client === 0)
      newErrors.id_client = "Le client est requis" as any;
    if (!editFiche.telephone?.trim())
      newErrors.telephone = "Le téléphone est requis";
    if (!editFiche.etat) newErrors.etat = "L'état est requis";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Update fiche (with id_client)
    const { error: ficheError } = await supabase
      .from("fiches")
      .update({
        id_client: editFiche.id_client,
        telephone: editFiche.telephone,
        code_barre: editFiche.code_barre,
        marque_id: editFiche.marque_id || null,
        type_produit_id: editFiche.type_produit_id || null,
        modele: editFiche.modele,
        diagnostic: editFiche.diagnostic,
        etat: editFiche.etat,
        technicien_id: editFiche.technicien_id || null,
        date_reception: editFiche.date_reception || null,
        date_enlevement: editFiche.date_enlevement || null,
        montant_total: total,
        montant_paye: editFiche.montant_paye ?? 0,
      })
      .eq("id", editFiche.id);
    if (ficheError) {
      setToast({
        type: "error",
        message: "Erreur lors de la mise à jour de la fiche !",
      });
      return;
    }
    // Delete old fiche_services and fiche_pieces
    await supabase.from("fiche_services").delete().eq("fiche_id", editFiche.id);
    await supabase.from("fiche_pieces").delete().eq("fiche_id", editFiche.id);
    // Insert new fiche_services
    for (const s of selectedServices) {
      await supabase.from("fiche_services").insert({
        fiche_id: editFiche.id,
        service_id: s.id,
        montant: s.price,
      });
    }
    // Insert new fiche_pieces
    for (const p of selectedPieces) {
      await supabase.from("fiche_pieces").insert({
        fiche_id: editFiche.id,
        piece_id: p.id,
        prix: p.price,
      });
    }
    setToast({ type: "success", message: "Fiche modifiée avec succès !" });
    setTimeout(() => {
      navigate("/fiches");
    }, 1200);
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  if (!editFiche) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Toast */}
      {toast && (
        <div
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
            onClick={() => setToast(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center bg-white">
            <FileText className="h-8 w-8 text-blue-700" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Modifier Fiche
            </h3>
            <p className="text-sm text-gray-600">Modifier une fiche client</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleUpdate} className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Informations Client */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Informations Client
            </h4>
            <div className="space-y-2">
              <ModernSelect
                options={clients.map((c) => c.nom_client)}
                value={clientInput}
                onChange={(value) => handleClientSelect(value as string)}
                placeholder="Sélectionnez un client"
                searchPlaceholder="Rechercher un client"
                icon={<User className="inline h-4 w-4 mr-2 text-gray-500" />}
                label="Nom du Client"
                required
                error={errors.id_client?.toString()}
              />
              {errors.id_client && (
                <p className="text-xs text-red-600">{errors.id_client}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <Phone className="inline h-4 w-4 mr-2 text-gray-500" />
                Téléphone *
              </label>
              <input
                type="tel"
                value={editFiche.telephone}
                onChange={(e) => handleInputChange("telephone", e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.telephone
                    ? "border-red-300 bg-red-50 focus:ring-red-500"
                    : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
                }`}
                placeholder="Numéro de téléphone"
              />
              {errors.telephone && (
                <p className="text-xs text-red-600">{errors.telephone}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <Barcode className="inline h-4 w-4 mr-2 text-gray-500" />
                Code à barre
              </label>
              <input
                type="text"
                value={editFiche.code_barre}
                readOnly
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Code à barre du produit"
              />
            </div>
          </div>

          {/* Informations Produit */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Informations Produit
            </h4>
            <div className="space-y-2">
              <ModernSelect
                options={marques.map((m) => m.nom)}
                value={marqueInput}
                onChange={(value) => {
                  const v = value as string;
                  setMarqueInput(v);
                  const found = marques.find(
                    (m) => m.nom.toLowerCase() === v.toLowerCase()
                  );
                  handleInputChange("marque_id", found ? found.id : null);
                }}
                placeholder="Sélectionnez une marque"
                searchPlaceholder="Rechercher une marque"
                icon={<Package className="inline h-4 w-4 text-gray-500" />}
                label="Marque"
                required
              />
            </div>
            <div className="space-y-2">
              <ModernSelect
                options={typesProduits.map((t) => t.type)}
                value={typeProduitInput}
                onChange={(value) => {
                  const v = value as string;
                  setTypeProduitInput(v);
                  const found = typesProduits.find(
                    (t) => t.type.toLowerCase() === v.toLowerCase()
                  );
                  handleInputChange("type_produit_id", found ? found.id : null);
                }}
                placeholder="Sélectionnez un type"
                searchPlaceholder="Rechercher un type"
                icon={<Cpu className="inline h-4 w-4 text-gray-500" />}
                label="Type de produit"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Modèle
              </label>
              <input
                type="text"
                value={editFiche.modele}
                onChange={(e) => handleInputChange("modele", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Modèle du produit"
              />
            </div>
          </div>

          {/* Informations Service */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Informations Service
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <ModernSelect
                  options={etatOptions}
                  value={etatInput}
                  onChange={(value) => {
                    const v = value as string;
                    setEtatInput(v);
                    const found = etatOptions.find(
                      (etat) => etat.toLowerCase() === v.toLowerCase()
                    );
                    handleInputChange("etat", found ? found : v);
                  }}
                  placeholder="Sélectionnez un état"
                  searchPlaceholder="Rechercher un état"
                  icon={
                    <CheckCircle className="inline h-4 w-4 text-gray-500" />
                  }
                  label="État"
                  required
                />
              </div>
              <div className="space-y-2">
                <ModernSelect
                  options={techniciens.map((t) => t.nom_technicien)}
                  value={technicienInput}
                  onChange={(value) => {
                    const v = value as string;
                    setTechnicienInput(v);
                    const found = techniciens.find(
                      (t) => t.nom_technicien.toLowerCase() === v.toLowerCase()
                    );
                    handleInputChange("technicien_id", found ? found.id : null);
                  }}
                  placeholder="Sélectionnez un technicien"
                  searchPlaceholder="Rechercher un technicien"
                  icon={<Wrench className="inline h-4 w-4 text-gray-500" />}
                  label="Technicien"
                  required
                />
              </div>
            </div>
            {/* Service autocomplete */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Services Multi-Select */}
              <div className="space-y-2">
                <ModernSelect
                  options={services.map((s) => s.nom_service)}
                  value={selectedServices.map((s) => s.name)}
                  onChange={(names) => handleServiceSelect(names as string[])}
                  placeholder="Sélectionnez un ou plusieurs services"
                  searchPlaceholder="Rechercher un service"
                  icon={<Wrench className="inline h-4 w-4 text-gray-500" />}
                  label="Services"
                  multiple={true}
                  required={false}
                />
                {/* Summary for services */}
                <div className="flex flex-col gap-1 mt-1">
                  {selectedServices.map((s) => (
                    <div
                      key={s.id}
                      className="flex justify-between items-center bg-blue-50 rounded px-2 py-1"
                    >
                      <span className="flex items-center gap-1 text-xs text-blue-900 font-medium">
                        <Wrench className="w-3 h-3" />
                        {s.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <input
                          type="number"
                          value={s.price}
                          min={0}
                          step={0.1}
                          onWheel={(e) => e.currentTarget.blur()}
                          onChange={(e) =>
                            handleServicePriceChange(
                              s.id,
                              Number(e.target.value)
                            )
                          }
                          className="w-16 px-1 py-0.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 text-right [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
                        />

                        <span className="text-xs">DT</span>
                        <button
                          onClick={() => handleRemoveService(s.id)}
                          className="ml-1 text-blue-700 hover:text-red-500"
                        >
                          <XCircle className="w-3 h-3" />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Pieces Multi-Select */}
              <div className="space-y-2">
                <ModernSelect
                  options={pieces.map((p) => p.nom)}
                  value={selectedPieces.map((p) => p.name)}
                  onChange={(names) => handlePieceSelect(names as string[])}
                  placeholder="Sélectionnez une ou plusieurs pièces"
                  searchPlaceholder="Rechercher une pièce"
                  icon={<Cpu className="inline h-4 w-4 text-gray-500" />}
                  label="Pièces"
                  multiple={true}
                  required={false}
                />
                {/* Summary for pieces */}
                <div className="flex flex-col gap-1 mt-1">
                  {selectedPieces.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center bg-green-50 rounded px-2 py-1"
                    >
                      <span className="flex items-center gap-1 text-xs text-green-900 font-medium">
                        <Cpu className="w-3 h-3" />
                        {p.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <input
                          type="number"
                          value={p.price}
                          min={0}
                          step={0.1}
                          onWheel={(e) => e.currentTarget.blur()}
                          onChange={(e) =>
                            handlePiecePriceChange(p.id, Number(e.target.value))
                          }
                          className="w-16 px-1 py-0.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 text-right [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
                        />

                        <span className="text-xs">DT</span>
                        <button
                          onClick={() => handleRemovePiece(p.id)}
                          className="ml-1 text-green-700 hover:text-red-500"
                        >
                          <XCircle className="w-3 h-3" />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Total price display */}
            {/* <div className="mt-4 flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">
                Total:
              </span>
              <span className="text-sm font-semibold text-green-700 rounded-lg bg-green-100 px-2">
                {total} DT
              </span>
            </div> */}
            {/* Montant fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <DollarSign className="inline h-4 w-4 mr-2 text-gray-500" />
                  Montant Total
                  <span className="ml-2 text-sm font-semibold text-gray-700 rounded-lg bg-gray-100 px-2">
                    {total} DT
                  </span>
                </label>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <DollarSign className="inline h-4 w-4 mr-2 text-gray-500" />
                  Montant Payé
                  <span className="ml-2 text-sm font-semibold text-green-700 rounded-lg bg-green-100 px-2">
                    {editFiche.montant_paye ?? ""} DT
                  </span>
                </label>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <DollarSign className="inline h-4 w-4 mr-2 text-gray-500" />
                  Montant Restant
                  {total - (editFiche.montant_paye ?? 0) <= 0 ? (
                    <span className="ml-2 text-sm font-semibold text-green-700 rounded-lg bg-green-100 px-2">
                      {total - (editFiche.montant_paye ?? 0)} DT
                    </span>
                  ) : (
                    <span className="ml-2 text-sm font-semibold text-red-500 rounded-lg bg-red-100 px-2">
                      {total - (editFiche.montant_paye ?? 0)} DT
                    </span>
                  )}
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <Calendar className="inline h-4 w-4 mr-2 text-gray-500" />
                Date de Récéption
              </label>
              <input
                type="datetime-local"
                value={formatDateForInput(editFiche.date_reception)}
                onChange={(e) =>
                  handleInputChange("date_reception", e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <label className="block text-sm font-medium text-gray-700">
                <Calendar className="inline h-4 w-4 mr-2 text-gray-500" />
                Date d'enlèvement
              </label>
              <input
                type="datetime-local"
                value={formatDateForInput(editFiche.date_enlevement)}
                onChange={(e) =>
                  handleInputChange("date_enlevement", e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Diagnostic & Service
              </label>
              <textarea
                value={editFiche.diagnostic}
                onChange={(e) =>
                  handleInputChange("diagnostic", e.target.value)
                }
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Décrivez le diagnostic et les services nécessaires..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={() => navigate("/fiches")}
            className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Sauvegarder les modifications
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModifierFiche;
