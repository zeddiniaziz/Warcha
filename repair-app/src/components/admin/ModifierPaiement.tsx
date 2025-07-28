import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase-client";
import {
  Calendar,
  CheckCircle,
  XCircle,
  CreditCard,
  QrCode,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

interface Paiement {
  id: number;
  fiche_id: number;
  montant: number;
  date: string;
  methode: string;
  note: string;
}

interface PaiementErrors {
  id?: string;
  fiche_id?: string;
  montant?: string;
  date?: string;
  methode?: string;
  note?: string;
}

interface PaiementInfo {
  total: number;
  paye: number;
  restant: number;
}

const methodes = ["espèce", "chèque", "virement", "carte bancaire", "autre"];

const ModifierPaiement: React.FC<{ id_atelier: number | null }> = ({
  id_atelier,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id?: string }>();
  const paiementFromState = location.state?.paiement as Paiement | undefined;
  const [paiement, setPaiement] = useState<Paiement | null>(
    paiementFromState || null
  );
  const [errors, setErrors] = useState<PaiementErrors>({});
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [paiementInfo, setPaiementInfo] = useState<PaiementInfo | null>(null);

  // Fetch paiement by id if not in state
  useEffect(() => {
    if (!paiement && params.id) {
      supabase
        .from("paiements")
        .select("*")
        .eq("id", params.id)
        .single()
        .then(({ data }) => {
          if (data) setPaiement(data);
        });
    }
  }, [params.id, paiement]);

  // Fetch fiche details and calculate payment info
  const [ficheCodeBarre, setFicheCodeBarre] = useState("");
  useEffect(() => {
    if (paiement?.fiche_id) {
      supabase
        .from("fiches")
        .select("code_barre, montant_total, montant_paye")
        .eq("id", paiement.fiche_id)
        .single()
        .then(({ data }) => {
          if (data) {
            setFicheCodeBarre(data.code_barre);
            const total = data.montant_total || 0;
            const paye = data.montant_paye || 0;

            // Get the original payment amount to properly calculate remaining
            const originalPaymentAmount = paiementFromState?.montant || 0;

            // Calculate remaining amount excluding the current payment being edited
            // This gives us the actual remaining amount that can be paid
            let restant = total - paye + originalPaymentAmount;

            setPaiementInfo({
              total,
              paye,
              restant,
            });
          }
        });
    }
  }, [paiement?.fiche_id, paiement?.montant, paiementFromState?.montant]);

  const handleInputChange = (field: keyof Paiement, value: string | number) => {
    setPaiement((prev) => (prev ? { ...prev, [field]: value } : prev));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));

    // Real-time validation for montant
    if (field === "montant" && paiementInfo) {
      const numValue = Number(value);

      const maxAllowedAmount = paiementInfo.restant;

      if (numValue > maxAllowedAmount) {
        setErrors((prev) => ({
          ...prev,
          montant: `Le montant ne peut pas dépasser ${maxAllowedAmount.toFixed(
            3
          )} DT`,
        }));
      }
    }
  };

  const handleReset = () => {
    if (paiementFromState) setPaiement(paiementFromState);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paiement) return;

    // Validation
    const newErrors: PaiementErrors = {};
    if (!ficheCodeBarre.trim())
      newErrors.fiche_id = "Le code à barre est requis";
    if (!paiement.montant || isNaN(Number(paiement.montant)))
      newErrors.montant = "Le montant est requis et doit être un nombre";
    if (!paiement.date) newErrors.date = "La date est requise";
    if (!paiement.methode) newErrors.methode = "La méthode est requise";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Check if montant exceeds the remaining amount
    if (paiementInfo && Number(paiement.montant) > paiementInfo.restant) {
      setToast({
        type: "error",
        message: `Le montant ne peut pas dépasser le montant restant (${paiementInfo.restant.toFixed(
          3
        )} DT).`,
      });
      return;
    }

    // Fetch current fiche data to get client name and id_atelier for validation
    const { data: fiche, error: ficheError } = await supabase
      .from("fiches")
      .select("montant_total, montant_paye, code_barre, id_client, id_atelier")
      .eq("id", paiement.fiche_id)
      .single();

    if (ficheError || !fiche) {
      setToast({
        type: "error",
        message: "Fiche non trouvée.",
      });
      return;
    }

    // Atelier check
    if (fiche.id_atelier !== id_atelier) {
      setToast({
        type: "error",
        message: "Le paiement ne peut être modifié le code à barre est invalide.",
      });
      return;
    }

    // Calculate the difference in payment amount
    const oldMontant = paiementFromState?.montant || 0;
    const newMontant = Number(paiement.montant);
    const montantDifference = newMontant - oldMontant;

    // Check if the new total payment would exceed the total amount
    // We add the difference (new - old) to the current paid amount
    const currentPaye = fiche.montant_paye || 0;
    const newTotalPaye = currentPaye + montantDifference;

    if (newTotalPaye > fiche.montant_total) {
      setToast({
        type: "error",
        message: `Le montant total payé (${newTotalPaye.toFixed(
          3
        )} DT) ne peut pas dépasser le montant total (${fiche.montant_total.toFixed(
          3
        )} DT).`,
      });
      return;
    }

    // --- Optimized update logic ---
    // 1. Update paiement
    // 2. If success, update fiche montant_paye
    // 3. Handle errors at each step
    const { error: paiementError } = await supabase
      .from("paiements")
      .update({
        montant: newMontant,
        date: paiement.date,
        methode: paiement.methode,
        note: paiement.note,
      })
      .eq("id", paiement.id);

    if (paiementError) {
      setToast({
        type: "error",
        message: "Erreur lors de la modification du paiement !",
      });
      return;
    }

    // Update montant_paye in fiches
    const { error: updateFicheError } = await supabase
      .from("fiches")
      .update({
        montant_paye: newTotalPaye,
      })
      .eq("id", paiement.fiche_id);

    if (updateFicheError) {
      setToast({
        type: "error",
        message: "Erreur lors de la mise à jour de la fiche !",
      });
      return;
    }

    setToast({ type: "success", message: "Paiement modifié avec succès !" });
    setTimeout(() => {
      navigate("/paiements");
    }, 1000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
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
          <div className="flex h-10 w-10 items-center justify-center bg-white">
            <CreditCard className="h-8 w-8 text-blue-700" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Modifier Paiement
            </h3>
            <p className="text-sm text-gray-600">
              Modifier un paiement existant
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <QrCode className="inline h-4 w-4 mr-2 text-gray-500" />
            QR Code de la fiche
          </label>
          <input
            type="text"
            value={ficheCodeBarre}
            disabled
            className="w-full rounded-lg border px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
            placeholder="Code à barre du produit"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Montant *
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={paiement?.montant ?? ""}
            onWheel={(e) => e.currentTarget.blur()}
            onChange={(e) => handleInputChange("montant", e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield] ${
              errors.montant
                ? "border-red-300 bg-red-50 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
            }`}
            placeholder="Montant du paiement"
          />

          {paiementInfo && (
            <div className="flex items-center justify-between text-xs text-gray-700 mt-1 mb-1 px-1">
              <span>
                <span className="font-semibold">Paiement:</span>{" "}
                {paiementInfo.restant <= 0 ? (
                  <span className="text-green-600 font-semibold">Payé</span>
                ) : (
                  <span className="text-red-600 font-semibold">Impayé</span>
                )}
              </span>
              <span>
                <span className="font-semibold">Total:</span>{" "}
                {Number(paiementInfo.total).toFixed(3)} DT
              </span>
              <span>
                <span className="font-semibold">Payé:</span>{" "}
                <span className="text-green-700 font-semibold">
                  {Number(paiementInfo.paye).toFixed(3)} DT
                </span>
              </span>
              <span>
                <span className="font-semibold">Restant:</span>{" "}
                <span
                  className={
                    paiementInfo.restant <= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {Number(Math.max(0, paiementInfo.restant)).toFixed(3)} DT
                </span>
              </span>
            </div>
          )}
          {errors.montant && (
            <p className="text-xs text-red-600">{errors.montant}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <Calendar className="inline h-4 w-4 mr-2 text-gray-500" />
            Date et heure *
          </label>
          <input
            type="datetime-local"
            value={paiement?.date ? paiement.date.slice(0, 16) : ""}
            onChange={(e) => handleInputChange("date", e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.date
                ? "border-red-300 bg-red-50 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
            }`}
          />
          {errors.date && <p className="text-xs text-red-600">{errors.date}</p>}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Méthode *
          </label>
          <select
            value={paiement?.methode ?? ""}
            onChange={(e) => handleInputChange("methode", e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.methode
                ? "border-red-300 bg-red-50 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
            }`}
          >
            <option value="">Sélectionnez une méthode</option>
            {methodes.map((m) => (
              <option key={m} value={m}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </option>
            ))}
          </select>
          {errors.methode && (
            <p className="text-xs text-red-600">{errors.methode}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Note
          </label>
          <textarea
            value={paiement?.note ?? ""}
            onChange={(e) => handleInputChange("note", e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Note (optionnelle)"
          />
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end border-t border-gray-200 pt-6">
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
            Modifier le paiement
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModifierPaiement;
