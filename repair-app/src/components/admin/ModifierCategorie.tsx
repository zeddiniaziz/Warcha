import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../supabase-client";
import { Layers, Tag, CheckCircle, XCircle } from "lucide-react";

interface Familles_Pieces {
  id: number;
  type: string;
  active: boolean;
  created_at?: string;
}

const ModifierCategorie: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const categorieFromState = location.state?.categorie as
    | Familles_Pieces
    | undefined;

  const [editCategorie, setEditCategorie] = useState<Familles_Pieces | null>(
    categorieFromState || null
  );
  const [errors, setErrors] = useState<Partial<Familles_Pieces>>({});
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  if (!editCategorie) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Aucune catégorie à modifier.</div>
      </div>
    );
  }

  const handleInputChange = (
    field: keyof Familles_Pieces,
    value: string | boolean
  ) => {
    setEditCategorie((prev) => (prev ? { ...prev, [field]: value } : prev));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleReset = () => {
    setEditCategorie(categorieFromState || null);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Partial<Familles_Pieces> = {};
    if (!editCategorie.type.trim())
      newErrors.type = "Le nom de la catégorie est requis";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Update in "familles_pieces"
    const { error } = await supabase
      .from("familles_pieces")
      .update({
        type: editCategorie.type,
        active: editCategorie.active,
      })
      .eq("id", editCategorie.id);

    if (error) {
      setToast({
        type: "error",
        message: "Erreur lors de la modification de la catégorie !",
      });
      return;
    }

    setToast({ type: "success", message: "Catégorie modifiée avec succès !" });
    setTimeout(() => {
      navigate("/categories_pieces");
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
            <Layers className="h-8 w-8 text-blue-700" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Modifier Catégorie
            </h3>
            <p className="text-sm text-gray-600">
              Modifier une catégorie de pièce
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <Tag className="inline h-4 w-4 mr-2 text-gray-500" />
            Nom de la catégorie *
          </label>
          <input
            type="text"
            value={editCategorie.type}
            onChange={(e) => handleInputChange("type", e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.type
                ? "border-red-300 bg-red-50 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
            }`}
            placeholder="Entrez le nom de la catégorie"
          />
          {errors.type && <p className="text-xs text-red-600">{errors.type}</p>}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Statut *
          </label>
          <button
            type="button"
            className={`
        flex items-center justify-between w-full px-4 py-3 rounded-lg border 
        
      `}
            onClick={() => handleInputChange("active", !editCategorie.active)}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`
          relative w-10 h-5 rounded-full transition-all duration-200 ease-in-out
          ${editCategorie.active ? "bg-green-600" : "bg-gray-300"}
        `}
              >
                <div
                  className={`
            absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ease-in-out
            ${editCategorie.active ? "translate-x-5" : "translate-x-0.5"}
          `}
                ></div>
              </div>

              <div className="flex flex-col items-start">
                <span
                  className={`
            text-sm font-medium transition-colors duration-200
            ${editCategorie.active ? "text-green-700" : "text-gray-600"}
          `}
                >
                  {editCategorie.active ? "Active" : "Inactive"}
                </span>
                <span
                  className={`
            text-xs transition-colors duration-200
            ${editCategorie.active ? "text-gray-600" : "text-gray-500"}
          `}
                >
                  {editCategorie.active
                    ? "Catégorie disponible"
                    : "Catégorie non disponible"}
                </span>
              </div>
            </div>

            <div
              className={`
        w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200
        ${editCategorie.active ? "text-green-600" : "text-gray-400"}
      `}
            >
              {editCategorie.active ? (
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="red"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </button>
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

export default ModifierCategorie;
