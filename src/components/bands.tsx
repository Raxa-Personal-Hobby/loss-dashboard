import type { Band } from "@/lib/types";
import { BAND_LABEL } from "@/lib/types";

// Status colors are reserved for bands. They always ship with a text label, never color alone.
export const BAND_STYLE: Record<Band, { fg: string; bg: string; dot: string }> = {
  0: { fg: "#18794e", bg: "#e4f3ea", dot: "#2a9d63" },
  1: { fg: "#55600d", bg: "#eef2d6", dot: "#93a224" },
  2: { fg: "#9a5b00", bg: "#f8edd9", dot: "#d99a1e" },
  3: { fg: "#b24a12", bg: "#fbe5d8", dot: "#e8692a" },
  4: { fg: "#b42318", bg: "#fbe3e1", dot: "#d4372c" },
};

export function BandPill({ band, size = "sm" }: { band: Band; size?: "sm" | "xs" }) {
  const s = BAND_STYLE[band];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ${size === "xs" ? "px-2 py-[1px] text-[10.5px]" : "px-2.5 py-0.5 text-[11.5px]"}`}
      style={{ color: s.fg, background: s.bg }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} aria-hidden />
      {BAND_LABEL[band]}
    </span>
  );
}
