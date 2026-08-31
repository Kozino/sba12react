
import { useEffect, useMemo, useState } from "react";
import { fileUrl } from "@/lib/api";
export type GalleryItem = {
  id: number;
  title: string;
  caption?: string;
  image: string;
  event_year: number;
};

export default function GalleryClient({ items }: { items: GalleryItem[] }) {
  const [year, setYear] = useState<string>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const years = useMemo(() => {
    const ys = new Set<number>();
    for (const g of items) if (g.event_year) ys.add(Number(g.event_year));
    return Array.from(ys).sort((a, b) => b - a);
  }, [items]);

  const filtered = useMemo(
    () =>
      year === "all"
        ? items
        : items.filter((g) => Number(g.event_year) === Number(year)),
    [items, year]
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowRight")
        setOpenIndex((i) => (i === null ? null : (i + 1) % filtered.length));
      if (e.key === "ArrowLeft")
        setOpenIndex((i) =>
          i === null ? null : (i - 1 + filtered.length) % filtered.length
        );
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, filtered.length]);

  if (items.length === 0) return null;

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => setYear("all")}
          className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-colors ${
            year === "all"
              ? "border-navy-700 bg-navy-700 text-white"
              : "border-slate-300 bg-white text-slate-600 hover:border-navy-400"
          }`}
        >
          All Years
        </button>
        {years.map((y) => (
          <button
            key={y}
            onClick={() => setYear(String(y))}
            className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-colors ${
              year === String(y)
                ? "border-navy-700 bg-navy-700 text-white"
                : "border-slate-300 bg-white text-slate-600 hover:border-navy-400"
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>figure]:mb-4">
        {filtered.map((g, i) => (
          <figure
            key={g.id}
            className="group relative cursor-pointer break-inside-avoid overflow-hidden rounded-xl"
            onClick={() => setOpenIndex(i)}
          >
            <img
              src={fileUrl(g.image)}
              alt={g.title}
              className="w-full transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/90 to-transparent p-4 pt-12">
              <p className="text-sm font-bold text-white">{g.title}</p>
              {g.caption && (
                <p className="mt-0.5 text-xs text-slate-300">{g.caption}</p>
              )}
              {g.event_year && (
                <p className="mt-1 text-xs font-bold text-gold-300">{g.event_year}</p>
              )}
            </figcaption>
          </figure>
        ))}
      </div>

      {openIndex !== null && filtered[openIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/95 p-4"
          onClick={() => setOpenIndex(null)}
        >
          <button
            className="absolute right-5 top-5 rounded-full border border-white/30 p-2 text-white hover:bg-white/10"
            onClick={() => setOpenIndex(null)}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="5" y1="5" x2="19" y2="19" />
              <line x1="19" y1="5" x2="5" y2="19" />
            </svg>
          </button>
          <button
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/30 p-2 text-white hover:bg-white/10 sm:left-6"
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex((openIndex - 1 + filtered.length) % filtered.length);
            }}
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/30 p-2 text-white hover:bg-white/10 sm:right-6"
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex((openIndex + 1) % filtered.length);
            }}
            aria-label="Next image"
          >
            ›
          </button>
          <figure
            className="max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={fileUrl(filtered[openIndex].image)}
              alt={filtered[openIndex].title}
              className="max-h-[75vh] w-auto rounded-lg"
            />
            <figcaption className="mt-4 text-center">
              <p className="font-display text-lg font-bold text-white">
                {filtered[openIndex].title}
              </p>
              {filtered[openIndex].caption && (
                <p className="mt-1 text-sm text-slate-300">
                  {filtered[openIndex].caption}
                </p>
              )}
              {filtered[openIndex].event_year && (
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-gold-400">
                  {filtered[openIndex].event_year}
                </p>
              )}
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
