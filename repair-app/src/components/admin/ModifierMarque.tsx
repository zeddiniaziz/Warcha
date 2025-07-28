import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../supabase-client";
import { Tag, CheckCircle, XCircle } from "lucide-react";

interface Marque {
  id: number;
  nom: string;
}

const ModifierMarque: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const marqueFromState = location.state?.marque as Marque | undefined;

  const [editMarque, setEditMarque] = useState<Marque | null>(
    marqueFromState || null
  );
  const [errors, setErrors] = useState<Partial<Marque>>({});
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  if (!editMarque) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Aucune marque à modifier.</div>
      </div>
    );
  }

  const handleInputChange = (field: keyof Marque, value: string) => {
    setEditMarque((prev) => (prev ? { ...prev, [field]: value } : prev));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleReset = () => {
    setEditMarque(marqueFromState || null);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Partial<Marque> = {};
    if (!editMarque.nom.trim())
      newErrors.nom = "Le nom de la marque est requis";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Update in "marques"
    const { error } = await supabase
      .from("marques")
      .update({
        nom: editMarque.nom,
      })
      .eq("id", editMarque.id);

    if (error) {
      setToast({
        type: "error",
        message: "Erreur lors de la modification de la marque !",
      });
      return;
    }

    setToast({ type: "success", message: "Marque modifiée avec succès !" });
    setTimeout(() => {
      navigate("/marques");
    }, 1200);
  };

  return (
    <div className="m-5 max-w-lg mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
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
            <Tag className="h-8 w-8 text-blue-700" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Modifier Marque
            </h3>
            <p className="text-sm text-gray-600">Modifier une marque</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <Tag className="inline h-4 w-4 mr-2 text-gray-500" />
            Nom de la marque *
          </label>
          <input
            type="text"
            value={editMarque.nom}
            onChange={(e) => handleInputChange("nom", e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.nom
                ? "border-red-300 bg-red-50 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
            }`}
            placeholder="Entrez le nom de la marque"
          />
          {errors.nom && <p className="text-xs text-red-600">{errors.nom}</p>}
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
            Sauvegarder les modifications
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModifierMarque;
