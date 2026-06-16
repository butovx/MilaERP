import type { Metadata, Viewport } from "next";
import "./globals.css";
import MainNav from "@/components/MainNav";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import Link from "next/link";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "MILA ERP",
  description: "Система управления складом и ресурсами предприятия",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
          media="all"
        />
        <noscript>
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </noscript>
      </head>
      <body className="antialiased min-h-full bg-background text-foreground font-sans transition-colors duration-200">
        <ThemeProvider>
          <div className="flex flex-col md:flex-row min-h-screen">
            {/* Navigation menu (sidebar) */}
            <MainNav />
            
            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
              <main className="flex-grow w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 max-w-[120rem]">
                {children}
              </main>
              
              <footer className="bg-card border-t border-[var(--card-border)] py-4 sm:py-6 mt-auto">
                <div className="max-w-[120rem] mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-color-muted">
                      © {new Date().getFullYear()} MILA ERP - Управление складом
                    </p>
                    <div className="flex gap-4 sm:gap-6">
                      <Link
                        href="/help"
                        className="text-xs text-color-secondary hover:text-color-primary"
                      >
                        Помощь
                      </Link>
                      <Link
                        href="/privacy"
                        className="text-xs text-color-secondary hover:text-color-primary"
                      >
                        Конфиденциальность
                      </Link>
                      <Link
                        href="/about"
                        className="text-xs text-color-secondary hover:text-color-primary"
                      >
                        О нас
                      </Link>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
