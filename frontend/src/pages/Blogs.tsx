import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { CardImage, DateChip, EmptyState, Excerpt, PageHero } from "@/components/ui";

type Blog = {
  id: number; title: string; author?: string; excerpt?: string;
  body: string; image?: string; date: string;
};

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[] | null>(null);

  useEffect(() => {
    apiFetch("/api/blogs")
      .then((r) => r.json())
      .then((d) => setBlogs(d.blogs || []))
      .catch(() => setBlogs([]));
  }, []);

  return (
    <>
      <PageHero
        crumb="Reflections"
        title="Blogs"
        subtitle="Personal reflections, devotions and letters from members of the brotherhood."
      />
      <section className="container-site py-14">
        {blogs === null ? (
          <p className="text-sm text-slate-500">Loading posts…</p>
        ) : blogs.length === 0 ? (
          <EmptyState message="No blog posts have been published yet." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {blogs.map((b) => (
              <Link
                key={b.id}
                to={`/blogs/${b.id}`}
                className="card group flex gap-5 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-card-hover"
              >
                <CardImage src={b.image} alt={b.title} className="hidden h-auto w-40 shrink-0 sm:block" />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <DateChip date={b.date} />
                    {b.author && (
                      <span className="badge border-gold-300 bg-gold-50 text-gold-700">
                        {b.author}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 font-display text-lg font-bold leading-snug text-navy-900 group-hover:text-navy-700">
                    {b.title}
                  </h2>
                  {b.excerpt && (
                    <p className="mt-2 text-sm italic leading-relaxed text-slate-500">
                      {b.excerpt}
                    </p>
                  )}
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                    <Excerpt text={b.body} length={120} />
                  </p>
                  <span className="mt-4 text-sm font-bold text-gold-600">Read post →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
