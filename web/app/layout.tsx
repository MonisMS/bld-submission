import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Remote Browser Control",
  description: "Control a headless browser in real time",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
