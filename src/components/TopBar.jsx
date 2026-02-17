import { Package, TrendingUp } from "lucide-react";
import Switcher from "./Switcher";

export default function TopBar({viewMode,setViewMode}) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl blur opacity-50"></div>
          <div className="relative w-14 h-14 bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Package className="w-7 h-7 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700">
            Gestion Stock MGW
          </h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Gestion complète de votre catalogue
          </p>
        </div>
      </div>

      <Switcher viewMode={viewMode} setViewMode={setViewMode} />
    </div>
  );
}
