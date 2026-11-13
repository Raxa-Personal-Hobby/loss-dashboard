import { RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEFAULT_THRESHOLDS, GROUPS, SOURCES, getPath, isDefault, setPath, type Thresholds } from "@/lib/thresholds";
import { BandPill } from "./bands";
import type { Band } from "@/lib/types";

function NumField({ value, def, unit, step, onChange }: { value: number; def: number; unit: string; step?: number; onChange: (v: number) => void }) {
  const changed = value !== def;
  return (
    <label className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#8b929b]">
        {unit}
        {changed && <span className="h-1.5 w-1.5 rounded-full bg-[#d99a1e]" title={`Default ${def}`} />}
      </span>
      <input
        type="number"
        inputMode="decimal"
        step={step ?? 1}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (isFinite(v)) onChange(v);
        }}
        className={`w-[84px] rounded-md border bg-white px-2 py-1.5 text-[13px] tabular-nums text-[#1c2126] ${changed ? "border-[#d99a1e]" : "border-[#d8dce1]"}`}
        title={`Default ${def}`}
      />
    </label>
  );
}

export function ThresholdsDialog({ open, onOpenChange, th, setTh, unitLabel }: { open: boolean; onOpenChange: (v: boolean) => void; th: Thresholds; setTh: (t: Thresholds) => void; unitLabel: string }) {
  const usedSources = [...new Set(GROUPS.flatMap((g) => g.rows.flatMap((r) => r.source)))];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-3xl overflow-y-auto p-0">
        <div className="border-b border-[#e3e6ea] px-5 pb-4 pt-5 sm:px-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-[19px] font-extrabold text-[#1c2126]">Risk levels</DialogTitle>
            <DialogDescription className="text-[13px] text-[#5d6570]">
              You decide what counts as Low, Guarded, Moderate, High or Severe. Every number below is a starting point; change any of them. Your settings stay in this browser.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {([0, 1, 2, 3, 4] as Band[]).map((b) => (
              <BandPill key={b} band={b} size="xs" />
            ))}
            <button
              type="button"
              disabled={isDefault(th)}
              onClick={() => setTh(structuredClone(DEFAULT_THRESHOLDS))}
              className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12.5px] font-semibold text-[#5d6570] hover:text-[#1c2126] disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
            </button>
          </div>
        </div>
        <div className="space-y-6 px-5 py-5 sm:px-6">
          {GROUPS.map((g) => (
            <section key={g.title}>
              <h3 className="text-[15px] font-bold text-[#1c2126]">{g.title.replace("Location", unitLabel)}</h3>
              <p className="mt-0.5 text-[12px] text-[#6c737d]">{g.sub}</p>
              <div className="mt-2 divide-y divide-[#f0f1f3] rounded-xl border border-[#e3e6ea]">
                {g.rows.map((r) => (
                  <div key={r.label} className="px-3 py-3">
                    <div className="text-[13px] font-semibold text-[#1c2126]">{r.label.replace(/location/gi, (m) => (m[0] === "L" ? unitLabel : unitLabel.toLowerCase()))}</div>
                    {r.help && <div className="text-[11.5px] text-[#6c737d]">{r.help}</div>}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {r.keys.map((k, i) => (
                        <NumField
                          key={k.path}
                          value={getPath(th, k.path)}
                          def={getPath(DEFAULT_THRESHOLDS, k.path)}
                          unit={k.unit || ["Low ≤", "Guarded ≤", "Moderate ≤", "High ≤"][i] || ""}
                          step={k.step}
                          onChange={(v) => setTh(setPath(th, k.path, v))}
                        />
                      ))}
                    </div>
                    <div className="mt-1.5 text-[11px] text-[#8b929b]">Default source: {r.source.map((id) => SOURCES[id].short).join(", ")}</div>
                  </div>
                ))}
              </div>
            </section>
          ))}
          <section className="rounded-xl bg-[#f7f8f9] p-4">
            <h3 className="text-[13.5px] font-bold text-[#1c2126]">Where the defaults come from</h3>
            <ul className="mt-2 space-y-2 text-[12px] leading-relaxed text-[#3c434c]">
              {usedSources.map((id) => (
                <li key={id}>
                  <span className="font-semibold text-[#1c2126]">{SOURCES[id].short}:</span> {SOURCES[id].text}
                  {SOURCES[id].url && <span className="block break-all text-[11px] text-[#6c737d]">{SOURCES[id].url}</span>}
                </li>
              ))}
            </ul>
          </section>
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
