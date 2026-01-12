import type { Metadata } from "next";
import { DM_Mono } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";

const dmMono = DM_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "Link Dashboard",
  description: "Track your hangouts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${dmMono.className} antialiased flex bg-background text-foreground`}
      >
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-8 font-mono">
          {children}
        </main>
      </body>
    </html>
  );
}
