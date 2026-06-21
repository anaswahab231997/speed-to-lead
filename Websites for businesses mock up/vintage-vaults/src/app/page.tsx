import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-200 font-serif selection:bg-[#4a1c1c] selection:text-white">
      <main className="flex flex-col items-center">
        {/* Hero Section */}
        <section className="relative w-full h-[80vh] flex items-center justify-center overflow-hidden border-b border-[#301b1b]">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a]/80 via-transparent to-[#1a1a1a] z-10" />
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1596484552834-6a58f84bfc4c?q=80&w=2000&auto=format&fit=crop')" }}
          />
          <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
            <h2 className="text-amber-700 tracking-widest uppercase text-sm mb-4 font-sans font-semibold">
              Bespoke Wine Preservation
            </h2>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 text-white drop-shadow-2xl leading-tight">
              Vintage Vaults <br/>
              <span className="text-[#8c3636] italic font-light">Custom Cellars</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
              Toronto's premier architectural firm for ultra-luxury, climate-controlled wine environments.
            </p>
          </div>
        </section>

        {/* Services Section */}
        <section className="w-full py-24 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {/* Service 1 */}
            <article className="group flex flex-col items-start border-t border-[#4a1c1c] pt-8">
              <span className="text-[#8c3636] font-mono text-sm mb-4">01</span>
              <h3 className="text-3xl font-semibold text-white mb-4">Climate-Controlled Environments</h3>
              <p className="text-gray-400 leading-relaxed">
                Precision-engineered atmospheric systems ensuring perfect humidity and temperature stability for your rarest vintages.
              </p>
            </article>

            {/* Service 2 */}
            <article className="group flex flex-col items-start border-t border-[#4a1c1c] pt-8">
              <span className="text-[#8c3636] font-mono text-sm mb-4">02</span>
              <h3 className="text-3xl font-semibold text-white mb-4">Custom Oak Racking</h3>
              <p className="text-gray-400 leading-relaxed">
                Handcrafted mahogany and dark oak architectural shelving, designed to present your collection with absolute majesty.
              </p>
            </article>

            {/* Service 3 */}
            <article className="group flex flex-col items-start border-t border-[#4a1c1c] pt-8">
              <span className="text-[#8c3636] font-mono text-sm mb-4">03</span>
              <h3 className="text-3xl font-semibold text-white mb-4">Glass Enclosures</h3>
              <p className="text-gray-400 leading-relaxed">
                Frameless, UV-protected thermal glass installations that transform your cellar into a breathtaking visual centerpiece.
              </p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
