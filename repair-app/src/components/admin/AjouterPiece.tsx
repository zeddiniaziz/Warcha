import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase-client";
import { Package, Tag, DollarSign, CheckCircle, XCircle } from "lucide-react";
import ModernSelect from "../ModernSelect";

interface FamillePiece {
  id: number;
  type: string;
  active: boolean;
}

interface NewPiece {
  nom_piece: string;
  type: number | "";
  prix_achat: number | "";
  prix_vente: number | "";
  qte_stock: number | "";
}

const AjouterPiece: React.FC<{ id_atelier: number | null }> = ({
  id_atelier,
}) => {
  const [famillesPieces, setFamillesPieces] = useState<FamillePiece[]>([]);
  const [newPiece, setNewPiece] = useState<NewPiece>({
    nom_piece: "",
    type: "",
    prix_achat: "",
    prix_vente: "",
    qte_stock: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof NewPiece, string>>>(
    {}
  );
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // For autocomplete
  const [typeInput, setTypeInput] = useState("");

  // Fetch familles_pieces
  const fetchFamillesPieces = async () => {
    const { data, error } = await supabase
      .from("familles_pieces")
      .select("*")
      .eq("id_atelier", id_atelier)
      .eq("active", true);
    if (!error) setFamillesPieces(data || []);
  };

  useEffect(() => {
    fetchFamillesPieces();
  }, []);

  const handleInputChange = (
    field: keyof NewPiece,
    value: string | number | ""
  ) => {
    setNewPiece((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleReset = () => {
    setNewPiece({
      nom_piece: "",
      type: "",
      prix_achat: "",
      prix_vente: "",
      qte_stock: "",
    });
    setTypeInput("");

    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Partial<Record<keyof NewPiece, string>> = {};
    if (!newPiece.nom_piece.trim())
      newErrors.nom_piece = "Le nom de la pièce est requis";
    if (!newPiece.qte_stock)
      newErrors.qte_stock = "La quantité en stock est requise";
    if (!newPiece.type) newErrors.type = "Le type de la pièce est requis";
    if (newPiece.prix_achat === "" || isNaN(Number(newPiece.prix_achat)))
      newErrors.prix_achat = "Prix d'achat requis";
    if (newPiece.prix_vente === "" || isNaN(Number(newPiece.prix_vente)))
      newErrors.prix_vente = "Prix de vente requis";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Insert into "pieces"
    const { error } = await supabase.from("pieces").insert({
      nom_piece: newPiece.nom_piece,
      type: newPiece.type,
      prix_achat: Number(newPiece.prix_achat),
      prix_vente: Number(newPiece.prix_vente),
      qte_stock: Number(newPiece.qte_stock),
      id_atelier: id_atelier,
    });

    if (error) {
      setToast({
        type: "error",
        message: "Erreur lors de l'ajout de la pièce !",
      });
      return;
    }

    setToast({ type: "success", message: "Pièce ajoutée avec succès !" });
    handleReset();
  };

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
              Nouvelle Pièce
            </h3>
            <p className="text-sm text-gray-600">Ajouter une pièce au stock</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* type */}
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
            icon={<Tag className="inline h-4 w-4 text-gray-500" />}
          />
          {errors.type && <p className="text-xs text-red-600">{errors.type}</p>}
        </div>
        {/* nom piece */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <Tag className="inline h-4 w-4 mr-2 text-gray-500" />
            Nom de la pièce *
          </label>
          <input
            type="text"
            value={newPiece.nom_piece}
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

        {/* qte stock */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <Package className="inline h-4 w-4 mr-2 text-gray-500" />
            Quantité en stock *
          </label>
          <input
            type="number"
            min={0}
            step="0.0"
            value={newPiece.qte_stock}
            onChange={(e) => handleInputChange("qte_stock", e.target.value)}
            onWheel={(e) => e.currentTarget.blur()}
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield] ${
              errors.qte_stock
                ? "border-red-300 bg-red-50 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
            }`}
            placeholder="Quantité en stock"
          />
          {errors.qte_stock && (
            <p className="text-xs text-red-600">{errors.qte_stock}</p>
          )}
        </div>

        {/* prix achat */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <DollarSign className="inline h-4 w-4 mr-2 text-gray-500" />
            Prix d'achat *
          </label>
          <input
            type="number"
            min={0}
            step="0.1"
            value={newPiece.prix_achat}
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
        {/* prix vente */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <DollarSign className="inline h-4 w-4 mr-2 text-gray-500" />
            Prix de vente *
          </label>
          <input
            type="number"
            min={0}
            step="0.1"
            value={newPiece.prix_vente}
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
        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end border-t border-gray-200 pt-6">
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
            Ajouter la pièce
          </button>
        </div>
      </form>
    </div>
  );
};

export default AjouterPiece;
