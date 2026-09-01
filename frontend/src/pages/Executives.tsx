import { useEffect, useState } from "react";
import { PageHero, CtaBand, CardImage, EmptyState } from "@/components/ui";
import { apiFetch } from "@/lib/api";

type Executive = {
  id: number;
  name: string;
  position: string;
  image: string | null;
};

export default function ExecutivesPage() {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/api/executives");
        const data = await res.json();
        setExecutives(data.executives || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <PageHero
        crumb="Leadership"
        title="Our Executives"
        subtitle="The management committee currently administering the association, in accordance with our constitution."
      />
      <section className="container-site py-14">
        {loading ? (
          <p className="text-center text-sm text-slate-400">Loading…</p>
        ) : executives.length === 0 ? (
          <EmptyState message="Executive list coming soon." />
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {executives.map((ex) => (
              <div
                key={ex.id}
                className="card flex flex-col items-center p-4 text-center transition-shadow hover:shadow-card-hover sm:p-5"
              >
                <CardImage
                  src={ex.image}
                  alt={ex.name}
                  className="aspect-square w-full rounded-xl"
                />
                <h2 className="mt-4 font-display text-base font-bold text-navy-900 sm:text-lg">
                  {ex.name}
                </h2>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gold-600 sm:text-sm">
                  {ex.position}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
      <CtaBand
        title="Part of the family?"
        text="Register your details to appear in the association roll. Once the executives approve your registration, your unique member ID unlocks the Audit Portal."
        href="/register"
        ctaLabel="Register Now"
      />
    </>
  );
}
