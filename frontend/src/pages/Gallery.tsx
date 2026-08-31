import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { PageHero } from "@/components/ui";
import GalleryClient from "@/components/GalleryClient";

type GalleryItem = {
  id: number;
  title: string;
  caption?: string;
  image: string;
  event_year: number;
};

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[] | null>(null);

  useEffect(() => {
    apiFetch("/api/gallery")
      .then((r) => r.json())
      .then((d) => setItems(d.gallery || []))
      .catch(() => setItems([]));
  }, []);

  return (
    <>
      <PageHero
        crumb="Gallery & Events"
        title="Gallery & Events"
        subtitle="Photos from reunions, meetings, worship and the life of the association — browse by year."
      />
      <section className="container-site py-14">
        {items === null ? (
          <p className="text-sm text-slate-500">Loading gallery…</p>
        ) : (
          <GalleryClient items={items} />
        )}
      </section>
    </>
  );
}
