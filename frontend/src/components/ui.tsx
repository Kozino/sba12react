import { Link } from "react-router-dom";
import { fileUrl } from "@/lib/api";
import { formatDate, toneClasses } from "@/lib/format";

export function StatusBadge({ tone, label }: { tone: keyof typeof toneClasses; label: string }) {
  return <span className={`badge ${toneClasses[tone]}`}>{label}</span>;
}

export function PageHero({
  title,
  subtitle,
  crumb
}: {
  title: string;
  subtitle?: string;
  crumb?: string;
}) {
  return (
    <section className="page-hero">
      <div className="container-site relative z-10 py-14 sm:py-16">
        {crumb && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-gold-400">
            {crumb}
          </p>
        )}
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{title}</h1>
        {subtitle && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}

export function GoldDivider() {
  return <div className="h-1.5 w-24 rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600" />;
}

export function SectionHead({
  kicker,
  title,
  center
}: {
  kicker?: string;
  title: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "text-center" : ""}>
      {kicker && (
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-gold-600">
          {kicker}
        </p>
      )}
      <h2 className="font-display text-2xl font-bold text-navy-900 sm:text-3xl">{title}</h2>
      <div className={`mt-4 ${center ? "mx-auto" : ""}`}>
        <GoldDivider />
      </div>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export function Excerpt({ text, length = 150 }: { text: string; length?: number }) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= length) return <>{clean}</>;
  return <>{clean.slice(0, length).trimEnd()}…</>;
}

export function CardImage({
  src,
  alt,
  className = ""
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  if (src) {
    return (
      <img
        src={fileUrl(src)}
        alt={alt}
        className={`object-cover ${className}`}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-navy-800 via-navy-700 to-navy-600 ${className}`}
    >
      <img src="/logo.png" alt="" className="h-16 w-16 opacity-80" />
    </div>
  );
}

export function DateChip({ date }: { date?: string | null }) {
  return (
    <span className="badge border-navy-200 bg-navy-50 text-navy-700">
      {formatDate(date)}
    </span>
  );
}

export function ImageMarquee({
  images,
  secondsPerImage = 2,
}: {
  images: { src: string; alt: string }[];
  secondsPerImage?: number;
}) {
  const duration = images.length * secondsPerImage;
  return (
    <div className="w-full overflow-hidden">
      <div
        className="flex w-max animate-marquee gap-6"
        style={{ animationDuration: `${duration}s` }}
      >
        {[...images, ...images].map((img, i) => (
          <img
            key={i}
            src={img.src}
            alt={img.alt}
            className="h-40 w-64 flex-none rounded-xl object-cover shadow-xl sm:h-48 sm:w-72"
          />
        ))}
      </div>
    </div>
  );
}

export function CtaBand({
  title,
  text,
  href,
  ctaLabel
}: {
  title: string;
  text: string;
  href: string;
  ctaLabel: string;
}) {
  return (
    <section className="container-site py-14">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-950 via-navy-900 to-navy-700 px-6 py-12 text-center sm:px-12">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(500px 250px at 80% 10%, rgba(253,191,46,0.18), transparent 65%)"
          }}
        />
        <h2 className="relative font-display text-2xl font-bold text-white sm:text-3xl">
          {title}
        </h2>
        <p className="relative mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
          {text}
        </p>
        <Link
          to={href}
          className="btn btn-gold relative mt-7"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
