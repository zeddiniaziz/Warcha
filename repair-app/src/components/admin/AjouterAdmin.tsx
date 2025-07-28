import React, { useState } from "react";
import { supabase } from "../../supabase-client";
import {
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  User,
  Phone,
  Mail,
  Lock,
  ShieldUser,
} from "lucide-react";

interface NewAdmin {
  nom_admin: string;
  telephone: string;
  email: string;
  password: string;
}

const AjouterAdmin: React.FC<{ id_atelier: number | null }> = ({ id_atelier }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [newAdmin, setNewAdmin] = useState<NewAdmin>({
    nom_admin: "",
    telephone: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<NewAdmin>>({});
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof NewAdmin, value: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    setNewAdmin((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setNewAdmin({
      nom_admin: "",
      telephone: "",
      email: "",
      password: "",
    });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Basic validation
      const newErrors: Partial<NewAdmin> = {};
      if (!newAdmin.nom_admin.trim())
        newErrors.nom_admin = "Le nom de l'administrateur est requis";
      if (!newAdmin.telephone.trim())
        newErrors.telephone = "Le numéro de téléphone est requis";
      if (!newAdmin.email.trim()) newErrors.email = "L'email est requis";
      if (!newAdmin.password.trim())
        newErrors.password = "Le mot de passe est requis";
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setLoading(false);
        return;
      }

      // Insert into admins
      const { data: adminData, error: adminError } = await supabase
        .from("admins")
        .insert({
          nom_admin: newAdmin.nom_admin,
          telephone: newAdmin.telephone,
          email: newAdmin.email,
          password: newAdmin.password,
          id_atelier: id_atelier,
          isSub: true,
        })
        .select()
        .single();
      adminData;
      if (adminError) {
        setToast({
          type: "error",
          message:
            adminError.message ||
            "Erreur lors de l'ajout de l'administrateur !",
        });
        setLoading(false);
        return;
      }

      setToast({
        type: "success",
        message: "Administrateur ajouté avec succès !",
      });
      handleReset();
    } catch (err) {
      console.error("Unexpected error:", err);
      setToast({
        type: "error",
        message: "Une erreur inattendue est survenue.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="m-5 max-w-lg mx-auto bg-white rounded-lg shadow-lg">
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
            <ShieldUser className="h-8 w-8 text-blue-700" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Nouvel Administrateur
            </h3>
            <p className="text-sm text-gray-600">
              Ajouter un nouvel administrateur
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <User className="inline h-4 w-4 mr-2 text-gray-500" />
            Nom de l'administrateur *
          </label>
          <input
            type="text"
            value={newAdmin.nom_admin}
            onChange={(e) => handleInputChange("nom_admin", e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.nom_admin
                ? "border-red-300 bg-red-50 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
            }`}
            placeholder="Entrez le nom de l'administrateur"
          />
          {errors.nom_admin && (
            <p className="text-xs text-red-600">{errors.nom_admin}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <Phone className="inline h-4 w-4 mr-2 text-gray-500" />
            Numéro de téléphone *
          </label>
          <input
            type="text"
            value={newAdmin.telephone}
            onChange={(e) => handleInputChange("telephone", e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.telephone
                ? "border-red-300 bg-red-50 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
            }`}
            placeholder="Entrez le numéro de téléphone"
          />
          {errors.telephone && (
            <p className="text-xs text-red-600">{errors.telephone}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <Mail className="inline h-4 w-4 mr-2 text-gray-500" />
            Email *
          </label>
          <input
            type="email"
            value={newAdmin.email || ""}
            onChange={(e) => handleInputChange("email", e.target.value)}
            autoComplete="off"
            name="new_admin_email"
            id="new_admin_email"
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.email
                ? "border-red-300 bg-red-50 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
            }`}
            placeholder="Entrez l'email de l'administrateur"
          />
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <Lock className="inline h-4 w-4 mr-2 text-gray-500" />
            Mot de passe *
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={newAdmin.password || ""}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.password
                  ? "border-red-300 bg-red-50 focus:ring-red-500"
                  : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
              }`}
              placeholder="Entrez le mot de passe de l'administrateur"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              tabIndex={-1}
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-600">{errors.password}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-200"
          >
            Réinitialiser
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Ajout en cours..." : "Ajouter l'administrateur"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AjouterAdmin;
