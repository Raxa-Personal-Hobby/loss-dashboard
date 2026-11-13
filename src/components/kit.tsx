import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { BarChart3, Download, Loader2, Table2 } from "lucide-react";
import { inClaude, saveFile, type SaveOutcome } from "@/lib/claude";
import { nodeToPng } from "@/lib/exporters";

export function announceSave(r: SaveOutcome, filename: string) {
  if (r === "saved") toast.success(`Saved ${filename}`);
  else if (r === "busy") toast("Another download is waiting for your OK first.");
  else if (r === "fallback") toast(`Downloading ${filename}`, inClaude() ? { description: "If nothing shows up, open this dashboard in claude.ai on a desktop browser." } : { description: "Check your Downloads folder." });
  else if (r === "failed") toast.error("That download didn't work. Try again.");
}

export async function savePng(node: HTMLElement | null, filename: string, bg?: string) {
  if (!node) return;
  try {
    const blob = await nodeToPng(node, bg);
    announceSave(await saveFile(filename, blob), filename);
  } catch (e: any) {
    toast.error(e?.message || "Could not create the image.");
  }
}

export interface Col {
  key: string;
  label: string;
  align?: "left" | "right";
  fmt?: (v: any, row: any) => ReactNode;
}

export function DataTable({ cols, rows, max = 400 }: { cols: Col[]; rows: Record<string, any>[]; max?: number }) {
  return (
    <div className="overflow-auto rounded-lg border border-[#edeff1]" style={{ maxHeight: max }}>
      <table className="w-full border-collapse text-[12.5px]">
        <thead className="sticky top-0 bg-[#f7f8f9]">
          <tr>
            {cols.map((c) => (
              <th key={c.key} className={`whitespace-nowrap border-b border-[#e3e6ea] px-3 py-2 font-semibold text-[#5d6570] ${c.align === "right" ? "text-right" : "text-left"}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-[#f0f1f3] last:border-0">
              {cols.map((c) => (
                <td key={c.key} className={`whitespace-nowrap px-3 py-1.5 text-[#1c2126] ${c.align === "right" ? "text-right tabular-nums" : ""}`}>
                  {c.fmt ? c.fmt(r[c.key], r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function IconBtn({ onClick, title, children, active }: { onClick: () => void; title: string; children: ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-[#5d6570] transition hover:bg-[#eceef1] hover:text-[#1c2126] ${active ? "bg-[#eceef1] text-[#1c2126]" : ""}`}
    >
      {children}
    </button>
  );
}

export function Seg<T extends string>({ value, options, onChange, small }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; small?: boolean }) {
  return (
    <div className="inline-flex rounded-lg bg-[#eceef1] p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-md font-semibold transition ${small ? "px-2 py-1 text-[11.5px]" : "px-2.5 py-1 text-[12.5px]"} ${value === o.value ? "bg-white text-[#1c2126] shadow-sm" : "text-[#5d6570] hover:text-[#1c2126]"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  note,
  table,
  children,
  controls,
  file,
  className = "",
}: {
  title: string;
  subtitle?: ReactNode;
  note?: ReactNode;
  table?: { cols: Col[]; rows: Record<string, any>[] };
  children: ReactNode;
  controls?: ReactNode;
  file: string;
  className?: string;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLElement>(null);
  return (
    <section ref={ref} className={`flex min-w-0 flex-col rounded-[14px] border border-[#e3e6ea] bg-white p-4 sm:p-5 ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold leading-snug text-[#1c2126]">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[12.5px] leading-snug text-[#5d6570]">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1" data-export-ignore>
          {controls}
          {table && (
            <IconBtn title={view === "chart" ? "Show as table" : "Show as chart"} onClick={() => setView(view === "chart" ? "table" : "chart")} active={view === "table"}>
              {view === "chart" ? <Table2 className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
            </IconBtn>
          )}
          <IconBtn
            title="Save this card as PNG"
            onClick={async () => {
              setBusy(true);
              await savePng(ref.current, `${file}.png`, "#ffffff");
              setBusy(false);
            }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          </IconBtn>
        </div>
      </header>
      <div className="mt-3 min-w-0 flex-1">{view === "chart" || !table ? children : <DataTable cols={table.cols} rows={table.rows} />}</div>
      {note && <p className="mt-3 border-t border-[#f0f1f3] pt-2.5 text-[11.5px] leading-relaxed text-[#6c737d]">{note}</p>}
    </section>
  );
}

export function SectionHead({ id, eyebrow, title, sub }: { id: string; eyebrow: string; title: string; sub?: string }) {
  return (
    <div id={id} className="scroll-mt-28 pt-2">
      <div className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--accent-ink)" }}>
        {eyebrow}
      </div>
      <h2 className="mt-1 text-[22px] font-extrabold leading-tight tracking-[-0.01em] text-[#1c2126] sm:text-[26px]">{title}</h2>
      {sub && <p className="mt-1 max-w-3xl text-[13.5px] text-[#5d6570]">{sub}</p>}
    </div>
  );
}
