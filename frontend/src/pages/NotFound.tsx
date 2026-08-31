import { PageHero } from "@/components/ui";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <>
      <PageHero crumb="404" title="Page Not Found" />
      <section className="container-site py-16 text-center">
        <p className="text-sm text-slate-600">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/" className="btn btn-navy mt-6">
          ← Back to Home
        </Link>
      </section>
    </>
  );
}
