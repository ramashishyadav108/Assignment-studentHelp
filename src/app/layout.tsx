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
  
  // Don't show header on landing page (it has its own nav)
  const isLandingPage = pathname === '/';

  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        </head>
        <body className={`${inter.className} flex flex-col min-h-screen overflow-x-hidden`}>
          {!isLandingPage && <Header />}
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          {/* Show footer on all pages except PDF viewer with individual PDFs */}
          {!isPdfViewerPage && <Footer />}
          {/* Show general chatbot on all pages except PDF viewer */}
          {!isPdfViewerPage && <GeneralChatbot />}
        </body>
      </html>
    </ClerkProvider>
  );
}
