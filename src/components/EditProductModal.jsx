/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import {
  X,
  MapPin,
  ShoppingCart,
  TrendingDown,
  Save,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";

const EditProductModal = ({ product, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    localisation: "",
    stock_acheter: "",
    stock_sorti: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !product) return;

    const currentLocalisation =
      product.meta?.find((m) => m.meta_key === "_localisation_produit")
        ?.meta_value || "";

    setFormData((prev) => {
      // empêche le setState inutile
      if (prev.localisation === currentLocalisation) {
        return prev;
      }

      return {
        localisation: currentLocalisation,
        stock_acheter: "",
        stock_sorti: "",
      };
    });

    setError("");
  }, [isOpen, product?.id]);

  const localisations = [
    { value: "Showroom", label: "Showroom" },
    { value: "En arrivage", label: "En arrivage" },
  ];

  const handleChange = (field, value) => {
    // Si on remplit stockAcheter, vider stockSortie et vice-versa
    if (field === "stock_acheter" && value) {
      setFormData((prev) => ({
        ...prev,
        stock_acheter: value,
        stock_sorti: "",
      }));
    } else if (field === "stock_sorti" && value) {
      setFormData((prev) => ({
        ...prev,
        stock_sorti: value,
        stock_acheter: "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
    setError("");
  };

  const calculateNewStock = () => {
    const current = product?.stock_quantity || 0;
    const acheter = parseInt(formData.stock_acheter) || 0;
    const sortie = parseInt(formData.stock_sorti) || 0;

    if (acheter > 0) {
      return current + acheter;
    }
    if (sortie > 0) {
      return Math.max(0, current - sortie);
    }
    return current;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.localisation) {
      setError("Veuillez sélectionner une localisation");
      return;
    }

    const acheter = parseInt(formData.stock_acheter) || 0;
    const sortie = parseInt(formData.stock_sorti) || 0;

    if (acheter === 0 && sortie === 0) {
      setError("Veuillez renseigner une quantité (achat ou sortie)");
      return;
    }

    if (sortie > product?.stock_quantity) {
      setError("La quantité de sortie ne peut pas dépasser le stock actuel");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onSave(formData);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setLoading(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-black">
                Modifier le produit
              </h2>
              <p className="text-black-100 text-sm mt-1 line-clamp-1">
                {product?.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-black" />
            </button>
          </div>

          <div className="mt-4">
            <code className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-black text-xs font-mono font-bold rounded-lg">
              {product?.sku}
            </code>
          </div>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]"
        >
          {/* Stock actuel */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                  Stock actuel
                </p>
                <p className="text-3xl font-bold text-blue-900">
                  {product?.stock_quantity || 0}
                </p>
              </div>
              <div
                className={`p-4 rounded-xl ${
                  product?.stock_quantity > 10
                    ? "bg-emerald-100"
                    : product?.stock_quantity > 0
                      ? "bg-amber-100"
                      : "bg-rose-100"
                }`}
              >
                <ShoppingCart
                  className={`w-8 h-8 ${
                    product?.stock_quantity > 10
                      ? "text-emerald-600"
                      : product?.stock_quantity > 0
                        ? "text-amber-600"
                        : "text-rose-600"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700 font-medium">{error}</p>
            </div>
          )}

          {/* Localisation */}
          <div className="space-y-3">
            <label className="block">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Localisation
                </span>
                <span className="text-rose-500 font-bold">*</span>
              </div>
              <select
                value={formData.localisation}
                onChange={(e) => handleChange("localisation", e.target.value)}
                className="w-full px-4 py-3.5 text-base border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 bg-white transition-all font-medium text-slate-900"
                required
              >
                {localisations.map((loc) => (
                  <option
                    key={loc.value}
                    value={loc.value}
                    disabled={!loc.value}
                  >
                    {loc.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Quantités */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stock à acheter */}
            <div className="space-y-3">
              <label className="block">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Stock à acheter
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.stock_acheter}
                    onChange={(e) =>
                      handleChange("stock_acheter", e.target.value)
                    }
                    placeholder="0"
                    disabled={!!formData.stock_sorti}
                    className="w-full px-4 py-3.5 text-base border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 bg-emerald-50/50 transition-all font-bold text-emerald-900 placeholder:text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600 font-semibold text-sm">
                    unités
                  </div>
                </div>
              </label>

              {formData.stockAcheter && (
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-3">
                  <p className="text-xs text-emerald-600 font-medium mb-1">
                    Nouveau stock après achat :
                  </p>
                  <p className="text-xl font-bold text-emerald-900">
                    {calculateNewStock()}
                  </p>
                </div>
              )}
            </div>

            {/* Stock de sortie */}
            <div className="space-y-3">
              <label className="block">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-rose-100 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-rose-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Stock de sortie
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={product?.stock_quantity || 0}
                    step="1"
                    value={formData.stock_sorti}
                    onChange={(e) =>
                      handleChange("stock_sorti", e.target.value)
                    }
                    placeholder="0"
                    disabled={!!formData.stock_acheter}
                    className="w-full px-4 py-3.5 text-base border-2 border-rose-200 rounded-xl focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-100 bg-rose-50/50 transition-all font-bold text-rose-900 placeholder:text-rose-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-600 font-semibold text-sm">
                    unités
                  </div>
                </div>
              </label>

              {formData.stockSortie && (
                <div className="bg-rose-50 border-2 border-rose-200 rounded-lg p-3">
                  <p className="text-xs text-rose-600 font-medium mb-1">
                    Nouveau stock après sortie :
                  </p>
                  <p className="text-xl font-bold text-rose-900">
                    {calculateNewStock()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <span className="text-lg">ℹ️</span>
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Information :</p>
                <ul className="space-y-1 list-disc list-inside text-blue-700">
                  <li>Vous ne pouvez remplir qu'un seul champ à la fois</li>
                  <li>
                    Le stock de sortie ne peut pas dépasser le stock actuel
                  </li>
                  <li>La localisation est obligatoire</li>
                </ul>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t-2 border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 text-slate-700 bg-white hover:bg-slate-100 rounded-xl font-semibold transition-all border-2 border-slate-200 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>

          <button
            onClick={handleSubmit}
            className={`px-8 py-3 rounded-xl font-bold transition-all duration-200 flex items-center gap-2 ${
              success
                ? "bg-emerald-500 text-white"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : success ? (
              <>
                <Check className="w-5 h-5" />
                <span>Enregistré !</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Enregistrer</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProductModal;
