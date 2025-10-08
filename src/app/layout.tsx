"use client";

import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GeneralChatbot from '@/components/GeneralChatbot';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // Don't show general chatbot on PDF viewer pages
  const isPdfViewerPage = pathname?.startsWith('/pdfs/') && pathname !== '/pdfs' && pathname !== '/pdfs/upload';

  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} flex flex-col min-h-screen`}>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          {/* Show general chatbot on all pages except PDF viewer */}
          {!isPdfViewerPage && <GeneralChatbot />}
        </body>
      </html>
    </ClerkProvider>
  );
}
