import React, { useState, useEffect, useContext } from "react";
import { X, Layers, Package, RotateCcw, FileText, Save } from "lucide-react";
import { ProductContext } from "../context/ProductContext";

const EditDetailsModal = ({ product, isOpen, onClose, onSaved }) => {
  const { updateProductDetails } = useContext(ProductContext);

  const getMeta = (key) => {
    const m = product?.meta?.find((m) => m.meta_key === key);
    return m?.meta_value || "";
  };

  const [form, setForm] = useState({
    nombre_pieces: "",
    unite_produit: "",
    rouleaux_produit: "",
    observation_produit: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (product && isOpen) {
      setForm({
        nombre_pieces:       getMeta("_nombre_pieces"),
        unite_produit:       getMeta("_unite_produit"),
        rouleaux_produit:    getMeta("_rouleaux_produit"),
        observation_produit: getMeta("_observation_produit"),
      });
      setError(null);
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

//   const handleSubmit = async () => {
//     setError(null);
//     setSaving(true);

//     const payload = {};
//     if (form.nombre_pieces !== "")       payload.nombre_pieces       = form.nombre_pieces;
//     if (form.unite_produit !== "")       payload.unite_produit       = form.unite_produit;
//     if (form.rouleaux_produit !== "")    payload.rouleaux_produit    = form.rouleaux_produit;
//     if (form.observation_produit !== "") payload.observation_produit = form.observation_produit;

//     if (Object.keys(payload).length === 0) {
//       setError("Veuillez renseigner au moins un champ.");
//       setSaving(false);
//       return;
//     }

//     try {
//       await updateProductDetails(product.id, payload);
//       onSaved?.(payload);
//       onClose();
//     } catch (err) {
//       setError(err.message || "Erreur lors de la sauvegarde.");
//     } finally {
//       setSaving(false);
//     }
//   };
const handleSubmit = async () => {
    setError(null);
    setSaving(true);

    // ✅ On envoie tous les champs, même vides
    const payload = {
        nombre_pieces:       form.nombre_pieces,
        unite_produit:       form.unite_produit,
        rouleaux_produit:    form.rouleaux_produit,
        observation_produit: form.observation_produit,
    };

    try {
        await updateProductDetails(product.id, payload);
        onSaved?.(payload);
        onClose();
    } catch (err) {
        setError(err.message || "Erreur lors de la sauvegarde.");
    } finally {
        setSaving(false);
    }
};
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{ background: "#fff", boxShadow: "0 25px 60px rgba(0,0,0,0.18)" }}
      >
        {/* ── Header ── */}
        <div
          className="px-6 pt-6 pb-4"
          style={{
            background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
            borderBottom: "1px solid #e0e7ff",
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Modifier les détails
              </h2>
              <p className="text-xs font-semibold text-indigo-400 mt-0.5 uppercase tracking-widest">
                {product?.name || ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
              style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1" }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 flex flex-col gap-4" style={{ background: "#f8fafc" }}>

          {/* Nombre de pièces */}
          <SectionCard
            icon={<Layers size={18} className="text-indigo-500" />}
            iconBg="#eef2ff"
            label="UGS Interne"
            labelColor="#6366f1"
          >
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                name="nombre_pieces"
                value={form.nombre_pieces}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="0.01"
                className="flex-1 text-2xl font-bold text-slate-800 bg-transparent border-none outline-none"
                style={{ minWidth: 0 }}
              />
              <span className="text-sm font-semibold text-indigo-400">pièces</span>
            </div>
          </SectionCard>

          {/* Unité produit */}
          <SectionCard
            icon={<Package size={18} className="text-violet-500" />}
            iconBg="#f3e8ff"
            label="UNITÉ PRODUIT"
            labelColor="#7c3aed"
          >
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                name="unite_produit"
                value={form.unite_produit}
                onChange={handleChange}
                placeholder="ex: m²"
                className="flex-1 text-2xl font-bold text-slate-800 bg-transparent border-none outline-none"
                style={{ minWidth: 0 }}
              />
            </div>
          </SectionCard>

          {/* Rouleaux */}
          <SectionCard
            icon={<RotateCcw size={18} className="text-emerald-500" />}
            iconBg="#ecfdf5"
            label="ROULEAUX"
            labelColor="#059669"
          >
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                name="rouleaux_produit"
                value={form.rouleaux_produit}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="0.01"
                className="flex-1 text-2xl font-bold text-slate-800 bg-transparent border-none outline-none"
                style={{ minWidth: 0 }}
              />
              <span className="text-sm font-semibold text-emerald-400">roul.</span>
            </div>
          </SectionCard>

          {/* Observation */}
          <SectionCard
            icon={<FileText size={18} className="text-amber-500" />}
            iconBg="#fffbeb"
            label="OBSERVATION"
            labelColor="#d97706"
          >
            <textarea
              name="observation_produit"
              value={form.observation_produit}
              onChange={handleChange}
              rows={3}
              placeholder="Remarques, notes…"
              className="w-full mt-2 text-sm text-slate-700 bg-transparent border-none outline-none resize-none"
              style={{ fontFamily: "inherit" }}
            />
          </SectionCard>

          {/* Erreur */}
          {error && (
            <p className="text-sm text-rose-500 text-center">{error}</p>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="px-6 py-4 flex gap-3"
          style={{ background: "#fff", borderTop: "1px solid #f1f5f9" }}
        >
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 h-12 rounded-xl text-sm font-semibold text-slate-500 transition-colors"
            style={{ background: "#f1f5f9", border: "none" }}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-[2] h-12 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity"
            style={{
              background: saving
                ? "#a5b4fc"
                : "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
              border: "none",
              opacity: saving ? 0.8 : 1,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            <Save size={16} />
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* Carte de section réutilisable */
const SectionCard = ({ icon, iconBg, label, labelColor, children }) => (
  <div
    className="rounded-2xl px-4 py-3"
    style={{
      background: "#fff",
      border: "1.5px solid #e2e8f0",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}
  >
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <span
        className="text-xs font-bold tracking-widest"
        style={{ color: labelColor }}
      >
        {label}
      </span>
    </div>
    {children}
  </div>
);

export default EditDetailsModal;
