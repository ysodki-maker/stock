import { Eye, Loader2, Package, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { ProductContext } from "../context/ProductContext";
import { useContext, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const SORT_DIRECTIONS = { NONE: "none", ASC: "asc", DESC: "desc" };

function SortIcon({ direction }) {
  if (direction === SORT_DIRECTIONS.ASC)
    return <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />;
  if (direction === SORT_DIRECTIONS.DESC)
    return <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />;
  return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover/th:opacity-100 transition-opacity" />;
}

export default function TableProducts({ filteredProducts, getMeta }) {
  const { loading } = useContext(ProductContext);
  const navigate = useNavigate();
  const [reservationLoading, setReservationLoading] = useState(null);
  const [reservationSuccess, setReservationSuccess] = useState(null);
  const [reservationValues, setReservationValues] = useState({});

  // ─── Sorting state ───────────────────────────────────────────────
  const [sortConfig, setSortConfig] = useState({ key: null, direction: SORT_DIRECTIONS.NONE });

  useEffect(() => {
    const initialValues = {};
    filteredProducts.forEach((p) => {
      initialValues[p.id] = getMeta(p, "_reservation") || "";
    });
    setReservationValues(initialValues);
  }, [filteredProducts]);

  // ─── Sort handler ─────────────────────────────────────────────────
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: SORT_DIRECTIONS.ASC };
      if (prev.direction === SORT_DIRECTIONS.ASC) return { key, direction: SORT_DIRECTIONS.DESC };
      return { key: null, direction: SORT_DIRECTIONS.NONE };
    });
  };

  // ─── Sorted products ──────────────────────────────────────────────
  const sortedProducts = useMemo(() => {
    if (!sortConfig.key || sortConfig.direction === SORT_DIRECTIONS.NONE) return filteredProducts;

    return [...filteredProducts].sort((a, b) => {
      let aVal, bVal;

      switch (sortConfig.key) {
        case "sku":
          aVal = (a.sku || "").toLowerCase();
          bVal = (b.sku || "").toLowerCase();
          break;
        case "name":
          aVal = (a.name || "").toLowerCase();
          bVal = (b.name || "").toLowerCase();
          break;
        case "stock_quantity":
          aVal = a.stock_quantity ?? 0;
          bVal = b.stock_quantity ?? 0;
          break;
        case "unite":
          aVal = (getMeta(a, "_unite_produit") || "").toLowerCase();
          bVal = (getMeta(b, "_unite_produit") || "").toLowerCase();
          break;
        case "statut":
          aVal = (getMeta(a, "_localisation_produit") || "").toLowerCase();
          bVal = (getMeta(b, "_localisation_produit") || "").toLowerCase();
          break;
        case "categorie":
          aVal = (a.taxonomies?.product_cat?.terms?.[0]?.name || "").toLowerCase();
          bVal = (b.taxonomies?.product_cat?.terms?.[0]?.name || "").toLowerCase();
          break;
        case "reservation":
          aVal = (reservationValues[a.id] || "").toLowerCase();
          bVal = (reservationValues[b.id] || "").toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortConfig.direction === SORT_DIRECTIONS.ASC ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === SORT_DIRECTIONS.ASC ? 1 : -1;
      return 0;
    });
  }, [filteredProducts, sortConfig, reservationValues, getMeta]);

  const updateReservation = async (productId, value) => {
    setReservationValues((prev) => ({ ...prev, [productId]: value }));

    try {
      setReservationLoading(productId);
      setReservationSuccess(null);

      const res = await fetch(
        `https://stockbackup.cosinus.ma/wp-json/wc-full-api/v1/products/${productId}/reservation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reservation: value }),
        }
      );

      if (!res.ok) throw new Error("Erreur API");

      setReservationSuccess(productId);
      setTimeout(() => setReservationSuccess(null), 1500);
    } catch (err) {
      setReservationValues((prev) => ({
        ...prev,
        [productId]:
          getMeta(
            filteredProducts.find((p) => p.id === productId),
            "_reservation"
          ) || "",
      }));
      alert(err.message);
    } finally {
      setReservationLoading(null);
    }
  };

  const getReservationRowClass = (product) => {
    const value = reservationValues[product.id];
    const isSaved = reservationSuccess === product.id;
    if (isSaved && value) return "bg-emerald-50 ring-1 ring-emerald-200 animate-pulse-once";
    if (value) return "bg-red-300";
    return "";
  };

  // ─── Reusable sortable header ─────────────────────────────────────
  const SortableTh = ({ colKey, label, className = "" }) => {
    const isActive = sortConfig.key === colKey;
    return (
      <th
        className={`px-5 py-6 text-left cursor-pointer select-none group/th ${className}`}
        onClick={() => handleSort(colKey)}
      >
        <span
          className={`text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
            isActive ? "text-indigo-600" : "text-slate-700 hover:text-indigo-500"
          }`}
        >
          {label}
          <SortIcon direction={isActive ? sortConfig.direction : SORT_DIRECTIONS.NONE} />
        </span>
      </th>
    );
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-slate-200/50 overflow-hidden">
      <div className="relative">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-slate-100 hover:scrollbar-thumb-indigo-400">
          <table className="w-full min-w-[1800px]">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-slate-200">
                {/* SKU — sticky */}
                <th
                  className="px-8 py-6 text-left min-w-[180px] sticky left-0 bg-gradient-to-r from-slate-100 to-slate-50 z-10 cursor-pointer select-none group/th"
                  onClick={() => handleSort("sku")}
                >
                  <span
                    className={`text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                      sortConfig.key === "sku" ? "text-indigo-600" : "text-slate-700 hover:text-indigo-500"
                    }`}
                  >
                    SKU
                    <SortIcon direction={sortConfig.key === "sku" ? sortConfig.direction : SORT_DIRECTIONS.NONE} />
                  </span>
                </th>

                <SortableTh colKey="name" label="Nom Produit" />
                <SortableTh colKey="stock_quantity" label="Quantité" className="min-w-[100px]" />
                <SortableTh colKey="unite" label="Unité" className="min-w-[100px]" />
                <SortableTh colKey="statut" label="Statut" className="min-w-[100px]" />
                <SortableTh colKey="categorie" label="Catégorie" className="min-w-[100px]" />
                <SortableTh colKey="reservation" label="Reservation" className="min-w-[150px]" />

                <th className="px-8 py-6 text-center min-w-[100px]">
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-24 text-center">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 font-semibold text-base">Chargement des données...</p>
                  </td>
                </tr>
              ) : sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-24 text-left">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
                      <Package className="w-10 h-10 text-slate-400" />
                    </div>
                    <p className="text-slate-700 font-bold text-lg mb-2">Aucun produit trouvé</p>
                    <p className="text-slate-500 text-sm">Essayez de modifier vos critères de recherche</p>
                  </td>
                </tr>
              ) : (
                sortedProducts.map((product) => (
                  <tr
                    key={product.id}
                    className={`
                      border-b border-slate-100 
                      hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/30 
                      transition-all duration-200 group
                      ${getReservationRowClass(product)}
                    `}
                  >
                    <td className="px-6 py-5 text-left min-w-[180px] sticky left-0 bg-gradient-to-r from-slate-100 to-slate-50 z-10">
                      <code className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                        {product.sku || "N/A"}
                      </code>
                    </td>

                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-900 text-sm leading-tight group-hover:text-indigo-700 transition-colors">
                        {product.name}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-left">
                      <div
                        className={`inline-flex items-center justify-center min-w-[70px] px-4 py-2 rounded-full text-xs font-bold shadow-sm ${
                          product.stock_quantity > 10
                            ? "bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200"
                            : product.stock_quantity > 0
                            ? "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border border-amber-200"
                            : "bg-gradient-to-r from-rose-100 to-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {product.stock_quantity ?? 0}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-left">
                      <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 text-sm font-bold">
                        {getMeta(product, "_unite_produit")}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">
                          {getMeta(product, "_localisation_produit")}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2">
                        {product.taxonomies?.product_cat?.terms?.slice(0, 2).map((cat) => (
                          <span
                            key={cat.id}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 text-xs font-semibold border border-purple-200 hover:shadow-md transition-shadow"
                          >
                            {cat.name}
                          </span>
                        )) || <span className="text-slate-400 text-xs">-</span>}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="relative flex items-center gap-2 max-w-[250px]">
                        <input
                          type="text"
                          value={reservationValues[product.id] || ""}
                          placeholder="Réservation..."
                          onChange={(e) =>
                            setReservationValues((prev) => ({ ...prev, [product.id]: e.target.value }))
                          }
                          className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-all ${
                            reservationValues[product.id]
                              ? "bg-amber-50 border-amber-300 text-amber-800 font-semibold"
                              : "border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                          }`}
                          disabled={reservationLoading === product.id}
                        />

                        <button
                          type="button"
                          onClick={() => updateReservation(product.id, reservationValues[product.id] || "")}
                          disabled={reservationLoading === product.id}
                          className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                          title="Mettre à jour la réservation"
                        >
                          💾
                        </button>

                        {!!reservationValues[product.id] && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("Supprimer la réservation ?")) {
                                updateReservation(product.id, "");
                              }
                            }}
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                            title="Libérer"
                          >
                            ❌
                          </button>
                        )}

                        {reservationLoading === product.id && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 animate-pulse">⏳</span>
                        )}
                        {reservationSuccess === product.id && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-500 text-sm">✔</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          className="p-2 hover:bg-indigo-100 rounded-lg transition-all group/btn"
                          title="Voir"
                          onClick={() => navigate(`/products/${product.id}`)}
                        >
                          <Eye className="w-4 h-4 text-slate-400 group-hover/btn:text-indigo-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}