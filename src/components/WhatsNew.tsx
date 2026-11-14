import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ReleaseNote } from "@/lib/version";

const TAG: Record<ReleaseNote["items"][number]["tag"], string> = {
  New: "bg-[#e4f3ea] text-[#18794e]",
  Improved: "bg-[#e6eef8] text-[#1d4f91]",
  Fixed: "bg-[#f8edd9] text-[#9a5b00]",
};

export function WhatsNew({ open, onOpenChange, notes }: { open: boolean; onOpenChange: (v: boolean) => void; notes: ReleaseNote[] }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto p-0">
        <div className="border-b border-[#e3e6ea] px-5 pb-4 pt-5 sm:px-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-[19px] font-extrabold text-[#1c2126]">What's new</DialogTitle>
            <DialogDescription className="text-[13px] text-[#5d6570]">Changes since you last opened the dashboard.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="space-y-5 px-5 py-5 sm:px-6">
          {notes.map((n) => (
            <section key={n.version}>
              <div className="flex items-baseline gap-2">
                <h3 className="text-[14px] font-bold text-[#1c2126]">Version {n.version}</h3>
                <span className="text-[12px] text-[#8b929b]">{n.date}</span>
              </div>
              <ul className="mt-2 space-y-2">
                {n.items.map((it) => (
                  <li key={it.text} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[#3c434c]">
                    <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${TAG[it.tag]}`}>{it.tag}</span>
                    <span>{it.text}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <button type="button" onClick={() => onOpenChange(false)} className="w-full rounded-lg bg-[color:var(--brand-deep)] px-4 py-2.5 text-[13px] font-bold text-white">
            Got it
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
