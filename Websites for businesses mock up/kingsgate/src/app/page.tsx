'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';

// --- KINGSGATE LUXURY VALUES (EXTRACTED) ---
const services = [
  {
    title: 'PERMIT-READY PLANNING',
    description: 'Feasibility review, zoning checks, and permit planning in Toronto. Approvals are coordinated early to reduce delays and strictly protect your project timeline.',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    title: 'SCOPE CONTROL & COORDINATION',
    description: 'Design-build coordination with clear scope, strict specifications, and selections. Change orders are strictly tracked with their exact price and schedule impact.',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  {
    title: 'MILESTONE QUALITY CHECKS',
    description: 'Uncompromising standards enforced at framing, mechanical, envelope, insulation, and high-end finishes. Inspections happen at the stages that matter most.',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  }
];

export default function KingsGateLuxuryHomes() {
  const gridRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: gridRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -150]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] selection:bg-[#c5a059] selection:text-black relative">
      
      {/* GLOBAL NOISE/GRAIN OVERLAY */}
      <div 
        className="fixed inset-0 z-50 pointer-events-none opacity-20 mix-blend-overlay"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }}
      />

      {/* 1. CINEMATIC HERO SECTION (VIDEO) */}
      <section className="relative w-full h-screen min-h-[800px] flex items-center justify-center overflow-hidden bg-black text-white">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-80"
          poster="/live-media/live_asset_2.jpg"
        >
          <source src="/hero-luxury-cinematic.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#0a0a0a] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-6xl mx-auto pointer-events-none mt-16">
          <motion.span 
            className="text-[#c5a059] uppercase tracking-[0.5em] text-xs sm:text-sm font-semibold mb-8 block drop-shadow-md"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            Award-Winning Luxury Home Builder
          </motion.span>
          
          <motion.h1 
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extralight tracking-[0.15em] uppercase mb-10 drop-shadow-2xl"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 30, damping: 25, mass: 2, delay: 0.2 }}
          >
            KingsGate
            <span className="block mt-4 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-[0.25em] text-white/90">
              Luxury Homes
            </span>
          </motion.h1>
          
          <motion.div 
            className="border-l-2 border-[#c5a059] pl-8 max-w-4xl text-left mx-auto mb-16"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
          >
            <p className="text-lg sm:text-xl md:text-2xl font-light text-gray-200 leading-relaxed drop-shadow-md">
              "A luxury home isn't won in the last 10%—it's won in planning, documentation, and daily site control." 
            </p>
            <p className="mt-4 text-sm md:text-base text-gray-400 font-light tracking-wide uppercase">
              Delivering permit-ready planning and meticulous finish control across Toronto and the GTA.
            </p>
          </motion.div>

          <motion.button 
            className="pointer-events-auto px-14 py-6 border border-[#c5a059]/50 bg-[#c5a059]/10 backdrop-blur-md text-[#c5a059] uppercase tracking-[0.3em] text-xs sm:text-sm font-bold transition-all duration-700 hover:bg-[#c5a059] hover:text-black hover:border-[#c5a059] hover:scale-105"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 40, damping: 20, mass: 1.5, delay: 0.8 }}
          >
            Build Your Toronto Dream Home Today
          </motion.button>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-60"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#c5a059] mb-3">Discover</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-[#c5a059] to-transparent" />
        </motion.div>
      </section>

      {/* 2. VALUE-DRIVEN PROCESS GRID */}
      <section className="bg-[#0a0a0a] text-neutral-100 py-32 px-6 sm:px-12 lg:px-24 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-24 flex flex-col items-center">
            <span className="text-[#c5a059] uppercase tracking-[0.4em] text-xs font-semibold mb-6">How We Manage Your Build</span>
            <h2 className="text-4xl md:text-6xl font-light tracking-[0.2em] text-center uppercase">
              The KingsGate Process
            </h2>
            <p className="text-neutral-400 mt-8 text-center max-w-3xl font-light leading-relaxed text-lg">
              Building in Toronto means approvals, coordination, and details that can't be left to chance. KingsGate manages a permit-ready design-build process with disciplined scheduling and high-end finishing.
            </p>
            <div className="w-20 h-[1px] bg-[#c5a059] mt-12"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {services.map((service, index) => (
              <div 
                key={index}
                className="group relative border border-neutral-800 bg-[#111111]/80 backdrop-blur-sm p-12 transition-all duration-700 hover:border-[#c5a059] hover:-translate-y-3 cursor-pointer flex flex-col items-center text-center shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-[#c5a059]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="text-[#c5a059] mb-10 transform group-hover:scale-125 transition-transform duration-700">
                  {service.icon}
                </div>
                <h3 className="text-xl md:text-2xl font-normal tracking-[0.2em] mb-6 uppercase text-white group-hover:text-[#c5a059] transition-colors duration-300">
                  {service.title}
                </h3>
                <p className="text-neutral-400 font-light leading-relaxed text-sm md:text-base">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. PARALLAX BENTO IMAGE GRID */}
      <section ref={gridRef} className="py-32 bg-[#0a0a0a] overflow-hidden relative">
        <div className="max-w-[100rem] mx-auto px-6 lg:px-12">
          <div className="mb-24 flex flex-col items-center text-center">
            <h2 className="text-4xl md:text-6xl font-light tracking-[0.2em] uppercase text-white mb-6">
              Architectural <span className="text-[#c5a059]">Prestige</span>
            </h2>
            <p className="text-neutral-400 tracking-[0.3em] uppercase text-sm">Crafted for generations</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 h-[1200px] md:h-[1600px] relative">
            
            {/* Column 1 (Scrolls Up) */}
            <motion.div style={{ y: y1 }} className="flex flex-col gap-6 lg:gap-8 relative top-[100px] md:top-0">
              <div className="relative w-full h-[500px] md:h-[700px] group overflow-hidden border border-neutral-800">
                <div className="absolute inset-0 bg-[#c5a059]/20 mix-blend-overlay z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <Image src="/live-media/live_asset_0.jpg" alt="KingsGate Build 1" fill className="object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0" />
              </div>
              <div className="relative w-full h-[400px] md:h-[600px] group overflow-hidden border border-neutral-800">
                <div className="absolute inset-0 bg-[#c5a059]/20 mix-blend-overlay z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <Image src="/live-media/live_asset_1.jpg" alt="KingsGate Build 4" fill className="object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0" />
              </div>
            </motion.div>

            {/* Column 2 (Scrolls Down) */}
            <motion.div style={{ y: y2 }} className="flex flex-col gap-6 lg:gap-8 relative top-[-100px] md:top-[-200px]">
              <div className="relative w-full h-[600px] md:h-[800px] group overflow-hidden border border-neutral-800">
                <div className="absolute inset-0 bg-[#c5a059]/20 mix-blend-overlay z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <Image src="/live-media/live_asset_2.jpg" alt="KingsGate Build 2" fill className="object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0" />
              </div>
              <div className="relative w-full h-[500px] md:h-[700px] group overflow-hidden border border-neutral-800">
                <div className="absolute inset-0 bg-[#c5a059]/20 mix-blend-overlay z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <Image src="/live-media/live_asset_3.jpg" alt="KingsGate Build 5" fill className="object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0" />
              </div>
            </motion.div>

            {/* Column 3 (Scrolls Up Faster) */}
            <motion.div style={{ y: y3 }} className="flex flex-col gap-6 lg:gap-8 relative top-[50px] md:top-[100px]">
              <div className="relative w-full h-[450px] md:h-[650px] group overflow-hidden border border-neutral-800">
                <div className="absolute inset-0 bg-[#c5a059]/20 mix-blend-overlay z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <Image src="/live-media/live_asset_4.jpg" alt="KingsGate Build 3" fill className="object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0" />
              </div>
              <div className="relative w-full h-[550px] md:h-[750px] group overflow-hidden border border-neutral-800">
                <div className="absolute inset-0 bg-[#c5a059]/20 mix-blend-overlay z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <Image src="/live-media/live_asset_5.jpg" alt="KingsGate Build 6" fill className="object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0" />
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 4. TRUST MATRIX */}
      <section className="bg-black text-white py-32 border-y border-neutral-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#c5a059]/10 via-black to-black pointer-events-none"></div>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-6xl md:text-9xl font-black uppercase tracking-tighter mb-16 text-[#c5a059] opacity-90 text-center">
            Trust & Precision
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 border border-[#c5a059]/20 bg-black/60 backdrop-blur-md">
            <div className="group border-b md:border-b-0 md:border-r border-[#c5a059]/20 p-16 flex flex-col justify-between hover:bg-[#c5a059] hover:text-black transition-all duration-700">
              <div>
                <h3 className="text-2xl font-bold uppercase tracking-widest mb-4">Rating</h3>
                <div className="flex gap-2 mb-10 text-[#c5a059] group-hover:text-black transition-colors duration-700">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-12 h-12 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-8xl lg:text-[11rem] font-black leading-none tracking-tighter drop-shadow-2xl">5.0</p>
            </div>

            <div className="group border-b md:border-b-0 md:border-r border-[#c5a059]/20 p-16 flex flex-col justify-between hover:bg-[#c5a059] hover:text-black transition-all duration-700">
              <h3 className="text-2xl font-bold uppercase tracking-widest mb-10">Verified<br/>Reviews</h3>
              <p className="text-8xl lg:text-[11rem] font-black leading-none tracking-tighter drop-shadow-2xl">95</p>
            </div>

            <div className="group p-16 flex flex-col justify-between hover:bg-[#c5a059] hover:text-black transition-all duration-700">
              <h3 className="text-2xl font-bold uppercase tracking-widest mb-10">Years<br/>Experience</h3>
              <p className="text-8xl lg:text-[11rem] font-black leading-none tracking-tighter drop-shadow-2xl">17+</p>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
