import {Eye, Loader2, MapPin, Package } from "lucide-react";
import { useContext } from "react";
import { ProductContext } from "../context/ProductContext";
import { useNavigate } from "react-router-dom";
export default function GridProducts({ filteredProducts, getMeta }) {
  const { loading } = useContext(ProductContext);
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {loading ? (
        <div className="col-span-full flex flex-col items-center justify-center py-24">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
          <p className="text-slate-600 font-semibold text-base">
            Chargement des données...
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center py-24">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
            <Package className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-700 font-bold text-lg mb-2">
            Aucun produit trouvé
          </p>
          <p className="text-slate-500 text-sm">
            Essayez de modifier vos critères de recherche
          </p>
        </div>
      ) : (
        filteredProducts.map((product) => (
          <div
            key={product.id}
            className="group bg-white rounded-2xl border-2 border-slate-200 hover:border-indigo-300 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
          >
            {/* Image du produit */}
            <div className="relative h-64 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-20 h-20 text-slate-300" />
                </div>
              )}

              {/* Badge Stock */}
              <div className="absolute top-4 right-4">
                <div
                  className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm ${
                    product.stock_quantity > 10
                      ? "bg-emerald-500/90 text-white"
                      : product.stock_quantity > 0
                      ? "bg-amber-500/90 text-white"
                      : "bg-rose-500/90 text-white"
                  }`}
                >
                  Stock: {product.stock_quantity ?? 0}
                </div>
              </div>

              {/* Actions overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4 gap-2">
                <button
                  className="p-3 bg-white/90 hover:bg-white rounded-xl transition-all shadow-lg hover:scale-110"
                  title="Voir"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <Eye className="w-5 h-5 text-indigo-600" />
                </button>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-5">
              {/* SKU */}
              <code className="inline-block text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 mb-3">
                {product.sku || "N/A"}
              </code>

              {/* Nom du produit */}
              <h3 className="font-bold text-slate-900 text-base mb-3 line-clamp-2 group-hover:text-indigo-700 transition-colors">
                {product.name}
              </h3>

              {/* Détails */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Localisation
                  </span>
                  <span className="font-semibold text-slate-700">
                    {getMeta(product, "_localisation_produit")}
                  </span>
                </div>
              </div>

              {/* Catégories */}
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                {product.taxonomies?.product_cat?.terms
                  ?.slice(0, 2)
                  .map((cat) => (
                    <span
                      key={cat.id}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 text-xs font-semibold border border-purple-200"
                    >
                      {cat.name}
                    </span>
                  )) || (
                  <span className="text-slate-400 text-xs">Sans catégorie</span>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
