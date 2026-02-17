export default function Error({error}) {
  return (
    <div className="mb-6 p-5 bg-gradient-to-r from-rose-50 to-red-50 border-2 border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 shadow-lg">
      <AlertCircle className="w-6 h-6 flex-shrink-0" />
      <p className="font-semibold text-sm">{error}</p>
    </div>
  );
}
