import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtDay, parseDay } from "@/lib/normalize";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  day: number;
  /** Latest date of loss in the data, to warn when the chosen date is before it. */
  latestLossDay: number | null;
  onSave: (day: number) => void;
}

/** Changes the as-of date of the data already loaded, without uploading it again. */
export function AsOfDialog({ open, onOpenChange, day, latestLossDay, onSave }: Props) {
  const [text, setText] = useState(fmtDay(day, "iso"));
  useEffect(() => {
    if (open) setText(fmtDay(day, "iso"));
  }, [open, day]);
  const picked = parseDay(text);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md p-0">
        <div className="border-b border-[#e3e6ea] px-5 pb-4 pt-5 sm:px-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-[19px] font-extrabold text-[#1c2126]">As-of date</DialogTitle>
            <DialogDescription className="text-[13px] text-[#5d6570]">
              The date the loss run's figures are valued as of. Year-to-date and last-12-month comparisons end on this date.
            </DialogDescription>
          </DialogHeader>
        </div>
        <form
          className="space-y-4 px-5 py-5 sm:px-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (picked == null) return;
            onSave(picked);
            onOpenChange(false);
          }}
        >
          <label className="block">
            <span className="text-[12.5px] font-semibold text-[#1c2126]">Valued as of</span>
            <input type="date" required className="mt-1 w-full rounded-md border border-[#d8dce1] bg-white px-2 py-1.5 text-[13px]" value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          {picked != null && latestLossDay != null && picked < latestLossDay && (
            <p className="rounded-lg bg-[#f8edd9] px-3 py-2.5 text-[12.5px] text-[#9a5b00]">The data has a date of loss after this date ({fmtDay(latestLossDay)}). Check the date on the loss run.</p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => onOpenChange(false)} className="rounded-lg px-4 py-2 text-[13px] font-semibold text-[#5d6570] hover:text-[#1c2126]">
              Cancel
            </button>
            <button type="submit" disabled={picked == null || picked === day} className="rounded-lg bg-[color:var(--brand-deep)] px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40">
              Save date
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
