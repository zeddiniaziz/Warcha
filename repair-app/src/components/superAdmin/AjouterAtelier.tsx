import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase-client";
import { CheckCircle, XCircle, Building2, ShieldUser, HandCoins, CalendarClock } from "lucide-react";
import ModernSelect from "../ModernSelect";

interface NewAtelier {
  nom_atelier: string;
  id_admin: number;
  id_abonnement: number;
}

const AjouterAtelier: React.FC = () => {
  const [newAtelier, setNewAtelier] = useState<NewAtelier>({
    nom_atelier: "",
    id_admin: 0,
    id_abonnement: 0,
  });
  const [errors, setErrors] = useState<Partial<NewAtelier>>({});
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [atelierInfo, setAtelierInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [adminInput, setAdminInput] = useState<string>("");
  const [abonnements, setAbonnements] = useState<any[]>([]);
  const [abonnementInput, setAbonnementInput] = useState<string>("");
  const [dureeAbonnement, setDureeAbonnement] = useState<string>("");
  const handleDureeSelect = (value: string | string[]) => {
    setDureeAbonnement(value as string);
  };

  // Fetch admins not assigned to any atelier
  const fetchAdmins = async () => {
    // Only show admins who have id_atelier as null (no atelier assigned) and isSub is false
    const { data: adminsData, error: adminsError } = await supabase
      .from("admins")
      .select("id, nom_admin, email, id_atelier, isSub")
      .is("id_atelier", null)
      .eq("isSub", false);
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

  const handleReset = () => {
    setNewAtelier({ nom_atelier: "", id_admin: 0, id_abonnement: 0 });
    setErrors({});
    setAtelierInfo(null);
    setAdminInput("");
    setAbonnementInput("");
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

      // Insert into ateliers (without id_abonnement)
      const { data: atelierData, error: atelierError } = await supabase
        .from("ateliers")
        .insert({
          nom_atelier: newAtelier.nom_atelier,
          id_admin: newAtelier.id_admin,
        })
        .select()
        .single();

      if (atelierError) {
        setToast({
          type: "error",
          message:
            atelierError.message || "Erreur lors de l'ajout de l'atelier !",
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
      } else if (dureeAbonnement === "Annuel (20% de réduction)") {
        duree = 12;
        prix_paye = selectedAbonnement
          ? ((selectedAbonnement.prix * 12 ) - (selectedAbonnement.prix * 2.4))
          : 0;
      }

      // Insert into abonnement_atelier with the new atelier id, selected abonnement, duree, and prix_paye
      const { error: abAtelierError } = await supabase
        .from("abonnement_atelier")
        .insert({
          id_atelier: atelierData.id,
          id_abonnement: newAtelier.id_abonnement,
          duree,
          prix_paye,
        });
      if (abAtelierError) {
        setToast({
          type: "error",
          message:
            abAtelierError.message ||
            "Erreur lors de l'association de l'abonnement !",
        });
        setLoading(false);
        return;
      }

      // Update the admin's id_atelier to the new atelier id
      const { error: adminUpdateError } = await supabase
        .from("admins")
        .update({ id_atelier: atelierData.id })
        .eq("id", newAtelier.id_admin);
      if (adminUpdateError) {
        setToast({
          type: "error",
          message:
            adminUpdateError.message ||
            "Erreur lors de la mise à jour de l'admin !",
        });
        setLoading(false);
        return;
      }

      setToast({
        type: "success",
        message: "Atelier, abonnement et admin mis à jour avec succès !",
      });
      setAtelierInfo(atelierData);
      handleReset();
      await fetchAdmins(); // Rerender admin list after insert
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

  // Fetch atelier info by name (optional, for demo)
  // const fetchAtelierInfo = async () => {
  //   if (!newAtelier.nom_atelier.trim()) return;
  //   setLoading(true);
  //   const { data, error } = await supabase
  //     .from("ateliers")
  //     .select("*, admins(*)")
  //     .eq("nom_atelier", newAtelier.nom_atelier)
  //     .single();
  //   if (error) {
  //     setToast({ type: "error", message: error.message });
  //     setAtelierInfo(null);
  //   } else {
  //     setAtelierInfo(data);
  //   }
  //   setLoading(false);
  // };

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
              Nouvel Atelier
            </h3>
            <p className="text-sm text-gray-600">Ajouter un nouvel atelier</p>
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
            {loading ? "Ajout en cours..." : "Ajouter l'atelier"}
          </button>
        </div>
      </form>

      {/* Atelier Info (optional, after add or fetch) */}
      {atelierInfo && (
        <div className="mt-6 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-semibold text-gray-700 mb-2">
            Informations sur l'atelier
          </h4>
          <div className="text-sm text-gray-800">
            <div>
              <strong>Nom:</strong> {atelierInfo.nom_atelier}
            </div>
            <div>
              <strong>ID Admin:</strong> {atelierInfo.id_admin}
            </div>
            {atelierInfo.admins && (
              <div className="mt-2">
                <strong>Admin:</strong> {atelierInfo.admins.nom_admin} (
                <span className="text-blue-700">
                  {atelierInfo.admins.email}
                </span>
                )<br />
                <strong>Téléphone:</strong> {atelierInfo.admins.telephone}
              </div>
            )}
            <div>
              <strong>Créé le:</strong> {atelierInfo.created_at}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AjouterAtelier;
