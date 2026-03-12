import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { Toaster } from "@/components/ui/sonner";
import Link from "next/link";
import { BarChart2 } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NetCo Marketing Workstation",
  description: "Marketing-Workstation für NetCo Body-Cam, BauTV+ und Microvista",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConvexClientProvider>
          <div className="border-b px-4 py-2 flex items-center gap-4 text-sm">
            <Link href="/kpis" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <BarChart2 className="h-4 w-4" />
              Executive Overview
            </Link>
          </div>
          {children}
          <Toaster />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
