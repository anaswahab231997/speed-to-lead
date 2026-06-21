import React from 'react';

const services = [
  {
    title: 'CUSTOM HOME BUILDING',
    description: 'Our custom home building services are the epitome of luxury & precision. We offer end-to-end solutions, from concept to completion, ensuring your dream home reflects your vision and surpasses expectations.',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  {
    title: 'HOME RENOVATION & REMODELING',
    description: 'Our home renovation and remodeling services breathe new life into your living spaces. We specialize in transforming your current home into a modern, functional, and aesthetically pleasing haven.',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  },
  {
    title: 'CONSTRUCTION MANAGEMENT',
    description: 'Our construction management services orchestrate your project with precision. From inception to completion, we ensure efficiency, quality, & adherence to timelines, turning your vision into reality.',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  }
];

export default function ServicesGrid() {
  return (
    <section className="bg-[#0a0a0a] text-neutral-100 py-24 lg:py-32 px-6 sm:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20 flex flex-col items-center">
          <span className="text-[#c5a059] uppercase tracking-[0.3em] text-xs font-semibold mb-4">Excellence in Every Detail</span>
          <h2 className="text-3xl md:text-5xl font-light tracking-widest text-center uppercase">
            Our Services
          </h2>
          <div className="w-12 h-[1px] bg-[#c5a059] mt-8"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div 
              key={index}
              className="group relative border border-neutral-800 bg-[#111111] p-10 transition-all duration-700 hover:border-[#c5a059] hover:-translate-y-2 cursor-pointer flex flex-col items-center text-center"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#c5a059]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="text-[#c5a059] mb-8 transform group-hover:scale-110 transition-transform duration-700">
                {service.icon}
              </div>
              
              <h3 className="text-lg md:text-xl font-normal tracking-[0.15em] mb-6 uppercase">
                {service.title}
              </h3>
              
              <p className="text-neutral-400 font-light leading-relaxed text-sm md:text-base">
                {service.description}
              </p>

              <div className="mt-auto pt-10">
                <span className="inline-flex items-center text-xs uppercase tracking-[0.2em] text-[#c5a059] transition-colors duration-300">
                  Explore Service
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
