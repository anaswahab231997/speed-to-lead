'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <motion.section 
      className="relative w-full h-screen min-h-[600px] flex items-center justify-center overflow-hidden bg-[#0a0a0a] text-white"
      initial="rest"
      whileHover="hover"
    >
      {/* Background Image with Heavy Spring Mutation */}
      <motion.div
        className="absolute inset-0 w-full h-full origin-center"
        variants={{
          rest: { 
            scale: 1,
            filter: 'grayscale(100%) brightness(0.35)'
          },
          hover: { 
            scale: 1.08,
            filter: 'grayscale(0%) brightness(0.65)'
          }
        }}
        transition={{
          type: 'spring',
          stiffness: 30,
          damping: 15,
          mass: 2.5,
        }}
      >
        <Image 
          src="/legacy-media/native_asset_2_upscaled.jpg"
          alt="KingsGate Luxury Custom Build"
          fill
          priority={true}
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>

      {/* Dark Overlay for Luxury Feel */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-black/20 to-[#0a0a0a]/90 pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-5xl mx-auto pointer-events-none">
        <motion.h1 
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight tracking-[0.15em] uppercase mb-8 drop-shadow-lg"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 40,
            damping: 20,
            mass: 1.5,
            delay: 0.1
          }}
        >
          KingsGate
          <span className="block mt-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium tracking-[0.2em] text-white/90">
            Luxury Homes Inc.
          </span>
        </motion.h1>
        
        <motion.p 
          className="text-base sm:text-lg md:text-xl font-light text-gray-300 leading-relaxed mb-12 max-w-3xl drop-shadow-md"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 40,
            damping: 20,
            mass: 1.5,
            delay: 0.3
          }}
        >
          KingsGate Luxury Homes designs and builds high-end custom homes across Toronto and the GTA with a controlled, permit-ready process.
        </motion.p>

        <motion.button 
          className="pointer-events-auto px-10 py-4 border border-white/30 bg-black/40 backdrop-blur-md text-white uppercase tracking-[0.25em] text-xs sm:text-sm font-medium transition-all duration-500 hover:bg-white hover:text-black hover:border-white"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 40,
            damping: 20,
            mass: 1.5,
            delay: 0.5
          }}
        >
          Explore Projects
        </motion.button>
      </div>
    </motion.section>
  );
}
