import { LayoutGrid, Table } from "lucide-react";
export default function Switcher({ viewMode, setViewMode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 shadow-sm border-2 border-slate-200">
        <button
          onClick={() => setViewMode("table")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            viewMode === "table"
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Table className="w-4 h-4" />
          <span className="hidden sm:inline">Tableau</span>
        </button>
        <button
          onClick={() => setViewMode("grid")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            viewMode === "grid"
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="hidden sm:inline">Grille</span>
        </button>
      </div>
    </div>
  );
}
