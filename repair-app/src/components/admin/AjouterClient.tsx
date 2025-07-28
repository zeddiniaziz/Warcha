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
} from "lucide-react";

interface NewClient {
  nom_client: string;
  telephone: string;
  email: string;
  password: string;
}

const AjouterClient: React.FC<{ id_atelier: number | null }> = ({ id_atelier }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [newClient, setNewClient] = useState<NewClient>({
    nom_client: "",
    telephone: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<NewClient>>({});
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof NewClient, value: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    setNewClient((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setNewClient({
      nom_client: "",
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
      const newErrors: Partial<NewClient> = {};
      if (!newClient.nom_client.trim())
        newErrors.nom_client = "Le nom du client est requis";
      if (!newClient.telephone.trim())
        newErrors.telephone = "Le numéro du client est requis";
      if (!newClient.email.trim()) newErrors.email = "L'email est requis";
      if (!newClient.password.trim())
        newErrors.password = "Le mot de passe est requis";
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setLoading(false);
        return;
      }

      // Insert into clients
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .insert({
          nom_client: newClient.nom_client,
          telephone: newClient.telephone,
          email: newClient.email,
          password: newClient.password,
          id_atelier: id_atelier,
        })
        .select()
        .single();
      clientData;
      if (clientError) {
        setToast({
          type: "error",
          message: clientError.message || "Erreur lors de l'ajout du client !",
        });
        setLoading(false);
        return;
      }

      setToast({ type: "success", message: "Client ajouté avec succès !" });
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
              Nouveau Client
            </h3>
            <p className="text-sm text-gray-600">Ajouter un nouveau client</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <User className="inline h-4 w-4 mr-2 text-gray-500" />
            Nom du client *
          </label>
          <input
            type="text"
            value={newClient.nom_client}
            onChange={(e) => handleInputChange("nom_client", e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.nom_client
                ? "border-red-300 bg-red-50 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
            }`}
            placeholder="Entrez le nom du client"
          />
          {errors.nom_client && (
            <p className="text-xs text-red-600">{errors.nom_client}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <Phone className="inline h-4 w-4 mr-2 text-gray-500" />
            Numéro de téléphone *
          </label>
          <input
            type="text"
            value={newClient.telephone}
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
            value={newClient.email || ""}
            onChange={(e) => handleInputChange("email", e.target.value)}
            autoComplete="off"
            name="new_client_email"
            id="new_client_email"
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.email
                ? "border-red-300 bg-red-50 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
            }`}
            placeholder="Entrez l'email du client"
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
              value={newClient.password || ""}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.password
                  ? "border-red-300 bg-red-50 focus:ring-red-500"
                  : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
              }`}
              placeholder="Entrez le mot de passe du client"
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
            {loading ? "Ajout en cours..." : "Ajouter le client"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AjouterClient;
