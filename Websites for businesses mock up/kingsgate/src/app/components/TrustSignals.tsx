import React from 'react';

const TrustSignals = () => {
  return (
    <section className="bg-black text-white py-24 border-y-8 border-white">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-6xl md:text-9xl font-black uppercase tracking-tighter mb-12">
          Trust Matrix
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 border-4 border-white">
          <div className="group border-b-4 md:border-b-0 md:border-r-4 border-white p-12 flex flex-col justify-between hover:bg-white hover:text-black transition-colors">
            <div>
              <h3 className="text-2xl font-bold uppercase tracking-widest mb-2">Rating</h3>
              <div className="flex gap-2 mb-8">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-10 h-10 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
            </div>
            <p className="text-8xl lg:text-[10rem] font-black leading-none tracking-tighter">5.0</p>
          </div>

          <div className="group border-b-4 md:border-b-0 md:border-r-4 border-white p-12 flex flex-col justify-between hover:bg-white hover:text-black transition-colors">
            <h3 className="text-2xl font-bold uppercase tracking-widest mb-8">Verified<br/>Reviews</h3>
            <p className="text-8xl lg:text-[10rem] font-black leading-none tracking-tighter">95</p>
          </div>

          <div className="group p-12 flex flex-col justify-between hover:bg-white hover:text-black transition-colors">
            <h3 className="text-2xl font-bold uppercase tracking-widest mb-8">Years<br/>Experience</h3>
            <p className="text-8xl lg:text-[10rem] font-black leading-none tracking-tighter">17+</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSignals;
