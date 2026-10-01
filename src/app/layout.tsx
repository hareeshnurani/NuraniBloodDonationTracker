import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BloodLink — Blood donation request management",
  description:
    "Raise blood requests, get matched with nearby donors, and coordinate safely in one app.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BloodLink",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f2f2f7",
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
