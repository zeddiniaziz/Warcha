import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase-client";
import {
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  User,
  Phone,
  Settings,
} from "lucide-react";
import ModernSelect from "../ModernSelect";

interface NewTechnicien {
  nom_technicien: string;
  numero: string;
  id_service: number;
  email: string;
  password: string;
}
interface Service {
  id: number;
  nom_service: string;
  active: boolean;
  created_at?: string;
}

const AjouterTechnicien: React.FC<{ id_atelier: number | null }> = ({ id_atelier }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [newTechnicien, setNewTechnicien] = useState<NewTechnicien>({
    nom_technicien: "",
    numero: "",
    id_service: 0,
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<NewTechnicien>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [serviceInput, setServiceInput] = useState<string>("");
  const [loading, setLoading] = useState(false); // Added loading state
  const handleInputChange = (field: keyof NewTechnicien, value: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    setNewTechnicien((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setNewTechnicien({
      nom_technicien: "",
      numero: "",
      id_service: 0,
      email: "",
      password: "",
    });
    setErrors({});
    setServiceInput("");
  };
  const AfficherLesServices = async () => {
    const { data, error } = await supabase.from("services").select("*").eq("id_atelier", id_atelier);
    if (error) {
      throw error;
    }
    setServices(data);
  };
  useEffect(() => {
    AfficherLesServices();
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Basic validation
      const newErrors: Partial<NewTechnicien> = {};
      if (!newTechnicien.nom_technicien.trim())
        newErrors.nom_technicien = "Le nom du technicien est requis";
      if (!newTechnicien.numero.trim())
        newErrors.numero = "Le numéro du technicien est requis";
      if (!newTechnicien.id_service) newErrors.id_service = 0;
      if (!newTechnicien.email.trim()) newErrors.email = "L'email est requis";
      if (!newTechnicien.password.trim())
        newErrors.password = "Le mot de passe est requis";
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setLoading(false);
        return;
      }

      // Insert into techniciens (trigger will handle user creation and role assignment)
      const { data: technicienData, error: technicienError } = await supabase
        .from("techniciens")
        .insert({
          nom_technicien: newTechnicien.nom_technicien,
          numero: newTechnicien.numero,
          id_service: newTechnicien.id_service,
          email: newTechnicien.email,
          password: newTechnicien.password, // Trigger will use this to create auth user
          id_atelier: id_atelier,
        })
        .select()
        .single();
        technicienData;
      if (technicienError) {
        setToast({
          type: "error",
          message:
            technicienError.message || "Erreur lors de l'ajout du technicien !",
        });
        setLoading(false);
        return;
      }

      setToast({ type: "success", message: "Technicien ajouté avec succès !" });
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
            <User className="h-8 w-8 text-blue-700" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Nouveau Technicien
            </h3>
            <p className="text-sm text-gray-600">
              Ajouter un nouveau technicien
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-2">
          <ModernSelect
            options={services.map((service) => service.nom_service)}
            value={serviceInput}
            onChange={(value: string | string[]) => {
              const v = value as string;
              setServiceInput(v);
              const found = services.find(
                (p) => p.nom_service.toLowerCase() === v.toLowerCase()
              );
              handleInputChange(
                "id_service",
                found ? found.id.toString() : "0"
              );
            }}
            placeholder="Sélectionnez un service"
            searchPlaceholder="Rechercher un service"
            icon={<Settings className="inline h-4 w-4 text-gray-500" />}
            label="Service"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <User className="inline h-4 w-4 mr-2 text-gray-500" />
            Nom du technicien *
          </label>
          <input
            type="text"
            value={newTechnicien.nom_technicien}
            onChange={(e) =>
              handleInputChange("nom_technicien", e.target.value)
            }
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.nom_technicien
                ? "border-red-300 bg-red-50 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
            }`}
            placeholder="Entrez le nom du technicien"
          />
          {errors.nom_technicien && (
            <p className="text-xs text-red-600">{errors.nom_technicien}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <Phone className="inline h-4 w-4 mr-2 text-gray-500" />
            Numéro de téléphone *
          </label>
          <input
            type="text"
            value={newTechnicien.numero}
            onChange={(e) => handleInputChange("numero", e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.numero
                ? "border-red-300 bg-red-50 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
            }`}
            placeholder="Entrez le numéro de téléphone"
          />
          {errors.numero && (
            <p className="text-xs text-red-600">{errors.numero}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <User className="inline h-4 w-4 mr-2 text-gray-500" />
            Email *
          </label>
          <input
            type="email"
            value={newTechnicien.email || ""}
            onChange={(e) => handleInputChange("email", e.target.value)}
            autoComplete="off" // <-- prevents most autofill
            name="new_technicien_email" // <-- uncommon name helps bypass Chrome's autofill
            id="new_technicien_email"
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.email
                ? "border-red-300 bg-red-50 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
            }`}
            placeholder="Entrez l'email du technicien"
          />

          {errors.email && (
            <p className="text-xs text-red-600">{errors.email}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <Phone className="inline h-4 w-4 mr-2 text-gray-500" />
            Mot de passe *
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={newTechnicien.password || ""}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.password
                  ? "border-red-300 bg-red-50 focus:ring-red-500"
                  : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
              }`}
              placeholder="Entrez le mot de passe du technicien"
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
            disabled={loading} // Disable button while loading
          >
            {loading ? "Ajout en cours..." : "Ajouter le technicien"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AjouterTechnicien;
