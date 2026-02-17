import { AlertCircle, Box, Package } from "lucide-react";
import {ProductContext} from "../context/ProductContext";
import { useContext } from "react";
export default function StatsBar() {
    const {
        products,
        totalProducts,
        
      } = useContext(ProductContext);
  return (
    <div className="grid grid-cols-3 sm:grid-cols3 gap-4 mb-6 hidden">
      <div className="group relative overflow-hidden bg-white rounded-2xl p-5 border border-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-blue-600">
              Total Produits
            </span>
            <Package className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-900">
            {totalProducts}
          </div>
        </div>
      </div>

      <div className="group relative overflow-hidden bg-white rounded-2xl p-5 border border-emerald-100 hover:border-emerald-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-emerald-600">
              En Stock
            </span>
            <Box className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-900">
            {products.filter((p) => p.stock_quantity > 0).length}
          </div>
        </div>
      </div>

      <div className="group relative overflow-hidden bg-white rounded-2xl p-5 border border-amber-100 hover:border-amber-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-amber-600">
              Stock Faible
            </span>
            <AlertCircle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-900">
            {
              products.filter(
                (p) => p.stock_quantity > 0 && p.stock_quantity <= 10
              ).length
            }
          </div>
        </div>
      </div>
    </div>
  );
}




