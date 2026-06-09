import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Remote Browser Control",
  description: "Drive a headless browser in real time from your browser",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("dark h-full", "font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col antialiased">
        <TooltipProvider delay={300}>{children}</TooltipProvider>
        <Toaster position="bottom-right" theme="dark" richColors />
      </body>
    </html>
  );
}
