import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { CardImage, DateChip, GoldDivider, PageHero } from "@/components/ui";
import { RichContent } from "@/components/RichContent";

type Blog = {
  id: number; title: string; author?: string; excerpt?: string;
  body: string; image?: string; date: string;
};

export default function BlogDetailPage() {
  const { id } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    apiFetch(`/api/blogs/${id}`)
      .then(async (r) => {
        if (!r.ok) return setNotFound(true);
        const d = await r.json();
        setBlog(d.blog);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <>
        <PageHero crumb="Blogs" title="Post Not Found" />
        <section className="container-site py-16 text-center text-sm text-slate-600">
          <p>The blog post you are looking for does not exist.</p>
          <Link to="/blogs" className="btn btn-navy mt-6">← Back to all posts</Link>
        </section>
      </>
    );
  }

  if (!blog) return <PageHero crumb="Blogs" title="Loading…" />;

  return (
    <>
      <PageHero crumb="Blogs" title={blog.title} />
      <article className="container-site py-14">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <DateChip date={blog.date} />
            {blog.author && (
              <span className="badge border-gold-300 bg-gold-50 text-gold-700">
                {blog.author}
              </span>
            )}
            <Link to="/blogs" className="text-sm font-semibold text-slate-500 hover:text-navy-700">
              ← All posts
            </Link>
          </div>
          {blog.image && (
            <CardImage src={blog.image} alt={blog.title} className="mt-6 h-72 w-full rounded-2xl sm:h-96" />
          )}
          {blog.excerpt && (
            <p className="mt-8 border-l-4 border-gold-500 pl-4 font-display text-lg italic leading-relaxed text-navy-800">
              {blog.excerpt}
            </p>
          )}
          <div className="mt-8">
            <GoldDivider />
          </div>
          <div className="mt-8">
            <RichContent html={blog.body} />
          </div>
        </div>
      </article>
    </>
  );
}
