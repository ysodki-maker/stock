/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
import { useContext, useState, useMemo } from "react";
import { ProductContext } from "../context/ProductContext";
import TopBar from "./TopBar";
import SearchBar from "./SearchBar";
import FilterProducts from "./FilterProducts";
import TableProducts from "./TableProducts";
import GridProducts from "./GridProducts";
import Pagination from "./Pagination";
import EnArrivageProducts from "./EnArrivageProducts";
import StatsBar from "./StatsBar";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
const ProductList = () => {
  const {
    products,
    filtersData,
    loading,
    error,
    page,
    totalPages,
    filterProducts,
    goToPage,
    nextPage,
    previousPage,
    activeFilters,
    resetFilters,
    fetchProducts,
    perPage,
    isSearching,
    // fetchEnArrivageProducts,
  } = useContext(ProductContext);

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [arrivage, setArrivage] = useState(false);
  const getMetaValue = (product, key) =>
    product.meta?.find((m) => m.meta_key === key)?.meta_value;
  const location = useLocation();
  // Filtrage local avec recherche

  useEffect(() => {
    if (location.state?.refresh) {
      fetchProducts(1, perPage); // Recharge la page 1
      setSelectedFilter("");
      setFilterValue("");
      resetFilters();
      setShowFilters(false);

      // Nettoyer l'état pour éviter un refresh permanent
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const filteredProducts = useMemo(() => {
    if (isSearching) {
      return products; // 🔥 PAS DE FILTRAGE LOCAL
    }

    return products.filter((product) => {
      const localisationRaw =
        getMetaValue(product, "_localisation_produit") || "";
      const localisation = localisationRaw.toLowerCase().trim();
      const stock = Number(product.stock_quantity ?? 0);

      if (localisation === "showroom" && stock === 0) {
        return false;
      }

      return true;
    });
  }, [products, isSearching]);

  const handleSearch = (term) => {
    const cleanTerm = term.trim();
    setSearchTerm(term);

    if (cleanTerm === "") {
      fetchProducts(1, perPage);
    } else {
      fetchProducts(1, perPage, cleanTerm);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setSelectedFilter(filterType);
    setFilterValue(value);
  };

  const handleApplyFilter = () => {
    if (!selectedFilter || !filterValue) return;

    filterProducts({
      category: selectedFilter === "category" ? filterValue : null,
      fournisseur: selectedFilter === "fournisseur" ? filterValue : null,
      type_produit: selectedFilter === "type_produit" ? filterValue : null,
      design: selectedFilter === "design" ? filterValue : null,
      couleur: selectedFilter === "couleur" ? filterValue : null,

    });
    setShowFilters(false);
    setArrivage(false);
    setSearchTerm("");
  };

  const handleResetFilters = () => {
    setSelectedFilter("");
    setFilterValue("");
    resetFilters();
    setShowFilters(false);
  };

  const hasActiveFilters =
    activeFilters.category ||
    activeFilters.fournisseur ||
    activeFilters.type_produit ||
    activeFilters.design ||
    activeFilters.couleur;

  // Helper pour extraire les meta données
  const getMeta = (product, metaKey) => {
    const meta = product.meta?.find((m) => m.meta_key === metaKey);
    return meta?.meta_value || "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-slate-200/50 shadow-sm">
        <div className="px-8 py-6">
          <TopBar viewMode={viewMode} setViewMode={setViewMode} />
          <StatsBar />
          <SearchBar
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            hasActiveFilters={hasActiveFilters}
            handleResetFilters={handleResetFilters}
            arrivage={arrivage}
            setArrivage={setArrivage}
            handleSearch={handleSearch}
          />
          <FilterProducts
            filterValue={filterValue}
            filtersData={filtersData}
            handleApplyFilter={handleApplyFilter}
            selectedFilter={selectedFilter}
            handleFilterChange={handleFilterChange}
            setShowFilters={setShowFilters}
            showFilters={showFilters}
          />
        </div>
      </div>
      {/* Main Content */}
      <div className="px-8 py-8">
        {error && <Error error={error} />}
        {arrivage === false ? (
          <>
            {viewMode === "table" ? (
              <TableProducts
                filteredProducts={filteredProducts}
                getMeta={getMeta}
              />
            ) : (
              <GridProducts
                filteredProducts={filteredProducts}
                getMeta={getMeta}
              />
            )}
            {/* {!isSearching && !loading && filteredProducts.length > 0 && ( */}
              <Pagination
                goToPage={goToPage}
                nextPage={nextPage}
                page={page}
                previousPage={previousPage}
                totalPages={totalPages}
              />
            {/* )} */}
          </>
        ) : (
          <EnArrivageProducts viewMode={viewMode} />
        )}
      </div>
    </div>
  );
};

export default ProductList;
