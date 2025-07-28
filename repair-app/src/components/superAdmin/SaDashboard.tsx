import React, { useState, useEffect } from "react";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  Package,
  DollarSign,
  Building,
  Clock,
  Star,
  TrendingUp,
  Activity,
  ChevronRight,
} from "lucide-react";

import { supabase } from "../../supabase-client";

const COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F97316", // Orange
];

type MetricCardProps = {
  title: string;
  value: React.ReactNode;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
}) => (
  <div className="group bg-gradient-to-br from-white to-blue-50/30 rounded-xl shadow-sm border border-blue-100/50 p-6 hover:shadow-lg hover:shadow-blue-100/20 transition-all duration-300 hover:-translate-y-1">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" />
            {subtitle}
          </p>
        )}
      </div>
      <div
        className={`p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-blue-200`}
      >
        <Icon className="w-7 h-7 text-white" />
      </div>
    </div>
  </div>
);

const SaDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [globalStats, setGlobalStats] = useState<any>({
    totalAteliers: 0,
    totalAbonnements: 0,
    totalRevenue: 0,
    abonnementsParType: [],
    activeVsExpired: [],
    recentAbonnements: [],
    topAteliers: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setLastUpdated(new Date().toLocaleString());

      // Fetch all needed data
      const { data: ateliers } = await supabase.from("ateliers").select("*");
      const { data: abonnements } = await supabase
        .from("abonnements")
        .select("*");
      const { data: abonnementAtelier } = await supabase.from(
        "abonnement_atelier"
      ).select(`
          *,
          ateliers (
            nom_atelier
          ),
          abonnements (
            nom
          )
        `);

      // Total Ateliers
      const totalAteliers = ateliers ? ateliers.length : 0;

      // Total Abonnements
      const totalAbonnements = abonnementAtelier ? abonnementAtelier.length : 0;

      // Total Revenue
      const totalRevenue = abonnementAtelier
        ? abonnementAtelier.reduce((sum, a) => sum + (a.prix_paye || 0), 0)
        : 0;

      // Abonnements par Type
      const abonnementTypes: { [key: string]: number } = {};
      if (abonnementAtelier && abonnements) {
        abonnementAtelier.forEach((a: any) => {
          const ab = abonnements.find((ab: any) => ab.id === a.id_abonnement);
          if (ab) {
            abonnementTypes[ab.nom] = (abonnementTypes[ab.nom] || 0) + 1;
          }
        });
      }
      const abonnementsParType = Object.entries(abonnementTypes).map(
        ([type, count]) => ({ type, count })
      );

      // Active vs Expired abonnements
      let active = 0,
        expired = 0;
      if (abonnementAtelier) {
        abonnementAtelier.forEach((a: any) => {
          if (a.is_paid) active++;
          else expired++;
        });
      }
      const activeVsExpired = [
        { name: "Actifs", value: active },
        { name: "Expirés", value: expired },
      ];

      // Recent abonnements
      const recentAbonnements = abonnementAtelier
        ? [...abonnementAtelier]
            .sort(
              (a: any, b: any) =>
                new Date(b.created_at || 0).getTime() -
                new Date(a.created_at || 0).getTime()
            )
            .slice(0, 5)
            .map((a: any) => ({
              atelier: a.ateliers?.nom_atelier || "-",
              abonnement: a.abonnements?.nom || "-",
              prix: a.prix_paye,
              date: a.created_at,
            }))
        : [];

      // Top ateliers by revenue
      const revenueByAtelier: {
        [key: string]: { nom: string; total: number };
      } = {};
      if (abonnementAtelier) {
        abonnementAtelier.forEach((a: any) => {
          const nom = a.ateliers?.nom_atelier || "-";
          if (!revenueByAtelier[nom]) revenueByAtelier[nom] = { nom, total: 0 };
          revenueByAtelier[nom].total += a.prix_paye || 0;
        });
      }
      const topAteliers = Object.values(revenueByAtelier)
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);

      setGlobalStats({
        totalAteliers,
        totalAbonnements,
        totalRevenue,
        abonnementsParType,
        activeVsExpired,
        recentAbonnements,
        topAteliers,
      });
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <span className="text-gray-700 font-medium">
            Chargement des données...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-6 lg:p-8 space-y-8">
        {/* Dashboard Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Tableau de bord Super Admin
              </h1>
              <p className="text-blue-100 text-lg">
                Vue globale sur les ateliers et abonnements
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-md px-4 py-2">
              <Clock className="w-5 h-5 text-blue-200" />
              <span className="text-sm text-blue-100">
                Dernière mise à jour : {lastUpdated}
              </span>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          <MetricCard
            title="Total Abonnements"
            value={globalStats.totalAbonnements}
            icon={Building}
            color="blue-700"
            subtitle="Abonnements enregistrés"
          />
          <MetricCard
            title="Revenus Totaux"
            value={`${globalStats.totalRevenue.toFixed(2)} TND`}
            icon={DollarSign}
            color="blue-700"
            subtitle="Montant encaissé"
          />
          <MetricCard
            title="Types d'abonnements"
            value={globalStats.abonnementsParType.length}
            icon={Package}
            color="blue-700"
            subtitle="Catégories disponibles"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Pie Chart: Répartition des abonnements par type */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Répartition par Type
              </h3>
              <div className="p-2 rounded-md">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={
                    globalStats.abonnementsParType.length
                      ? globalStats.abonnementsParType
                      : [{ type: "Aucun", count: 1 }]
                  }
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={40}
                  label={(entry: any) => `${entry.type}: ${entry.count}`}
                  labelLine={false}
                >
                  {globalStats.abonnementsParType.map(
                    (_entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    )
                  )}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart: Abonnements actifs vs expirés */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Statut des Abonnements
              </h3>
              <div className="p-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={
                    globalStats.activeVsExpired.length
                      ? globalStats.activeVsExpired
                      : [{ name: "Aucun", value: 1 }]
                  }
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={40}
                  label={(entry: any) => `${entry.name}: ${entry.value}`}
                  labelLine={false}
                >
                  {globalStats.activeVsExpired.map(
                    (_entry: any, index: number) => (
                      <Cell
                        key={`cell2-${index}`}
                        fill={index === 0 ? "#10B981" : "#EF4444"}
                      />
                    )
                  )}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Ateliers by Revenue */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Top Ateliers</h3>
              <div className="p-2">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
            <div className="space-y-4">
              {globalStats.topAteliers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <Building className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">Aucun atelier trouvé</p>
                </div>
              ) : (
                globalStats.topAteliers.map((a: any, idx: number) => (
                  <div
                    key={a.nom}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-yellow-50/30 rounded-xl border border-gray-200 hover:border-yellow-200 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                          idx === 0
                            ? "bg-yellow-500"
                            : idx === 1
                            ? "bg-yellow-500"
                            : "bg-yellow-500"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span className="font-semibold text-gray-800">
                        {a.nom}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-gray-900">
                        {a.total.toFixed(2)} TND
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Abonnements Table */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-800">
                Abonnements Récents
              </h3>
              <div className="p-2"></div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Atelier
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Abonnement
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Prix payé
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {globalStats.recentAbonnements.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-gray-500">Aucun abonnement récent</p>
                    </td>
                  </tr>
                ) : (
                  globalStats.recentAbonnements.map((a: any, idx: number) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8  flex items-center justify-center">
                            <Building className="w-6 h-6 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">
                            {a.atelier}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {a.abonnement}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold">
                          {a.prix?.toFixed(3)} TND
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {a.date
                          ? new Date(a.date).toLocaleString("fr-FR")
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default SaDashboard;
