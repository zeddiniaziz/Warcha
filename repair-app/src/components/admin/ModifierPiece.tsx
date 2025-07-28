import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../supabase-client";
import { Tag, Package, DollarSign, CheckCircle, XCircle } from "lucide-react";
import ModernSelect from "../ModernSelect";

interface FamillePiece {
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
  qte_stock: number;
  created_at?: string;
}

const ModifierPiece: React.FC<{ id_atelier: number | null }> = ({
  id_atelier,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();

  // Try to get piece from navigation state
  const pieceFromState = location.state?.piece as Piece | undefined;
  const [editPiece, setEditPiece] = useState<Piece | null>(
    pieceFromState || null
  );
  const [loading, setLoading] = useState(!pieceFromState && !!params.id);

  // Data for select/autocomplete
  const [famillesPieces, setFamillesPieces] = useState<FamillePiece[]>([]);
  const [typeInput, setTypeInput] = useState("");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Piece, string>>>(
    {}
  );

  // Fetch piece by ID if not in state (for direct URL access)
  useEffect(() => {
    if (!editPiece && params.id) {
      setLoading(true);
      supabase
        .from("pieces")
        .select("*")
        .eq("id", params.id)
        .single()
        .then(({ data }) => {
          if (data) setEditPiece(data);
          setLoading(false);
        });
    }
  }, [params.id, editPiece]);

  // If no piece, show error and redirect
  useEffect(() => {
    if (!editPiece && !loading) {
      navigate("/pieces");
    }
  }, [editPiece, loading, navigate]);

  // Fetch familles_pieces for type select
  useEffect(() => {
    const fetchFamilles = async () => {
      const { data } = await supabase
        .from("familles_pieces")
        .select("*")
        .eq("id_atelier", id_atelier);
      setFamillesPieces(data || []);
    };
    fetchFamilles();
  }, []);

  // Set initial typeInput when data is loaded
  useEffect(() => {
    if (editPiece && famillesPieces.length) {
      setTypeInput(
        famillesPieces.find((f) => f.id === editPiece.type)?.type || ""
      );
    }
  }, [editPiece, famillesPieces]);

  // Handle input changes
  const handleInputChange = (
    field: keyof Piece,
    value: string | number | ""
  ) => {
    setEditPiece((prev) => (prev ? { ...prev, [field]: value } : prev));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Update function
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPiece) return;

    // Basic validation
    const newErrors: Partial<Record<keyof Piece, string>> = {};
    if (!editPiece.nom_piece?.trim())
      newErrors.nom_piece = "Le nom de la pièce est requis";
    if (!editPiece.type) newErrors.type = "Le type de la pièce est requis";
    if (
      editPiece.prix_achat === undefined ||
      editPiece.prix_achat === null ||
      isNaN(Number(editPiece.prix_achat))
    )
      newErrors.prix_achat = "Prix d'achat requis";
    if (
      editPiece.prix_vente === undefined ||
      editPiece.prix_vente === null ||
      isNaN(Number(editPiece.prix_vente))
    )
      newErrors.prix_vente = "Prix de vente requis";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Update in "pieces"
    const { error } = await supabase
      .from("pieces")
      .update({
        nom_piece: editPiece.nom_piece,
        type: editPiece.type,
        prix_achat: Number(editPiece.prix_achat),
        prix_vente: Number(editPiece.prix_vente),
        qte_stock: Number(editPiece.qte_stock),
      })
      .eq("id", editPiece.id);

    if (error) {
      setToast({
        type: "error",
        message: "Erreur lors de la modification de la pièce !",
      });
      return;
    }

    setToast({ type: "success", message: "Pièce modifiée avec succès !" });
    setTimeout(() => {
      navigate("/pieces");
    }, 1200);
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  if (!editPiece) {
    return null;
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
            <Package className="h-8 w-8 text-blue-700" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Modifier Pièce
            </h3>
            <p className="text-sm text-gray-600">Modifier une pièce du stock</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleUpdate} className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <Tag className="inline h-4 w-4 mr-2 text-gray-500" />
            Nom de la pièce *
          </label>
          <input
            type="text"
            value={editPiece.nom_piece}
            onChange={(e) => handleInputChange("nom_piece", e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.nom_piece
                ? "border-red-300 bg-red-50 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
            }`}
            placeholder="Entrez le nom de la pièce"
          />
          {errors.nom_piece && (
            <p className="text-xs text-red-600">{errors.nom_piece}</p>
          )}
        </div>
        <div className="space-y-2">
          <ModernSelect
            options={famillesPieces.map((t) => t.type)}
            value={typeInput}
            onChange={(value: string | string[]) => {
              const v = value as string;
              setTypeInput(v);
              const found = famillesPieces.find(
                (t) => t.type.toLowerCase() === v.toLowerCase()
              );
              handleInputChange("type", found ? found.id : "");
            }}
            placeholder="Sélectionnez un type"
            label="Type de pièce"
            required
            icon={<Package className="inline h-4 w-4 text-gray-500" />}
          />
          {errors.type && <p className="text-xs text-red-600">{errors.type}</p>}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <DollarSign className="inline h-4 w-4 mr-2 text-gray-500" />
            Prix d'achat *
          </label>
          <input
            type="number"
            min={0}
            step="0.1"
            value={editPiece.prix_achat}
            onChange={(e) => handleInputChange("prix_achat", e.target.value)}
            onWheel={(e) => e.currentTarget.blur()}
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield] ${
              errors.prix_achat
                ? "border-red-300 bg-red-50 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
            }`}
            placeholder="Prix d'achat"
          />
          {errors.prix_achat && (
            <p className="text-xs text-red-600">{errors.prix_achat}</p>
          )}
        </div>

        {/* */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <DollarSign className="inline h-4 w-4 mr-2 text-gray-500" />
            Prix de vente *
          </label>
          <input
            type="number"
            min={0}
            step="0.001"
            value={editPiece.prix_vente}
            onChange={(e) => handleInputChange("prix_vente", e.target.value)}
            onWheel={(e) => e.currentTarget.blur()}
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield] ${
              errors.prix_vente
                ? "border-red-300 bg-red-50 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
            }`}
            placeholder="Prix de vente"
          />
          {errors.prix_vente && (
            <p className="text-xs text-red-600">{errors.prix_vente}</p>
          )}
        </div>
        {/**/}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <DollarSign className="inline h-4 w-4 mr-2 text-gray-500" />
            Quantité en stock *
          </label>
          <input
            type="number"
            min={0}
            step="0.1"
            value={editPiece.qte_stock}
            onChange={(e) => handleInputChange("qte_stock", e.target.value)}
            onWheel={(e) => e.currentTarget.blur()}
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield] ${
              errors.prix_achat
                ? "border-red-300 bg-red-50 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
            }`}
            placeholder="Quantité en stock"
          />
          {errors.qte_stock && (
            <p className="text-xs text-red-600">{errors.qte_stock}</p>
          )}
        </div>
        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={() => navigate("/pieces")}
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

export default ModifierPiece;
