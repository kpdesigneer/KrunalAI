
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { ParticleGlobe } from './components/ParticleGlobe';

function App() {
  
  return (
    <div className="min-h-screen bg-black w-full overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-8 py-5 flex items-center justify-between bg-black/50 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-10">
          <div className="text-lg font-bold tracking-[0.15em] uppercase text-white">Krunal AI</div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <a href="#work" className="hover:text-white transition-colors duration-300">Work</a>
            <a href="#company" className="hover:text-white transition-colors duration-300">Company</a>
            <a href="#services" className="hover:text-white transition-colors duration-300">Services</a>
            <a href="#contact" className="hover:text-white transition-colors duration-300">Contact</a>
          </div>
        </div>
        <a href="#contact" className="group flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-white/20 rounded-full hover:border-white/50 transition-all duration-300">
          <span>Start Your Project</span>
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold group-hover:scale-110 transition-transform duration-300">↗</span>
        </a>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Ambient Top-Left Purple Light Ray */}
        <div className="absolute top-[-15%] left-[-10%] w-[50vw] h-[30vw] bg-[#6633ff]/20 blur-[120px] -rotate-45 pointer-events-none z-0" />

        {/* Large faded background brand text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1] select-none">
          <span className="text-[12vw] font-bold tracking-[0.15em] uppercase text-white/[0.03] whitespace-nowrap">KRUNAL AI</span>
        </div>

        {/* 3D Particle Globe Background */}
        <div className="absolute inset-0 z-[2] pointer-events-none">
          <Canvas
            camera={{ position: [0, 0, 8], fov: 45 }}
            eventSource={document.getElementById('root') as HTMLElement}
            eventPrefix="client"
          >
            <ParticleGlobe />
          </Canvas>
        </div>

        {/* Center Headline — overlapping the globe */}
        <motion.div 
          className="relative z-10 text-center px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] animated-gradient-text whitespace-nowrap pb-3">
            I build what others <em className="italic font-extrabold">imagine.</em>
          </h1>
        </motion.div>

        {/* Bottom-Left: Subheadline + CTA */}
        <motion.div 
          className="absolute bottom-12 left-8 md:left-14 z-10 max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
        >
          <p className="text-sm md:text-base text-gray-400 leading-relaxed mb-6">
            We empower organizations with AI that turns complex challenges into real-world outcomes.
          </p>
          <a 
            href="#contact" 
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] hover:from-[#6d28d9] hover:to-[#2563eb] shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105"
          >
            Start Your Project
            <span className="group-hover:translate-x-0.5 transition-transform duration-300">→</span>
          </a>
        </motion.div>

        {/* Bottom-Right: Stats */}
        <motion.div 
          className="absolute bottom-12 right-8 md:right-14 z-10 flex gap-8 md:gap-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
        >
          {[
            { value: '50+', label: 'Projects Delivered' },
            { value: '100%', label: 'Client Satisfaction' },
            { value: '24/7', label: 'Support Available' },
          ].map((stat) => (
            <div key={stat.label} className="text-right">
              <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-32 px-4 relative z-10 bg-black">
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
          <span>Krunal AI, © 2026. All rights reserved.</span>
          <span>Based in India</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
