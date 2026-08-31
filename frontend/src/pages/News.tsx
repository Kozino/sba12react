import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { CardImage, DateChip, EmptyState, Excerpt, PageHero } from "@/components/ui";

type News = { id: number; title: string; body: string; image?: string; date: string };

export default function NewsPage() {
  const [news, setNews] = useState<News[] | null>(null);

  useEffect(() => {
    apiFetch("/api/news")
      .then((r) => r.json())
      .then((d) => setNews(d.news || []))
      .catch(() => setNews([]));
  }, []);

  return (
    <>
      <PageHero
        crumb="Newsroom"
        title="Association News"
        subtitle="Official announcements, meeting reports and the life of the association."
      />
      <section className="container-site py-14">
        {news === null ? (
          <p className="text-sm text-slate-500">Loading news…</p>
        ) : news.length === 0 ? (
          <EmptyState message="No news has been published yet. Please check back soon." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((n) => (
              <Link
                key={n.id}
                to={`/news/${n.id}`}
                className="card group flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-card-hover"
              >
                <CardImage src={n.image} alt={n.title} className="h-48 w-full" />
                <div className="flex flex-1 flex-col p-5">
                  <DateChip date={n.date} />
                  <h2 className="mt-3 font-display text-lg font-bold leading-snug text-navy-900 group-hover:text-navy-700">
                    {n.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                    <Excerpt text={n.body} />
                  </p>
                  <span className="mt-4 text-sm font-bold text-gold-600">
                    Read more →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
