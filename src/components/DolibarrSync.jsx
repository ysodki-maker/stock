/* eslint-disable no-empty */
/* eslint-disable no-control-regex */
/* eslint-disable no-unused-vars */
import { useState, useCallback, useRef } from "react";

// ─── Dolibarr API Helper ─────────────────────────────────────────────────────
const createDolibarrAPI = (baseUrl, apiKey) => {
  const h = { "Content-Type": "application/json", DOLAPIKEY: apiKey };
  const base = baseUrl.replace(/\/$/, "");
  const get = async (ep) => {
    const res = await fetch(`${base}/api/index.php/${ep}`, { headers: h });
    if (!res.ok) throw new Error(`GET ${ep} -> ${res.status}`);
    return res.json();
  };
  const post = async (ep, body) => {
    const res = await fetch(`${base}/api/index.php/${ep}`, {
      method: "POST", headers: h, body: JSON.stringify(body),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      const detail = e?.error?.message || e?.message || JSON.stringify(e).substring(0, 120);
      throw new Error(`[${res.status}] ${detail}`);
    }
    return res.json();
  };
  const put = async (ep, body) => {
    const res = await fetch(`${base}/api/index.php/${ep}`, {
      method: "PUT", headers: h, body: JSON.stringify(body),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      const detail = e?.error?.message || e?.message || JSON.stringify(e).substring(0, 120);
      throw new Error(`[${res.status}] ${detail}`);
    }
    return res.json();
  };
  return { get, post, put };
};

const WC_API = "https://stockbackup.cosinus.ma/wp-json/wc-full-api/v1";

// ─── Set stock via mouvement d'inventaire ────────────────────────────────────
// Dolibarr n'accepte pas stock_reel directement à la création.
// Il faut passer par /stockmovements (type 0 = entrée inventaire).
const setDolibarrStock = async (api, productId, qty) => {
  const qtyFloat = parseFloat(qty) || 0;
  if (qtyFloat <= 0) return;
  // On cherche le premier entrepôt disponible (id=0 = entrepôt par défaut)
  try {
    await api.post("stockmovements", {
      product_id: productId,
      warehouse_id: 1,       // entrepôt principal (id=1 dans la plupart des installs)
      qty: qtyFloat,
      type: 0,               // 0 = entrée / inventaire
      label: "Import Produits",
      inventorycode: `WC-IMPORT-${productId}`,
    });
  } catch (_) {
    // Fallback : essayer avec warehouse_id=0
    try {
      await api.post("stockmovements", {
        product_id: productId,
        warehouse_id: 0,
        qty: qtyFloat,
        type: 0,
        label: "Import Produits",
      });
    } catch (_2) { /* non-bloquant */ }
  }
};

// ─── Sanitize strings for Dolibarr API ───────────────────────────────────────
// Strips HTML tags, trims whitespace, removes characters that crash Dolibarr
const sanitizeText = (str) => {
  if (!str) return "";
  return str
    .replace(/<[^>]*>/g, " ")      // strip HTML tags
    .replace(/&[a-z]+;/gi, " ")    // strip HTML entities (&nbsp; etc.)
    .replace(/[\u0000-\u001F]/g, "") // strip control characters
    .trim()
    .substring(0, 255);            // Dolibarr label max length
};

const sanitizeRef = (str) => {
  if (!str) return "";
  let s = str.trim();
  // Extrait la ref entre les dernieres parentheses si present
  // ex: 'SURF KA (60.40842/01)' -> '60.40842/01'
  const match = s.match(/\(([^)]+)\)\s*$/);
  if (match) s = match[1].trim();
  // Garde / ( ) . - : valides dans Dolibarr
  return s.replace(/[\x00-\x1F]/g, "").replace(/["'\\<>{}|^`]/g, "").replace(/\s+/g, "_").trim().substring(0, 128);
};

const sanitizeDescription = (str) => {
  if (!str) return "";
  return str
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[\u0000-\u001F]/g, "")
    .trim()
    .substring(0, 2000);
};
const mapToDolibarr = (product) => {
  const rawRef = product.sku?.trim() || `WC-${product.id}`;
  return {
    ref: sanitizeRef(rawRef),
    label: sanitizeText(product.name) || `Produit-${product.id}`,
    price: parseFloat(product.price) || 0,
    price_ttc: parseFloat(product.regular_price || product.price) || 0,
    tva_tx: 20,
    type: 0,
    status: 1,
    status_buy: 1,
    description: sanitizeDescription(product.short_description || product.description || ""),
    note_public: `Import Produits ID:${product.id}`,
    array_options: {
      options_Produits_id: String(product.id),
      options_wc_category: sanitizeText(product.categories?.map((c) => c.name).join(", ") || ""),
    },
  };
};

// ─── Badge ────────────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const map = {
    pending:  { bg: "#131b2a", color: "#4a6080", label: "En attente" },
    checking: { bg: "#0d1e35", color: "#4da6ff", label: "Verification..." },
    syncing:  { bg: "#0d2240", color: "#60b0ff", label: "Envoi..." },
    created:  { bg: "#0a2018", color: "#3dd68c", label: "Cree" },
    updated:  { bg: "#122808", color: "#7ed957", label: "Mis a jour" },
    skipped:  { bg: "#131b2a", color: "#4a6080", label: "Ignore" },
    error:    { bg: "#280a0a", color: "#ff6b6b", label: "Erreur" },
    waiting:  { bg: "#1e1a08", color: "#e0b030", label: "Confirmation..." },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "2px 9px", borderRadius: 4,
      fontSize: 11, fontWeight: 600,
      border: `1px solid ${s.color}28`,
      whiteSpace: "nowrap",
    }}>{s.label}</span>
  );
};

// ─── Progress Ring ────────────────────────────────────────────────────────────
const Ring = ({ done, total }) => {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const r = 38, c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
      <svg width={100} height={100} style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id="rg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1a5cff"/>
            <stop offset="100%" stopColor="#00c9a7"/>
          </linearGradient>
        </defs>
        <circle cx={50} cy={50} r={r} fill="none" stroke="#141e30" strokeWidth={7}/>
        <circle cx={50} cy={50} r={r} fill="none" stroke="url(#rg)" strokeWidth={7}
          strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset .4s ease" }}/>
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: "#e0eeff", lineHeight: 1 }}>{pct}%</span>
        <span style={{ fontSize: 10, color: "#3a5070" }}>{done}/{total}</span>
      </div>
    </div>
  );
};

// ─── Duplicate Modal ──────────────────────────────────────────────────────────
const DuplicateModal = ({ product, existing, onDecision }) => {
  if (!product) return null;
  const wc = {
    name: product.name,
    ref: product.sku || `WC-${product.id}`,
    price: parseFloat(product.price || 0).toFixed(2),
    stock: product.stock_quantity ?? "—",
    category: product.categories?.map((c) => c.name).join(", ") || "—",
  };
  const doli = {
    name: existing?.label || "—",
    ref: existing?.ref || "—",
    price: parseFloat(existing?.price || 0).toFixed(2),
    stock: existing?.stock_reel ?? "—",
    category: existing?.array_options?.options_wc_category || "—",
  };
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(3,6,14,0.92)",
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(6px)",
    }}>
      <div style={{
        background: "#0b1220", border: "1px solid #1e3555",
        borderRadius: 14, padding: "30px 34px",
        maxWidth: 520, width: "92%",
        boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
      }}>
        <div style={{
          width: 46, height: 46, borderRadius: 10,
          background: "#1a2a10", border: "1px solid #3a5a20",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, marginBottom: 16,
        }}>⚠</div>
        <h3 style={{ margin: "0 0 4px", fontSize: 17, color: "#ddeeff", fontWeight: 800 }}>
          Doublon detecte
        </h3>
        <p style={{ margin: "0 0 22px", fontSize: 12, color: "#3a5570", lineHeight: 1.6 }}>
          Le produit <strong style={{ color: "#90b8d8" }}>{product.name}</strong> (ref: <code style={{ color: "#4da6ff" }}>{wc.ref}</code>) existe deja dans Dolibarr.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Produits", d: wc, accent: "#4da6ff" },
            { label: "Dolibarr (existant)", d: doli, accent: "#e0b030" },
          ].map(({ label, d, accent }) => (
            <div key={label} style={{
              background: "#070c16", border: `1px solid ${accent}28`,
              borderRadius: 8, padding: "14px 16px",
            }}>
              <div style={{ fontSize: 9, color: accent, fontWeight: 800, letterSpacing: "0.1em", marginBottom: 10 }}>
                {label.toUpperCase()}
              </div>
              {[["Nom", d.name], ["Ref", d.ref], ["Prix", d.price], ["Stock", d.stock], ["Categorie", d.category]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 6, fontSize: 11, lineHeight: 1.9 }}>
                  <span style={{ color: "#2a4060", minWidth: 60 }}>{k}</span>
                  <span style={{ color: "#90b0d0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <button style={{
            background: "linear-gradient(135deg,#1a5cff,#00c9a7)",
            border: "none", borderRadius: 8, color: "#fff",
            padding: "11px 0", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }} onClick={() => onDecision("update")}>
            Mettre a jour
          </button>
          <button style={{
            background: "transparent", border: "1px solid #1e3555",
            borderRadius: 8, color: "#6080a0",
            padding: "11px 0", fontSize: 13,
            cursor: "pointer", fontFamily: "inherit",
          }} onClick={() => onDecision("skip")}>
            Ignorer
          </button>
        </div>

        {/* Bulk buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button style={{
            background: "#091a0d", border: "1px solid #1a4020",
            borderRadius: 7, color: "#3dd68c",
            padding: "8px 0", fontSize: 11,
            cursor: "pointer", fontFamily: "inherit",
          }} onClick={() => onDecision("update_all")}>
            Tout mettre a jour
          </button>
          <button style={{
            background: "#0a1020", border: "1px solid #182035",
            borderRadius: 7, color: "#3a5070",
            padding: "8px 0", fontSize: 11,
            cursor: "pointer", fontFamily: "inherit",
          }} onClick={() => onDecision("skip_all")}>
            Tout ignorer
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function DolibarrSync() {
  const [dolibarrUrl, setDolibarrUrl] = useState("");
  const [apiKey, setApiKey]           = useState("");
  const [configSaved, setConfigSaved] = useState(false);
  const [testStatus, setTestStatus]   = useState(null);
  const [testMsg, setTestMsg]         = useState("");

  const [wcProducts, setWcProducts]   = useState([]);
  const [loadingWC, setLoadingWC]     = useState(false);
  const [wcError, setWcError]         = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [syncResults, setSyncResults] = useState([]);
  const [syncing, setSyncing]         = useState(false);
  const [syncDone, setSyncDone]       = useState(false);

  // Modal state
  const [modalProduct,  setModalProduct]  = useState(null);
  const [modalExisting, setModalExisting] = useState(null);
  const resolveRef     = useRef(null);
  const bulkDecRef     = useRef(null); // "update" | "skip" | null

  const abortRef = useRef(false);

  const created = syncResults.filter((r) => r.status === "created").length;
  const updated = syncResults.filter((r) => r.status === "updated").length;
  const skipped = syncResults.filter((r) => r.status === "skipped").length;
  const errored = syncResults.filter((r) => r.status === "error").length;
  const done    = syncResults.filter((r) => ["created","updated","skipped","error"].includes(r.status)).length;

  // ── Test connection ──────────────────────────────────────────────────────
  const testConnection = async () => {
    setTestStatus(null);
    try {
      const api = createDolibarrAPI(dolibarrUrl.replace(/\/$/, ""), apiKey);
      const info = await api.get("status");
      setTestStatus("ok");
      setTestMsg(`Connecte - Dolibarr v${info.dolibarr_version || "?"}`);
    } catch (e) {
      setTestStatus("error");
      setTestMsg(e.message);
    }
  };

  // ── Load WC products ─────────────────────────────────────────────────────
  const loadProducts = async () => {
    setLoadingWC(true); setWcError(""); setSyncResults([]); setSyncDone(false);
    try {
      let all = [], page = 1, totalPages = 1;
      do {
        const res = await fetch(`${WC_API}/products?page=${page}&per_page=50`);
        if (!res.ok) throw new Error("Erreur API Produits");
        const data = await res.json();
        all = [...all, ...(data.products || [])];
        totalPages = data.total_pages || 1;
        page++;
      } while (page <= totalPages);
      setWcProducts(all);
      setSelectedIds(new Set(all.map((p) => p.id)));
    } catch (e) { setWcError(e.message); }
    finally { setLoadingWC(false); }
  };

  const saveConfig  = () => { setConfigSaved(true); loadProducts(); };
  const resetConfig = () => {
    setConfigSaved(false); setWcProducts([]); setSyncResults([]);
    setSyncDone(false); bulkDecRef.current = null;
  };

  const toggleProduct = (id) => setSelectedIds((p) => {
    const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const toggleAll = () =>
    setSelectedIds(selectedIds.size === wcProducts.length
      ? new Set()
      : new Set(wcProducts.map((p) => p.id)));

  // ── Ask duplicate decision ───────────────────────────────────────────────
  const askDuplicate = (product, existing) =>
    new Promise((resolve) => {
      setModalProduct(product);
      setModalExisting(existing);
      resolveRef.current = resolve;
    });

  const handleModalDecision = (decision) => {
    setModalProduct(null);
    setModalExisting(null);
    if (decision === "update_all") { bulkDecRef.current = "update"; resolveRef.current?.("update"); }
    else if (decision === "skip_all") { bulkDecRef.current = "skip"; resolveRef.current?.("skip"); }
    else { resolveRef.current?.(decision); }
    resolveRef.current = null;
  };

  // ── Sync ─────────────────────────────────────────────────────────────────
  const startSync = useCallback(async () => {
    const api = createDolibarrAPI(dolibarrUrl.replace(/\/$/, ""), apiKey);
    const toSync = wcProducts.filter((p) => selectedIds.has(p.id));

    setSyncing(true); setSyncDone(false);
    abortRef.current = false; bulkDecRef.current = null;
    setSyncResults(toSync.map((p) => ({ id: p.id, name: p.name, status: "pending", message: "" })));

    for (let i = 0; i < toSync.length; i++) {
      if (abortRef.current) break;
      const product = toSync[i];
      const payload = mapToDolibarr(product);

      setSyncResults((prev) => prev.map((r) => r.id === product.id ? { ...r, status: "checking" } : r));

      try {
        // Look up existing product
        let existingId = null, existingData = null;
        try {
          const res = await api.get(
            `products?sqlfilters=(t.ref%3A%3D%3A'${encodeURIComponent(payload.ref)}')`
          );
          if (Array.isArray(res) && res.length > 0) {
            existingId = res[0].id; existingData = res[0];
          }
        } catch (_) {}

        let finalStatus = "created";

        if (existingId) {
          let decision = bulkDecRef.current;
          if (!decision) {
            setSyncResults((prev) => prev.map((r) => r.id === product.id ? { ...r, status: "waiting" } : r));
            decision = await askDuplicate(product, existingData);
          }

          setSyncResults((prev) => prev.map((r) => r.id === product.id ? { ...r, status: "syncing" } : r));

          if (decision === "update") {
            console.log("[DolibarrSync] Updating ref:", payload.ref, "| raw SKU:", product.sku);
            await api.put(`products/${existingId}`, payload);
            const qty = parseFloat(product.stock_quantity) || 0;
            if (qty > 0) {
              await setDolibarrStock(api, existingId, qty);
            }
            finalStatus = "updated";
          } else {
            finalStatus = "skipped";
          }
        } else {
          setSyncResults((prev) => prev.map((r) => r.id === product.id ? { ...r, status: "syncing" } : r));
          console.log("[DolibarrSync] Sending ref:", payload.ref, "| raw SKU:", product.sku);
          const newId = await api.post("products", payload);
          const qty = parseFloat(product.stock_quantity) || 0;
          if (newId && qty > 0) {
            await setDolibarrStock(api, newId, qty);
          }
          finalStatus = "created";
        }

        setSyncResults((prev) => prev.map((r) => r.id === product.id ? { ...r, status: finalStatus } : r));
      } catch (err) {
        setSyncResults((prev) => prev.map((r) =>
          r.id === product.id ? { ...r, status: "error", message: err.message } : r
        ));
      }

      await new Promise((r) => setTimeout(r, 100));
    }

    setSyncing(false); setSyncDone(true); bulkDecRef.current = null;
  }, [dolibarrUrl, apiKey, wcProducts, selectedIds]);

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh", background: "#070c15", color: "#b8cce0",
      fontFamily: "'DM Mono','Fira Code','Courier New',monospace",
      padding: "28px 20px",
    }}>
      <DuplicateModal product={modalProduct} existing={modalExisting} onDecision={handleModalDecision} />

      <div style={{ maxWidth: 980, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg,#1a5cff,#00c9a7)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
          }}>&#8644;</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#ddeeff", letterSpacing: "-0.02em" }}>
              Dolibarr
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: "#2a4060" }}>
              Nom · Prix · Categorie · SKU · Stock &mdash; confirmation des doublons
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* STEP 1 */}
          <div style={card}>
            <StepTitle n="01" label="Connexion Dolibarr" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
              <Fld label="URL Dolibarr">
                <input style={inp} placeholder="https://erp.monsite.com"
                  value={dolibarrUrl} onChange={(e) => setDolibarrUrl(e.target.value)} disabled={configSaved}/>
              </Fld>
              <Fld label="Cle API (DOLAPIKEY)">
                <input style={inp} type="password" placeholder="••••••••••••••••••••"
                  value={apiKey} onChange={(e) => setApiKey(e.target.value)} disabled={configSaved}/>
              </Fld>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
              <button style={bSec} onClick={testConnection} disabled={!dolibarrUrl || !apiKey}>
                Tester la connexion
              </button>
              <button style={bPri} onClick={saveConfig} disabled={!dolibarrUrl || !apiKey || configSaved}>
                {configSaved ? "Configure" : "Valider & Charger les produits"}
              </button>
              {configSaved && <button style={bGho} onClick={resetConfig}>Modifier</button>}
            </div>
            {testStatus && (
              <div style={{
                marginTop: 10, padding: "8px 14px", borderRadius: 6, fontSize: 12,
                background: testStatus === "ok" ? "#092018" : "#200909",
                border: `1px solid ${testStatus === "ok" ? "#1a5c3a" : "#5c1a1a"}`,
                color: testStatus === "ok" ? "#3dd68c" : "#ff7070",
              }}>
                {testStatus === "ok" ? "OK " : "Echec "}{testMsg}
              </div>
            )}
          </div>

          {/* STEP 2 */}
          {configSaved && (
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <StepTitle n="02" label={`Produits${wcProducts.length ? ` (${wcProducts.length})` : ""}`} />
                <button style={bGho} onClick={loadProducts} disabled={loadingWC}>
                  {loadingWC ? "Chargement..." : "Recharger"}
                </button>
              </div>

              {wcError && <div style={{ ...errB, marginTop: 12 }}>{wcError}</div>}
              {loadingWC && (
                <div style={{ textAlign: "center", padding: 40, color: "#2a4060", fontSize: 13 }}>
                  Chargement de tous les produits...
                </div>
              )}

              {wcProducts.length > 0 && !loadingWC && (
                <>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12,
                    margin: "14px 0 8px", padding: "7px 12px",
                    background: "#090e1a", borderRadius: 6,
                  }}>
                    <input type="checkbox"
                      checked={selectedIds.size === wcProducts.length}
                      onChange={toggleAll}
                      style={{ accentColor: "#4da6ff", width: 14, height: 14 }}/>
                    <span style={{ fontSize: 12, color: "#2a4060" }}>
                      Tout selectionner &mdash;{" "}
                      <strong style={{ color: "#80a8c8" }}>{selectedIds.size}</strong>
                      /{wcProducts.length}
                    </span>
                  </div>

                  {/* Column headers */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "22px 34px 1fr 90px 80px 60px 120px 130px",
                    gap: 10, padding: "4px 10px",
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "#1e3550",
                    borderBottom: "1px solid #101828", marginBottom: 6,
                  }}>
                    {["","","NOM","SKU","PRIX","STOCK","CATEGORIE","STATUT"].map((h, i) => (
                      <span key={i}>{h}</span>
                    ))}
                  </div>

                  {/* Rows */}
                  <div style={{ maxHeight: 340, overflowY: "auto" }}>
                    {wcProducts.map((p) => {
                      const r = syncResults.find((s) => s.id === p.id);
                      const sel = selectedIds.has(p.id);
                      return (
                        <div key={p.id} style={{
                          display: "grid",
                          gridTemplateColumns: "22px 34px 1fr 90px 80px 60px 120px 130px",
                          alignItems: "center", gap: 10,
                          padding: "6px 10px", marginBottom: 3,
                          borderRadius: 6,
                          background: sel ? "#0b1628" : "#090e18",
                          border: `1px solid ${sel ? "#18304e" : "#0e1824"}`,
                        }}>
                          <input type="checkbox" checked={sel}
                            onChange={() => toggleProduct(p.id)}
                            style={{ accentColor: "#4da6ff" }}/>
                          <div style={{
                            width: 30, height: 30, borderRadius: 4,
                            background: "#111a28", overflow: "hidden", flexShrink: 0,
                          }}>
                            {p.images?.[0] && (
                              <img src={p.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                            )}
                          </div>
                          <span style={{ fontSize: 12, color: "#90b0cc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.name}
                          </span>
                          <span style={{ fontSize: 11, color: "#2a5070", display: "flex", flexDirection: "column", gap: 1 }}>
                            <span>{p.sku || `WC-${p.id}`}</span>
                            {p.sku && p.sku !== sanitizeRef(p.sku) && (
                              <span style={{ color: "#e0b030", fontSize: 10 }}>
                                → {sanitizeRef(p.sku)}
                              </span>
                            )}
                          </span>
                          <span style={{ fontSize: 12, color: "#50b880", fontWeight: 600 }}>
                            {parseFloat(p.price || 0).toFixed(2)}
                          </span>
                          <span style={{ fontSize: 12, color: (p.stock_quantity > 0) ? "#80b0e0" : "#2a4060" }}>
                            {p.stock_quantity ?? "—"}
                          </span>
                          <span style={{ fontSize: 11, color: "#2a4060", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.categories?.map((c) => c.name).join(", ") || "—"}
                          </span>
                          {r ? <Badge status={r.status}/> : <span/>}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {wcProducts.length > 0 && !loadingWC && (
            <div style={card}>
              <StepTitle n="03" label="Synchronisation" />

              {syncResults.length > 0 && (
                <div style={{ display: "flex", gap: 20, alignItems: "center", margin: "18px 0 14px" }}>
                  <Ring done={done} total={syncResults.length}/>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, flex: 1 }}>
                    {[
                      { label: "Crees",      value: created, color: "#3dd68c" },
                      { label: "Mis a jour", value: updated, color: "#7ed957" },
                      { label: "Ignores",    value: skipped, color: "#4a6080" },
                      { label: "Erreurs",    value: errored, color: "#ff6b6b" },
                    ].map((s) => (
                      <div key={s.label} style={{
                        background: "#090e1a", borderRadius: 7,
                        padding: "10px 12px", border: "1px solid #141e30",
                        textAlign: "center",
                      }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: "#2a4060", marginTop: 4 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {syncResults.length > 0 && (
                <div style={{ height: 3, background: "#141e30", borderRadius: 2, marginBottom: 16, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${syncResults.length > 0 ? (done / syncResults.length) * 100 : 0}%`,
                    background: "linear-gradient(90deg,#1a5cff,#00c9a7)",
                    transition: "width .3s ease",
                  }}/>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <button
                  style={{
                    ...bPri,
                    opacity: syncing || selectedIds.size === 0 ? 0.6 : 1,
                    cursor: syncing || selectedIds.size === 0 ? "not-allowed" : "pointer",
                    padding: "11px 24px", fontSize: 13,
                  }}
                  onClick={startSync}
                  disabled={syncing || selectedIds.size === 0}
                >
                  {syncing
                    ? `Synchronisation... (${done}/${syncResults.length})`
                    : syncDone
                    ? "Re-synchroniser"
                    : `Synchroniser ${selectedIds.size} produit${selectedIds.size > 1 ? "s" : ""}`}
                </button>
                {syncing && (
                  <button style={{ ...bSec, borderColor: "#602020", color: "#ff7070" }}
                    onClick={() => { abortRef.current = true; }}>
                    Arreter
                  </button>
                )}
              </div>

              {syncDone && (
                <div style={{
                  marginTop: 14, padding: "10px 16px", borderRadius: 7, fontSize: 12,
                  background: errored === 0 ? "#092018" : "#141a08",
                  border: `1px solid ${errored === 0 ? "#1a5c3a" : "#3a4a10"}`,
                  color: errored === 0 ? "#3dd68c" : "#c8c820",
                }}>
                  {errored === 0
                    ? `Termine - ${created} cree${created>1?"s":""}, ${updated} mis a jour, ${skipped} ignore${skipped>1?"s":""}.`
                    : `Termine avec ${errored} erreur${errored>1?"s":""} - ${created} crees, ${updated} mis a jour.`}
                </div>
              )}

              {errored > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 9, color: "#1e3050", letterSpacing: "0.1em", marginBottom: 6 }}>JOURNAL D'ERREURS</div>
                  {syncResults.filter((r) => r.status === "error").map((r) => (
                    <div key={r.id} style={{
                      padding: "6px 12px", marginBottom: 4,
                      background: "#180808", border: "1px solid #3a1010",
                      borderRadius: 5, fontSize: 11, color: "#ff9090",
                    }}>
                      <strong>{r.name}</strong> — {r.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: 32, fontSize: 10, color: "#182030" }}>
          Dolibarr REST API v13+ requis · DOLAPIKEY dans Parametres Securite · Stock via /products/:id/inventory
        </p>
      </div>
    </div>
  );
}

const StepTitle = ({ n, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
    <span style={{
      background: "#0d1e35", border: "1px solid #1a3a5c",
      color: "#4da6ff", fontSize: 10, fontWeight: 700,
      padding: "2px 8px", borderRadius: 4, letterSpacing: "0.05em",
    }}>{n}</span>
    <span style={{ fontSize: 14, fontWeight: 600, color: "#80a8c8" }}>{label}</span>
  </div>
);
const Fld = ({ label, children }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 11, color: "#2a4060" }}>
    {label}{children}
  </label>
);
const card = { background: "#0b1220", border: "1px solid #182840", borderRadius: 10, padding: "20px 22px" };
const inp  = { background: "#070c16", border: "1px solid #182840", borderRadius: 6, color: "#b0cce8", padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
const bPri = { background: "linear-gradient(135deg,#1a5cff,#00c9a7)", border: "none", borderRadius: 6, color: "#fff", padding: "9px 20px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
const bSec = { background: "transparent", border: "1px solid #1a3a5c", borderRadius: 6, color: "#4da6ff", padding: "8px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" };
const bGho = { background: "transparent", border: "1px solid #141e30", borderRadius: 6, color: "#2a4060", padding: "6px 12px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" };
const errB = { background: "#200a0a", border: "1px solid #5c1a1a", borderRadius: 6, color: "#ff8080", padding: "8px 14px", fontSize: 12 };
