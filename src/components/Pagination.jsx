import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  previousPage,
  page,
  totalPages,
  goToPage,
  nextPage
}) {
  return (
    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 my-7">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={previousPage}
            disabled={page === 1}
            className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>

          <div className="flex items-center gap-1">
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`min-w-[36px] h-9 rounded-lg font-semibold text-sm transition-all ${
                    page === pageNum
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white border border-transparent hover:border-slate-200"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={nextPage}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="text-sm text-slate-600">
          Page <span className="font-bold text-slate-900">{page}</span> /{" "}
          <span className="font-bold text-slate-900">{totalPages}</span>
        </div>
      </div>
    </div>
  );
}
