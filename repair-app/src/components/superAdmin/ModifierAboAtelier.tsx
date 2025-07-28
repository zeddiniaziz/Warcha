import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../supabase-client";
import { CheckCircle, XCircle, Building2 } from "lucide-react";

const ModifierAboAtelier: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { abonnementAtelier } = location.state || {};

  // Initial values from abonnementAtelier
  const atelierNom = abonnementAtelier?.atelier?.nom_atelier || "";
  const initialDateDebut = abonnementAtelier?.date_debut
    ? new Date(abonnementAtelier.date_debut).toISOString().slice(0, 10)
    : "";
  const initialDateFin = abonnementAtelier?.date_fin
    ? new Date(abonnementAtelier.date_fin).toISOString().slice(0, 10)
    : "";
  const [id_atelier, setId_atelier] = useState<number>();
  id_atelier;
  const [dateDebut, setDateDebut] = useState<string>(initialDateDebut);
  const [months, setMonths] = useState<number>(1);
  const [dateFin, setDateFin] = useState<string>(initialDateFin);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Helper to add months to a date string (YYYY-MM-DD)
  function addMonthsToDate(dateStr: string, months: number): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    date.setMonth(date.getMonth() + months);
    return date.toISOString().slice(0, 10);
  }

  // Update dateFin automatically when dateDebut or months changes
  useEffect(() => {
    if (dateDebut && months > 0) {
      setDateFin(addMonthsToDate(dateDebut, months));
    } else {
      setDateFin("");
    }
  }, [dateDebut, months]);
  const handleStopAbonnement = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("abonnement_atelier")
        .update({ is_paid: false })
        .eq("id", abonnementAtelier.id);

      if (error) {
        setToast({
          type: "error",
          message: error.message || "Erreur lors de l'arrêt de l'abonnement.",
        });
        setLoading(false);
        return;
      }

      setToast({
        type: "success",
        message: "Abonnement arrêté avec succès !",
      });

      setTimeout(() => {
        navigate("/superAdmin/Ateliers");
      }, 1200);
    } catch (err) {
      setToast({
        type: "error",
        message: "Une erreur inattendue est survenue.",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleReactivateAbonnement = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("abonnement_atelier")
        .update({ is_paid: true })
        .eq("id", abonnementAtelier.id);

      if (error) {
        setToast({
          type: "error",
          message:
            error.message || "Erreur lors de la réactivation de l'abonnement.",
        });
        setLoading(false);
        return;
      }

      setToast({
        type: "success",
        message: "Abonnement réactivé avec succès !",
      });

      setTimeout(() => {
        navigate("/superAdmin/Ateliers");
      }, 1200);
    } catch (err) {
      setToast({
        type: "error",
        message: "Une erreur inattendue est survenue.",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: data_id_atelier, error: fetchIDError } = await supabase
        .from("ateliers")
        .select("id")
        .eq("nom_atelier", atelierNom)
        .single();
      if (fetchIDError) {
        console.error("Failed to fetch id atelier:", fetchIDError);
        return;
      }
      const id_atelier = data_id_atelier?.id;
      setId_atelier(id_atelier);

      const { data: oldData, error: fetchError } = await supabase
        .from("abonnement_atelier")
        .select("prix_paye")
        .eq("id_atelier", id_atelier) // 👈 Use id_atelier instead of id
        .single();
      if (fetchError) {
        console.error("Failed to fetch old prix_paye:", fetchError);
        return;
      }

      const prix_paye_total = oldData?.prix_paye + oldData?.prix_paye * months;

      // Update abonnement_atelier
      const { error } = await supabase
        .from("abonnement_atelier")
        .update({
          date_debut: dateDebut,
          date_fin: dateFin,
          duree: months,
          is_paid: true,
          prix_paye: prix_paye_total,
        })
        .eq("id", abonnementAtelier.id);
      if (error) {
        setToast({
          type: "error",
          message: error.message || "Erreur lors de la mise à jour.",
        });
        setLoading(false);
        return;
      }

      setToast({
        type: "success",
        message: "Abonnement mis à jour avec succès !",
      });

      setTimeout(() => {
        navigate("/superAdmin/Ateliers");
      }, 1200);
    } catch (err) {
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
              Gérer Abonnement Atelier
            </h3>
            <p className="text-sm text-gray-600">
              Étendre ou arrêter l'abonnement de l'atelier
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Atelier Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Nom de l'atelier
          </label>
          <input
            type="text"
            value={atelierNom}
            readOnly
            className="w-full rounded-lg border px-3 py-2 text-sm bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
          />
        </div>
        {/* Date début */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Date début *
          </label>
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300 hover:border-gray-400"
            required
          />
        </div>
        {/* Nombre de mois à ajouter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Nombre de mois à ajouter *
          </label>
          <input
            type="number"
            min={1}
            max={36}
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300 hover:border-gray-400"
            required
          />
        </div>
        {/* Date fin (calculée) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Date fin (calculée)
          </label>
          <input
            type="date"
            value={dateFin}
            readOnly
            className="w-full rounded-lg border px-3 py-2 text-sm bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
          />
        </div>
        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end border-t border-gray-200 pt-6">
          <button
            type="submit"
            className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Mise à jour..." : "Mettre à jour l'abonnement"}
          </button>
          {abonnementAtelier.is_paid ? (
            <button
              type="button"
              onClick={handleStopAbonnement}
              className="inline-flex justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700"
              disabled={loading}
            >
              Arrêter l'abonnement
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReactivateAbonnement}
              className="inline-flex justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700"
              disabled={loading}
            >
              Réactiver l'abonnement
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ModifierAboAtelier;
