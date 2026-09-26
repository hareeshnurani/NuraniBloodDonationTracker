import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/login" className="text-sm font-medium text-[var(--accent)] hover:underline">
          ← BloodLink
        </Link>
        <article className="prose prose-neutral mt-6 max-w-none text-[var(--label)] [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-[15px] [&_p]:leading-relaxed [&_ul]:text-[15px]">
          {children}
        </article>
        <footer className="mt-10 border-t border-[var(--separator)] pt-6 text-[13px] text-[var(--label-secondary)]">
          <nav className="flex flex-wrap gap-4">
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link href="/disclaimer" className="hover:underline">
              Medical disclaimer
            </Link>
          </nav>
          <p className="mt-4">
            BloodLink coordinates voluntary donors and requesters. It is not a blood bank or hospital service.
          </p>
        </footer>
      </div>
    </div>
  );
}
