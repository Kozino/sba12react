import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { SITE, EXECUTIVES } from "@/lib/site";
import { CardImage, DateChip, Excerpt, SectionHead, CtaBand, ImageMarquee } from "@/components/ui";

const HERO_MARQUEE_IMAGES = [
  { src: "/saviobosco1.jpg", alt: "Savio Bosco Alphas 2012 — photo 1" },
  { src: "/saviobosco2.jpg", alt: "Savio Bosco Alphas 2012 — photo 2" },
  { src: "/saviobosco3.jpg", alt: "Savio Bosco Alphas 2012 — photo 3" },
  { src: "/saviobosco4.jpg", alt: "Savio Bosco Alphas 2012 — photo 4" },
];

type News = { id: number; title: string; body: string; image?: string; date: string };
type Gallery = { id: number; image: string; title?: string; caption?: string; event_year: number };

export default function HomePage() {
  const [news, setNews] = useState<News[]>([]);
  const [gallery, setGallery] = useState<Gallery[]>([]);
  const [members, setMembers] = useState<number | null>(null);

  useEffect(() => {
    apiFetch("/api/home")
      .then((r) => r.json())
      .then((d) => {
        setNews(d.news || []);
        setGallery(d.gallery || []);
        setMembers(d.members ?? 0);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="page-hero">
        <ImageMarquee images={HERO_MARQUEE_IMAGES} secondsPerImage={2} />
        <div className="page-hero-overlay" />
        <div className="container-site relative z-20 max-w-2xl py-16 lg:py-24">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-gold-300">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
              Seminary Family · Since 2006
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
              Savio Bosco <span className="text-gold-400">Alphas 2012</span>
            </h1>
            <p className="mt-5 font-display text-lg italic text-gold-300 sm:text-xl">
              &ldquo;{SITE.motto}&rdquo;
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
              {SITE.mottoTranslation} — {SITE.mottoRef}
            </p>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              We are the brothers who entered <strong className="text-white">St. Dominic
              Savio Seminary, Akpu</strong> in 2006 (JSS 1) and all who joined us in the
              other classes. Though the seminary years ended, the brotherhood continues —
              in word, in deed and in prayer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn btn-gold">
                Register as a Member
              </Link>
              <Link to="/about" className="btn btn-ghost-white">
                Our Story
              </Link>
              <Link to="/audit" className="btn btn-ghost-white">
                Member Audit Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-navy-100 bg-white">
        <div className="container-site grid grid-cols-2 gap-6 py-8 sm:grid-cols-4">
          {[
            [members === null ? "—" : String(members), "Registered Members"],
            ["2006", "Seminary Admission (JSS 1)"],
            ["8", "Executive Offices"],
            ["31 Dec", "Annual General Meeting"]
          ].map(([value, label]) => (
            <div key={label} className="text-center">
              <p className="font-display text-3xl font-bold text-navy-800">{value}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Who we are */}
      <section className="container-site py-16">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <SectionHead kicker="Who We Are" title="One Seminary. One Family. One Purpose." />
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              <p>
                The Savio Bosco Alphas 2012 association brings together the students who
                were admitted into St. Dominic Savio Seminary, Akpu — in Orumba South
                Local Government, Anambra State — in 2006 as JSS 1 students, together with
                everyone who later joined that same set in the other classes.
              </p>
              <p>
                Our name carries our identity: <em>Savio</em> and <em>Bosco</em> for the
                saint who shaped the seminary, and <em>Alphas</em> — the first, the
                beginning — for the class that stands at the head of this family.
              </p>
              <p>
                We exist to keep our brotherhood alive, to give every member an identity,
                and to lend a helping hand to one another — financially and otherwise.
              </p>
            </div>
            <Link to="/about" className="btn btn-navy mt-8">
              Read About the Association
            </Link>
          </div>
          <div className="grid gap-4">
            {[
              {
                title: "Brotherhood",
                text: "A cordial, lasting relationship among members — the seminary family extended for life."
              },
              {
                title: "Identity",
                text: "Every member is known, registered and identified by a unique member ID."
              },
              {
                title: "Benevolence",
                text: "Financial and practical support in marriage, illness, bereavement and ordination."
              },
              {
                title: "Faith",
                text: "Rooted in the Christian life of the seminary; ambassadors of the Church in the world."
              }
            ].map((f) => (
              <div key={f.title} className="card flex gap-4 p-5 transition-shadow hover:shadow-card-hover">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gold-100 font-display text-lg font-bold text-gold-700">
                  {f.title.charAt(0)}
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-navy-800">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Executives / Leadership */}
      <section className="bg-white py-16">
        <div className="container-site">
          <div className="flex items-end justify-between gap-4">
            <SectionHead kicker="Leadership" title="Our Executive Officers" />
            <Link
              to="/executives"
              className="mb-4 hidden text-sm font-bold text-navy-700 underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-navy-900 sm:block"
            >
              Meet the Executives →
            </Link>
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-slate-600">
            The association is administered by a management committee of eight executive
            officers, elected by the members for a two-year term and answerable to them
            at the Annual General Meeting on 31 December each year — in accordance with
            our constitution.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EXECUTIVES.map((ex) => (
              <Link
                key={ex.name}
                to="/executives"
                className="card group p-5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-700 font-display text-sm font-bold text-gold-400">
                  {ex.name.charAt(0)}
                </div>
                <h3 className="mt-3 font-display text-base font-bold text-navy-900 group-hover:text-navy-700">
                  {ex.name}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{ex.short}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest news */}
      <section className="bg-navy-50/60 py-16">
        <div className="container-site">
          <div className="flex items-end justify-between gap-4">
            <SectionHead kicker="Newsroom" title="Latest News" />
            <Link
              to="/news"
              className="mb-4 hidden text-sm font-bold text-navy-700 underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-navy-900 sm:block"
            >
              View all news →
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
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
                  <span className="mt-4 text-sm font-bold text-gold-600">Read more →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery strip */}
      <section className="container-site py-16">
        <div className="flex items-end justify-between gap-4">
          <SectionHead kicker="Gallery" title="Moments from the Family" />
          <Link
            to="/gallery"
            className="mb-4 hidden text-sm font-bold text-navy-700 underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-navy-900 sm:block"
          >
            View gallery →
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {gallery.map((g) => (
            <Link key={g.id} to="/gallery" className="group relative block overflow-hidden rounded-xl">
              <CardImage src={g.image} alt={g.title || g.caption || ""} className="h-44 w-full transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/80 to-transparent p-3">
                <p className="text-xs font-semibold text-white">{g.title || g.caption}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CtaBand
        title="Are you part of this family?"
        text="Register your details to receive your unique member ID, appear in the association records, and unlock the Audit Portal — your payments, the constitution, the minutes and the reports."
        href="/register"
        ctaLabel="Register Now"
      />
    </>
  );
}
