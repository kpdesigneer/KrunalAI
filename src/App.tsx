import React, { useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { ParticleGlobe } from './components/ParticleGlobe';

function App() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  
  return (
    <div className="min-h-screen bg-black w-full overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-8 py-5 flex items-center justify-between glass-card !rounded-none border-t-0 border-x-0 !bg-black/50">
        <div className="flex items-center gap-8">
          <div className="text-xl font-bold tracking-tight">Krunal AI</div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <a href="#work" className="hover:text-white transition-colors">Work</a>
            <a href="#company" className="hover:text-white transition-colors">Company</a>
          </div>
        </div>
        <button className="px-5 py-2 text-sm font-medium border border-white/20 rounded-full hover:bg-white hover:text-black transition-all">
          Contact
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center pt-20 px-4 overflow-hidden">
        {/* Ambient Top-Left Purple Light Ray */}
        <div className="absolute top-[-15%] left-[-10%] w-[50vw] h-[30vw] bg-[#6633ff]/20 blur-[120px] -rotate-45 pointer-events-none z-0" />

        {/* 3D Particle Globe Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Canvas
            camera={{ position: [0, 0, 8], fov: 45 }}
            eventSource={document.getElementById('root') as HTMLElement}
            eventPrefix="client"
          >
            <ParticleGlobe />
          </Canvas>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-32 px-4 relative z-10 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16">
            <div>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-white">Our Services</h2>
              <p className="text-xl text-gray-400 max-w-xl">
                We offer comprehensive digital solutions that transform your business and drive innovation across every touchpoint.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Service Cards */}
            {[
              { id: '01', title: 'Product Design', desc: 'End-to-end product design—from research and UX flows to polished UI systems.' },
              { id: '02', title: 'Development', desc: 'Robust, scalable products across web and mobile—from elegant UIs to reliable APIs.' },
              { id: '03', title: 'GTM Strategy', desc: 'Data-driven go-to-market for SaaS and AI—clear positioning, smart pricing.' },
              { id: '04', title: 'Healthcare Apps', desc: 'Secure, compliant healthcare software—built for HIPAA and auditability.' },
              { id: '05', title: 'AI Development', desc: 'Build production-ready AI—rapid prototyping to deployed models.' },
              { id: '06', title: 'IoT Development', desc: 'From device firmware to cloud ingestion—secure, reliable IoT systems.' },
            ].map((service) => (
              <motion.div 
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
                className="glass-card p-8 group cursor-pointer overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-sm font-mono text-gray-500 mb-8">{service.id}</div>
                <h3 className="text-2xl font-semibold mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">{service.title}</h3>
                <p className="text-gray-400 leading-relaxed">{service.desc}</p>
                
                <div className="mt-8 flex items-center gap-2 text-sm text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Explore Services</span>
                  <span>→</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 pt-20 pb-10 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div>
            <h2 className="text-3xl font-bold mb-6">We turn bold ideas into powerful digital realities.</h2>
            <button className="px-6 py-3 bg-white text-black rounded-full font-medium hover:scale-105 transition-transform">
              Let's work together
            </button>
          </div>
          <div className="flex gap-16">
            <div className="flex flex-col gap-4 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Services</a>
              <a href="#" className="hover:text-white transition-colors">Atom</a>
              <a href="#" className="hover:text-white transition-colors">Demos</a>
            </div>
            <div className="flex flex-col gap-4 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Resources</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 text-sm text-gray-600 flex justify-between">
          <span>Antimatter AI, © 2026. All rights reserved.</span>
          <span>Based in Atlanta, GA</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
