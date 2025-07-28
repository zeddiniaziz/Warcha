import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../supabase-client";
import {
  CheckCircle,
  XCircle,
  Building2,
  ShieldUser,
  HandCoins,
  CalendarClock,
} from "lucide-react";
import ModernSelect from "../ModernSelect";

interface NewAtelier {
  nom_atelier: string;
  id_admin: number;
  id_abonnement: number;
}

const ModifierAtelier: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { abonnementAtelier } = location.state || {};

  const [newAtelier, setNewAtelier] = useState<NewAtelier>({
    nom_atelier: abonnementAtelier?.atelier?.nom_atelier || "",
    id_admin: abonnementAtelier?.atelier?.id_admin || 0,
    id_abonnement: abonnementAtelier?.id_abonnement || 0,
  });
  const [errors, setErrors] = useState<Partial<NewAtelier>>({});
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [adminInput, setAdminInput] = useState<string>("");
  const [abonnements, setAbonnements] = useState<any[]>([]);
  const [abonnementInput, setAbonnementInput] = useState<string>("");
  const [dureeAbonnement, setDureeAbonnement] = useState<string>(
    abonnementAtelier?.duree === 12 ? "Annuel (20% de réduction)" : "Mensuel"
  );
  const [isPaid, setIsPaid] = useState<boolean>(
    abonnementAtelier?.is_paid ?? false
  );

  useEffect(() => {
    setAdminInput(abonnementAtelier?.atelier?.admin?.nom_admin || "");
    setAbonnementInput(abonnementAtelier?.abonnement?.nom || "");
    setIsPaid(abonnementAtelier?.is_paid ?? false);
  }, [abonnementAtelier]);

  // Fetch admins (allow current admin + available ones)
  const fetchAdmins = async () => {
    const { data: adminsData, error: adminsError } = await supabase
      .from("admins")
      .select("id, nom_admin, email, id_atelier, isSub")
      .is("id_atelier", null);
    if (!adminsError && adminsData) {
      setAdmins(adminsData);
    }
  };

  // Fetch abonnements
  const fetchAbonnements = async () => {
    const { data, error } = await supabase
      .from("abonnements")
      .select("id, nom, prix");
    if (!error && data) setAbonnements(data);
  };

  useEffect(() => {
    fetchAdmins();
    fetchAbonnements();
  }, []);

  const handleInputChange = (field: keyof NewAtelier, value: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    setNewAtelier((prev) => ({
      ...prev,
      [field]: field === "id_admin" ? Number(value) : value,
    }));
  };

  const handleAdminSelect = (value: string | string[]) => {
    const v = value as string;
    setAdminInput(v);
    const found = admins.find(
      (a) => a.nom_admin.toLowerCase() === v.toLowerCase()
    );
    handleInputChange("id_admin", found ? found.id.toString() : "0");
  };

  const handleAbonnementSelect = (value: string | string[]) => {
    const v = value as string;
    setAbonnementInput(v);
    const found = abonnements.find(
      (a) => a.nom.toLowerCase() === v.toLowerCase()
    );
    setNewAtelier((prev) => ({ ...prev, id_abonnement: found ? found.id : 0 }));
  };

  const handleDureeSelect = (value: string | string[]) => {
    setDureeAbonnement(value as string);
  };

  const handleReset = () => {
    setNewAtelier({
      nom_atelier: abonnementAtelier?.atelier?.nom_atelier || "",
      id_admin: abonnementAtelier?.atelier?.id_admin || 0,
      id_abonnement: abonnementAtelier?.id_abonnement || 0,
    });
    setErrors({});
    setAdminInput(abonnementAtelier?.atelier?.admin?.nom_admin || "");
    setAbonnementInput(abonnementAtelier?.abonnement?.nom || "");
    setDureeAbonnement(
      abonnementAtelier?.duree === 12 ? "Annuel (20% de réduction)" : "Mensuel"
    );
  };

  const handlePaidToggle = async () => {
    const newPaid = !isPaid;
    setIsPaid(newPaid);
    await supabase
      .from("abonnement_atelier")
      .update({ is_paid: newPaid })
      .eq("id", abonnementAtelier.id);
    setToast({
      type: "success",
      message: `Abonnement marqué comme ${newPaid ? "payé" : "non payé"}.`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Basic validation
      const newErrors: Partial<NewAtelier> = {};
      if (!newAtelier.nom_atelier.trim())
        newErrors.nom_atelier = "Le nom de l'atelier est requis";
      if (!newAtelier.id_admin) newErrors.id_admin = 0;
      if (!newAtelier.id_abonnement) newErrors.id_abonnement = 0;
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setLoading(false);
        return;
      }

      // Update ateliers
      const { error: atelierError } = await supabase
        .from("ateliers")
        .update({
          nom_atelier: newAtelier.nom_atelier,
          id_admin: newAtelier.id_admin,
        })
        .eq("id", abonnementAtelier.id_atelier);

      if (atelierError) {
        setToast({
          type: "error",
          message:
            atelierError.message ||
            "Erreur lors de la modification de l'atelier !",
        });
        setLoading(false);
        return;
      }

      // Determine duree and prix_paye based on selected duration and abonnement
      const selectedAbonnement = abonnements.find(
        (a) => a.id === newAtelier.id_abonnement
      );
      let duree = 0;
      let prix_paye = 0;
      if (dureeAbonnement === "Mensuel") {
        duree = 1;
        prix_paye = selectedAbonnement ? selectedAbonnement.prix : 0;
      } else if (
        dureeAbonnement === "Annuel (20% de réduction)" ||
        dureeAbonnement === "Annuel"
      ) {
        duree = 12;
        prix_paye = selectedAbonnement
          ? selectedAbonnement.prix * 12 - selectedAbonnement.prix * 2.4
          : 0;
      }

      // Update abonnement_atelier
      const { error: abAtelierError } = await supabase
        .from("abonnement_atelier")
        .update({
          id_abonnement: newAtelier.id_abonnement,
          duree,
          prix_paye,
        })
        .eq("id", abonnementAtelier.id);

      if (abAtelierError) {
        setToast({
          type: "error",
          message:
            abAtelierError.message ||
            "Erreur lors de la modification de l'abonnement !",
        });
        setLoading(false);
        return;
      }

      // Update the admin's id_atelier if changed
      if (newAtelier.id_admin !== abonnementAtelier.atelier.id_admin) {
        // Remove old admin's atelier if needed
        await supabase
          .from("admins")
          .update({ id_atelier: null })
          .eq("id", abonnementAtelier.atelier.id_admin);

        // Set new admin's atelier
        await supabase
          .from("admins")
          .update({ id_atelier: abonnementAtelier.id_atelier })
          .eq("id", newAtelier.id_admin);
      }

      setToast({
        type: "success",
        message: "Atelier et abonnement modifiés avec succès !",
      });

      setTimeout(() => {
        navigate("/superAdmin/Ateliers");
      }, 1500);
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
            <Building2 className="h-8 w-8 text-blue-700" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Modifier Atelier
            </h3>
            <p className="text-sm text-gray-600">
              Modifier les informations de l'atelier
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-2">
          <ModernSelect
            options={admins.map((admin) => admin.nom_admin)}
            value={adminInput}
            onChange={handleAdminSelect}
            placeholder="Sélectionnez un admin"
            searchPlaceholder="Rechercher un admin"
            icon={<ShieldUser className="inline h-4 w-4 text-gray-500" />}
            label="Admin"
            required
          />
          {errors.id_admin === 0 && (
            <p className="text-xs text-red-600">L'admin est requis</p>
          )}
        </div>
        <div className="space-y-2">
          <ModernSelect
            options={abonnements.map((ab) => ab.nom)}
            value={abonnementInput}
            onChange={handleAbonnementSelect}
            placeholder="Sélectionnez un abonnement"
            searchPlaceholder="Rechercher un abonnement"
            icon={<HandCoins className="inline h-4 w-4 text-gray-500" />}
            label="Type Abonnement"
            required
          />
          {errors.id_abonnement === 0 && (
            <p className="text-xs text-red-600">L'abonnement est requis</p>
          )}
        </div>
        <div className="space-y-2">
          <ModernSelect
            options={["Mensuel", "Annuel (20% de réduction)"]}
            value={dureeAbonnement}
            onChange={handleDureeSelect}
            placeholder="Sélectionnez la durée"
            searchPlaceholder="Rechercher la durée"
            icon={<CalendarClock className="inline h-4 w-4 text-gray-500" />}
            label="Durée de l’abonnement"
            required
            disabled
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <Building2 className="inline h-4 w-4 mr-2 text-gray-500" />
            Nom de l'atelier *
          </label>
          <input
            type="text"
            value={newAtelier.nom_atelier}
            onChange={(e) => handleInputChange("nom_atelier", e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.nom_atelier
                ? "border-red-300 bg-red-50 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
            }`}
            placeholder="Entrez le nom de l'atelier"
          />
          {errors.nom_atelier && (
            <p className="text-xs text-red-600">{errors.nom_atelier}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Statut de paiement *
          </label>
          <button
            type="button"
            className={`
              flex items-center justify-between w-full px-4 py-3 rounded-lg border
            `}
            onClick={handlePaidToggle}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`
                  relative w-10 h-5 rounded-full transition-all duration-200 ease-in-out
                  ${isPaid ? "bg-green-600" : "bg-gray-300"}
                `}
              >
                <div
                  className={`
                    absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ease-in-out
                    ${isPaid ? "translate-x-5" : "translate-x-0.5"}
                  `}
                ></div>
              </div>
              <div className="flex flex-col items-start">
                <span
                  className={`
                    text-sm font-medium transition-colors duration-200
                    ${isPaid ? "text-green-700" : "text-gray-600"}
                  `}
                >
                  {isPaid ? "Payé" : "Non payé"}
                </span>
                <span
                  className={`
                    text-xs transition-colors duration-200
                    ${isPaid ? "text-gray-600" : "text-gray-500"}
                  `}
                >
                  {isPaid ? "Abonnement actif" : "Abonnement non payé"}
                </span>
              </div>
            </div>
            <div
              className={`
                w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200
                ${isPaid ? "text-green-600" : "text-gray-400"}
              `}
            >
              {isPaid ? (
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
            onClick={handleReset}
            className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-200"
          >
            Réinitialiser
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Modification..." : "Modifier l'atelier"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModifierAtelier;
