import { useEffect, useState } from "react";
import {
  Package,
  Layers,
  Tag,
  Cpu,
  ArrowRight,
  TrendingUp,
  BarChart3,
  PieChart,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  Legend,
} from "recharts";

import { supabase } from "../../supabase-client";
import { useNavigate } from "react-router-dom";



interface Piece {
  id: number;
  nom_piece: string;
  type: number;
  prix_achat: number;
  prix_vente: number;
  qte_stock: number;
}

interface FamillePiece {
  id: number;
  type: string;
  active: boolean;
}

interface Marque {
  id: number;
  nom: string;
}

interface FamilleProduit {
  id: number;
  type: string;
  active: boolean;
}

function GererStock({ id_atelier }: { id_atelier: number | null }) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [famillesPieces, setFamillesPieces] = useState<FamillePiece[]>([]);
  const [marques, setMarques] = useState<Marque[]>([]);
  const [famillesProduits, setFamillesProduits] = useState<FamilleProduit[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [barPage, setBarPage] = useState(0); // For bar chart carousel
  const navigate = useNavigate();
  // const sidebarOpen = useSidebarOpen();

  // Fetch all stock data from Supabase
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [piecesRes, famillesPiecesRes, marquesRes, famillesProduitsRes] =
          await Promise.all([
            supabase.from("pieces").select("*").eq("id_atelier", id_atelier),
            supabase.from("familles_pieces").select("*").eq("id_atelier", id_atelier),
            supabase.from("marques").select("*").eq("id_atelier", id_atelier),
            supabase.from("familles_produits").select("*").eq("id_atelier", id_atelier),
          ]);

        setPieces(piecesRes.data || []);
        setFamillesPieces(famillesPiecesRes.data || []);
        setMarques(marquesRes.data || []);
        setFamillesProduits(famillesProduitsRes.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Statistics calculations
  const totalPieces = pieces.length;
  const totalFamillesPieces = famillesPieces.length;
  const totalMarques = marques.length;
  const totalFamillesProduits = famillesProduits.length;

  const activeFamillesPieces = famillesPieces.filter((f) => f.active).length;
  const activeFamillesProduits = famillesProduits.filter(
    (f) => f.active
  ).length;

  const totalInventoryValue = pieces.reduce(
    (sum, piece) => sum + piece.prix_achat * piece.qte_stock,
    0
  );
  const totalPotentialRevenue = pieces.reduce(
    (sum, piece) => sum + piece.prix_vente * piece.qte_stock,
    0
  );
  const potentialProfit = totalPotentialRevenue - totalInventoryValue;

  // Chart data with more professional colors
  const pieChartData = [
    { name: "Pièces", value: totalPieces, color: "#60a5fa" }, // blue-600
    { name: "Familles Pièces", value: totalFamillesPieces, color: "#84cc16" }, // emerald-500
    { name: "Marques", value: totalMarques, color: "#fbbf24" }, // amber-500
    {
      name: "Familles Produits",
      value: totalFamillesProduits,
      color: "#ef4444", // red-500
    },
  ];

  // Bar chart colors for each bar (cycling through a palette)
  const barColors = [
    "#4f46e5", // blue-600
    "#2563eb", // emerald-500
    "#0284c7", // amber-500
    "#0891b2", // red-500
    "#0d9488", // purple-700
    "#059669", // sky-500
    "#16a34a", // rose-500
    "#65a30d", // cyan-400
  ];

  const barChartData = famillesPieces.map((famille, idx) => ({
    name:
      famille.type.length > 12
        ? famille.type.substring(0, 12) + "..."
        : famille.type,
    pieces: pieces.filter((p) => p.type === famille.id).length,
    active: famille.active,
    fill: barColors[idx % barColors.length],
  }));

  const getPieceType = (typeId: number) => {
    const famille = famillesPieces.find((f) => f.id === typeId);
    return famille ? famille.type : "Non défini";
  };

  const stats = [
    {
      title: "Valeur du Stock",
      value: totalInventoryValue.toLocaleString("fr-TN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      unit: "DT",
      icon: TrendingUp,
      color: "text-blue-600 bg-white",
    },
    {
      title: "Profit Potentiel",
      value: potentialProfit.toLocaleString("fr-TN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      unit: "DT",
      icon: BarChart3,
      color: "text-blue-600",
    },
    {
      title: "Familles Actives",
      value: `${activeFamillesPieces + activeFamillesProduits}`,
      unit: `/ ${totalFamillesPieces + totalFamillesProduits}`,
      icon: PieChart,
      color: "text-blue-600",
    },
  ];

  // Responsive grid classes for cards
  // 1 col on mobile, 2 on md, 2 on xl if sidebar open, 3 on xl if sidebar closed
  const cardsGridClass = "grid-cols-1 md:grid-cols-2 xl:grid-cols-2"

  // Carousel logic for bar chart
  const famillesPerPage = 8;
  const totalPages = Math.ceil(barChartData.length / famillesPerPage);
  const pagedBarData = barChartData.slice(
    barPage * famillesPerPage,
    barPage * famillesPerPage + famillesPerPage
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-blue-600">
                Gestion du Stock
              </h1>
              <p className="text-gray-600 mt-1">
                Vue d'ensemble et statistiques
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                    {stat.value}
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      {stat.unit}
                    </span>
                  </p>
                </div>
                <div className="p-3 rounded-lg">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pièces par Famille (Bar Chart) - Full width, scrollable if too many familles */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Pièces par Famille
          </h3>
          <div className="flex items-center">
            {barChartData.length > famillesPerPage && (
              <button
                className="mr-2 p-2 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
                onClick={() => setBarPage((p) => Math.max(0, p - 1))}
                disabled={barPage === 0}
                aria-label="Précédent"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M15 19l-7-7 7-7"
                    stroke="#2563eb"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pagedBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="pieces"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={true}
                  >
                    {pagedBarData.map((entry, idx) => (
                      <Cell key={`bar-${idx}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {barChartData.length > famillesPerPage && (
              <button
                className="ml-2 p-2 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
                onClick={() =>
                  setBarPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={barPage === totalPages - 1}
                aria-label="Suivant"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M9 5l7 7-7 7"
                    stroke="#2563eb"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>
          {barChartData.length > famillesPerPage && (
            <div className="text-center mt-2 text-xs text-gray-500">
              Page {barPage + 1} / {totalPages}
            </div>
          )}
        </div>

        {/* Distribution des Catégories (Pie Chart) - Full width, below bar chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribution des Catégories
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value: number, name: string) => [value, name]}
              />
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
                isAnimationActive={true}
                labelLine={false}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                content={() => {
                  const total = pieChartData.reduce(
                    (sum, e) => sum + e.value,
                    0
                  );
                  return (
                    <ul
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "1.5rem",
                        margin: 0,
                        padding: 0,
                        listStyle: "none",
                      }}
                    >
                      {pieChartData.map((entry) => {
                        const percent = total
                          ? ((entry.value / total) * 100).toFixed(1)
                          : 0;
                        return (
                          <li
                            key={entry.name}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                backgroundColor: entry.color,
                                marginRight: 6,
                              }}
                            />
                            <span style={{ fontSize: 14, color: "#374151" }}>
                              {entry.name} ({percent}%)
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  );
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Main Cards Grid */}
        <div className={`grid ${cardsGridClass} gap-6`}>
          {/* Pièces Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg">
                  <Package className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Pièces</h3>
                  <p className="text-sm text-gray-600">
                    {totalPieces} Pièces en stock
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {pieces.length > 0 ? (
                  pieces.slice(0, 3).map((piece) => (
                    <div
                      key={piece.id}
                      className="flex justify-between items-center py-2 border-b border-gray-50 last:border-b-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {piece.nom_piece}
                        </p>
                        <p className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getPieceType(piece.type)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          <span className="text-sm font-medium text-green-600">Vente</span> : {piece.prix_vente?.toFixed(3)} DT
                        </p>
                        <p className="text-xs text-gray-500">
                          Achat &nbsp;&nbsp;: {piece.prix_achat?.toFixed(3)} DT
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">Aucune pièce disponible</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => navigate("/pieces")}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-900 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Voir tout
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Familles Pièces Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg">
                  <Layers className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Familles Pièces</h3>
                  <p className="text-sm text-gray-600">
                    {activeFamillesPieces} actives / {totalFamillesPieces}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {famillesPieces.length > 0 ? (
                  famillesPieces.slice(0, 4).map((famille) => (
                    <div
                      key={famille.id}
                      className="flex justify-between items-center py-2 border-b border-gray-50 last:border-b-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {famille.type}
                        </p>
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            famille.active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {famille.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">Aucune famille disponible</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => navigate("/categories_pieces")}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-900 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Voir tout
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Marques Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <Tag className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Marques
                  </h3>
                  <p className="text-sm text-gray-600">
                    {totalMarques} marques
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {marques.length > 0 ? (
                  marques.slice(0, 3).map((marque) => (
                    <div
                      key={marque.id}
                      className="flex items-center py-2 border-b border-gray-50 last:border-b-0"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {marque.nom}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">Aucune marque disponible</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => navigate("/marques")}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-900 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Voir tout
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Familles Produits Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <Cpu className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Familles Produits
                  </h3>
                  <p className="text-sm text-gray-600">
                    {activeFamillesProduits} actives / {totalFamillesProduits}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {famillesProduits.slice(0, 3).map((famille) => (
                  <div
                    key={famille.id}
                    className="flex justify-between items-center py-2 border-b border-gray-50 last:border-b-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {famille.type}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          famille.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {famille.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/categories_produits")}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-900 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Voir tout
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GererStock;
