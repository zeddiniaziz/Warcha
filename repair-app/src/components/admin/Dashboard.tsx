import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { supabase } from "../../supabase-client";
import {
  ChevronLeft,
  ChevronRight,
  User,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";

const COLORS = ["#3b82f6", "#facc15", "#dc2626", "#84cc16", "#F97316"];

const DashboardAdminAtelier = ({
  id_atelier,
}: {
  id_atelier: number | null;
}) => {
  // Stat cards
  const [fichesToday, setFichesToday] = useState<
    { nom: string; telephone: string; date_enlevement?: string }[]
  >([]);
  const [profitToday, setProfitToday] = useState<number>(0);
  const [paiementsTodayList, setPaiementsTodayList] = useState<
    { montant: number; methode: string; date?: string }[]
  >([]);

  // Charts
  const [topServices, setTopServices] = useState<any[]>([]);
  const [topPieces, setTopPieces] = useState<any[]>([]);
  const [topFamillesPieces, setTopFamillesPieces] = useState<any[]>([]);
  const [topMarques, setTopMarques] = useState<any[]>([]);
  const [topFamillesProduits, setTopFamillesProduits] = useState<any[]>([]);
  const [paiementRepartition, setPaiementRepartition] = useState<any[]>([]);

  // Chart pagination state
  const [servicesPage, setServicesPage] = useState(0);
  const [piecesPage, setPiecesPage] = useState(0);
  const [famillesPiecesPage, setFamillesPiecesPage] = useState(0);
  const [marquesPage, setMarquesPage] = useState(0);
  const [famillesProduitsPage, setFamillesProduitsPage] = useState(0);

  const [loading, setLoading] = useState(true);
  const ITEMS_PER_PAGE = 5;

  // Abonnement info state
  const [abonnementInfo, setAbonnementInfo] = useState<{
    date_debut?: string;
    date_fin?: string;
    duree?: number;
    is_paid?: boolean;
  } | null>(null);

  // Pagination helpers
  const getPaginatedData = (data: any[], page: number) => {
    const start = page * ITEMS_PER_PAGE;
    return data.slice(start, start + ITEMS_PER_PAGE);
  };

  const getMaxPages = (data: any[]) => Math.ceil(data.length / ITEMS_PER_PAGE);

  // Helper for progress bar
  const getAbonnementProgress = () => {
    if (!abonnementInfo?.date_debut || !abonnementInfo?.date_fin) return 0;
    const start = new Date(abonnementInfo.date_debut).getTime();
    const end = new Date(abonnementInfo.date_fin).getTime();
    const now = Date.now();
    if (now < start) return 0;
    if (now > end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  };

  useEffect(() => {
    if (!id_atelier) return;
    setLoading(true);

    const fetchData = async () => {
      // 1. Fiches à enlever aujourd'hui
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const { data: fichesTodayData } = await supabase
        .from("fiches")
        .select("id, telephone, id_client, date_enlevement")
        .eq("id_atelier", id_atelier)
        .gte("date_enlevement", today.toISOString())
        .lt("date_enlevement", tomorrow.toISOString());

      let fichesTodayList: {
        nom: string;
        telephone: string;
        date_enlevement?: string;
      }[] = [];
      if (fichesTodayData && fichesTodayData.length > 0) {
        const clientIds = fichesTodayData
          .map((f: any) => f.id_client)
          .filter((id: number | null) => !!id);

        let clientsMap: Record<number, string> = {};
        if (clientIds.length > 0) {
          const { data: clientsData } = await supabase
            .from("clients")
            .select("id, nom_client")
            .in("id", clientIds);
          clientsData?.forEach((c: any) => {
            clientsMap[c.id] = c.nom_client;
          });
        }

        fichesTodayList = fichesTodayData.map((f: any) => ({
          nom:
            f.id_client && clientsMap[f.id_client]
              ? clientsMap[f.id_client]
              : "Client inconnu",
          telephone: f.telephone || "",
          date_enlevement: f.date_enlevement,
        }));
      }

      // 2. Profit aujourd'hui & today's paiements
      const { data: paiementsToday } = await supabase
        .from("paiements")
        .select("montant, methode, date")
        .eq("id_atelier", id_atelier)
        .gte("date", today.toISOString())
        .lt("date", tomorrow.toISOString());
      const profit =
        paiementsToday?.reduce(
          (sum: number, p: any) => sum + (p.montant || 0),
          0
        ) || 0;
      setPaiementsTodayList(paiementsToday || []);

      // 3. Services les plus sollicités
      const { data: services } = await supabase
        .from("services")
        .select("id, nom_service, count_service")
        .eq("id_atelier", id_atelier);
      let topServicesArr = (services || [])
        .map((s: any) => ({
          name: s.nom_service || `Service #${s.id}`,
          value: s.count_service || 0,
        }))
        .sort((a, b) => b.value - a.value);

      // 4. Pièces les plus utilisées
      const { data: pieces } = await supabase
        .from("pieces")
        .select("id, nom_piece, count_piece")
        .eq("id_atelier", id_atelier);
      let topPiecesArr = (pieces || [])
        .map((p: any) => ({
          name: p.nom_piece || `Pièce #${p.id}`,
          value: p.count_piece || 0,
        }))
        .sort((a, b) => b.value - a.value);

      // 5. Familles pièces les plus utilisées
      const { data: famillesPieces } = await supabase
        .from("familles_pieces")
        .select("id, type, count_familles_pieces")
        .eq("id_atelier", id_atelier);
      let topFamillesArr = (famillesPieces || [])
        .map((f: any) => ({
          name: f.type || `Famille #${f.id}`,
          value: f.count_familles_pieces || 0,
        }))
        .sort((a, b) => b.value - a.value);

      // 6. Marques les plus réparées
      const { data: marques } = await supabase
        .from("marques")
        .select("id, nom, count_marques")
        .eq("id_atelier", id_atelier);
      let topMarquesArr = (marques || [])
        .map((m: any) => ({
          name: m.nom || `Marque #${m.id}`,
          value: m.count_marques || 0,
        }))
        .sort((a, b) => b.value - a.value);

      // 7. Familles produits les plus réparées
      const { data: famillesProduits } = await supabase
        .from("familles_produits")
        .select("id, type, count_familles_produits")
        .eq("id_atelier", id_atelier);
      let topFamillesProduitsArr = (famillesProduits || [])
        .map((f: any) => ({
          name: f.type || `Famille #${f.id}`,
          value: f.count_familles_produits || 0,
        }))
        .sort((a, b) => b.value - a.value);

      // 8. Répartition par méthode de paiement
      const { data: paiements } = await supabase
        .from("paiements")
        .select("methode, montant")
        .eq("id_atelier", id_atelier);
      const repartition: Record<string, number> = {};
      paiements?.forEach((p: any) => {
        repartition[p.methode] =
          (repartition[p.methode] || 0) + (p.montant || 0);
      });
      const totalPaiement = Object.values(repartition).reduce(
        (a, b) => a + b,
        0
      );
      const paiementArr = Object.entries(repartition).map(([k, v], i) => ({
        name: k,
        value: totalPaiement ? Math.round((v / totalPaiement) * 100) : 0,
        color: COLORS[i % COLORS.length],
      }));

      // Fetch abonnement info for progress bar
      const { data: abData } = await supabase
        .from("abonnement_atelier")
        .select("date_debut, date_fin, duree, is_paid")
        .eq("id_atelier", id_atelier)
        .order("date_debut", { ascending: false })
        .limit(1)
        .single();

      if (abData?.date_fin) {
        const endDate = new Date(abData.date_fin);
        const now = new Date();
        // Add 1 day to endDate
        endDate.setDate(endDate.getDate() + 1);
        if (now > endDate && abData.is_paid) {
          // Update is_paid to false in supabase
          await supabase
            .from("abonnement_atelier")
            .update({ is_paid: false })
            .eq("id_atelier", id_atelier)
            .eq("date_fin", abData.date_fin);
          abData.is_paid = false;
        }
      }
      setAbonnementInfo(abData || null);
      setFichesToday(fichesTodayList);
      setProfitToday(profit);
      setTopServices(topServicesArr);
      setTopPieces(topPiecesArr);
      setTopFamillesPieces(topFamillesArr);
      setTopMarques(topMarquesArr);
      setTopFamillesProduits(topFamillesProduitsArr);
      setPaiementRepartition(paiementArr);
      setLoading(false);
    };
    fetchData();
  }, [id_atelier]);

  const ChartNavigation = ({
    data,
    currentPage,
    onPageChange,
    title,
  }: {
    data: any[];
    currentPage: number;
    onPageChange: (page: number) => void;
    title: string;
  }) => {
    const maxPages = getMaxPages(data);

    if (maxPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <span className="text-xs text-gray-500 px-2">
            {currentPage + 1} / {maxPages}
          </span>
          <button
            onClick={() =>
              onPageChange(Math.min(maxPages - 1, currentPage + 1))
            }
            disabled={currentPage >= maxPages - 1}
            className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">
            Chargement du tableau de bord...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Vue d'ensemble de votre atelier
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {/* Fiches à enlever aujourd'hui card */}
          <div className="group bg-gradient-to-br from-white to-blue-50/30 rounded-xl shadow-sm border border-blue-100/50 p-6 hover:shadow-lg hover:shadow-blue-100/20 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-blue-200">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">
                    Fiches à Enlever Aujourd'hui
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-blue-600">
                      {fichesToday.length}
                    </span>
                    <span className="text-sm text-gray-500 font-medium">
                      fiche{fichesToday.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              {fichesToday.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">
                    Aucune fiche aujourd'hui
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar">
                  {fichesToday.map((fiche, i) => {
                    let time = "";
                    if (fiche.date_enlevement) {
                      const d = new Date(fiche.date_enlevement);
                      const h = d.getHours().toString().padStart(2, "0");
                      const m = d.getMinutes().toString().padStart(2, "0");
                      time = `${h}:${m}`;
                    }
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 hover:bg-white hover:border-blue-200 transition-all duration-200"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {fiche.nom}
                          </p>
                          {time && (
                            <p className="text-xs text-blue-600 font-medium mt-1">
                              📅 {time}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md font-mono ml-3 flex-shrink-0">
                          {fiche.telephone}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Profit Aujourd'hui card */}
          <div className="group bg-gradient-to-br from-white to-emerald-50/30 rounded-xl shadow-sm border border-emerald-100/50 p-6 hover:shadow-lg hover:shadow-emerald-100/20 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg group-hover:shadow-emerald-200">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">
                    Profit Aujourd'hui
                  </h3>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-bold text-emerald-600">
                      {profitToday.toLocaleString("fr-TN", {
                        minimumFractionDigits: 3,
                      })}
                    </span>
                    <span className="text-sm text-emerald-600 font-semibold">
                      DT
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              {paiementsTodayList.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">
                    Aucun paiement aujourd'hui
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar">
                  {paiementsTodayList.map((p, i) => {
                    let time = "";
                    if (p.date) {
                      const d = new Date(p.date);
                      const h = d.getHours().toString().padStart(2, "0");
                      const m = d.getMinutes().toString().padStart(2, "0");
                      time = `${h}:${m}`;
                    }
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 hover:bg-white hover:border-emerald-200 transition-all duration-200"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-emerald-700">
                            {p.montant.toLocaleString("fr-TN", {
                              minimumFractionDigits: 3,
                            })}{" "}
                            DT
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-gray-600">
                            {p.methode}
                          </p>
                          {time && (
                            <p className="text-xs text-emerald-600 font-medium">
                              🕒 {time}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Abonnement Progress Card */}
          <div className="group bg-gradient-to-br from-white to-amber-50/30 rounded-xl shadow-sm border border-amber-100/50 p-6 hover:shadow-lg hover:shadow-amber-100/20 transition-all duration-300 hover:-translate-y-1 lg:col-span-2 xl:col-span-1">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg group-hover:shadow-amber-200">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">
                    Progression de l'abonnement
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <span className="bg-gray-100 px-2 py-1 rounded-md font-medium">
                      {abonnementInfo?.date_debut
                        ? new Date(
                            abonnementInfo.date_debut
                          ).toLocaleDateString("fr-FR")
                        : "-"}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="bg-gray-100 px-2 py-1 rounded-md font-medium">
                      {abonnementInfo?.date_fin
                        ? new Date(abonnementInfo.date_fin).toLocaleDateString(
                            "fr-FR"
                          )
                        : "-"}
                    </span>
                    <span className="bg-gray-100 px-2 py-1 rounded-md font-medium">
                      {abonnementInfo?.date_fin && abonnementInfo?.date_debut
                        ? (() => {
                            const start = new Date(abonnementInfo?.date_debut);
                            const end = new Date(abonnementInfo?.date_fin);

                            let months =
                              (end.getFullYear() - start.getFullYear()) * 12 +
                              (end.getMonth() - start.getMonth());
                            let days = end.getDate() - start.getDate();

                            if (days < 0) {
                              // go back one month and calculate remaining days
                              months--;
                              const prevMonth = new Date(
                                end.getFullYear(),
                                end.getMonth(),
                                0
                              );
                              days += prevMonth.getDate();
                            }

                            let result = "";
                            if (months > 0) result += `${months} mois`;
                            if (days > 0)
                              result += `${months > 0 ? " et " : ""}${days} ${
                                days === 1 ? "jr" : "jrs"
                              }`;
                            return result || "-";
                          })()
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="relative">
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out relative ${
                      getAbonnementProgress() < 100
                        ? "bg-gradient-to-r from-amber-400 to-amber-500"
                        : "bg-gradient-to-r from-emerald-400 to-emerald-500"
                    }`}
                    style={{ width: `${getAbonnementProgress()}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-xs font-medium text-gray-500">
                  <span>{Math.round(getAbonnementProgress())}%</span>
                  <span>
                    {getAbonnementProgress() < 100 ? "En cours" : "Terminé"}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex justify-center">
                {abonnementInfo?.is_paid ? (
                  <div className="inline-flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 rounded-lg border border-emerald-200">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      Abonnement actif
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-red-50 to-red-100 text-red-700 rounded-lg border border-red-200">
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      Abonnement non payé
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Services Chart */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6">
            <ChartNavigation
              data={topServices}
              currentPage={servicesPage}
              onPageChange={setServicesPage}
              title="Services les plus sollicités"
            />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getPaginatedData(topServices, servicesPage)}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pieces Chart */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6">
            <ChartNavigation
              data={topPieces}
              currentPage={piecesPage}
              onPageChange={setPiecesPage}
              title="Pièces les plus utilisées"
            />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getPaginatedData(topPieces, piecesPage)}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar dataKey="value" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Familles Pieces Chart */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6">
            <ChartNavigation
              data={topFamillesPieces}
              currentPage={famillesPiecesPage}
              onPageChange={setFamillesPiecesPage}
              title="Familles pièces les plus utilisées"
            />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getPaginatedData(topFamillesPieces, famillesPiecesPage)}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Marques Chart */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6">
            <ChartNavigation
              data={topMarques}
              currentPage={marquesPage}
              onPageChange={setMarquesPage}
              title="Marques les plus réparées"
            />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getPaginatedData(topMarques, marquesPage)}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Familles Produits Chart */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6">
            <ChartNavigation
              data={topFamillesProduits}
              currentPage={famillesProduitsPage}
              onPageChange={setFamillesProduitsPage}
              title="Familles produits les plus réparées"
            />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getPaginatedData(
                    topFamillesProduits,
                    famillesProduitsPage
                  )}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar dataKey="value" fill="#eab308" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods Pie Chart */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Répartition par méthode de paiement
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={paiementRepartition}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    strokeWidth={2}
                    stroke="#ffffff"
                  >
                    {paiementRepartition.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value}%`,
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span style={{ fontSize: "12px" }}>{value}</span>
                    )}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdminAtelier;
