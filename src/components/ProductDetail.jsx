import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Package,
  MapPin,
  Layers,
  Box,
  AlertCircle,
  Edit3,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  X,
  Tag,
  Truck,
  BarChart3,
  FileText,
  ShoppingCart,
  Calendar,
  User,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import EditProductModal from "./EditProductModal"; // Ajustez le chemin selon votre structure

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
    const navigate = useNavigate();

  const handleSaveProduct = async (formData) => {
    try {
      const updateData = {};

      // localisation
      if (formData.localisation) {
        updateData.localisation = formData.localisation;
      }

      // stock acheté
      if (formData.stock_acheter && Number(formData.stock_acheter) > 0) {
        updateData.stock_acheter = Number(formData.stock_acheter);
      }

      // stock sorti
      if (formData.stock_sorti && Number(formData.stock_sorti) > 0) {
        updateData.stock_sorti = Number(formData.stock_sorti);
      }

      console.log("📤 Données envoyées à l'API:", updateData);

      if (Object.keys(updateData).length === 0) {
        throw new Error("Aucune donnée valide à envoyer");
      }

      const response = await fetch(
        `https://stockbackup.cosinus.ma/wp-json/wc-full-api/v1/products/${product.id}/meta`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Erreur API");
      }

      // reload produit
      const productResponse = await fetch(
        `https://stockbackup.cosinus.ma/wp-json/wc-full-api/v1/products/${product.id}`
      );
      setProduct(await productResponse.json());
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  useEffect(() => {
    // Remplacer par votre appel API réel
    const fetchProduct = async () => {
      try {
        const response = await fetch(
          `https://stockbackup.cosinus.ma/wp-json/wc-full-api/v1/products/${id}`
        );
        const data = await response.json();

        console.log(data);

        setTimeout(() => {
          setProduct(data);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error("Erreur:", error);
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const getMeta = (metaKey) => {
    const meta = product?.meta?.find((m) => m.meta_key === metaKey);
    return meta?.meta_value || "-";
  };

  const getTaxonomyValue = (taxonomy, options = {}) => {
    const { separator = ", ", fallback = "-", field = "name" } = options;

    if (!product?.taxonomies?.[taxonomy]?.terms?.length) {
      return fallback;
    }

    const values = product.taxonomies[taxonomy].terms
      .map((term) => term[field])
      .filter(Boolean);

    return values.length ? values.join(separator) : fallback;
  };

  const getStockStatusConfig = () => {
    if (product.stock_quantity > 10) {
      return {
        color: "emerald",
        bgClass: "bg-emerald-500",
        label: "En stock",
      };
    } else if (product.stock_quantity > 0) {
      return {
        color: "amber",
        bgClass: "bg-amber-500",
        label: "Stock faible",
      };
    } else {
      return {
        color: "rose",
        bgClass: "bg-rose-500",
        label: "Rupture de stock",
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Package className="w-20 h-20 text-indigo-600 animate-pulse mx-auto mb-4" />
            <div className="absolute inset-0 bg-indigo-400 blur-xl opacity-20 animate-pulse"></div>
          </div>
          <p className="text-slate-700 font-semibold text-lg">
            Chargement du produit...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-20 h-20 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Produit introuvable
          </h2>
          <p className="text-slate-600 mb-6">
            Le produit que vous recherchez n'existe pas ou a été supprimé.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatusConfig();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header avec navigation */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/90 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/", { state: { refresh: true } })}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-xl font-medium transition-all border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Retour</span>
            </button>
            <button
              className="px-4 py-2 text-slate-700 hover:text-blue-600 bg-white hover:bg-blue-50 rounded-xl font-medium transition-all border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow flex items-center gap-2"
              onClick={() => setShowEditModal(true)}
            >
              <Edit3 className="w-4 h-4" />
              <span className="hidden sm:inline">Modifier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section Hero - Images et Info principale */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Galerie d'images */}
          <div className="space-y-4">
            {/* Image principale */}
            <div
              className={`relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xl aspect-square ${
                product.images?.length > 0 ? "cursor-pointer group" : ""
              }`}
              onClick={() =>
                product.images?.length > 0 && setShowImageModal(true)
              }
            >
              {product.images?.length > 0 ? (
                <>
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <span className="text-white text-sm font-semibold bg-black/30 backdrop-blur-sm px-3 py-1 rounded-lg">
                        Cliquer pour agrandir
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                  <Package className="w-24 h-24 text-slate-300 mb-3" />
                  <span className="text-slate-400 font-medium">
                    Aucune image disponible
                  </span>
                </div>
              )}
            </div>

            {/* Miniatures */}
            {product.images?.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl border-2 overflow-hidden transition-all ${
                      selectedImage === index
                        ? "border-indigo-500 ring-4 ring-indigo-100 scale-105 shadow-lg"
                        : "border-slate-200 hover:border-indigo-300 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Vue ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informations principales */}
          <div className="space-y-6">
            {/* En-tête avec SKU et statut stock */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 rounded-xl">
                  <Package className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                    Référence
                  </p>
                  <code className="text-base font-mono font-bold text-indigo-700">
                    {product.sku}
                  </code>
                </div>
              </div>

              <div
                className={`px-5 py-2.5 rounded-full text-sm font-bold shadow-lg ${stockStatus.bgClass} text-white`}
              >
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  {stockStatus.label}: {product.stock_quantity}
                </span>
              </div>
            </div>

            {/* Titre */}
            <div className="space-y-3">
              <h1 className="text-1xl lg:text-3xl font-bold text-slate-900 leading-tight">
                {product.name}
              </h1>
            </div>
            {/* Catégories et informations compactes */}
            <div className="space-y-4">
              {/* Catégories */}
              {product.taxonomies?.product_cat?.terms?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Catégories
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.taxonomies.product_cat.terms.map((cat) => (
                      <span
                        key={cat.id}
                        className="inline-flex items-center px-4 py-2 rounded-lg bg-white border border-purple-200 text-purple-700 text-sm font-semibold hover:bg-purple-50 hover:shadow-md transition-all cursor-pointer"
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Stock à acheter (si disponible) */}
            {getMeta("_localisation_produit") !== "-" && (
              <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
                {/* Localisation */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-indigo-100 rounded-xl flex-shrink-0">
                    <MapPin className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">
                      Localisation actuelle
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {getMeta("_localisation_produit")}
                    </p>
                  </div>
                </div>

                {/* Stock à acheter - si disponible */}
                {(() => {
                  const stockAcheter = getMeta("_stock_acheter");
                  const hasStockAcheter =
                    stockAcheter &&
                    stockAcheter !== "-" &&
                    stockAcheter !== "" &&
                    parseFloat(stockAcheter) > 0;

                  return hasStockAcheter ? (
                    <>
                      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-4"></div>

                      <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-md">
                        {/* Effet de fond animé */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-40 transition-opacity"></div>

                        <div className="relative flex items-center gap-4 p-4">
                          {/* Icône */}
                          <div className="flex-shrink-0 p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <TrendingUp className="w-6 h-6 text-white" />
                          </div>

                          {/* Contenu */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">
                                Stock à acheter
                              </p>
                            </div>

                            <div className="flex items-baseline gap-2.5">
                              <span className="text-3xl font-bold text-emerald-900 tabular-nums">
                                {parseFloat(stockAcheter).toLocaleString(
                                  "fr-FR"
                                )}
                              </span>
                              <span className="text-base font-semibold text-emerald-700">
                                {getMeta("_unite_produit")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : null;
                })()}
                {/* Stock à sortie - si disponible */}
                {(() => {
                  const stockSortie = getMeta("_stock_sorti");
                  const hasStockSortie =
                    stockSortie &&
                    stockSortie !== "-" &&
                    stockSortie !== "" &&
                    parseFloat(stockSortie) > 0;

                  return hasStockSortie ? (
                    <>
                      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-4"></div>

                      <div className="group relative overflow-hidden bg-gradient-to-br from-red-50 to-teal-50 rounded-xl border-2 border-red-200 hover:border-red-300 transition-all duration-300 hover:shadow-md">
                        {/* Effet de fond animé */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-40 transition-opacity"></div>

                        <div className="relative flex items-center gap-4 p-4">
                          {/* Icône */}
                          <div className="flex-shrink-0 p-3 bg-gradient-to-br from-red-500 to-red-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <TrendingUp className="w-6 h-6 text-white" />
                          </div>

                          {/* Contenu */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs text-red-700 font-bold uppercase tracking-wider">
                                Stock sortie
                              </p>
                            </div>

                            <div className="flex items-baseline gap-2.5">
                              <span className="text-3xl font-bold text-red-900 tabular-nums">
                                {parseFloat(stockSortie).toLocaleString(
                                  "fr-FR"
                                )}
                              </span>
                              <span className="text-base font-semibold text-red-700">
                                {getMeta("_unite_produit")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : null;
                })()}
                {/* Réservation - VERSION AMÉLIORÉE */}
                {(() => {
                  // const reservation = getMeta("_reservation");
                  // const hasReservation =
                  //   reservation && reservation !== "" && reservation !== "-";

                  // return hasReservation ? (
                  //   <>
                  //     <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-4"></div>

                  //     <div className="group relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-300 hover:border-amber-400 transition-all duration-300 hover:shadow-md">
                  //       {/* Effet de fond animé */}
                  //       <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full -mr-16 -mt-16 opacity-30 group-hover:opacity-50 transition-opacity"></div>

                  //       {/* Badge "Réservé" en coin */}
                  //       <div className="absolute top-3 right-3">
                  //         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-200 text-amber-900 shadow-sm">
                  //           <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  //           Réservé
                  //         </span>
                  //       </div>

                  //       <div className="relative flex items-center gap-4 p-4">
                  //         {/* Icône */}
                  //         <div className="flex-shrink-0 p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  //           <Calendar className="w-6 h-6 text-white" />
                  //         </div>

                  //         {/* Contenu */}
                  //         <div className="flex-1 pr-16">
                  //           <div className="flex items-center gap-2 mb-1">
                  //             <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">
                  //               Réservation
                  //             </p>
                  //           </div>

                  //           <div className="flex items-center gap-2">
                  //             <p className="text-lg font-bold text-amber-900 leading-tight">
                  //               {reservation}
                  //             </p>
                  //           </div>
                  //         </div>
                  //       </div>
                  //     </div>
                  //   </>
                  // ) : null;
                })()}
              </div>
            )}
            {/* Observations (si disponible) */}
            {getMeta("_observation_produit") !== "-" &&
              getMeta("_observation_produit") !== "" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-900 mb-1">
                        Observations
                      </p>
                      <p className="text-sm text-amber-700">
                        {getMeta("_observation_produit")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Grille d'informations détaillées */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Carte Localisation */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <MapPin className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                  Localisation
                </p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {getMeta("_localisation_produit")}
                </p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
          </div>

          {/* Carte Unité */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Layers className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                  Unité de mesure
                </p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {getMeta("_unite_produit")}
                </p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
          </div>

          {/* Carte Stock restant */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Box className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                  Stock restant
                </p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {getMeta("_stock_restant") || "0"}
                </p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
          </div>

          {/* Carte Rouleaux (si disponible) */}
          {getMeta("_rouleaux_produit") !== "-" &&
            getMeta("_rouleaux_produit") !== "" && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <Package className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                      Rouleaux
                    </p>
                    <p className="text-lg font-bold text-slate-900 mt-1">
                      {getMeta("_rouleaux_produit")}
                    </p>
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
              </div>
            )}

          {/* Carte Affectation (si disponible) */}
          {getMeta("_affectation") !== "-" &&
            getMeta("_affectation") !== "" && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                      Affectation
                    </p>
                    <p className="text-lg font-bold text-slate-900 mt-1">
                      {getMeta("_affectation")}
                    </p>
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
              </div>
            )}
        </div>

        {/* Section détails et historique */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Détails produit - 2 colonnes */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Package className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Informations détaillées
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2 p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                  <Tag className="w-4 h-4" />
                  Nombre de pièces
                </div>
                <p className="text-slate-900 font-bold text-lg">
                  {getMeta("_nombre_pieces") || "-"}
                </p>
              </div>
              <div className="space-y-2 p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                  <Truck className="w-4 h-4" />
                  Fournisseur
                </div>
                <p className="text-slate-900 font-bold text-lg">
                  {getTaxonomyValue("fournisseur")}
                </p>
              </div>

              <div className="space-y-2 p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                  <Tag className="w-4 h-4" />
                  Type de produit
                </div>
                <p className="text-slate-900 font-bold text-lg">
                  {getTaxonomyValue("type_produit")}
                </p>
              </div>

              <div className="space-y-2 p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                  <Box className="w-4 h-4" />
                  Stock sorti
                </div>
                <p className="text-slate-900 font-bold text-lg">
                  {getMeta("_stock_sorti") || "-"}
                </p>
              </div>

              <div className="space-y-2 p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                  <Package className="w-4 h-4" />
                  Stock acheter
                </div>
                <p className="text-slate-900 font-bold text-lg">
                  {getMeta("_stock_acheter") || "-"}
                </p>
              </div>              
            </div>
          </div>

          {/* Historique de stock - 1 colonne */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Mouvements récents
              </h2>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {product.stock_history?.length > 0 ? (
                product.stock_history.map((history, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        history.type === "in" ? "bg-emerald-100" : "bg-rose-100"
                      }`}
                    >
                      {history.type === "in" ? (
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-rose-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-bold text-sm ${
                          history.type === "in"
                            ? "text-emerald-700"
                            : "text-rose-700"
                        }`}
                      >
                        {history.type === "in" ? "+" : "-"}
                        {history.quantity} unités
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {history.note}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <span>📅</span>
                        {history.date}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun mouvement enregistré</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Image en plein écran */}
      {showImageModal && product.images?.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          {/* Bouton fermer */}
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-sm"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Navigation gauche */}
          {product.images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage((prev) =>
                  prev === 0 ? product.images.length - 1 : prev - 1
                );
              }}
              className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-sm"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Image */}
          <img
            src={product.images[selectedImage]}
            alt={product.name}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Navigation droite */}
          {product.images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage((prev) =>
                  prev === product.images.length - 1 ? 0 : prev + 1
                );
              }}
              className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-sm"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Indicateurs de pagination */}
          {product.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {product.images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(index);
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    selectedImage === index
                      ? "bg-white scale-125 w-8"
                      : "bg-white/50 hover:bg-white/75"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
      <EditProductModal
        product={product}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveProduct}
      />
    </div>
  );
};

export default ProductDetail;
