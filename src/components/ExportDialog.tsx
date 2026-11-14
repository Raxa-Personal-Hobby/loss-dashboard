import { useState, type ReactNode } from "react";
import { FileSpreadsheet, Image as ImageIcon, Loader2, Presentation } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function Option({ icon, title, desc, cta, onClick, busy }: { icon: ReactNode; title: string; desc: ReactNode; cta: string; onClick: () => void; busy: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#e3e6ea] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[color:var(--brand-tint)] text-[color:var(--brand-deep)]">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-bold text-[#1c2126]">{title}</div>
        <div className="mt-0.5 text-[12.5px] leading-relaxed text-[#5d6570]">{desc}</div>
      </div>
      <button type="button" onClick={onClick} disabled={busy} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[color:var(--brand-deep)] px-3.5 py-2 text-[12.5px] font-bold text-white disabled:opacity-50">
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {cta}
      </button>
    </div>
  );
}

type Handlers = { onPptx: () => Promise<void>; onPng: () => Promise<void>; onXlsx: () => Promise<void> };

/** The export choices. Shared by the Export window and the Export section at the bottom of the page. */
export function ExportOptions({ onPptx, onPng, onXlsx }: Handlers) {
  const [busy, setBusy] = useState<string | null>(null);
  const run = (k: string, fn: () => Promise<void>) => async () => {
    setBusy(k);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="space-y-3">
      <Option
        icon={<Presentation className="h-5 w-5" />}
        title="PowerPoint or Google Slides"
        desc={
          <>
            11 branded slides with editable charts and tables. For Google Slides, upload the .pptx to Google Drive and choose Open with › Google Slides.
          </>
        }
        cta="Download .pptx"
        busy={busy === "pptx"}
        onClick={run("pptx", onPptx)}
      />
      <Option icon={<ImageIcon className="h-5 w-5" />} title="PNG image" desc="The whole dashboard as one high-resolution image. Every card also has its own PNG button." cta="Download .png" busy={busy === "png"} onClick={run("png", onPng)} />
      <Option icon={<FileSpreadsheet className="h-5 w-5" />} title="Filtered claims (Excel)" desc="The claims behind this view with the cleaned-up categories. Claimant names are left out." cta="Download .xlsx" busy={busy === "xlsx"} onClick={run("xlsx", onXlsx)} />
      <p className="pt-1 text-[11.5px] text-[#8b929b]">Your browser may ask you to confirm each download.</p>
    </div>
  );
}

export function ExportDialog({ open, onOpenChange, scope, ...handlers }: { open: boolean; onOpenChange: (v: boolean) => void; scope: string } & Handlers) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-xl p-0">
        <div className="border-b border-[#e3e6ea] px-5 pb-4 pt-5 sm:px-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-[19px] font-extrabold text-[#1c2126]">Export</DialogTitle>
            <DialogDescription className="text-[13px] text-[#5d6570]">
              Exports use what's on screen now: <span className="font-semibold text-[#1c2126]">{scope}</span>
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-5 py-5 sm:px-6">
          <ExportOptions {...handlers} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
