import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { CardImage, DateChip, GoldDivider, PageHero } from "@/components/ui";
import { RichContent } from "@/components/RichContent";

type News = { id: number; title: string; body: string; image?: string; date: string };

export default function NewsDetailPage() {
  const { id } = useParams();
  const [news, setNews] = useState<News | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    apiFetch(`/api/news/${id}`)
      .then(async (r) => {
        if (!r.ok) return setNotFound(true);
        const d = await r.json();
        setNews(d.news);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <>
        <PageHero crumb="News" title="News Not Found" />
        <section className="container-site py-16 text-center text-sm text-slate-600">
          <p>The news item you are looking for does not exist.</p>
          <Link to="/news" className="btn btn-navy mt-6">← Back to all news</Link>
        </section>
      </>
    );
  }

  if (!news) return <PageHero crumb="News" title="Loading…" />;

  return (
    <>
      <PageHero crumb="News" title={news.title} />
      <article className="container-site py-14">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <DateChip date={news.date} />
            <Link to="/news" className="text-sm font-semibold text-slate-500 hover:text-navy-700">
              ← All news
            </Link>
          </div>
          {news.image && (
            <CardImage src={news.image} alt={news.title} className="mt-6 h-72 w-full rounded-2xl sm:h-96" />
          )}
          <div className="mt-8">
            <GoldDivider />
          </div>
          <div className="mt-8">
            <RichContent html={news.body} />
          </div>
        </div>
      </article>
    </>
  );
}
