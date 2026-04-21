import React, { useRef, useMemo } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { ParticleGlobe } from './components/ParticleGlobe';

function App() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // High-precision scroll tracking for global transitions
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Smooth out the scroll delta for buttery transitions
  const smoothProg = useSpring(scrollYProgress, { damping: 25, stiffness: 60 });

  // Globe Orchestration: Position, Scale, and Shape (Morphing)
  // Transition kicks in around 25% of the page scroll (entering 2nd section)
  const globeX = useTransform(smoothProg, [0, 0.35, 1], ["0%", "-35%", "-35%"]);
  const globeY = useTransform(smoothProg, [0, 0.35, 1], ["0%", "20%", "20%"]);
  const globeScale = useTransform(smoothProg, [0, 0.35], [1, 0.9]);
  const globeShape = useTransform(smoothProg, [0.1, 0.35], [0, 1]); // 0 = Sphere, 1 = Box

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!headlineRef.current) return;
    const rect = headlineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    headlineRef.current.style.setProperty('--mouse-x', `${x}px`);
    headlineRef.current.style.setProperty('--mouse-y', `${y}px`);
    headlineRef.current.style.setProperty('--spotlight-opacity', '1');
  };

  const handleMouseLeave = () => {
    if (!headlineRef.current) return;
    headlineRef.current.style.setProperty('--spotlight-opacity', '0');
  };
  
  return (
    <div ref={containerRef} className="relative bg-black w-full overflow-x-hidden">
      {/* 3D PERSISTENT BACKGROUND LAYER */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div 
          style={{ x: globeX, y: globeY, scale: globeScale }}
          className="w-full h-full flex items-center justify-center translate-y-[-10vh]"
        >
          <Canvas
            camera={{ position: [0, 0, 8], fov: 45 }}
            eventSource={containerRef as React.RefObject<HTMLElement>}
            eventPrefix="client"
          >
            <ParticleGlobe externalProgress={globeShape} />
          </Canvas>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-8 py-5 flex items-center justify-between bg-black/50 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-10">
          <div className="text-lg font-bold tracking-[0.15em] text-white">
            KRUN<span className="text-purple-400">Al</span>
          </div>
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
          <span className="text-[12vw] font-bold tracking-[0.15em] text-white/[0.03] whitespace-nowrap">
            KRUN<span className="text-purple-500/20">Al</span>
          </span>
        </div>

        <motion.div 
          className="relative z-10 text-center px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <h1 
            ref={headlineRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] animated-gradient-text whitespace-nowrap pb-3 cursor-default"
          >
            I build what others <em className="italic font-extrabold pointer-events-none">imagine.</em>
          </h1>
        </motion.div>

        {/* Bottom-Left: Subheadline + CTA */}
        <motion.div 
          className="absolute bottom-12 left-8 md:left-14 z-10 max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
        >
          <p className="text-sm md:text-base text-gray-400 leading-relaxed mb-6 italic">
            Less talk. More building.<br />
            Ideas are easy. I make them real.
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

      {/* Services Section - Horizontal Scroll Container */}
      <section id="services" className="relative h-[400vh] z-10 bg-transparent">
        <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center px-8 md:px-20">
          {/* Header Info */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 ml-[45%] md:ml-[35%] pr-10">
            <div>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-white">Our Services</h2>
            </div>
            <p className="text-gray-400 text-sm md:text-base max-w-sm ml-auto">
              We offer comprehensive digital solutions that transform your business and drive innovation across every touchpoint.
            </p>
          </div>

          {/* Cards Wrapper */}
          <div className="relative h-[65vh] w-full overflow-visible">
            <motion.div 
              style={{ x: useTransform(smoothProg, [0.35, 1], ["0%", "-150%"]) }}
              className="flex gap-8 absolute left-[45%] md:left-[35%] top-0 h-full w-max"
            >
              {[
                { 
                  id: '01', 
                  title: 'Product Design', 
                  desc: 'End-to-end product design—from research and UX flows to polished UI systems and developer-ready handoff.',
                  services: ['User Research & Strategy', 'UX Flows & Wireframes', 'UI Systems & Prototypes', 'Design Ops & Dev Handoff'],
                  tools: ['Figma', 'Sketch', 'Adobe XD', 'Blender', 'Spline', 'AE'],
                  accent: 'bg-[#3b3b8e]' 
                },
                { 
                  id: '02', 
                  title: 'Development', 
                  desc: 'Robust, scalable products across web and mobile—from elegant UIs to reliable APIs and infrastructure.',
                  services: ['React & Next.js', 'Native Mobile App', 'Cloud Infrafructure', 'API & Database Dev'],
                  tools: ['React', 'Node', 'AWS', 'Swift', 'Kotlin', 'Go'],
                  accent: 'bg-[#1a1a1a] border border-white/5' 
                },
                { 
                  id: '03', 
                  title: 'AI Development', 
                  desc: 'Build production-ready AI—rapid prototyping to deployed models.',
                  services: ['NLP & LLM Training', 'Computer Vision', 'Predictive Analytics', 'AI Strategy'],
                  tools: ['Python', 'PyTorch', 'OpenAI', 'Vertex AI', 'Langchain'],
                  accent: 'bg-[#1a1a1a] border border-white/5' 
                },
                { 
                  id: '04', 
                  title: 'GTM Strategy', 
                  desc: 'Data-driven go-to-market for SaaS and AI—clear positioning, smart pricing.',
                  services: ['Market Analysis', 'Brand Positioning', 'Launch Planning', 'Growth Loops'],
                  tools: ['Segment', 'Amplitude', 'Hubspot', 'Notion'],
                  accent: 'bg-[#1a1a1a] border border-white/5' 
                }
              ].map((service) => (
                <div 
                  key={service.id}
                  className={`${service.accent} w-[300px] md:w-[450px] h-full rounded-[2.5rem] p-10 flex flex-col justify-between overflow-hidden relative shadow-2xl`}
                >
                  <div className="flex justify-between items-start">
                    {service.id === '01' ? (
                      <h3 className="text-3xl md:text-4xl font-bold leading-tight">{service.title}</h3>
                    ) : (
                      <div className="text-4xl font-bold opacity-80">{service.id}</div>
                    )}
                    <span className="text-2xl">↗</span>
                  </div>

                  <p className="text-gray-300 text-sm md:text-base leading-relaxed mt-6">
                    {service.desc}
                  </p>

                  <div className="mt-10 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">Services</div>
                      <ul className="text-[11px] md:text-xs text-gray-400 space-y-1">
                        {service.services.map(s => <li key={s}>{s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">Tools</div>
                      <div className="grid grid-cols-3 gap-2 opacity-60">
                        {service.tools.map(t => (
                          <div key={t} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-bold">
                            {t.substring(0, 1)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {service.id !== '01' && (
                    <div className="mt-auto pt-10">
                      <h3 className="text-xl font-bold">{service.title}</h3>
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
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
          <span>KRUN<span className="text-purple-400/50">Al</span>, © 2026. All rights reserved.</span>
          <span>Based in India</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
