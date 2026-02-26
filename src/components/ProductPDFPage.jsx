/* eslint-disable no-unused-vars */
import React, { useState, useContext, useEffect, useRef } from "react";
import {
  FileDown, Loader2, Search, CheckSquare, Square,
  FileText, Package, ChevronDown, ChevronUp, X, AlertCircle, ImageOff, Sparkles, Filter,
} from "lucide-react";
import { ProductContext } from "../context/ProductContext";
import jsPDF from "jspdf";

/* ═══════════════════════════════════════════════════════
   LAYOUT — A4 Portrait 210 × 297 mm
   Header | Image pleine largeur | Specs 2 colonnes | Stock+Prix | Footer
═══════════════════════════════════════════════════════ */
const PW = 210;
const PH = 297;
const M  = 0;

/* ═══════════════════════════════════════════════════════
   PALETTE — Luxury Dark
═══════════════════════════════════════════════════════ */
const C = {
  ink:        [18,  16,  14],
  charcoal:   [32,  30,  28],
  warm:       [55,  50,  45],
  stone:      [110, 105, 98],
  silver:     [168, 162, 155],
  sand:       [210, 204, 196],
  cream:      [245, 241, 235],
  ivory:      [252, 250, 246],
  gold:       [184, 148, 88],
  goldLight:  [212, 180, 118],
  white:      [255, 255, 255],
  divider:    [220, 215, 207],
  rowA:       [248, 246, 242],
  rowB:       [255, 255, 255],
};

/* ═══════════════════════════════════════════════════════
   PROXY IMAGE
═══════════════════════════════════════════════════════ */
const WP_UPLOADS = "https://stockbackup.cosinus.ma/wp-content/uploads";
const PROXY_BASE  = "/wp-images";
const toProxyUrl  = (url) => (!url ? null : url.startsWith(WP_UPLOADS) ? url.replace(WP_UPLOADS, PROXY_BASE) : url);

const loadImage = (originalUrl) =>
  new Promise((resolve) => {
    if (!originalUrl) return resolve(null);
    fetch(toProxyUrl(originalUrl))
      .then((r) => { if (!r.ok) throw new Error(); return r.blob(); })
      .then((blob) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const c = document.createElement("canvas");
            c.width = img.naturalWidth; c.height = img.naturalHeight;
            c.getContext("2d").drawImage(img, 0, 0);
            resolve({ b64: c.toDataURL("image/jpeg", 0.95), w: img.naturalWidth, h: img.naturalHeight });
          };
          img.onerror = () => resolve(null);
          img.src = e.target.result;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      })
      .catch(() => resolve(null));
  });

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
const sf  = (doc, rgb) => doc.setFillColor(...rgb);
const ss  = (doc, rgb) => doc.setDrawColor(...rgb);
const st  = (doc, rgb) => doc.setTextColor(...rgb);
const getTax   = (p, k) => p?.taxonomies?.[k]?.terms?.length ? p.taxonomies[k].terms.map((x) => x.name).join(", ") : null;
const getMeta  = (p, k) => p?.meta?.find((m) => m.meta_key === k)?.meta_value || null;
const stripHtml= (s)    => s ? s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "";
const val      = (v)    => (v !== null && v !== undefined && String(v).trim() !== "") ? String(v) : null;

/* ═══════════════════════════════════════════════════════
   DRAW QR-LIKE BLOCK (decorative reference stamp)
═══════════════════════════════════════════════════════ */
const drawRefStamp = (doc, x, y, sku) => {
  const w = 22, h = 8;
  sf(doc, C.ink); doc.rect(x, y, w, h, "F");
  doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); st(doc, C.gold);
  doc.text("RÉF.", x + 1.5, y + 2.8);
  st(doc, C.white);
  doc.setFontSize(6.5); doc.setFont("courier", "bold");
  const skuShort = (sku || "—").slice(0, 12);
  doc.text(skuShort, x + 1.5, y + 6.2);
};

/* ═══════════════════════════════════════════════════════
   DESSIN PAGE PDF — Portrait A4 — Image en haut, infos en bas
═══════════════════════════════════════════════════════ */
const drawPage = async (doc, p, idx, total, opts) => {
  const { showPrice, showDimensions } = opts;

  const PAD       = 8;    // marge intérieure globale
  const HEADER_H  = 14;
  const FOOTER_H  = 9;
  const FOOTER_Y  = PH - FOOTER_H;

  /* ════ FOND GLOBAL ════ */
  sf(doc, C.ivory); doc.rect(0, 0, PW, PH, "F");

  /* ════ HEADER ════ */
  sf(doc, C.ink); doc.rect(0, 0, PW, HEADER_H, "F");
  sf(doc, C.gold); doc.rect(0, HEADER_H - 0.8, PW, 0.8, "F");

  /* Branding gauche */
  doc.setFontSize(7); doc.setFont("helvetica", "bold"); st(doc, C.gold);
  doc.text("CATALOGUE PRODUITS", PAD, 5.5);
  doc.setFontSize(5); doc.setFont("helvetica", "normal"); st(doc, C.silver);
  doc.text(new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }), PAD, 10);

  /* Fiche N/total droite */
  doc.setFontSize(6); doc.setFont("helvetica", "normal"); st(doc, C.silver);
  doc.text(`FICHE  ${idx + 1} / ${total}`, PW - PAD, 5.5, { align: "right" });
  doc.setFontSize(5); st(doc, C.sand);
  const cat0 = getTax(p, "product_cat");
  doc.text(`${cat0 ? cat0 + "  ·  " : ""}${p.sku || ""}`, PW - PAD, 10, { align: "right" });

  /* ════ BLOC NOM PRODUIT (sous header) ════ */
  const NAME_H = 14;
  const NAME_Y = HEADER_H;
  sf(doc, C.charcoal); doc.rect(0, NAME_Y, PW, NAME_H, "F");
  sf(doc, C.gold); doc.rect(0, NAME_Y + NAME_H - 0.5, PW, 0.5, "F");

  doc.setFontSize(11); doc.setFont("helvetica", "bold"); st(doc, C.ivory);
  const nameLines = doc.splitTextToSize(p.name || "Produit", PW - PAD * 2);
  doc.text(nameLines[0], PAD, NAME_Y + 9.5);

  /* SKU badge */
  const skuTxt = p.sku || "";
  if (skuTxt) {
    const skuW = doc.getTextWidth(skuTxt) * 0.75 + 6;
    sf(doc, C.gold);
    doc.roundedRect(PW - PAD - skuW, NAME_Y + 4, skuW, 6, 1, 1, "F");
    doc.setFontSize(5.5); doc.setFont("courier", "bold"); st(doc, C.ink);
    doc.text(skuTxt, PW - PAD - skuW / 2, NAME_Y + 8.2, { align: "center" });
  }

  /* ════ ZONE IMAGE — pleine largeur ════ */
  const IMG_Y = NAME_Y + NAME_H;
  const IMG_H = 95;   // grande image ~95mm de hauteur

  sf(doc, C.cream); doc.rect(0, IMG_Y, PW, IMG_H, "F");

  const imgData = await loadImage(p?.images?.[0]);
  if (imgData?.b64) {
    const IPAD  = 6;
    const maxW  = PW - IPAD * 2;
    const maxH  = IMG_H - IPAD * 2;
    const r     = Math.min(maxW / imgData.w, maxH / imgData.h);
    const dW    = imgData.w * r;
    const dH    = imgData.h * r;
    const dX    = IPAD + (maxW - dW) / 2;
    const dY    = IMG_Y + IPAD + (maxH - dH) / 2;
    doc.addImage(imgData.b64, "JPEG", dX, dY, dW, dH, undefined, "FAST");
  } else {
    doc.setFontSize(9); doc.setFont("helvetica", "italic"); st(doc, C.silver);
    doc.text("Aucune image disponible", PW / 2, IMG_Y + IMG_H / 2, { align: "center" });
  }

  /* Stamp SKU sur l'image */
  drawRefStamp(doc, PAD, IMG_Y + IMG_H - 10, p.sku);

  /* Ligne d'or séparatrice image / infos */
  sf(doc, C.gold); doc.rect(0, IMG_Y + IMG_H, PW, 0.8, "F");

  /* ════ ZONE INFOS ════ */
  const INFO_Y  = IMG_Y + IMG_H + 0.8;
  const BOT_H   = 28;   // hauteur fixe bloc stock + prix en bas
  const BOT_Y   = FOOTER_Y - BOT_H;
  const SPEC_Y  = INFO_Y;
  const SPEC_H  = BOT_Y - SPEC_Y;

  /* Fond blanc zone infos */
  sf(doc, C.white); doc.rect(0, INFO_Y, PW, FOOTER_Y - INFO_Y, "F");

  /* ── Données ── */
  const category    = getTax(p, "product_cat");
  const typeProd    = getTax(p, "type_produit");
  const fournisseur = getTax(p, "fournisseur");
  const design      = getTax(p, "design");
  const couleur     = getTax(p, "couleur");
  const localisation= getMeta(p, "_localisation_produit");
  const stockQty    = p.stock_quantity ?? 0;
  const unite       = val(getMeta(p, "_unite_produit") || getMeta(p, "_unite_produit") || getTax(p, "_unite_produit"));
  const nbrPiece    = val(getMeta(p, "_nombre_pieces") || getMeta(p, "_nombre_pieces"));
  const rouleaux    = val(getMeta(p, "_rouleaux_produit") || getMeta(p, "_rouleaux_produit") || getMeta(p, "_rouleaux_produit"));
  const { length: dl, width: dw, height: dh } = p.dimensions || {};
  const specs = [
    { label: "Catégorie",      value: category },
    { label: "Type",           value: typeProd },
    { label: "Fournisseur",    value: fournisseur },
    { label: "Localisation",   value: localisation },
    { label: "Design",         value: design },
    { label: "Couleur",        value: couleur },
    { label: "Nbre de pièces", value: nbrPiece },
    { label: "Unité",          value: unite },
    { label: "Rouleaux",       value: rouleaux },
    showDimensions && (dl||dw||dh) && { label: "Dimensions", value: `${dl||"—"} × ${dw||"—"} × ${dh||"—"} cm` },
    showDimensions && p.weight && { label: "Poids", value: `${p.weight} kg` },
  ].filter(Boolean).filter((f) => f.value);

  /* ── Layout 2 colonnes pour les specs ── */
  const nCols   = 2;
  const colW    = (PW - PAD * 2 - 4) / nCols;  // largeur d'une colonne
  const LABEL_W = 26;
  const nRows   = Math.ceil(specs.length / nCols);
  const ROW_H   = Math.min(10.5, Math.max(7, (SPEC_H - 10) / nRows));

  /* Titre SPÉCIFICATIONS */
  let sy = SPEC_Y + 5;
  doc.setFontSize(6); doc.setFont("helvetica", "bold"); st(doc, C.gold);
  doc.text("SPÉCIFICATIONS", PAD, sy);
  sy += 3;
  sf(doc, C.gold); doc.rect(PAD, sy, PW - PAD * 2, 0.4, "F");
  sy += 3;

  specs.forEach((spec, i) => {
    const col  = i % nCols;
    const row  = Math.floor(i / nCols);
    const x    = PAD + col * (colW + 4);
    const y    = sy + row * ROW_H;

    if (y + ROW_H > BOT_Y - 1) return;

    /* Fond alterné par ligne */
    if (row % 2 === 0) {
      sf(doc, C.rowA);
      doc.rect(x, y, colW, ROW_H, "F");
    }

    /* Accent gauche */
    sf(doc, C.gold); doc.rect(x, y, 1.5, ROW_H, "F");

    const midY = y + ROW_H / 2 + 1.8;

    /* Label */
    doc.setFontSize(5.5); doc.setFont("helvetica", "normal"); st(doc, C.stone);
    doc.text(spec.label.toUpperCase(), x + 3, midY);

    /* Séparateur */
    sf(doc, C.divider); doc.rect(x + LABEL_W, y + 1, 0.2, ROW_H - 2, "F");

    /* Valeur */
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); st(doc, C.ink);
    const valLines = doc.splitTextToSize(String(spec.value), colW - LABEL_W - 5);
    doc.text(valLines[0], x + LABEL_W + 3, midY);

    /* Bordure basse */
    sf(doc, C.divider); doc.rect(x, y + ROW_H, colW, 0.15, "F");
  });

  /* ════ BLOC STOCK + PRIX — ancré en bas ════ */
  sf(doc, C.gold); doc.rect(0, BOT_Y, PW, 0.6, "F");

  const stockColor = stockQty > 10 ? [42, 148, 96] : stockQty > 0 ? [194, 134, 38] : [192, 68, 68];
  const stockBg    = stockColor.map(v => Math.round(v * 0.08 + 255 * 0.92));
  const HAS_PRICE  = showPrice && !!p.price;

  if (HAS_PRICE) {
    const HALF = PW / 2;

    /* — Stock gauche — */
    sf(doc, stockBg); doc.rect(0, BOT_Y + 0.6, HALF, BOT_H, "F");
    sf(doc, stockColor); doc.rect(0, BOT_Y + 0.6, 4, BOT_H, "F");

    doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); st(doc, stockColor);
    doc.text("STOCK ACTUEL", 7, BOT_Y + 8);

    doc.setFontSize(24); doc.setFont("helvetica", "bold"); st(doc, stockColor);
    doc.text(String(stockQty), 7, BOT_Y + 23);

    if (unite) {
      doc.setFontSize(7); doc.setFont("helvetica", "normal"); st(doc, C.stone);
      doc.text(unite, 7 + doc.getTextWidth(String(stockQty)) * 1.18 + 1, BOT_Y + 23);
    }

    /* Séparateur vertical or */
    sf(doc, C.gold); doc.rect(HALF, BOT_Y + 0.6, 0.6, BOT_H, "F");

    /* — Prix droite — */
    sf(doc, C.ink); doc.rect(HALF + 0.6, BOT_Y + 0.6, HALF - 0.6, BOT_H, "F");

    doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); st(doc, C.gold);
    doc.text("PRIX UNITAIRE HT", HALF + 7, BOT_Y + 8);

    const priceStr = parseFloat(p.price).toFixed(2);
    doc.setFontSize(24); doc.setFont("helvetica", "bold"); st(doc, C.ivory);
    doc.text(priceStr, HALF + 7, BOT_Y + 23);
    doc.setFontSize(10); doc.setFont("helvetica", "normal"); st(doc, C.silver);
    doc.text("DH", HALF + 7 + doc.getTextWidth(priceStr) * 1.18 + 2, BOT_Y + 23);

  } else {
    /* Stock pleine largeur */
    sf(doc, stockBg); doc.rect(0, BOT_Y + 0.6, PW, BOT_H, "F");
    sf(doc, stockColor); doc.rect(0, BOT_Y + 0.6, 4, BOT_H, "F");

    doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); st(doc, stockColor);
    doc.text("STOCK ACTUEL", 7, BOT_Y + 8);

    doc.setFontSize(26); doc.setFont("helvetica", "bold"); st(doc, stockColor);
    doc.text(String(stockQty), 7, BOT_Y + 24);

    if (unite) {
      doc.setFontSize(8); doc.setFont("helvetica", "normal"); st(doc, C.stone);
      doc.text(unite, 7 + doc.getTextWidth(String(stockQty)) * 1.18 + 2, BOT_Y + 24);
    }
  }

  /* ════ FOOTER ════ */
  sf(doc, C.ink); doc.rect(0, FOOTER_Y, PW, FOOTER_H, "F");
  sf(doc, C.gold); doc.rect(0, FOOTER_Y, PW, 0.4, "F");

  const desc = stripHtml(p.short_description);
  if (desc) {
    doc.setFontSize(5); doc.setFont("helvetica", "italic"); st(doc, C.silver);
    const dl2 = doc.splitTextToSize(desc, PW * 0.6);
    doc.text(dl2[0], PAD, FOOTER_Y + 5.5);
  }
  doc.setFontSize(5); doc.setFont("helvetica", "normal"); st(doc, C.stone);
  doc.text("stockbackup.cosinus.ma", PW / 2, FOOTER_Y + 5.5, { align: "center" });

  doc.setFontSize(5); doc.setFont("helvetica", "normal"); st(doc, C.silver);
  doc.text(`${idx + 1} / ${total}`, PW - PAD, FOOTER_Y + 5.5, { align: "right" });
};

/* ═══════════════════════════════════════════════════════
   GÉNÉRATION PDF
═══════════════════════════════════════════════════════ */
const generatePDF = async (products, opts = {}) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const o   = { showPrice: true, showDimensions: true, companyName: "Cosinus", ...opts };
  for (let i = 0; i < products.length; i++) {
    if (i > 0) doc.addPage();
    await drawPage(doc, products[i], i, products.length, o);
  }
  return doc;
};

/* ═══════════════════════════════════════════════════════
   COMPOSANT REACT — Luxury Catalog UI
═══════════════════════════════════════════════════════ */

/* Inject CSS for fonts & animations */
const injectStyles = () => {
  if (document.getElementById("pdf-luxury-styles")) return;
  const s = document.createElement("style");
  s.id = "pdf-luxury-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');

    .lux-root { font-family: 'DM Sans', sans-serif; }
    .lux-display { font-family: 'Playfair Display', serif; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes pulse-gold {
      0%, 100% { box-shadow: 0 0 0 0 rgba(184,148,88,0.4); }
      50%       { box-shadow: 0 0 0 6px rgba(184,148,88,0); }
    }

    .lux-card {
      animation: fadeUp 0.2s ease both;
    }

    .gold-shimmer {
      background: linear-gradient(90deg, #b89458, #e8d4a0, #b89458);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: shimmer 3s linear infinite;
    }

    .lux-btn-primary {
      background: linear-gradient(135deg, #b89458, #d4a76a, #b89458);
      background-size: 200% auto;
      transition: background-position 0.4s, transform 0.15s, box-shadow 0.3s;
    }
    .lux-btn-primary:hover {
      background-position: right center;
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(184,148,88,0.45);
    }
    .lux-btn-primary:active { transform: translateY(0); }

    .lux-checkbox-sel { animation: pulse-gold 1.5s ease 1; }

    .lux-input:focus {
      border-color: #b89458 !important;
      box-shadow: 0 0 0 3px rgba(184,148,88,0.18) !important;
      outline: none;
    }

    .lux-product-card {
      transition: box-shadow 0.2s, border-color 0.2s, transform 0.15s;
    }
    .lux-product-card:hover {
      box-shadow: 0 6px 28px rgba(0,0,0,0.09);
      transform: translateY(-1px);
    }
    .lux-product-card.selected {
      border-color: #b89458;
      box-shadow: 0 0 0 1px #b89458, 0 8px 32px rgba(184,148,88,0.15);
    }

    .lux-tag {
      letter-spacing: 0.06em;
      font-size: 10px;
      font-weight: 600;
    }

    .expand-panel {
      animation: fadeUp 0.2s ease both;
    }
  `;
  document.head.appendChild(s);
};

const API_BASE = "https://stockbackup.cosinus.ma/wp-json/wc-full-api/v1";

/* Récupère TOUS les produits (toutes les pages) */
const fetchAllProducts = async () => {
  const perPage = 100;
  let page = 1;
  let all  = [];
  while (true) {
    const res  = await fetch(`${API_BASE}/products?page=${page}&per_page=${perPage}`);
    if (!res.ok) throw new Error("Erreur chargement produits");
    const data = await res.json();
    const items = data.products || [];
    all = all.concat(items);
    if (page >= (data.total_pages || 1) || items.length === 0) break;
    page++;
  }
  return all;
};

const ProductPDFPage = () => {
  const { products, loading: ctxLoading, fetchProducts, totalProducts, totalPages, page, perPage, goToPage, nextPage, previousPage, changePerPage } = useContext(ProductContext);

  useEffect(() => { injectStyles(); }, []);

  const [search,         setSearch]         = useState("");
  const [selected,       setSelected]       = useState(new Set());
  const [generating,     setGenerating]     = useState(false);
  const [genProgress,    setGenProgress]    = useState("");
  const [expandedId,     setExpandedId]     = useState(null);
  const [showPrice,      setShowPrice]      = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);

  /* Recherche avec debounce — appelle l'API au lieu de filtrer localement */
  const searchTimeout = React.useRef(null);
  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchProducts(1, perPage, value);
    }, 400);
  };

  const clearSearch = () => {
    setSearch("");
    fetchProducts(1, perPage, "");
  };

  const toggle    = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll = ()   => setSelected(new Set(products.map((p) => p.id)));
  const clearAll  = ()   => setSelected(new Set());

  const handleGenerate = async () => {
    if (!selected.size) return;
    setGenerating(true);
    try {
      const selectedInPage = products.filter((p) => selected.has(p.id));
      let list;
      if (selectedInPage.length === selected.size) {
        list = selectedInPage;
      } else {
        setGenProgress("Récupération des produits...");
        const all = await fetchAllProducts();
        list = all.filter((p) => selected.has(p.id));
      }
      setGenProgress(`Génération de ${list.length} fiche${list.length > 1 ? "s" : ""}...`);
      const doc  = await generatePDF(list, { showPrice, showDimensions, companyName: "Cosinus" });
      const name = list.length === 1
        ? `fiche-${list[0].sku || list[0].id}.pdf`
        : `catalogue-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(name);
    } catch (e) { console.error(e); }
    finally { setGenerating(false); setGenProgress(""); }
  };

  return (
    <div className="lux-root min-h-screen" style={{ background: "#F5F1EB" }}>

      {/* ════════════ HEADER ════════════ */}
      <header style={{ background: "linear-gradient(160deg, #131210 0%, #1e1c18 60%, #282420 100%)" }}
        className="relative overflow-hidden px-8 pt-10 pb-8 shadow-2xl">

        {/* motif décoratif */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: "repeating-linear-gradient(45deg, #b89458 0, #b89458 1px, transparent 0, transparent 50%)",
          backgroundSize: "12px 12px",
        }} />

        {/* Ligne dorée en bas */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent, #b89458 30%, #e8d4a0 50%, #b89458 70%, transparent)" }} />

        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-6">

            {/* Branding */}
            <div className="flex items-center gap-5">
              <div style={{
                width: 56, height: 56, border: "1.5px solid rgba(184,148,88,0.5)",
                background: "rgba(184,148,88,0.08)", borderRadius: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <FileText style={{ width: 26, height: 26, color: "#b89458" }} />
              </div>
              <div>
                <h1 className="lux-display text-3xl font-black" style={{ color: "#F5F1EB", lineHeight: 1.1 }}>
                  Fiches Produits
                </h1>
                <p style={{ color: "#7a7268", fontSize: 13, marginTop: 4, letterSpacing: "0.08em" }}>
                  CATALOGUE PREMIUM · A4 PAYSAGE
                </p>
              </div>
            </div>

            {/* Bouton export */}
            {selected.size > 0 && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="lux-btn-primary flex items-center gap-3 px-7 py-3.5 rounded-2xl font-bold text-sm"
                style={{ color: "#131210", letterSpacing: "0.04em", opacity: generating ? 0.7 : 1 }}
              >
                {generating
                  ? <><Loader2 style={{ width: 18, height: 18 }} className="animate-spin" />Génération...</>
                  : <><FileDown style={{ width: 18, height: 18 }} />Exporter {selected.size} fiche{selected.size > 1 ? "s" : ""}</>}              </button>
            )}
          </div>

          {/* Options */}
          <div className="mt-7 flex flex-wrap gap-2 items-center">
            <span style={{ color: "#5a5650", fontSize: 11, letterSpacing: "0.12em", fontWeight: 700 }}
              className="uppercase mr-2">Inclure :</span>
            {[
              { label: "Prix",       s: showPrice,      set: setShowPrice },
              { label: "Dimensions", s: showDimensions, set: setShowDimensions },
            ].map(({ label, s, set }) => (
              <button
                key={label}
                onClick={() => set((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  border: s ? "1.5px solid #b89458" : "1.5px solid rgba(255,255,255,0.08)",
                  background: s ? "rgba(184,148,88,0.12)" : "transparent",
                  color: s ? "#d4a76a" : "#5a5650",
                  letterSpacing: "0.06em",
                }}
              >
                {s
                  ? <CheckSquare style={{ width: 13, height: 13, color: "#b89458" }} />
                  : <Square style={{ width: 13, height: 13 }} />}
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ════════════ BODY ════════════ */}
      <main className="max-w-5xl mx-auto px-5 py-8 space-y-4">

        {/* Barre recherche */}
        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center"
          style={{ border: "1.5px solid #e5e0d7" }}>
          <div className="relative flex-1 w-full">
            <Search style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", width: 18, height: 18, color: "#b89458" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Rechercher par nom ou référence..."
              className="lux-input w-full py-3 rounded-xl text-sm font-medium"
              style={{
                paddingLeft: 48, paddingRight: 40,
                border: "1.5px solid #e5e0d7",
                background: "#faf8f5",
                color: "#1a1814",
                fontFamily: "'DM Sans', sans-serif",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
            />
            {search && (
              <button onClick={clearSearch}
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#b0a898" }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={selectAll}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl transition-all"
              style={{ background: "#1a1814", color: "#e8d4a0", border: "none", letterSpacing: "0.04em" }}>
              Sélectionner la page
            </button>
            {selected.size > 0 && (
              <button onClick={clearAll}
                className="px-4 py-2.5 text-sm font-semibold rounded-xl transition-all"
                style={{ background: "#f5f1eb", color: "#7a7268", border: "1.5px solid #e0dbd2" }}>
                Vider ({selected.size})
              </button>
            )}
          </div>
        </div>

        {/* Banner sélection */}
        {selected.size > 0 && (
          <div className="rounded-2xl p-4 flex items-center justify-between"
            style={{
              background: "linear-gradient(135deg, #1a1814 0%, #282420 100%)",
              border: "1.5px solid rgba(184,148,88,0.3)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              animation: "fadeUp 0.2s ease both",
            }}>
            <div className="flex items-center gap-4">
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "rgba(184,148,88,0.15)", border: "1px solid rgba(184,148,88,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Package style={{ width: 18, height: 18, color: "#b89458" }} />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "#f5f1eb" }}>
                  <span className="gold-shimmer">{selected.size}</span>&nbsp;
                  produit{selected.size > 1 ? "s" : ""} sélectionné{selected.size > 1 ? "s" : ""}
                </p>
                <p style={{ color: "#5a5650", fontSize: 12 }}>
                  {selected.size} page{selected.size > 1 ? "s" : ""} A4 paysage · PDF premium
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="lux-btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
              style={{ color: "#131210", opacity: generating ? 0.7 : 1 }}
            >
              {generating
                ? <><Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />{genProgress || "Génération..."}</>
                : <><FileDown style={{ width: 16, height: 16 }} />Télécharger</>}
            </button>
          </div>
        )}

        {/* Compteur */}
        <p style={{ color: "#9a9088", fontSize: 13, paddingLeft: 2 }}>
          <span style={{ fontWeight: 700, color: "#1a1814" }}>{totalProducts}</span>
          &nbsp;produit{totalProducts !== 1 ? "s" : ""}
          {search && <span style={{ color: "#b89458" }}> · « {search} »</span>}
        </p>

        {/* ════ LISTE ════ */}
        {ctxLoading ? (
          <div className="flex flex-col items-center justify-center py-36 gap-5">
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              border: "2px solid #b89458", borderTopColor: "transparent",
              animation: "spin 0.8s linear infinite",
            }} />
            <p style={{ color: "#9a9088", fontWeight: 600 }}>Chargement du catalogue...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-36 gap-4">
            <AlertCircle style={{ width: 40, height: 40, color: "#c8c0b4" }} />
            <p style={{ color: "#9a9088", fontWeight: 600, fontSize: 17 }}>Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((product, i) => {
              const isSel = selected.has(product.id);
              const isExp = expandedId === product.id;
              const cat   = getTax(product, "product_cat");
              const loc   = getMeta(product, "_localisation_produit");
              const stock = product.stock_quantity ?? 0;
              const nbr   = getMeta(product, "_nbr_piece") || getMeta(product, "nbr_piece");
              const unite = getMeta(product, "_unite") || getMeta(product, "unite") || getTax(product, "unite");
              const rol   = getMeta(product, "_rouleaux") || getMeta(product, "rouleaux") || getMeta(product, "_nombre_rouleaux");
              const stockCol = stock > 10 ? "#3a9e6a" : stock > 0 ? "#c89030" : "#c85050";

              return (
                <div
                  key={product.id}
                  className={`lux-card lux-product-card bg-white rounded-2xl overflow-hidden ${isSel ? "selected" : ""}`}
                  style={{
                    border: isSel ? "1.5px solid #b89458" : "1.5px solid #e5e0d7",
                  }}
                >
                  {/* Barre supérieure dorée si sélectionné */}
                  {isSel && (
                    <div style={{
                      height: 2,
                      background: "linear-gradient(90deg, #b89458, #e8d4a0, #b89458)",
                    }} />
                  )}

                  <div className="flex items-center gap-4 px-4 py-3">

                    {/* Checkbox stylisé */}
                    <button
                      onClick={() => toggle(product.id)}
                      className={`flex-shrink-0 ${isSel ? "lux-checkbox-sel" : ""}`}
                      style={{
                        width: 22, height: 22, borderRadius: 7,
                        border: isSel ? "2px solid #b89458" : "2px solid #d5cfc6",
                        background: isSel ? "linear-gradient(135deg, #b89458, #d4a76a)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s",
                      }}
                    >
                      {isSel && (
                        <svg viewBox="0 0 10 8" style={{ width: 11, height: 11 }}>
                          <polyline points="1,4 3.5,6.5 9,1" style={{ fill: "none", stroke: "#131210", strokeWidth: 2, strokeLinecap: "round" }} />
                        </svg>
                      )}
                    </button>

                    {/* Miniature */}
                    <div style={{
                      flexShrink: 0, width: 52, height: 52, borderRadius: 12,
                      overflow: "hidden", border: "1.5px solid #ede9e2",
                      background: "#f5f1eb",
                    }}>
                      {product.images?.[0]
                        ? <img src={product.images[0]} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ImageOff style={{ width: 20, height: 20, color: "#c8c0b4" }} />
                          </div>}
                    </div>

                    {/* Infos */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1a1814", margin: 0 }}
                          className="truncate">
                          {product.name}
                        </h3>
                        {cat && (
                          <span className="lux-tag"
                            style={{
                              padding: "2px 9px", borderRadius: 20,
                              background: "#f0ece5", color: "#7a7268",
                              letterSpacing: "0.07em", flexShrink: 0,
                            }}>
                            {cat}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <code style={{
                          fontSize: 11, padding: "2px 8px", borderRadius: 6,
                          background: "#1a1814", color: "#b89458",
                          fontFamily: "'Courier New', monospace", fontWeight: 700,
                        }}>
                          {product.sku || "—"}
                        </code>
                        {loc && <span className="lux-tag" style={{ padding: "2px 8px", borderRadius: 6, background: "#f0ece5", color: "#6a6258" }}>{loc}</span>}
                        {nbr && <span className="lux-tag" style={{ padding: "2px 8px", borderRadius: 6, background: "#f0ece5", color: "#6a6258" }}>{nbr} pcs</span>}
                        {rol && <span className="lux-tag" style={{ padding: "2px 8px", borderRadius: 6, background: "#f0ece5", color: "#6a6258" }}>{rol} roul.</span>}
                      </div>
                    </div>

                    {/* Prix + Stock */}
                    <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
                      {product.price && (
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: 10, color: "#b0a898", fontWeight: 700, letterSpacing: "0.09em", marginBottom: 1 }}>PRIX HT</p>
                          <p style={{ fontSize: 15, fontWeight: 800, color: "#1a1814" }}>
                            {parseFloat(product.price).toFixed(2)}&nbsp;<span style={{ fontSize: 11, color: "#7a7268" }}>DH</span>
                          </p>
                        </div>
                      )}
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 10, color: "#b0a898", fontWeight: 700, letterSpacing: "0.09em", marginBottom: 1 }}>STOCK</p>
                        <p style={{ fontSize: 15, fontWeight: 800, color: stockCol }}>{stock}</p>
                      </div>
                    </div>

                    {/* Toggle expand */}
                    <button
                      onClick={() => setExpandedId(isExp ? null : product.id)}
                      style={{
                        flexShrink: 0, padding: "8px", borderRadius: 10,
                        background: isExp ? "#1a1814" : "transparent",
                        color: isExp ? "#b89458" : "#b0a898",
                        border: "none", cursor: "pointer", transition: "all 0.2s",
                      }}
                    >
                      {isExp ? <ChevronUp style={{ width: 18, height: 18 }} /> : <ChevronDown style={{ width: 18, height: 18 }} />}
                    </button>
                  </div>

                  {/* ── Panneau détails ── */}
                  {isExp && (
                    <div className="expand-panel" style={{
                      borderTop: "1.5px solid #ede9e2",
                      padding: "14px 16px 16px",
                      background: "#faf8f4",
                    }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
                        {[
                          { label: "Catégorie",      value: getTax(product, "product_cat") },
                          { label: "Fournisseur",    value: getTax(product, "fournisseur") },
                          { label: "Design",         value: getTax(product, "design") },
                          { label: "Couleur",        value: getTax(product, "couleur") },
                          { label: "Nbre de pièces", value: nbr },
                          { label: "Unité",          value: unite },
                          { label: "Rouleaux",       value: rol },
                          { label: "Localisation",   value: loc },
                        ].filter((d) => d.value).map(({ label, value }) => (
                          <div key={label} style={{
                            background: "#fff", borderRadius: 12, padding: "10px 12px",
                            border: "1.5px solid #ede9e2",
                          }}>
                            <p style={{ fontSize: 9.5, fontWeight: 700, color: "#b89458", letterSpacing: "0.1em", marginBottom: 3 }}>
                              {label.toUpperCase()}
                            </p>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1814", margin: 0 }} className="truncate">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ════ PAGINATION ════ */}
        {!ctxLoading && totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 pb-4">

            {/* Info */}
            <p style={{ fontSize: 12, color: "#9a9088" }}>
              Page <span style={{ fontWeight: 700, color: "#1a1814" }}>{page}</span> sur{" "}
              <span style={{ fontWeight: 700, color: "#1a1814" }}>{totalPages}</span>
              {totalProducts > 0 && (
                <span style={{ color: "#b0a898" }}> · {totalProducts} produits au total</span>
              )}
            </p>

            {/* Contrôles */}
            <div className="flex items-center gap-1.5">

              {/* Première page */}
              <button
                onClick={() => goToPage(1)}
                disabled={page === 1}
                style={{
                  width: 34, height: 34, borderRadius: 9, border: "1.5px solid #e5e0d7",
                  background: page === 1 ? "#f5f1eb" : "#fff",
                  color: page === 1 ? "#c8c0b4" : "#5a5650",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 13, transition: "all 0.15s",
                }}
                title="Première page"
              >
                «
              </button>

              {/* Page précédente */}
              <button
                onClick={previousPage}
                disabled={page === 1}
                style={{
                  width: 34, height: 34, borderRadius: 9, border: "1.5px solid #e5e0d7",
                  background: page === 1 ? "#f5f1eb" : "#fff",
                  color: page === 1 ? "#c8c0b4" : "#5a5650",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 13, transition: "all 0.15s",
                }}
                title="Page précédente"
              >
                ‹
              </button>

              {/* Numéros de pages */}
              {(() => {
                const pages = [];
                const delta = 2;
                const left  = Math.max(1, page - delta);
                const right = Math.min(totalPages, page + delta);

                if (left > 1) {
                  pages.push(1);
                  if (left > 2) pages.push("...");
                }
                for (let p2 = left; p2 <= right; p2++) pages.push(p2);
                if (right < totalPages) {
                  if (right < totalPages - 1) pages.push("...");
                  pages.push(totalPages);
                }

                return pages.map((p2, idx) =>
                  p2 === "..." ? (
                    <span key={`ellipsis-${idx}`}
                      style={{ width: 34, textAlign: "center", color: "#b0a898", fontSize: 13 }}>
                      …
                    </span>
                  ) : (
                    <button
                      key={p2}
                      onClick={() => goToPage(p2)}
                      style={{
                        width: 34, height: 34, borderRadius: 9,
                        border: p2 === page ? "1.5px solid #b89458" : "1.5px solid #e5e0d7",
                        background: p2 === page
                          ? "linear-gradient(135deg, #b89458, #d4a76a)"
                          : "#fff",
                        color: p2 === page ? "#131210" : "#5a5650",
                        fontWeight: p2 === page ? 800 : 500,
                        fontSize: 13, cursor: "pointer",
                        boxShadow: p2 === page ? "0 2px 8px rgba(184,148,88,0.35)" : "none",
                        transition: "all 0.15s",
                      }}
                    >
                      {p2}
                    </button>
                  )
                );
              })()}

              {/* Page suivante */}
              <button
                onClick={nextPage}
                disabled={page === totalPages}
                style={{
                  width: 34, height: 34, borderRadius: 9, border: "1.5px solid #e5e0d7",
                  background: page === totalPages ? "#f5f1eb" : "#fff",
                  color: page === totalPages ? "#c8c0b4" : "#5a5650",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 13, transition: "all 0.15s",
                }}
                title="Page suivante"
              >
                ›
              </button>

              {/* Dernière page */}
              <button
                onClick={() => goToPage(totalPages)}
                disabled={page === totalPages}
                style={{
                  width: 34, height: 34, borderRadius: 9, border: "1.5px solid #e5e0d7",
                  background: page === totalPages ? "#f5f1eb" : "#fff",
                  color: page === totalPages ? "#c8c0b4" : "#5a5650",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 13, transition: "all 0.15s",
                }}
                title="Dernière page"
              >
                »
              </button>

              {/* Sélecteur items/page */}
              <select
                value={perPage}
                onChange={(e) => changePerPage(Number(e.target.value))}
                style={{
                  marginLeft: 8, height: 34, padding: "0 10px",
                  borderRadius: 9, border: "1.5px solid #e5e0d7",
                  background: "#fff", color: "#1a1814",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  outline: "none",
                }}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>{n} / page</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </main>

      {/* ════════════ FOOTER PAGE ════════════ */}
      <footer style={{ padding: "24px 32px", textAlign: "center", borderTop: "1px solid #e0dbd2" }}>
        <p style={{ fontSize: 12, color: "#b0a898", letterSpacing: "0.06em" }}>
          CATALOGUE PRODUITS · s.cosinus.ma
        </p>
      </footer>
    </div>
  );
};

export default ProductPDFPage;

