import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase-client";
import {
  User,
  Phone,
  Package,
  Wrench,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Settings,
  Cpu,
  DollarSign,
  QrCode,
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
  nom_piece: string;
  type: number;
  prix_achat: number;
  prix_vente: number;
  qte_stock?: number;
  created_at?: string;
}

interface Client {
  id: number;
  nom_client: string;
  telephone: string;
  email: string;
}

interface NewFiche {
  id_client: number; // <-- use id_client instead of nom_client
  telephone: string;
  code_barre: string;
  marque_id: number;
  type_produit_id: number;
  modele: string;
  diagnostic: string;
  etat: string;
  technicien_id: number;
  date_reception: string;
  date_enlevement: string;
  id_service?: number;
  id_piece?: number;
  montant_total?: number;
}

const AjouterFiche: React.FC<{ id_atelier: number | null }> = ({
  id_atelier,
}) => {
  const [newFiche, setNewFiche] = useState<NewFiche>({
    id_client: 0,
    telephone: "",
    code_barre: generateBarcode(),
    marque_id: 0,
    type_produit_id: 0,
    modele: "",
    diagnostic: "",
    etat: "",
    technicien_id: 0,
    date_reception: "",
    date_enlevement: "",
    id_service: undefined,
    id_piece: undefined,
    montant_total: undefined,
  });

  const [marques, setMarques] = useState<Marque[]>([]);
  const [typesProduits, setTypesProduits] = useState<TypeProduit[]>([]);
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [errors, setErrors] = useState<Partial<NewFiche>>({});
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // For autocomplete
  const [marqueInput, setMarqueInput] = useState("");
  const [typeProduitInput, setTypeProduitInput] = useState("");
  const [technicienInput, setTechnicienInput] = useState("");
  const [etatInput, setEtatInput] = useState("");
  const [serviceInput, setServiceInput] = useState("");
  serviceInput;
  const [pieceInput, setPieceInput] = useState("");
  pieceInput;
  const [clients, setClients] = useState<Client[]>([]);
  const [clientInput, setClientInput] = useState("");

  // --- State for multi-select ---
  const [selectedServices, setSelectedServices] = useState<
    { id: number; name: string; price: number }[]
  >([]);
  const [selectedPieces, setSelectedPieces] = useState<
    { id: number; name: string; price: number }[]
  >([]);

  // Fetch marques
  const fetchMarques = async () => {
    const { data, error } = await supabase
      .from("marques")
      .select("*")
      .eq("id_atelier", id_atelier);
    if (!error) setMarques(data || []);
  };

  // Fetch familles_produits
  const fetchTypesProduits = async () => {
    const { data, error } = await supabase
      .from("familles_produits")
      .select("id, type")
      .eq("id_atelier", id_atelier);
    if (!error) setTypesProduits(data || []);
  };

  // Fetch techniciens
  const fetchTechniciens = async () => {
    const { data, error } = await supabase
      .from("techniciens")
      .select("id, nom_technicien")
      .eq("id_atelier", id_atelier);
    if (!error) setTechniciens(data || []);
  };

  // Fetch services
  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("id_atelier", id_atelier);
    if (!error) setServices(data || []);
  };

  // Fetch pieces
  const fetchPieces = async () => {
    const { data, error } = await supabase
      .from("pieces")
      .select("id, nom_piece, type, prix_achat, prix_vente")
      .eq("id_atelier", id_atelier);
    if (!error) setPieces(data || []);
  };

  // Fetch clients
  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("id, nom_client, telephone, email")
      .eq("id_atelier", id_atelier);
    if (!error) setClients(data || []);
  };

  useEffect(() => {
    fetchClients();
    fetchMarques();
    fetchTypesProduits();
    fetchTechniciens();
    fetchServices();
    fetchPieces();
  }, []);


  const handleInputChange = (
    field: keyof NewFiche,
    value: string | number | undefined
  ) => {
    if (field === "id_client") {
      setNewFiche((prev) => ({
        ...prev,
        [field]:
          typeof value === "string" ? parseInt(value) || 0 : Number(value),
      }));
    } else {
      setNewFiche((prev) => ({ ...prev, [field]: value as any }));
    }
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleClientSelect = (value: string) => {
    setClientInput(value);
    const found = clients.find((c) => c.nom_client === value);
    if (found) {
      setNewFiche((prev) => ({
        ...prev,
        id_client: found.id,
        telephone: found.telephone || "",
      }));
    } else {
      setNewFiche((prev) => ({ ...prev, id_client: 0, telephone: "" }));
    }
    if (errors.id_client)
      setErrors((prev) => ({ ...prev, id_client: undefined }));
  };

  const handleReset = () => {
    setNewFiche({
      id_client: 0,
      telephone: "",
      code_barre: generateBarcode(),
      marque_id: 0,
      type_produit_id: 0,
      modele: "",
      diagnostic: "",
      etat: "",
      technicien_id: 0,
      date_reception: "",
      date_enlevement: "",
      id_service: undefined,
      id_piece: undefined,
      montant_total: undefined,
    });
    setClientInput("");
    setMarqueInput("");
    setTypeProduitInput("");
    setTechnicienInput("");
    setEtatInput("");
    setServiceInput("");
    setPieceInput("");
    setSelectedServices([]);
    setSelectedPieces([]);
    setErrors({});
  };

  // --- Multi-select handlers ---
  const handleServiceSelect = (names: string[]) => {
    // Add new, keep existing, remove unselected
    setSelectedServices((prev) => {
      // Find all selected service objects
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
          const piece = pieces.find((p) => p.nom_piece === name);
          const existing = prev.find((p) => p.id === piece?.id);
          return piece
            ? {
                id: piece.id,
                name: piece.nom_piece,
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

  // --- Total calculation ---
  const total =
    selectedServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0) +
    selectedPieces.reduce((sum, p) => sum + (Number(p.price) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Partial<NewFiche> = {};
    if (!newFiche.id_client || newFiche.id_client === 0)
      newErrors.id_client = "Le client est requis" as any;
    if (!newFiche.telephone.trim())
      newErrors.telephone = "Le téléphone est requis";
    if (!newFiche.etat) newErrors.etat = "L'état est requis";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Check uniqueness before insert
    const { data: existing } = await supabase
      .from("fiches")
      .select("id")
      .eq("code_barre", newFiche.code_barre)
      .single();

    if (existing) {
      setToast({
        type: "error",
        message:
          "Le code à barre généré existe déjà, veuillez recharger la page.",
      });
      // Optionally, regenerate and set a new barcode here
      setNewFiche((prev) => ({ ...prev, code_barre: generateBarcode() }));
      return;
    }
    // Insert fiche (with id_client)
    const { data: ficheData, error: ficheError } = await supabase
      .from("fiches")
      .insert({
        id_client: newFiche.id_client,
        telephone: newFiche.telephone,
        code_barre: newFiche.code_barre,
        marque_id: newFiche.marque_id || null,
        type_produit_id: newFiche.type_produit_id || null,
        modele: newFiche.modele,
        diagnostic: newFiche.diagnostic,
        etat: newFiche.etat,
        technicien_id: newFiche.technicien_id || null,
        date_enlevement: newFiche.date_enlevement || null,
        date_reception: newFiche.date_reception || null,
        montant_total: total,
        id_atelier: id_atelier,
      })
      .select()
      .single();
    if (ficheError || !ficheData) {
      setToast({
        type: "error",
        message: "Erreur lors de l'ajout de la fiche !",
      });
      return;
    }
    const ficheId = ficheData.id;
    // Insert fiche_services
    for (const s of selectedServices) {
      await supabase.from("fiche_services").insert({
        fiche_id: ficheId,
        service_id: s.id,
        montant: s.price,
      });
    }
    // Insert fiche_pieces
    for (const p of selectedPieces) {
      await supabase.from("fiche_pieces").insert({
        fiche_id: ficheId,
        piece_id: p.id,
        prix: p.price,
      });
    }
    setToast({ type: "success", message: "Fiche ajoutée avec succès !" });
    handleReset();
  };

  const etatOptions = ["En attente", "En cours", "Terminé", "Livré"];

  function generateBarcode() {
    const now = new Date();
    const datePart = now
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 14); // YYYYMMDDHHMMSS
    const randomPart = Math.floor(1000 + Math.random() * 9000); // 4 digits
    return `QR-${datePart}-${randomPart}`;
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
              Nouvelle Fiche
            </h3>
            <p className="text-sm text-gray-600">Ajouter une fiche client</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
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
                value={newFiche.telephone}
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
                <QrCode className="inline h-4 w-4 mr-2 text-gray-500" />
                QR Code
              </label>
              <input
                type="text"
                value={newFiche.code_barre}
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
                value={marqueInput as string}
                onChange={(value) => {
                  const v = value as string;
                  setMarqueInput(v);
                  const found = marques.find(
                    (m) => m.nom.toLowerCase() === v.toLowerCase()
                  );
                  handleInputChange("marque_id", found ? found.id : 0);
                }}
                placeholder="Sélectionnez une marque"
                searchPlaceholder="Rechercher une marque"
                icon={<Package className="inline h-4 w-4 mr-2 text-gray-500" />}
                label="Marque"
                required
              />
            </div>

            <ModernSelect
              options={typesProduits.map((t) => t.type)}
              value={typeProduitInput as string}
              onChange={(value) => {
                const v = value as string;
                setTypeProduitInput(v);
                const found = typesProduits.find(
                  (t) => t.type.toLowerCase() === v.toLowerCase()
                );
                handleInputChange("type_produit_id", found ? found.id : 0);
              }}
              placeholder="Sélectionnez un type"
              searchPlaceholder="Rechercher un type"
              icon={<Cpu className="inline h-4 w-4 mr-2 text-gray-500" />}
              label="Type de produit"
              required
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Modèle
              </label>
              <input
                type="text"
                value={newFiche.modele}
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
                  value={etatInput as string}
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
                  value={technicienInput as string}
                  onChange={(value) => {
                    const v = value as string;
                    setTechnicienInput(v);
                    const found = techniciens.find(
                      (t) => t.nom_technicien.toLowerCase() === v.toLowerCase()
                    );
                    handleInputChange("technicien_id", found ? found.id : 0);
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
                  options={pieces.map((p) => p.nom_piece)}
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
                        <Settings className="w-3 h-3" />
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
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <Calendar className="inline h-4 w-4 mr-2 text-gray-500" />
                Date de Récéption
              </label>
              <input
                type="datetime-local"
                value={newFiche.date_reception}
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
                value={newFiche.date_enlevement}
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
                value={newFiche.diagnostic}
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
            onClick={handleReset}
            className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Réinitialiser
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Ajouter la fiche
          </button>
        </div>
      </form>
    </div>
  );
};

export default AjouterFiche;
