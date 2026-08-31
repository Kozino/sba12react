import { PageHero } from "@/components/ui";
import AuditClient from "@/components/AuditClient";


export default function AuditPage() {
  return (
    <>
      <PageHero
        crumb="Audit"
        title="Member Audit Portal"
        subtitle="Your payments, the constitution, the minutes of meetings and the financial reports — all behind your unique member ID."
      />
      <section className="container-site py-14">
        <AuditClient />
      </section>
    </>
  );
}
