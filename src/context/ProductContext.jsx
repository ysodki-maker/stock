import React, { createContext, useState, useCallback, useEffect } from "react";
// Yahya
// eslint-disable-next-line react-refresh/only-export-components
export const ProductContext = createContext();

const API_BASE = "https://stockbackup.cosinus.ma/wp-json/wc-full-api/v1";

export const ProductProvider = ({ children }) => {
  /* =======================
   * STATES
   ======================= */
  const [products, setProducts] = useState([]);
  const [filtersData, setFiltersData] = useState({
    categories: [],
    fournisseurs: [],
    types_produits: [],
    design: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [activeFilters, setActiveFilters] = useState({
    category: null,
    fournisseur: null,
    type_produit: null,
    design: null,
  });

  const [isSearching, setIsSearching] = useState(false);
  // ✅ AJOUT : mémoriser le terme de recherche actif pour la pagination
  const [activeSearch, setActiveSearch] = useState("");

  /* =======================
   * FETCH ALL PRODUCTS
   ======================= */
  const fetchProducts = useCallback(
    async (pageNum = 1, itemsPerPage = perPage, searchTerm = "") => {
      setLoading(true);
      setError(null);

      try {
        let url = `${API_BASE}/products?page=${pageNum}&per_page=${itemsPerPage}`;

        if (searchTerm && searchTerm.trim() !== "") {
          url = `${API_BASE}/products?page=${pageNum}&per_page=${itemsPerPage}&search=${encodeURIComponent(
            searchTerm.trim()
          )}`;
          setIsSearching(true);
          setActiveSearch(searchTerm.trim()); // ✅ mémoriser le terme actif
        } else {
          setIsSearching(false);
          setActiveSearch(""); // ✅ reset si pas de recherche
        }

        const res = await fetch(url);

        if (!res.ok) throw new Error("Erreur chargement produits");

        const data = await res.json();
        setProducts(data.products || []);
        setPage(data.page || pageNum);
        setTotalPages(data.total_pages || 1);
        setTotalProducts(data.total_products || 0);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [perPage]
  );

  /* =======================
   * FETCH EN-ARRIVAGE PRODUCTS
   ======================= */
  const fetchEnArrivageProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/en-arrivage`);

      if (!res.ok) throw new Error("Erreur chargement produits en arrivage");

      const data = await res.json();

      setProducts(data.products || []);
      setTotalProducts(data.count || 0);

      setPage(1);
      setTotalPages(1);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* =======================
   * FETCH FILTERS
   ======================= */
  const fetchFilters = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/filters`);
      if (!res.ok) throw new Error("Erreur chargement filtres");
      const data = await res.json();
      setFiltersData(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  /* =======================
   * FILTER PRODUCTS
   ======================= */
  const filterProducts = useCallback(
    async (
      {
        category = null,
        fournisseur = null,
        type_produit = null,
        design = null,
        couleur=null
      },
      pageNum = 1
    ) => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("page", pageNum);
      params.append("per_page", perPage);

      if (category) params.append("category", category);
      if (fournisseur) params.append("fournisseur", fournisseur);
      if (type_produit) params.append("type_produit", type_produit);
      if (design) params.append("design", design);
      if (couleur) params.append("couleur", couleur);
      try {
        const res = await fetch(
          `${API_BASE}/products/filter?${params.toString()}`
        );

        if (!res.ok) throw new Error("Erreur filtrage produits");

        const data = await res.json();

        setProducts(data.products || []);
        setPage(data.page || 1);
        setTotalPages(data.total_pages || 1);
        setTotalProducts(data.total_products || 0);

        setActiveFilters({
          category,
          fournisseur,
          type_produit,
          design,
          couleur
        });
      } catch (err) {
        console.error(err);
        setError(err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [perPage]
  );

  /* =======================
   * PAGINATION
   ======================= */
  const goToPage = useCallback(
    (pageNum) => {
      if (pageNum < 1 || pageNum > totalPages) return;

      setPage(pageNum);

      if (
        activeFilters.category ||
        activeFilters.fournisseur ||
        activeFilters.type_produit ||
        activeFilters.couleur
      ) {
        // Filtres actifs → paginer avec les filtres
        filterProducts(activeFilters, pageNum);
      } else if (activeSearch) {
        // ✅ Recherche active → paginer avec le terme de recherche
        fetchProducts(pageNum, perPage, activeSearch);
      } else {
        // Aucun filtre ni recherche → pagination normale
        fetchProducts(pageNum, perPage);
      }
    },
    [totalPages, activeFilters, activeSearch, filterProducts, fetchProducts, perPage]
  );

  const nextPage = () => goToPage(page + 1);
  const previousPage = () => goToPage(page - 1);

  const changePerPage = (newPerPage) => {
    setPerPage(newPerPage);
    setPage(1);
    fetchProducts(1, newPerPage);
  };

  /* =======================
   * RESET FILTERS
   ======================= */
  const resetFilters = () => {
    setActiveFilters({
      category: null,
      fournisseur: null,
      type_produit: null,
      design: null,
      couleur:null
    });
    setActiveSearch(""); // ✅ reset la recherche active aussi
    setIsSearching(false);
    fetchProducts(1, perPage);
  };

  /* =======================
   * INIT
   ======================= */
  useEffect(() => {
    fetchProducts(1, perPage);
    fetchFilters();
  }, []);

  /* =======================
   * UPDATE PRODUCT META (STOCK / LOCALISATION)
   ======================= */
  const updateProductMeta = useCallback(
    async (productId, payload) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE}/products/${productId}/meta`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData?.message || "Erreur mise à jour produit");
        }

        const data = await res.json();

        // 🔄 Rafraîchir la liste après update
        await fetchProducts(page, perPage);

        return data;
      } catch (err) {
        console.error(err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchProducts, page, perPage]
  );

  /* =======================
   * PROVIDER
   ======================= */
  return (
    <ProductContext.Provider
      value={{
        products,
        filtersData,
        loading,
        error,

        page,
        perPage,
        totalPages,
        totalProducts,

        fetchProducts,
        filterProducts,
        fetchFilters,

        goToPage,
        nextPage,
        previousPage,
        changePerPage,

        activeFilters,
        resetFilters,

        fetchEnArrivageProducts,
        updateProductMeta,

        isSearching,
        setIsSearching,

        // ✅ AJOUT : exposer activeSearch pour les composants qui en auraient besoin
        activeSearch,
        setActiveSearch,
      }}
    >
      {children}
    </ProductContext.Provider>
  ); 
}; 