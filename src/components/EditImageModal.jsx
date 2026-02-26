import React, { useState, useEffect, useContext, useRef } from "react";
import {
  X,
  Upload,
  Link,
  Trash2,
  ImagePlus,
  Loader2,
  Check,
  AlertCircle,
  Images,
  Star,
} from "lucide-react";
import { ProductContext } from "../context/ProductContext";

const EditImageModal = ({ product, isOpen, onClose, onImageUpdated }) => {
  const { updateProductImage } = useContext(ProductContext);

  /* ── Mode : "file" | "url" ── */
  const [mode, setMode] = useState("file");

  /* ── Fichier ── */
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  /* ── URL ── */
  const [url, setUrl] = useState("");

  /* ── Options ── */
  const [gallery, setGallery] = useState(false);

  /* ── États ── */
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  /* ── Reset à l'ouverture ── */
  useEffect(() => {
    if (!isOpen) return;
    setMode("file");
    setFile(null);
    setPreview(null);
    setUrl("");
    setGallery(false);
    setSuccess(false);
    setError("");
  }, [isOpen, product?.id]);

  /* ── Nettoyage objectURL ── */
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  /* ── Handlers fichier ── */
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    validateAndSetFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) validateAndSetFile(dropped);
  };

  const validateAndSetFile = (f) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(f.type)) {
      setError("Format non supporté. Utilisez JPEG, PNG, WEBP ou GIF.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5 Mo.");
      return;
    }
    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    const source = mode === "file" ? file : url.trim();

    if (!source) {
      setError(
        mode === "file"
          ? "Veuillez sélectionner un fichier."
          : "Veuillez saisir une URL valide.",
      );
      return;
    }

    if (mode === "url" && !/^https?:\/\/.+/.test(url.trim())) {
      setError("L'URL doit commencer par http:// ou https://");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const newImageUrl = await updateProductImage(product.id, source, {
        gallery,
      });

      // 🔥 INFORMER LE PARENT
      onImageUpdated(newImageUrl.image_url, gallery);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        handleRemoveFile();
        setUrl("");
        onClose();
      }, 1800);
    } catch (err) {
      setError(err.message || "Erreur lors de l'envoi de l'image.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentImage = product?.images?.[0];
  const galleryImages = product?.images?.slice(1) || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 px-6 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <ImagePlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Modifier l'image
                </h2>
                <p className="text-violet-200 text-xs mt-0.5 line-clamp-1">
                  {product?.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* SKU */}
          <div className="mt-3">
            <code className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-mono font-bold rounded-lg">
              {product?.sku}
            </code>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Images actuelles */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Images actuelles
            </p>

            {currentImage || galleryImages.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {/* Image principale */}
                {currentImage && (
                  <div className="relative group">
                    <img
                      src={currentImage}
                      alt="Principale"
                      className="w-20 h-20 rounded-xl object-cover border-2 border-violet-400 shadow"
                    />
                    <div className="absolute -top-2 -right-2 bg-violet-600 text-white rounded-full p-0.5 shadow">
                      <Star className="w-3 h-3" fill="currentColor" />
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">
                        Principale
                      </span>
                    </div>
                  </div>
                )}

                {/* Galerie */}
                {galleryImages.map((img, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={img}
                      alt={`Galerie ${i + 1}`}
                      className="w-20 h-20 rounded-xl object-cover border-2 border-slate-200"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">
                        Galerie {i + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <Images className="w-8 h-8 text-slate-300" />
                <p className="text-sm text-slate-400 font-medium">
                  Aucune image pour ce produit
                </p>
              </div>
            )}
          </div>

          {/* Séparateur */}
          <div className="border-t-2 border-slate-100" />

          {/* ── Zone fichier ── */}
          {mode === "file" && (
            <div>
              {!file ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-violet-300 rounded-2xl cursor-pointer bg-violet-50/50 hover:bg-violet-50 hover:border-violet-400 transition-all group"
                >
                  <div className="p-3 bg-violet-100 rounded-xl mb-3 group-hover:bg-violet-200 transition-colors">
                    <Upload className="w-7 h-7 text-violet-500" />
                  </div>
                  <span className="text-sm font-bold text-violet-600">
                    Glissez une image ou cliquez ici
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    JPEG · PNG · WEBP · GIF — max 5 Mo
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-violet-50 border-2 border-violet-200 rounded-2xl">
                  <img
                    src={preview}
                    alt="Aperçu"
                    className="w-20 h-20 rounded-xl object-cover border-2 border-violet-300 flex-shrink-0 shadow"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {(file.size / 1024).toFixed(0)} Ko ·{" "}
                      {file.type.replace("image/", "").toUpperCase()}
                    </p>
                    <div className="mt-2 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs text-emerald-600 font-semibold">
                        Prêt à l'envoi
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Zone URL ── */}
          {mode === "url" && (
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Link className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError("");
                  }}
                  placeholder="https://exemple.com/image.jpg"
                  className="w-full pl-11 pr-4 py-3.5 text-sm border-2 border-violet-200 rounded-xl focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-100 bg-violet-50/50 transition-all text-slate-900 placeholder:text-slate-300 font-medium"
                />
              </div>
              {/* Aperçu URL en temps réel */}
              {url && /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(url) && (
                <div className="flex items-center gap-3 p-3 bg-violet-50 border border-violet-200 rounded-xl">
                  <img
                    src={url}
                    alt="Aperçu URL"
                    className="w-14 h-14 rounded-lg object-cover border border-violet-200 flex-shrink-0"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <p className="text-xs text-violet-700 font-medium truncate">
                    {url}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Toggle galerie ── */}
          <div
            onClick={() => setGallery((v) => !v)}
            className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              gallery
                ? "bg-violet-50 border-violet-300"
                : "bg-slate-50 border-slate-200 hover:border-violet-200"
            }`}
          >
            <div
              className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${
                gallery ? "bg-violet-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  gallery ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Images
                  className={`w-4 h-4 ${gallery ? "text-violet-600" : "text-slate-400"}`}
                />
                <p
                  className={`text-sm font-bold ${gallery ? "text-violet-800" : "text-slate-700"}`}
                >
                  Ajouter à la galerie
                </p>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {gallery
                  ? "L'image sera ajoutée à la galerie sans toucher à l'image principale"
                  : "L'image remplacera l'image principale du produit"}
              </p>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700 font-semibold">{error}</p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="bg-slate-50 px-6 py-4 border-t-2 border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 text-slate-700 bg-white hover:bg-slate-100 rounded-xl font-semibold transition-all border-2 border-slate-200 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || success || (!file && !url.trim())}
            className={`px-8 py-3 rounded-xl font-bold transition-all duration-200 flex items-center gap-2 ${
              success
                ? "bg-emerald-500 text-white shadow-lg"
                : "bg-gradient-to-r from-violet-600 to-purple-700 text-white hover:from-violet-700 hover:to-purple-800 shadow-lg hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Envoi en cours...
              </>
            ) : success ? (
              <>
                <Check className="w-5 h-5" />
                Image enregistrée !
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                {gallery
                  ? "Ajouter à la galerie"
                  : "Remplacer l'image principale"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditImageModal;
