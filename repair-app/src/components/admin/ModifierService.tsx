import React, { useState, useEffect } from "react";
import { supabase } from "../../supabase-client";
import { Layers, Tag, CheckCircle, XCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface Service {
  id: number;
  nom_service: string;
  prix_service: number;
  active: boolean;
}

interface ServiceUpdate {
  nom_service: string;
  prix_service: number;
  active: boolean;
}

const ModifierService: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const service = location.state?.service as Service;

  const [serviceData, setServiceData] = useState<ServiceUpdate>({
    nom_service: "",
    prix_service: 0,
    active: true,
  });
  const [errors, setErrors] = useState<Partial<ServiceUpdate>>({});
  const [toasts, setToasts] = useState<
    {
      id: number;
      type: "success" | "error" | "warning";
      message: string;
    }[]
  >([]);

  // Pre-populate form with existing service data
  useEffect(() => {
    if (service) {
      setServiceData({
        nom_service: service.nom_service,
        prix_service: service.prix_service,
        active: service.active,
      });
    } else {
      // If no service data, redirect back to services list
      showToast("error", "Aucun service sélectionné pour modification");
      navigate("/services");
    }
  }, [service, navigate]);

  const showToast = (
    type: "success" | "error" | "warning",
    message: string
  ) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const handleInputChange = (
    field: keyof ServiceUpdate,
    value: string | boolean
  ) => {
    setServiceData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Partial<ServiceUpdate> = {};
    if (!serviceData.nom_service.trim()) {
      showToast("error", "Le nom du service est requis");
      setErrors({
        nom_service: "Le nom du service est requis",
      });
      return;
    }
    if (Number(serviceData.prix_service) < 0) {
      showToast("error", "Prix de service est invalid");
      setErrors({
        prix_service: -1,
      });
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Update the service in database
    const { error } = await supabase
      .from("services")
      .update({
        nom_service: serviceData.nom_service,
        prix_service: serviceData.prix_service,
        active: serviceData.active,
      })
      .eq("id", service.id);

    if (error) {
      showToast("error", "Erreur lors de la modification du service !");
      return;
    }

    showToast("success", "Service modifié avec succès !");
    // Navigate back to services list after successful update
    setTimeout(() => {
      navigate("/services");
    }, 1500);
  };

  // If no service data, show loading or redirect
  if (!service) {
    return (
      <div className="m-5 max-w-lg mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 text-center">
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="m-5 max-w-lg mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Toast */}
      {toasts.map((toast) => (
        <div
          key={toast.id}
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
            onClick={() =>
              setToasts((prev) => prev.filter((t) => t.id !== toast.id))
            }
          >
            ×
          </button>
        </div>
      ))}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
            <Layers className="h-8 w-8 text-blue-700" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Modifier le Service
            </h3>
            <p className="text-sm text-gray-600">Modifier le service:</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <Tag className="inline h-4 w-4 mr-2 text-gray-500" />
            Nom du service *
          </label>
          <input
            type="text"
            value={serviceData.nom_service}
            onChange={(e) => handleInputChange("nom_service", e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.nom_service
                ? "border-red-300 bg-red-50 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
            }`}
            placeholder="Entrez le nom du service"
          />
          {errors.nom_service && (
            <p className="text-xs text-red-600">{errors.nom_service}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <Tag className="inline h-4 w-4 mr-2 text-gray-500" />
            Prix du service *
          </label>
          <input
            type="number"
            value={serviceData.prix_service}
            step={0.1}
            onWheel={(e) => e.currentTarget.blur()}
            onChange={(e) => handleInputChange("prix_service", e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield] ${
              errors.prix_service === -1
                ? "border-red-300 bg-red-50 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
            }`}
            placeholder="Entrez le prix du service"
          />
          {errors.prix_service === -1 && (
            <p className="text-xs text-red-600">
              le prix du service est invalid
            </p>
          )}
          <label className="block text-sm font-medium text-gray-700">
            Disponibilité *
          </label>
          <button
            type="button"
            className={`
        flex items-center justify-between w-full px-4 py-3 rounded-lg border 
        
      `}
            onClick={() => handleInputChange("active", !serviceData.active)}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`
          relative w-10 h-5 rounded-full transition-all duration-200 ease-in-out
          ${serviceData.active ? "bg-green-500" : "bg-gray-300"}
        `}
              >
                <div
                  className={`
            absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ease-in-out
            ${serviceData.active ? "translate-x-5" : "translate-x-0.5"}
          `}
                ></div>
              </div>

              <div className="flex flex-col items-start">
                <span
                  className={`
            text-sm font-medium transition-colors duration-200
            ${serviceData.active ? "text-green-700" : "text-gray-600"}
          `}
                >
                  {serviceData.active ? "Disponible" : "Non disponible"}
                </span>
                <span
                  className={`
            text-xs transition-colors duration-200
            text-gray-600
          `}
                >
                  {serviceData.active
                    ? "Service disponible"
                    : "Service non disponible"}
                </span>
              </div>
            </div>

            <div
              className={`
        w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200
        ${serviceData.active ? "text-green-600" : "text-gray-400"}
      `}
            >
              {serviceData.active ? (
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
                <svg className="w-4 h-4" fill="red" viewBox="0 0 20 20">
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
            onClick={() => navigate("/services")}
            className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Annuler
          </button>

          <button
            type="submit"
            className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Modifier le service
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModifierService;
