import { Box, Filter, Layers, Package2 } from "lucide-react";

export default function FilterProducts({
  showFilters,
  selectedFilter,
  handleFilterChange,
  filtersData,
  filterValue,
  setShowFilters,
  handleApplyFilter,
}) {
  return (
    <>
      {/* Filter Panel redesigné */}
      {showFilters && (
        <div className="mt-5 bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-indigo-100 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Filter className="w-5 h-5 text-indigo-600" />
              Filtres Avancés
            </h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Sélectionnez un critère
            </span>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {/* Filtre Catégorie */}
            <div
              className={`group relative rounded-xl border-2 transition-all duration-200 ${
                selectedFilter === "category"
                  ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg scale-105"
                  : "border-slate-200 hover:border-indigo-200 hover:shadow-md"
              }`}
            >
              <div className="p-5">
                <label className="block text-xs font-bold text-slate-700 mb-3 flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      selectedFilter === "category"
                        ? "bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg"
                        : "bg-slate-100 group-hover:bg-indigo-100"
                    }`}
                  >
                    <Layers
                      className={`w-5 h-5 ${
                        selectedFilter === "category"
                          ? "text-white"
                          : "text-slate-500"
                      }`}
                    />
                  </div>
                  <span className="uppercase tracking-wider">Catégorie</span>
                </label>
                <select
                  value={selectedFilter === "category" ? filterValue : ""}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 bg-white text-sm font-medium transition-all"
                >
                  <option value="">Choisir...</option>
                  {filtersData.categories?.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Filtre Design */}
            <div
              className={`group relative rounded-xl border-2 transition-all duration-200 ${
                selectedFilter === "design"
                  ? " border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg scale-105"
                  : "border-slate-200 hover:border-purple-200 hover:shadow-md"
              }`}
            >
              <div className="p-5">
                <label className="block text-xs font-bold text-slate-700 mb-3 flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      selectedFilter === "design"
                        ? "bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg"
                        : "bg-slate-100 group-hover:bg-purple-100"
                    }`}
                  >
                    <Package2
                      className={`w-5 h-5 ${
                        selectedFilter === "design"
                          ? "text-white"
                          : "text-slate-500"
                      }`}
                    />
                  </div>
                  <span className="uppercase tracking-wider">Design</span>
                </label>
                <select
                  value={selectedFilter === "design" ? filterValue : ""}
                  onChange={(e) => handleFilterChange("design", e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-100 bg-white text-sm font-medium transition-all"
                >
                  <option value="">Choisir...</option>
                  {filtersData.design?.map((t) => (
                    <option key={t.id} value={t.slug}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Filtre Couleurs */}
            <div
              className={`group relative rounded-xl border-2 transition-all duration-200 ${
                selectedFilter === "couleur"
                  ? " border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg scale-105"
                  : "border-slate-200 hover:border-purple-200 hover:shadow-md"
              }`}
            >
              <div className="p-5">
                <label className="block text-xs font-bold text-slate-700 mb-3 flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      selectedFilter === "couleur"
                        ? "bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg"
                        : "bg-slate-100 group-hover:bg-purple-100"
                    }`}
                  >
                    <Package2
                      className={`w-5 h-5 ${
                        selectedFilter === "couleur"
                          ? "text-white"
                          : "text-slate-500"
                      }`}
                    />
                  </div>
                  <span className="uppercase tracking-wider">Couleurs</span>
                </label>
                <select
                  value={selectedFilter === "couleur" ? filterValue : ""}
                  onChange={(e) => handleFilterChange("couleur", e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-100 bg-white text-sm font-medium transition-all"
                >
                  <option value="">Choisir...</option>
                  {filtersData.couleur?.map((t) => (
                    <option key={t.id} value={t.slug}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-6 pt-5 border-t-2 border-slate-100">
            <button
              onClick={() => setShowFilters(false)}
              className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-all text-sm"
            >
              Annuler
            </button>
            <button
              onClick={handleApplyFilter}
              disabled={!selectedFilter || !filterValue}
              className="px-8 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none text-sm hover:scale-105"
            >
              Appliquer le Filtre
            </button>
          </div>
        </div>
      )}
    </>
  );
}
