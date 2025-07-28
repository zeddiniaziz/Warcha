import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase-client";
import { CheckCircle, XCircle, User, Phone, Settings } from "lucide-react";
import ModernSelect from "../ModernSelect";
import { useLocation, useNavigate, useParams } from "react-router-dom";

interface Technicien {
  id: number;
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

const ModifierTechnicien: React.FC<{ id_atelier: number | null }> = ({ id_atelier }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const [services, setServices] = useState<Service[]>([]);
  //Fetch services
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

  // Try to get technicien from navigation state
  const technicienFromState = location.state?.technicien as
    | Technicien
    | undefined;
  const [editTechnicien, setEditTechnicien] = useState<Technicien | null>(
    technicienFromState || null
  );

  const [loading, setLoading] = useState(!technicienFromState && !!params.id);

  // Set initial inputs for ModernSelect field when data is loaded
  const [serviceInput, setServiceInput] = useState<string>("");
  useEffect(() => {
    if (editTechnicien && services.length) {
      setServiceInput(
        services.find((f) => f.id === editTechnicien.id_service)?.nom_service ||
          ""
      );
    }
  }, [editTechnicien, services]);

  // Fetch technicien by ID if not in state (for direct URL access)
  useEffect(() => {
    if (!editTechnicien && params.id) {
      setLoading(true);
      supabase
        .from("techniciens")
        .select("*")
        .eq("id", params.id)
        .single()
        .then(({ data }) => {
          if (data) setEditTechnicien(data);
          setLoading(false);
        });
    }
  }, [params.id, editTechnicien]);

  // If no technicien, show error and redirect
  useEffect(() => {
    if (!editTechnicien && !loading) {
      navigate("/techniciens");
    }
  }, [editTechnicien, loading, navigate]);

  // Handle input changes
  const handleInputChange = (
    field: keyof Technicien,
    value: string | number | null
  ) => {
    setEditTechnicien((prev) => (prev ? { ...prev, [field]: value } : prev));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Update function
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTechnicien) return;

    // Basic validation
    const newErrors: Partial<Record<keyof Technicien, string>> = {};
    if (!editTechnicien.nom_technicien?.trim())
      newErrors.nom_technicien = "Le nom du technicien est requis";
    if (!editTechnicien.id_service)
      newErrors.id_service = "Le service est requis";
    if (
      editTechnicien.numero === undefined ||
      editTechnicien.numero === null ||
      editTechnicien.numero === ""
    )
      newErrors.numero = "Le numéro du technicien est requis";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors as Partial<Technicien>);
      return;
    }
    // Only update editable fields
    const updateFields: any = {
      nom_technicien: editTechnicien.nom_technicien,
      id_service: editTechnicien.id_service,
      numero: editTechnicien.numero,
    };
    const { error } = await supabase
      .from("techniciens")
      .update(updateFields)
      .eq("id", editTechnicien.id);

    if (error) {
      setToast({
        type: "error",
        message: "Erreur lors de la modification du technicien !",
      });
      return;
    }

    setToast({ type: "success", message: "Technicien modifié avec succès !" });
    setTimeout(() => {
      navigate("/techniciens");
    }, 1200);
  };

  const [errors, setErrors] = useState<Partial<Technicien>>({});
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleReset = () => {
    navigate("/techniciens");
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
              Modifier Technicien
            </h3>
            <p className="text-sm text-gray-600">
              Modifier les informations du technicien
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleUpdate} className="p-6 space-y-6">
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
              handleInputChange("id_service", found ? found.id : null);
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
            value={editTechnicien?.nom_technicien}
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
            value={editTechnicien?.numero}
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
            Email
          </label>
          <input
            type="email"
            value={editTechnicien?.email || ""}
            readOnly
            className="w-full rounded-lg border px-3 py-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
            placeholder="Email du technicien"
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
            Modifier le technicien
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModifierTechnicien;
