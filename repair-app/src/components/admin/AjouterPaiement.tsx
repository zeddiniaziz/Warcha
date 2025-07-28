import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase-client";
import {
  Calendar,
  CheckCircle,
  XCircle,
  CreditCard,
  QrCodeIcon,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

interface NewPaiement {
  code_barre: string;
  montant: string;
  date: string;
  methode: string;
  note: string;
}

const methodes = ["espèce", "chèque", "virement", "carte bancaire", "autre"];

const AjouterPaiement: React.FC<{ id_atelier: number | null }> = ({
  id_atelier,
}) => {
  const [newPaiement, setNewPaiement] = useState<NewPaiement>({
    code_barre: "",
    montant: "",
    date: "",
    methode: "",
    note: "",
  });
  const [errors, setErrors] = useState<Partial<NewPaiement>>({});
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleInputChange = (field: keyof NewPaiement, value: string) => {
    setNewPaiement((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleReset = () => {
    setNewPaiement({
      code_barre: "",
      montant: "",
      date: "",
      methode: "",
      note: "",
    });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Partial<NewPaiement> = {};
    if (!newPaiement.code_barre.trim())
      newErrors.code_barre = "Le code à barre est requis";
    if (!newPaiement.montant.trim() || isNaN(Number(newPaiement.montant)))
      newErrors.montant = "Le montant est requis et doit être un nombre";
    if (!newPaiement.date) newErrors.date = "La date est requise";
    if (!newPaiement.methode) newErrors.methode = "La méthode est requise";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Fetch fiche_id from code_barre
    const { data: fiche, error: ficheError } = await supabase
      .from("fiches")
      .select(
        "id, montant_paye, montant_total, code_barre, id_client, id_atelier"
      )
      .eq("code_barre", newPaiement.code_barre)
      .single();

    if (ficheError || !fiche) {
      setToast({
        type: "error",
        message: "Aucune fiche trouvée avec ce code à barre.",
      });
      return;
    }

    // Fetch client name using id_client
    let clientName = "";
    if (fiche.id_client) {
      const { data: client } = await supabase
        .from("clients")
        .select("nom_client")
        .eq("id", fiche.id_client)
        .single();
      clientName = client?.nom_client || "";
    }

    if (fiche.id_atelier !== id_atelier) {
      setToast({
        type: "error",
        message: "Le code à barre de cette fiche est invalide.",
      });
      return;
    }

    // Insert paiement
    const c = fiche.montant_total - fiche.montant_paye;
    if (c === 0) {
      setToast({
        type: "error",
        message: `Le fiche \n Code : ${fiche.code_barre}\n Client: ${clientName}\n Est totalement payer.`,
      });
      return;
    } else if (Number(newPaiement.montant) > c) {
      setToast({
        type: "error",
        message: `Le montant a payer est invalid tu doit payer ${c}DT ou moins.`,
      });
      return;
    }

    const { error: paiementError } = await supabase.from("paiements").insert({
      fiche_id: fiche.id,
      date: newPaiement.date,
      methode: newPaiement.methode,
      note: newPaiement.note,
      montant: Number(newPaiement.montant),
      id_atelier: id_atelier,
    });

    // Update montant_paye in fiches
    let updateFicheError: any = null;
    if (!fiche.montant_paye) {
      const { error } = await supabase
        .from("fiches")
        .update({
          montant_paye: Number(newPaiement.montant),
        })
        .eq("id", fiche.id);
      updateFicheError = error;
    } else {
      const { error } = await supabase
        .from("fiches")
        .update({
          montant_paye:
            Number(newPaiement.montant) + Number(fiche.montant_paye),
        })
        .eq("id", fiche.id);
      updateFicheError = error;
    }

    if (paiementError || updateFicheError) {
      setToast({
        type: "error",
        message: "Erreur lors de l'ajout du paiement !",
      });
      return;
    }

    setToast({ type: "success", message: "Paiement ajouté avec succès !" });
    handleReset();
    // Redirect after a short delay so the user sees the toast
    setTimeout(() => {
      navigate("/paiements");
    }, 1000); // 1.2 seconds, adjust as you like
  };
  const navigate = useNavigate();
  const location = useLocation();
  const codeBarreFromCard = location.state?.code_barre || "";
  const paiementInfo = location.state?.paiementInfo || null;

  useEffect(() => {
    if (codeBarreFromCard) {
      setNewPaiement((prev) => ({
        ...prev,
        code_barre: codeBarreFromCard,
      }));
    }
  }, [codeBarreFromCard]);
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
              Nouveau Paiement
            </h3>
            <p className="text-sm text-gray-600">
              Ajouter un paiement à une fiche
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <QrCodeIcon className="inline h-4 w-4 mr-2 text-gray-500" />
            QR Code de la fiche *
          </label>
          <input
            type="text"
            value={newPaiement.code_barre}
            onChange={(e) => handleInputChange("code_barre", e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.code_barre
                ? "border-red-300 bg-red-50 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400 focus:ring-blue-500"
            }`}
            placeholder="Code à barre du produit"
          />
          {errors.code_barre && (
            <p className="text-xs text-red-600">{errors.code_barre}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Montant *
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={newPaiement.montant}
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
                {paiementInfo.restant === 0 ? (
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
                    paiementInfo.restant === 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {Number(paiementInfo.restant).toFixed(3)} DT
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
            value={newPaiement.date}
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
            value={newPaiement.methode}
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
            value={newPaiement.note}
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
            Ajouter le paiement
          </button>
        </div>
      </form>
    </div>
  );
};

export default AjouterPaiement;
