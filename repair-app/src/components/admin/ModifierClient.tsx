import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase-client";
import { CheckCircle, XCircle, User, Phone, Mail } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

interface Client {
  id: number;
  nom_client: string;
  telephone: string;
  email: string;
  password: string;
  created_at?: string;
  user_id?: string;
}

const ModifierClient: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();

  // Try to get client from navigation state
  const clientFromState = location.state?.client as Client | undefined;
  const [editClient, setEditClient] = useState<Client | null>(
    clientFromState || null
  );
  const [loading, setLoading] = useState(!clientFromState && !!params.id);

  // Fetch client by ID if not in state (for direct URL access)
  useEffect(() => {
    if (!editClient && params.id) {
      setLoading(true);
      supabase
        .from("clients")
        .select("*")
        .eq("id", params.id)
        .single()
        .then(({ data }) => {
          if (data) setEditClient(data);
          setLoading(false);
        });
    }
  }, [params.id, editClient]);

  // If no client, show error and redirect
  useEffect(() => {
    if (!editClient && !loading) {
      navigate("/clients");
    }
  }, [editClient, loading, navigate]);

  // Handle input changes
  const handleInputChange = (field: keyof Client, value: string) => {
    setEditClient((prev) => (prev ? { ...prev, [field]: value } : prev));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Update function
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClient) return;

    // Basic validation
    const newErrors: Partial<Record<keyof Client, string>> = {};
    if (!editClient.nom_client?.trim())
      newErrors.nom_client = "Le nom du client est requis";
    if (
      editClient.telephone === undefined ||
      editClient.telephone === null ||
      editClient.telephone === ""
    )
      newErrors.telephone = "Le numéro du client est requis";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors as Partial<Client>);
      return;
    }
    // Only update editable fields
    const updateFields: any = {
      nom_client: editClient.nom_client,
      telephone: editClient.telephone,
    };
    const { error } = await supabase
      .from("clients")
      .update(updateFields)
      .eq("id", editClient.id);

    if (error) {
      setToast({
        type: "error",
        message: "Erreur lors de la modification du client !",
      });
      return;
    }

    setToast({ type: "success", message: "Client modifié avec succès !" });
    setTimeout(() => {
      navigate("/clients");
    }, 1200);
  };

  const [errors, setErrors] = useState<Partial<Client>>({});
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleReset = () => {
    navigate("/clients");
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
              Modifier Client
            </h3>
            <p className="text-sm text-gray-600">
              Modifier les informations du client
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleUpdate} className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <User className="inline h-4 w-4 mr-2 text-gray-500" />
            Nom du client *
          </label>
          <input
            type="text"
            value={editClient?.nom_client || ""}
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
            value={editClient?.telephone || ""}
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
            Email
          </label>
          <input
            type="email"
            value={editClient?.email || ""}
            readOnly
            className="w-full rounded-lg border px-3 py-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
            placeholder="Email du client"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-200"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            onClick={handleUpdate}
          >
            Modifier le client
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModifierClient;
