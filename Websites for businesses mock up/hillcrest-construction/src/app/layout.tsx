import type { Metadata } from "next";
import { Roboto_Condensed, Inter } from "next/font/google";
import "./globals.css";

const robotoCondensed = Roboto_Condensed({ 
  subsets: ["latin"],
  variable: '--font-roboto-condensed',
  weight: ['300', '400', '700'],
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Hillcrest Construction | Modern Industrial Builds",
  description: "High-end commercial and residential construction portfolio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${robotoCondensed.variable} ${inter.variable}`}>
      <body className="bg-[#111827] text-gray-200 antialiased selection:bg-[#FE602F] selection:text-white font-sans">
        <header className="fixed w-full top-0 z-50 border-b border-[#1F2937] bg-[#111827]/90 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
            <div className="text-3xl font-bold tracking-tighter text-white uppercase" style={{ fontFamily: 'var(--font-roboto-condensed)' }}>
              Hillcrest <span className="text-[#FE602F]">Construction</span>
            </div>
            <nav className="hidden md:flex gap-8 text-sm font-bold tracking-widest uppercase text-gray-400">
              <span className="hover:text-white transition-colors cursor-pointer">Portfolio</span>
              <span className="hover:text-white transition-colors cursor-pointer">Commercial</span>
              <span className="hover:text-white transition-colors cursor-pointer">Residential</span>
            </nav>
            <button className="hidden md:block px-6 py-3 bg-transparent border-2 border-[#FE602F] text-[#FE602F] hover:bg-[#FE602F] hover:text-white font-bold uppercase tracking-wider text-sm transition-all duration-300">
              Get an Estimate
            </button>
          </div>
        </header>
        {children}
        <footer className="w-full border-t border-[#1F2937] bg-[#0d1117] py-16 mt-32">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="text-gray-500 text-sm font-bold tracking-widest uppercase mb-4">
              Secured & Encrypted via HTTPS Strict Transport
            </div>
            <div className="text-gray-600 text-xs">
              &copy; 2026 Hillcrest Construction. All Rights Reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
