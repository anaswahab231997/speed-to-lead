import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-serif',
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: "Vintage Vaults | Custom Cellars Toronto",
  description: "Ultra-luxury, climate-controlled wine environments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="bg-[#1a1a1a] text-gray-200 antialiased">
        <header className="fixed w-full top-0 z-50 border-b border-[#301b1b] bg-[#1a1a1a]/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="text-2xl font-serif font-bold tracking-wider text-white">
              V<span className="text-[#8c3636]">V</span>
            </div>
            <nav className="hidden md:flex gap-8 font-sans text-sm tracking-widest uppercase text-gray-400">
              <span className="hover:text-white transition-colors cursor-pointer">Environments</span>
              <span className="hover:text-white transition-colors cursor-pointer">Craftsmanship</span>
              <span className="hover:text-white transition-colors cursor-pointer">Consultation</span>
            </nav>
          </div>
        </header>
        {children}
        <footer className="w-full border-t border-[#301b1b] bg-[#111111] py-12 mt-24 text-center">
          <div className="text-gray-500 font-sans text-sm">
            &copy; {new Date().getFullYear()} Vintage Vaults Custom Cellars. All Rights Reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
