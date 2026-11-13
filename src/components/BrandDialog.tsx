import { useEffect, useRef, useState } from "react";
import { Check, ImagePlus, Info, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Brand } from "@/lib/types";
import { PRESETS, logoColors, loadImage, normHex, type ChartTheme } from "@/lib/color";
import { askBrand, capability, inClaude, type BrandGuess } from "@/lib/claude";
import { Seg } from "./kit";

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <label className="block">
      <span className="text-[12.5px] font-semibold text-[#1c2126]">{label}</span>
      <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#d8dce1] bg-white p-1.5">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0" aria-label={`${label} color picker`} />
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const h = normHex(e.target.value);
            if (h) onChange(h);
          }}
          className="w-full bg-transparent font-mono text-[13px] uppercase text-[#1c2126] outline-none"
          aria-label={`${label} hex`}
        />
      </div>
    </label>
  );
}

async function shrinkLogo(file: File): Promise<{ dataUrl: string; w: number; h: number }> {
  const raw: string = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error("Could not read that image."));
    r.readAsDataURL(file);
  });
  const img = await loadImage(raw);
  const w = img.naturalWidth || 400;
  const h = img.naturalHeight || 160;
  if (file.type === "image/svg+xml" || Math.max(w, h) <= 800) return { dataUrl: raw, w, h };
  const s = 800 / Math.max(w, h);
  const cv = document.createElement("canvas");
  cv.width = Math.round(w * s);
  cv.height = Math.round(h * s);
  cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height);
  return { dataUrl: cv.toDataURL("image/png"), w: cv.width, h: cv.height };
}

export function BrandDialog({ open, onOpenChange, brand, setBrand, theme }: { open: boolean; onOpenChange: (v: boolean) => void; brand: Brand; setBrand: (b: Brand) => void; theme: ChartTheme }) {
  const [ai, setAi] = useState<"checking" | "ready" | "off">(() => (inClaude() ? "checking" : "off"));
  const [busy, setBusy] = useState(false);
  const [guess, setGuess] = useState<BrandGuess | null>(null);
  const [aiErr, setAiErr] = useState("");
  const [logoErr, setLogoErr] = useState("");
  const [swatches, setSwatches] = useState<string[]>([]);
  const [target, setTarget] = useState<"primary" | "accent">("primary");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    let live = true;
    capability("sample").then((s) => live && setAi(s ? "ready" : "off"));
    return () => {
      live = false;
    };
  }, [open]);

  useEffect(() => {
    if (brand.logo) logoColors(brand.logo.dataUrl).then(setSwatches).catch(() => setSwatches([]));
    else setSwatches([]);
  }, [brand.logo]);

  const runAi = async () => {
    setBusy(true);
    setAiErr("");
    setGuess(null);
    try {
      const g = await askBrand(brand.companyName, brand.website);
      if (!normHex(g.primary ?? "")) throw new Error("The lookup didn't return usable colors. Pick them by hand or upload your logo.");
      setGuess(g);
    } catch (e: any) {
      if (e?.code === "not_granted") setAi("off");
      setAiErr(e?.code === "rate_limited" ? "Too many lookups in a row. Wait a minute and try again." : e?.message === "unavailable" ? "AI lookup isn't available in this view." : e?.message || "The lookup failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const onLogo = async (file: File) => {
    setLogoErr("");
    if (!/^image\/(png|jpeg|svg\+xml|webp|gif)$/.test(file.type)) {
      setLogoErr("Use a PNG, JPG, SVG or WebP image.");
      return;
    }
    try {
      setBrand({ ...brand, logo: await shrinkLogo(file) });
    } catch (e: any) {
      setLogoErr(e?.message || "Could not read that image.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto p-0">
        <div className="border-b border-[#e3e6ea] px-5 pb-4 pt-5 sm:px-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-[19px] font-extrabold text-[#1c2126]">Brand this dashboard</DialogTitle>
            <DialogDescription className="text-[13px] text-[#5d6570]">Company name, colors and logo carry into every chart and export. Changes apply as you go.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="space-y-6 px-5 py-5 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[12.5px] font-semibold text-[#1c2126]">Company name</span>
              <input value={brand.companyName} onChange={(e) => setBrand({ ...brand, companyName: e.target.value })} placeholder="Your company name" className="mt-1 w-full rounded-lg border border-[#d8dce1] bg-white px-3 py-2 text-[13.5px]" />
            </label>
            <label className="block">
              <span className="text-[12.5px] font-semibold text-[#1c2126]">Company website</span>
              <input value={brand.website} onChange={(e) => setBrand({ ...brand, website: e.target.value })} placeholder="www.example.com" className="mt-1 w-full rounded-lg border border-[#d8dce1] bg-white px-3 py-2 text-[13.5px]" inputMode="url" />
            </label>
          </div>

          {ai !== "off" && (
          <div className="rounded-xl border border-[#e3e6ea] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 text-[14px] font-bold text-[#1c2126]">
                  <Sparkles className="h-4 w-4" style={{ color: "var(--accent-ink)" }} /> Find brand colors from the website
                </div>
                <div className="mt-0.5 text-[12px] text-[#5d6570]">An AI agent suggests colors based on what it knows about the company. Only the name and website are sent.</div>
              </div>
              <button
                type="button"
                disabled={ai !== "ready" || busy || (!brand.website.trim() && !brand.companyName.trim())}
                onClick={runAi}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--brand-deep)] px-3.5 py-2 text-[13px] font-bold text-white disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {busy ? "Looking…" : "Find colors"}
              </button>
            </div>
            {aiErr && <p className="mt-2 text-[12px] text-[#b42318]">{aiErr}</p>}
            {guess && (
              <div className="mt-3 rounded-lg bg-[#f7f8f9] p-3">
                <div className="flex flex-wrap items-center gap-3">
                  {[guess.primary, guess.accent, guess.secondary].filter((c): c is string => !!normHex(c ?? "")).map((c, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#1c2126]">
                      <span className="h-6 w-6 rounded-md border border-black/10" style={{ background: normHex(c)! }} />
                      {["Primary", "Accent", "Secondary"][i]} <span className="font-mono text-[11px] uppercase text-[#5d6570]">{normHex(c)}</span>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setBrand({ ...brand, companyName: brand.companyName || guess.company_name || "", primary: normHex(guess.primary!)!, accent: normHex(guess.accent ?? "") ?? normHex(guess.secondary ?? "") ?? brand.accent });
                      setGuess(null);
                    }}
                    className="ml-auto inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-[12.5px] font-bold text-[#1c2126] shadow-sm ring-1 ring-[#e3e6ea]"
                  >
                    <Check className="h-3.5 w-3.5" /> Use these
                  </button>
                </div>
                <p className="mt-2 text-[11.5px] text-[#5d6570]">
                  {guess.confidence ? `Confidence: ${guess.confidence}. ` : ""}
                  {guess.notes} Check against the official brand guide before sharing.
                </p>
              </div>
            )}
          </div>
          )}

          <div>
            <div className="text-[14px] font-bold text-[#1c2126]">Logo</div>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-[84px] w-full shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-[#cdd1d7] bg-[#f7f8f9] px-3 hover:border-[#9aa0a8] sm:w-[200px]"
              >
                {brand.logo ? <img src={brand.logo.dataUrl} alt="Logo preview" className="max-h-[60px] max-w-full object-contain" /> : <span className="flex items-center gap-2 text-[13px] font-semibold text-[#5d6570]"><ImagePlus className="h-4 w-4" /> Upload logo</span>}
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onLogo(f); e.target.value = ""; }} />
              <div className="text-[12px] leading-relaxed text-[#5d6570]">
                <div className="flex items-start gap-1.5">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>Logos are trademarks, so the dashboard doesn't pull them from websites. Upload a logo file you own or have permission to use. PNG with a transparent background looks best.</span>
                </div>
                {brand.logo && (
                  <button type="button" onClick={() => setBrand({ ...brand, logo: null })} className="mt-1.5 inline-flex items-center gap-1 font-semibold text-[#b42318]">
                    <Trash2 className="h-3.5 w-3.5" /> Remove logo
                  </button>
                )}
                {logoErr && <div className="mt-1 text-[#b42318]">{logoErr}</div>}
              </div>
            </div>
            {swatches.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[12px] font-semibold text-[#3c434c]">Colors in your logo, tap to use as</span>
                <Seg small value={target} onChange={setTarget} options={[{ value: "primary", label: "Primary" }, { value: "accent", label: "Accent" }]} />
                <div className="flex gap-1.5">
                  {swatches.map((c) => (
                    <button key={c} type="button" title={c} onClick={() => setBrand({ ...brand, [target]: c })} className="h-7 w-7 rounded-md border border-black/10 transition hover:scale-110" style={{ background: c }} aria-label={`Use ${c}`} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="text-[14px] font-bold text-[#1c2126]">Colors</div>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <ColorField label="Primary" value={brand.primary} onChange={(v) => setBrand({ ...brand, primary: v })} />
              <ColorField label="Accent" value={brand.accent} onChange={(v) => setBrand({ ...brand, accent: v })} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p.name} type="button" onClick={() => setBrand({ ...brand, primary: p.primary, accent: p.accent })} className="inline-flex items-center gap-1.5 rounded-full border border-[#e3e6ea] bg-white py-1 pl-1 pr-2.5 text-[12px] font-semibold text-[#3c434c] hover:border-[#cdd1d7]">
                  <span className="flex">
                    <span className="h-4 w-4 rounded-full border-2 border-white" style={{ background: p.primary }} />
                    <span className="-ml-1.5 h-4 w-4 rounded-full border-2 border-white" style={{ background: p.accent }} />
                  </span>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-[#f7f8f9] p-4">
            <div className="text-[12.5px] font-bold text-[#1c2126]">Chart colors</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {theme.series.slice(0, 5).map((c, i) => (
                <span key={c + i} className="h-7 w-10 rounded-md" style={{ background: c }} title={c} />
              ))}
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-[#5d6570]">
              Checked so neighboring colors stay distinct for color-blind readers. {theme.notes.join(" ")}
            </p>
          </div>

          <div className="flex justify-end">
            <button type="button" onClick={() => onOpenChange(false)} className="rounded-lg bg-[color:var(--brand-deep)] px-5 py-2 text-[13px] font-bold text-white">
              Done
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
