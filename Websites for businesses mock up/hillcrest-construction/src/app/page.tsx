export default function Home() {
  return (
    <div className="min-h-screen bg-[#111827] text-gray-200">
      <main className="flex flex-col items-center pt-24">
        {/* Hero Section */}
        <section className="relative w-full h-[85vh] flex items-center justify-start overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/80 to-transparent z-10" />
          <div 
            className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-60"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541888082470-fa41508923dc?q=80&w=2000&auto=format&fit=crop&fm=webp')" }}
          />
          <div className="relative z-20 px-6 md:px-16 lg:px-32 max-w-7xl">
            <div className="h-1 w-24 bg-[#FE602F] mb-8" />
            <h1 
              className="text-6xl md:text-8xl font-black mb-6 text-white uppercase tracking-tighter leading-none"
              style={{ fontFamily: 'var(--font-roboto-condensed)' }}
            >
              Permanent<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-gray-600">
                Structures
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl leading-relaxed mb-10 font-medium">
              We engineer commercial and high-end residential frameworks built to outlast generations.
            </p>
            <button className="px-8 py-4 bg-[#FE602F] text-white font-bold uppercase tracking-widest text-sm hover:bg-[#e0552a] transition-colors">
              View Our Portfolio
            </button>
          </div>
        </section>

        {/* Services / Heavy Duty Section */}
        <section className="w-full py-32 px-6 md:px-16 lg:px-32 max-w-7xl mx-auto border-t border-[#1F2937] bg-[#111827]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
            <div className="order-2 md:order-1 relative aspect-[4/5] w-full">
              <div className="absolute inset-0 border-4 border-[#1F2937] translate-x-4 translate-y-4" />
              <div 
                className="absolute inset-0 bg-cover bg-center grayscale hover:grayscale-0 transition-all duration-700"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1000&auto=format&fit=crop&fm=webp')" }}
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 
                className="text-4xl md:text-6xl font-bold text-white mb-8 uppercase tracking-tight"
                style={{ fontFamily: 'var(--font-roboto-condensed)' }}
              >
                Industrial <span className="text-[#FE602F]">Precision</span>
              </h2>
              <div className="space-y-12">
                <article className="pl-6 border-l-2 border-[#1F2937] hover:border-[#FE602F] transition-colors">
                  <h3 className="text-2xl font-bold text-white mb-3">Commercial Builds</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Large-scale infrastructural development engineered with exacting tolerances and modern materials.
                  </p>
                </article>
                <article className="pl-6 border-l-2 border-[#1F2937] hover:border-[#FE602F] transition-colors">
                  <h3 className="text-2xl font-bold text-white mb-3">High-End Residential</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Bespoke luxury framing. We pour the foundation for architecture that defines the skyline.
                  </p>
                </article>
              </div>
            </div>
          </div>
        </section>

        {/* Legacy Preservation & Trust Signals */}
        <section className="w-full py-32 bg-[#0d1117] border-t border-[#1F2937]">
          <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-32">
            <div className="text-center mb-20">
              <div className="inline-block px-4 py-1 border border-[#FE602F] text-[#FE602F] text-xs font-bold tracking-widest uppercase mb-6">
                Established 1989
              </div>
              <h2 
                className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-8"
                style={{ fontFamily: 'var(--font-roboto-condensed)' }}
              >
                ⭐⭐⭐⭐⭐ On Your Team Since 1989
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                Hillcrest Construction is a construction and renovation general contractor - specializing in the highest quality work. We’re workplace orientated with strong technical know-how, years of experience and a customer-centered philosophy that adapts the construction process to your workplace.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mt-24">
              <div className="bg-[#111827] p-12 border border-[#1F2937]">
                <h3 className="text-2xl font-bold text-white mb-6 uppercase tracking-wider" style={{ fontFamily: 'var(--font-roboto-condensed)' }}>
                  Client Testimonial
                </h3>
                <blockquote className="text-gray-400 italic leading-loose">
                  "As a Not-for-Profit Housing Organization operating a number properties in the Toronto area, Hillcrest Construction has performed various renovations and constructions projects for us during the past few years. We have found their work to be of good quality, performed at reasonable prices. They practiced open communication with us, and stand behind their work. We would have no hesitation recommending their services."
                </blockquote>
              </div>
              
              <div className="bg-[#111827] p-12 border border-[#1F2937]">
                <h3 className="text-2xl font-bold text-white mb-6 uppercase tracking-wider" style={{ fontFamily: 'var(--font-roboto-condensed)' }}>
                  High-Profile Corporate Clients
                </h3>
                <ul className="space-y-4">
                  {[
                    "The YMCA of Greater Toronto",
                    "Seneca College",
                    "Covenant House",
                    "Magna International",
                    "7-Eleven Stores",
                    "Massimo Dutti",
                    "ZARA",
                    "Durham District School Board"
                  ].map((client) => (
                    <li key={client} className="flex items-center text-gray-400">
                      <span className="w-2 h-2 bg-[#FE602F] mr-4 block" />
                      {client}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
