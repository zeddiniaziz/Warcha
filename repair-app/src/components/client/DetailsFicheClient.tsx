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
  ArrowLeft,
  Printer,
} from "lucide-react";

// --- Interfaces ---
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
  id_service?: number;
  id_piece?: number;
  montant_total?: number;
  montant_paye?: number;
  montant_restant?: number;
}

interface Client {
  id: number;
  nom_client: string;
  telephone: string;
}

// Helper to format date for display
function formatDateForDisplay(dateString: string | null | undefined) {
  if (!dateString) return "Non spécifiée";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "Date invalide";
  return d.toLocaleString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Helper to format date for print
function formatDateForPrint(dateString: string | null | undefined) {
  if (!dateString) return "Non spécifiée";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "Date invalide";
  return (
    d.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }) +
    " " +
    d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

// Print function
function imprimerFiche(
  fiche: Fiche,
  clientName: string,
  marqueInput: string,
  typeProduitInput: string,
  technicienInput: string,
  selectedServices: any[],
  selectedPieces: any[],
  total: number
) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const printContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Fiche de Réparation - ${fiche.code_barre}</title>
      <style>
        @media print {
          body { 
            margin: 0; 
            padding: 15px; 
            font-family: Arial, sans-serif; 
            font-size: 12px;
            line-height: 1.3;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #333; 
            padding-bottom: 8px; 
            margin-bottom: 12px; 
          }
          .header h1 { 
            margin: 0 0 5px 0; 
            font-size: 18px; 
            color: #2563eb; 
          }
          .header h2 { 
            margin: 0 0 3px 0; 
            font-size: 14px; 
            color: #666; 
          }
          .header p { 
            margin: 0; 
            font-size: 10px; 
            color: #888; 
          }
          .section { 
            margin-bottom: 12px; 
          }
          .section h3 { 
            color: #2563eb; 
            border-bottom: 1px solid #ccc; 
            padding-bottom: 3px; 
            margin: 0 0 8px 0; 
            font-size: 14px; 
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 8px; 
            margin-bottom: 0; 
          }
          .info-item { 
            display: flex; 
            justify-content: space-between; 
            padding: 2px 0; 
            border-bottom: 1px dotted #ddd;
          }
          .info-item span:first-child {
            font-weight: 600;
            color: #555;
          }
          .services-list, .pieces-list { 
            margin: 5px 0; 
          }
          .service-item, .piece-item { 
            display: flex; 
            justify-content: space-between; 
            padding: 3px 8px; 
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            margin-bottom: 2px;
            border-radius: 3px;
          }
          .service-item span:last-child,
          .piece-item span:last-child {
            font-weight: bold;
            color: #2563eb;
          }
          .total-section { 
            border-top: 2px solid #333; 
            padding-top: 8px; 
            margin-top: 12px; 
            background: #f8f9fa;
            padding: 8px;
            border-radius: 5px;
          }
          .status { 
            font-weight: bold; 
            color: #059669; 
            background: #d1fae5;
            padding: 2px 6px;
            border-radius: 3px;
          }
          .amount { 
            font-weight: bold; 
            font-size: 13px;
          }
          .amount.paid { 
            color: #059669; 
          }
          .amount.unpaid { 
            color: #dc2626; 
          }
          .diagnostic-section {
            background: #f8f9fa;
            padding: 8px;
            border-radius: 5px;
            border-left: 4px solid #2563eb;
          }
          .diagnostic-section p {
            margin: 0;
            font-style: italic;
          }
          .footer {
            margin-top: 15px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 8px;
          }
          .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          @page { 
            margin: 1cm; 
            size: A4;
          }
        }
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.3; 
          color: #333; 
          font-size: 12px;
        }
        .header { 
          text-align: center; 
          border-bottom: 2px solid #333; 
          padding-bottom: 8px; 
          margin-bottom: 12px; 
        }
        .header h1 { 
          margin: 0 0 5px 0; 
          font-size: 18px; 
          color: #2563eb; 
        }
        .header h2 { 
          margin: 0 0 3px 0; 
          font-size: 14px; 
          color: #666; 
        }
        .header p { 
          margin: 0; 
          font-size: 10px; 
          color: #888; 
        }
        .section { 
          margin-bottom: 12px; 
        }
        .section h3 { 
          color: #2563eb; 
          border-bottom: 1px solid #ccc; 
          padding-bottom: 3px; 
          margin: 0 0 8px 0; 
          font-size: 14px; 
        }
        .info-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 8px; 
          margin-bottom: 0; 
        }
        .info-item { 
          display: flex; 
          justify-content: space-between; 
          padding: 2px 0; 
          border-bottom: 1px dotted #ddd;
        }
        .info-item span:first-child {
          font-weight: 600;
          color: #555;
        }
        .services-list, .pieces-list { 
          margin: 5px 0; 
        }
        .service-item, .piece-item { 
          display: flex; 
          justify-content: space-between; 
          padding: 3px 8px; 
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          margin-bottom: 2px;
          border-radius: 3px;
        }
        .service-item span:last-child,
        .piece-item span:last-child {
          font-weight: bold;
          color: #2563eb;
        }
        .total-section { 
          border-top: 2px solid #333; 
          padding-top: 8px; 
          margin-top: 12px; 
          background: #f8f9fa;
          padding: 8px;
          border-radius: 5px;
        }
        .status { 
          font-weight: bold; 
          color: #059669; 
          background: #d1fae5;
          padding: 2px 6px;
          border-radius: 3px;
        }
        .amount { 
          font-weight: bold; 
          font-size: 13px;
        }
        .amount.paid { 
          color: #059669; 
        }
        .amount.unpaid { 
          color: #dc2626; 
        }
        .diagnostic-section {
          background: #f8f9fa;
          padding: 8px;
          border-radius: 5px;
          border-left: 4px solid #2563eb;
        }
        .diagnostic-section p {
          margin: 0;
          font-style: italic;
        }
        .footer {
          margin-top: 15px;
          text-align: center;
          font-size: 10px;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 8px;
        }
        .two-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Fiche de Réparation</h1>
        <h2>Code: ${fiche.code_barre}</h2>
        <p>Date d'impression: ${new Date().toLocaleDateString("fr-FR")}</p>
      </div>

      <div class="two-column">
        <div>
          <div class="section">
            <h3>Informations Client</h3>
            <div class="info-grid">
              <div class="info-item">
                <span>Nom:</span>
                <span>${clientName}</span>
              </div>
              <div class="info-item">
                <span>Téléphone:</span>
                <span>${fiche.telephone}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Informations Produit</h3>
            <div class="info-grid">
              <div class="info-item">
                <span>Marque:</span>
                <span>${marqueInput}</span>
              </div>
              <div class="info-item">
                <span>Type:</span>
                <span>${typeProduitInput}</span>
              </div>
              <div class="info-item">
                <span>Modèle:</span>
                <span>${fiche.modele || "Non spécifié"}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Services</h3>
            ${
              selectedServices.length > 0
                ? `
              <div class="services-list">
                ${selectedServices
                  .map(
                    (s) => `
                  <div class="service-item">
                    <span>${s.name}</span>
                    <span>${s.price} DT</span>
                  </div>
                `
                  )
                  .join("")}
              </div>
            `
                : "<p style='margin:0; font-style:italic; color:#666;'>Aucun service sélectionné</p>"
            }
          </div>

          <div class="section">
            <h3>Pièces</h3>
            ${
              selectedPieces.length > 0
                ? `
              <div class="pieces-list">
                ${selectedPieces
                  .map(
                    (p) => `
                  <div class="piece-item">
                    <span>${p.name}</span>
                    <span>${p.price} DT</span>
                  </div>
                `
                  )
                  .join("")}
              </div>
            `
                : "<p style='margin:0; font-style:italic; color:#666;'>Aucune pièce sélectionnée</p>"
            }
          </div>
        </div>

        <div>
          <div class="section">
            <h3>Informations Service</h3>
            <div class="info-grid">
              <div class="info-item">
                <span>État:</span>
                <span class="status">${fiche.etat}</span>
              </div>
              <div class="info-item">
                <span>Technicien:</span>
                <span>${technicienInput}</span>
              </div>
              <div class="info-item">
                <span>Réception:</span>
                <span>${formatDateForPrint(fiche.date_reception)}</span>
              </div>
              <div class="info-item">
                <span>Enlèvement:</span>
                <span>${formatDateForPrint(fiche.date_enlevement)}</span>
              </div>
            </div>
          </div>

          <div class="total-section">
            <h3 style="margin-top: 0;">Informations Financières</h3>
            <div class="info-grid">
              <div class="info-item">
                <span>Total:</span>
                <span class="amount">${total.toFixed(3)} DT</span>
              </div>
              <div class="info-item">
                <span>Payé:</span>
                <span class="amount paid">${(fiche.montant_paye ?? 0).toFixed(
                  3
                )} DT</span>
              </div>
              <div class="info-item">
                <span>Restant:</span>
                <span class="amount ${
                  total - (fiche.montant_paye ?? 0) <= 0 ? "paid" : "unpaid"
                }">${(total - (fiche.montant_paye ?? 0)).toFixed(3)} DT</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Diagnostic & Service</h3>
            <div class="diagnostic-section">
              <p>${fiche.diagnostic || "Aucun diagnostic spécifié"}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Document généré le ${new Date().toLocaleString("fr-FR")}</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();

  // Wait for content to load then print
  printWindow.onload = function () {
    printWindow.print();
    printWindow.close();
  };
}

const DetailsFicheClient: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();

  // Try to get fiche from navigation state
  const ficheFromState = location.state?.fiche as Fiche | undefined;
  const ficheIdFromState = location.state?.ficheId as number | undefined;

  const [fiche, setFiche] = useState<Fiche | null>(ficheFromState || null);
  const [loading, setLoading] = useState(
    !ficheFromState && !ficheIdFromState && !!params.id
  );

  // Data for display
  const [marques, setMarques] = useState<Marque[]>([]);
  const [typesProduits, setTypesProduits] = useState<TypeProduit[]>([]);
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // For display
  const [marqueInput, setMarqueInput] = useState("");
  const [typeProduitInput, setTypeProduitInput] = useState("");
  const [technicienInput, setTechnicienInput] = useState("");
  const [clientName, setClientName] = useState("");

  // --- State for services and pieces display ---
  const [selectedServices, setSelectedServices] = useState<
    { id: number; name: string; price: number }[]
  >([]);
  const [selectedPieces, setSelectedPieces] = useState<
    { id: number; name: string; price: number }[]
  >([]);

  // Fetch fiche by ID if not in state (for direct URL access)
  useEffect(() => {
    if (!fiche && (ficheIdFromState || params.id)) {
      setLoading(true);
      const idToFetch = ficheIdFromState || params.id;
      supabase
        .from("fiches")
        .select("*")
        .eq("id", idToFetch)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching fiche:", error);
            setToast({
              type: "error",
              message: "Erreur lors du chargement de la fiche.",
            });
            setTimeout(() => navigate("/sectionClient"), 1200);
            return;
          }
          if (data) {
            setFiche(data);
          } else {
            // No data returned but no error - fiche doesn't exist
            setToast({
              type: "error",
              message: "Aucune fiche trouvée.",
            });
            setTimeout(() => navigate("/sectionClient"), 1200);
          }
          setLoading(false);
        });
    } else if (!fiche && !ficheIdFromState && !params.id) {
      // No fiche data and no ID to fetch
      setLoading(false);
    }
  }, [ficheIdFromState, params.id, navigate]);

  // Fetch data for display
  useEffect(() => {
    const fetchAll = async () => {
      const { data: marquesData } = await supabase.from("marques").select("*");
      setMarques(marquesData || []);
      const { data: typesData } = await supabase
        .from("familles_produits")
        .select("id, type");
      setTypesProduits(typesData || []);
      const { data: techsData } = await supabase
        .from("techniciens")
        .select("id, nom_technicien");
      setTechniciens(techsData || []);
      const { data: servicesData } = await supabase
        .from("services")
        .select("id, nom_service, active, prix_service, created_at");
      setServices(servicesData || []);
      const { data: piecesData } = await supabase
        .from("pieces")
        .select("id, nom_piece, type, prix_achat, prix_vente");
      setPieces(
        (piecesData || []).map((p: any) => ({
          id: p.id,
          nom: p.nom_piece,
          type: p.type,
          prix_achat: p.prix_achat,
          prix_vente: p.prix_vente,
        }))
      );
      const { data: clientsData } = await supabase
        .from("clients")
        .select("id, nom_client, telephone");
      setClients(clientsData || []);
    };
    fetchAll();
  }, []);

  // --- Fetch fiche_services and fiche_pieces on load ---
  useEffect(() => {
    if (!fiche) return;
    const fetchFicheDetails = async () => {
      const { data: ficheServices } = await supabase
        .from("fiche_services")
        .select("service_id, montant")
        .eq("fiche_id", fiche.id);
      const { data: fichePieces } = await supabase
        .from("fiche_pieces")
        .select("piece_id, prix")
        .eq("fiche_id", fiche.id);
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
  }, [fiche, services, pieces]);

  // Set initial inputs for display fields when data is loaded
  useEffect(() => {
    if (
      fiche &&
      marques.length &&
      typesProduits.length &&
      techniciens.length &&
      clients.length
    ) {
      setMarqueInput(
        marques.find((m) => m.id === fiche.marque_id)?.nom || "Non spécifiée"
      );
      setTypeProduitInput(
        typesProduits.find((t) => t.id === fiche.type_produit_id)?.type ||
          "Non spécifié"
      );
      setTechnicienInput(
        techniciens.find((t) => t.id === fiche.technicien_id)?.nom_technicien ||
          "Non assigné"
      );
      setClientName(
        clients.find((c) => c.id === fiche.id_client)?.nom_client ||
          "Client non trouvé"
      );
    }
  }, [fiche, marques, typesProduits, techniciens, clients]);

  // --- Total calculation ---
  const total =
    selectedServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0) +
    selectedPieces.reduce((sum, p) => sum + (Number(p.price) || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la fiche...</p>
        </div>
      </div>
    );
  }

  if (!fiche) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
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

      <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center">
                <FileText className="h-8 w-8 text-blue-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Détails de la Fiche
                </h3>
                <p className="text-sm text-gray-600">
                  Consultation des détails de votre fiche
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Informations Client */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Informations Client
              </h4>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <User className="inline h-4 w-4 mr-2 text-gray-500" />
                  Nom du Client
                </label>
                <div className="bg-gray-50 text-gray-900 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {clientName}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Phone className="inline h-4 w-4 mr-2 text-gray-500" />
                  Téléphone
                </label>
                <div className="bg-gray-50 text-gray-900 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {fiche.telephone}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Barcode className="inline h-4 w-4 mr-2 text-gray-500" />
                  Code à barre
                </label>
                <div className="bg-gray-50 text-gray-900 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {fiche.code_barre || "Non spécifié"}
                </div>
              </div>
            </div>

            {/* Informations Produit */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Informations Produit
              </h4>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Package className="inline h-4 w-4 mr-2 text-gray-500" />
                  Marque
                </label>
                <div className="bg-gray-50 text-gray-900 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {marqueInput}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Type de produit
                </label>
                <div className="bg-gray-50 text-gray-900 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {typeProduitInput}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Modèle
                </label>
                <div className="bg-gray-50 text-gray-900 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {fiche.modele || "Non spécifié"}
                </div>
              </div>
            </div>

            {/* Informations Service */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Informations Service
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <CheckCircle className="inline h-4 w-4 mr-2 text-gray-500" />
                    État
                  </label>
                  <div className="bg-gray-50 text-gray-900 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    {fiche.etat}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <Wrench className="inline h-4 w-4 mr-2 text-gray-500" />
                    Technicien
                  </label>
                  <div className="bg-gray-50 text-gray-900 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    {technicienInput}
                  </div>
                </div>
              </div>

              {/* Services and Pieces Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Services Display */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <Wrench className="inline h-4 w-4 mr-2 text-gray-500" />
                    Services
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3 min-h-[100px]">
                    {selectedServices.length > 0 ? (
                      <div className="space-y-2">
                        {selectedServices.map((s) => (
                          <div
                            key={s.id}
                            className="flex justify-between items-center bg-blue-50 rounded px-3 py-2"
                          >
                            <span className="flex items-center gap-2 text-sm text-blue-900 font-medium">
                              <Wrench className="w-4 h-4" />
                              {s.name}
                            </span>
                            <span className="text-sm font-semibold text-blue-900">
                              {s.price} DT
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        Aucun service sélectionné
                      </p>
                    )}
                  </div>
                </div>

                {/* Pieces Display */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <Cpu className="inline h-4 w-4 mr-2 text-gray-500" />
                    Pièces
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3 min-h-[100px]">
                    {selectedPieces.length > 0 ? (
                      <div className="space-y-2">
                        {selectedPieces.map((p) => (
                          <div
                            key={p.id}
                            className="flex justify-between items-center bg-green-50 rounded px-3 py-2"
                          >
                            <span className="flex items-center gap-2 text-sm text-green-900 font-medium">
                              <Cpu className="w-4 h-4" />
                              {p.name}
                            </span>
                            <span className="text-sm font-semibold text-green-900">
                              {p.price} DT
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        Aucune pièce sélectionnée
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Montant fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <DollarSign className="inline h-4 w-4 mr-2 text-gray-500" />
                    Montant Total
                  </label>
                  <div className="bg-gray-50 text-gray-900 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold">
                    {total.toFixed(3)} DT
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <DollarSign className="inline h-4 w-4 mr-2 text-gray-500" />
                    Montant Payé
                  </label>
                  <div className="bg-green-50 text-green-900 w-full rounded-lg border border-green-300 px-3 py-2 text-sm font-semibold">
                    {(fiche.montant_paye ?? 0).toFixed(3)} DT
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <DollarSign className="inline h-4 w-4 mr-2 text-gray-500" />
                    Montant Restant
                  </label>
                  <div
                    className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold ${
                      total - (fiche.montant_paye ?? 0) <= 0
                        ? "bg-green-50 text-green-900 border-green-300"
                        : "bg-red-50 text-red-900 border-red-300"
                    }`}
                  >
                    {(total - (fiche.montant_paye ?? 0)).toFixed(3)} DT
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <Calendar className="inline h-4 w-4 mr-2 text-gray-500" />
                    Date de Réception
                  </label>
                  <div className="bg-gray-50 text-gray-900 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    {formatDateForDisplay(fiche.date_reception)}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <Calendar className="inline h-4 w-4 mr-2 text-gray-500" />
                    Date d'enlèvement
                  </label>
                  <div className="bg-gray-50 text-gray-900 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    {formatDateForDisplay(fiche.date_enlevement)}
                  </div>
                </div>
              </div>

              {/* Diagnostic */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Diagnostic & Service
                </label>
                <div className="bg-gray-50 text-gray-900 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[100px]">
                  {fiche.diagnostic || "Aucun diagnostic spécifié"}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-center gap-4 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => navigate("/sectionClient")}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à mes fiches
            </button>
            <button
              type="button"
              onClick={() =>
                imprimerFiche(
                  fiche,
                  clientName,
                  marqueInput,
                  typeProduitInput,
                  technicienInput,
                  selectedServices,
                  selectedPieces,
                  total
                )
              }
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Printer className="w-4 h-4" />
              Imprimer Fiche
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsFicheClient;
