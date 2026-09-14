import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BloodLink — Blood Donation Request Management",
  description:
    "Professional blood donation request management with GPS matching and secure in-app coordination.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
