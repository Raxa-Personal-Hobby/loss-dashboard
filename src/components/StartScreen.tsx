import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Building2, Factory, HardHat, Lock, Search, Truck, UtensilsCrossed, X } from "lucide-react";
import { findIndustries, naicsTitle, type IndustryHit } from "@/lib/naics-titles";
import { SOII_YEAR, lookupNaics, type Ownership } from "@/lib/naics";
import { getIndustry, profileForNaics, type IndustryId } from "@/lib/industries";

export interface StartPick {
  code: string;
  title: string;
  industry: IndustryId;
  ownership: Ownership;
}

const QUICK: { code: string; label: string; icon: typeof Search }[] = [
  { code: "7225", label: "Restaurants", icon: UtensilsCrossed },
  { code: "23", label: "Construction", icon: HardHat },
  { code: "484", label: "Trucking", icon: Truck },
  { code: "53131", label: "Property management", icon: Building2 },
  { code: "31-33", label: "Manufacturing", icon: Factory },
];

const templateName = (id: IndustryId) => (id === "general" ? "General" : getIndustry(id).name);

/* First screen: find your industry by NAICS code or plain words. Picks the template and the BLS benchmark. */
export function StartScreen({ onPick, onSkip, onClose }: { onPick: (p: StartPick) => void; onSkip: () => void; onClose?: () => void }) {
  const [q, setQ] = useState("");
  const [own, setOwn] = useState<Ownership>("private");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => inputRef.current?.focus(), []);
  const hits = useMemo(() => findIndustries(q, own, 8), [q, own]);
  useEffect(() => setActive(0), [q, own]);
  const pick = (code: string, title: string) => onPick({ code, title, industry: profileForNaics(code), ownership: own });
  const pickHit = (h: IndustryHit) => pick(h.code, h.title);

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#f5f6f8]" role="dialog" aria-modal="true" aria-label="Set up your dashboard">
      <div className="h-1.5 w-full" style={{ background: "var(--brand-deep)" }} />
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-10 sm:pt-16">
        <div className="flex items-start justify-between gap-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--accent-ink)" }}>
            Loss dashboard · step 1 of 2
          </div>
          {onClose && (
            <button type="button" aria-label="Close" onClick={onClose} className="text-[#8b929b] hover:text-[#1c2126]">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <h1 className="mt-2 text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] text-[#1c2126] sm:text-[36px]">What does your company do?</h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-[#5d6570]">
          Type your NAICS code or a few words, like <i>fishing</i>, <i>roofing</i> or <i>property management</i>. We'll match your industry, pick the right template, and compare your safety numbers with the BLS {SOII_YEAR} average.
        </p>

        <div className="mt-6 rounded-[16px] border border-[#e3e6ea] bg-white p-3 shadow-[0_18px_40px_-28px_rgba(20,24,28,0.35)] sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8b929b]" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
                  if (e.key === "Enter" && hits[active]) pickHit(hits[active]);
                }}
                aria-label="NAICS code or what your company does"
                placeholder="Try fishing, 238160, or senior living"
                className="h-12 w-full rounded-xl border border-[#d8dce1] bg-white pl-10 pr-3 text-[16px] text-[#1c2126] outline-none focus:border-[color:var(--brand)]"
              />
            </label>
            <select value={own} onChange={(e) => setOwn(e.target.value as Ownership)} aria-label="Ownership" className="h-12 rounded-xl border border-[#d8dce1] bg-white px-3 text-[14px] text-[#1c2126]">
              <option value="private">Private company</option>
              <option value="state">State government</option>
              <option value="local">Local government</option>
            </select>
          </div>

          {q.trim() === "" ? (
            <div className="mt-3">
              <div className="px-1 text-[12px] font-semibold text-[#5d6570]">Popular</div>
              <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {QUICK.map((x) => (
                  <button key={x.code} type="button" onClick={() => pick(x.code, naicsTitle(x.code) ?? x.label)} className="flex items-center gap-2.5 rounded-xl border border-[#e3e6ea] px-3 py-2.5 text-left hover:border-[#b7bcc4]">
                    <x.icon className="h-4 w-4 shrink-0" style={{ color: "var(--brand-deep)" }} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-bold text-[#1c2126]">{x.label}</span>
                      <span className="block font-mono text-[11.5px] text-[#6c737d]">NAICS {x.code}</span>
                    </span>
                  </button>
                ))}
                <button type="button" onClick={() => inputRef.current?.focus()} className="flex items-center gap-2.5 rounded-xl border border-dashed border-[#cdd1d7] px-3 py-2.5 text-left text-[13.5px] font-semibold text-[#5d6570] hover:border-[#9aa0a8]">
                  <Search className="h-4 w-4 shrink-0" /> Something else? Type it above
                </button>
              </div>
            </div>
          ) : hits.length ? (
            <ul className="mt-2 divide-y divide-[#f0f1f3]" role="listbox" aria-label="Matching industries">
              {hits.map((h, i) => {
                const tpl = profileForNaics(h.code);
                const bls = h.bls;
                return (
                  <li key={h.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === active}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => pickHit(h)}
                      className={`flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left ${i === active ? "bg-[color:var(--brand-tint)]" : ""}`}
                    >
                      <span className="mt-0.5 w-16 shrink-0 font-mono text-[12.5px] font-semibold text-[#3c434c]">{h.code}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14.5px] font-semibold leading-snug text-[#1c2126]">{h.title}</span>
                        <span className="mt-0.5 block text-[12px] leading-snug text-[#6c737d]">
                          {templateName(tpl)} template
                          {bls ? ` · BLS TRIR ${bls.rate.trc.toFixed(1)}${bls.exact ? "" : `, from ${bls.rate.code ? `${bls.rate.code} ${bls.rate.name}` : bls.rate.name}`}` : ""}
                        </span>
                      </span>
                      <ArrowRight className={`mt-1 h-4 w-4 shrink-0 ${i === active ? "text-[#1c2126]" : "text-transparent"}`} />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-3 rounded-lg bg-[#f7f8f9] px-3 py-3 text-[13px] text-[#5d6570]">
              No matches for "{q}". Try other words or something broader, like <i>manufacturing</i> or <i>retail</i>. Or skip for now.
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[13px]">
          <button type="button" onClick={onSkip} className="font-semibold underline-offset-2 hover:underline" style={{ color: "var(--brand-deep)" }}>
            Not sure? Skip and look around with sample data
          </button>
          <span className="inline-flex items-center gap-1.5 text-[12px] text-[#6c737d]">
            <Lock className="h-3.5 w-3.5" /> Runs on this computer. Nothing you type is sent anywhere.
          </span>
        </div>
        <p className="mt-6 text-[11.5px] leading-relaxed text-[#8b929b]">
          Industry names from the U.S. Census Bureau (2017 NAICS). Injury rates from the Bureau of Labor Statistics, {SOII_YEAR}. If BLS doesn't publish your exact code, the closest group above it is used, and the dashboard says which. Step 2 is loading your loss run, or exploring the sample.
        </p>
      </div>
    </div>
  );
}

/** "11411 Fishing" for the header chip, from a saved benchmark choice. */
export function naicsChipLabel(code: string): string {
  if (code === "private" || !code) return "All private industry";
  const t = naicsTitle(code) ?? lookupNaics(code)?.rate.name;
  return t ? `${code} ${t}` : `NAICS ${code}`;
}
