import { Filter, Search, X } from "lucide-react";
import { ProductContext } from "../context/ProductContext";
import { useContext } from "react";

export default function SearchBar({
  searchTerm,
  setSearchTerm,
  showFilters,
  setShowFilters,
  hasActiveFilters,
  handleResetFilters,
  arrivage,
  setArrivage,
  handleSearch,
}) {
  const {
    fetchProducts,
    fetchEnArrivageProducts,
    perPage,
    setIsSearching,
    setActiveSearch, // ✅ AJOUT
  } = useContext(ProductContext);

  const handleArrivageToggle = () => {
    const nextValue = !arrivage;
    setArrivage(nextValue);
    handleResetFilters();
    setSearchTerm("");
    setIsSearching(false);
    setActiveSearch(""); // ✅ reset la recherche active lors du toggle arrivage
    if (nextValue) {
      fetchEnArrivageProducts(1);
    } else {
      fetchProducts(1, perPage);
    }
  };

  const handleInpSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value); // ✅ toujours mettre à jour l'affichage local

    if (value.trim() === "") {
      // ✅ reset propre si le champ est vidé
      setIsSearching(false);
      setActiveSearch("");
      fetchProducts(1, perPage);
    } else {
      // ✅ déléguer à handleSearch qui appelle fetchProducts avec le terme
      handleSearch(value);
    }
  };

  return (
    <div className="flex gap-3 flex-wrap items-center">
      {/* SEARCH */}
      <div className={`flex-1 min-w-[280px] relative group`}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
        <input
          type="text"
          placeholder="Rechercher par nom ou SKU..."
          value={searchTerm}
          onChange={handleInpSearch}
          disabled={arrivage}
          className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-sm shadow-sm"
        />
      </div>

      {/* FILTER BUTTON */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`group px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2.5 text-sm shadow-sm ${
          hasActiveFilters
            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200 hover:scale-105"
            : "bg-white text-slate-700 border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
        }`}
      >
        <Filter className="w-4 h-4 group-hover:rotate-12 transition-transform" />
        Filtres
        {hasActiveFilters && (
          <span className="bg-white text-indigo-600 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center animate-pulse">
            1
          </span>
        )}
      </button>

      {/* ARRIVAGE TOGGLE */}
      <div className="inline-flex rounded-xl border-2 border-slate-200 bg-slate-100 p-1 shadow-sm">
        <button
          onClick={() => arrivage && handleArrivageToggle()}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            !arrivage
              ? "bg-white shadow text-slate-800"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => !arrivage && handleArrivageToggle()}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            arrivage
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          En arrivage
        </button>
      </div>

      {/* RESET */}
      {hasActiveFilters && (
        <button
          onClick={handleResetFilters}
          className="px-6 py-3 rounded-xl font-semibold bg-white text-slate-700 border-2 border-slate-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200 flex items-center gap-2 text-sm shadow-sm"
        >
          <X className="w-4 h-4" />
          Réinitialiser
        </button>
      )}
    </div>
  );
}