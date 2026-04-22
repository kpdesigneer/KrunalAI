import React, { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { ParticleGlobe } from './components/ParticleGlobe';

function App() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const servicesRef = useRef<HTMLHeadingElement>(null);
  const { scrollYProgress } = useScroll();
  
  // Smooth scroll-driven position for the globe
  const smoothScroll = useSpring(scrollYProgress, { damping: 20, stiffness: 100 });

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

  const handleMouseMoveServices = (e: React.MouseEvent) => {
    if (!servicesRef.current) return;
    const rect = servicesRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    servicesRef.current.style.setProperty('--mouse-x', `${x}px`);
    servicesRef.current.style.setProperty('--mouse-y', `${y}px`);
    servicesRef.current.style.setProperty('--spotlight-opacity', '1');
  };

  const handleMouseLeaveServices = () => {
    if (!servicesRef.current) return;
    servicesRef.current.style.setProperty('--spotlight-opacity', '0');
  };
  
  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <div className="min-h-screen bg-black w-full overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-8 py-5 flex items-center justify-between bg-black/50 backdrop-blur-md border-b border-white/5">
        {/* Logo (Left) */}
        <div className="text-lg font-bold tracking-[0.15em] text-white min-w-[150px]">
          KRUN<span className="text-purple-400">Al</span>
        </div>

        {/* Navigation Links (Center) */}
        <div className="hidden md:flex items-center gap-2 text-sm text-gray-400 font-medium">
          {[
            { name: 'Home', href: '#', id: 'home', onClick: (e: any) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
            { name: 'Work', href: '#work', id: 'work', onClick: (e: any) => scrollToSection(e, 'work') },
            { name: 'Services', href: '#services', id: 'services', onClick: (e: any) => scrollToSection(e, 'services') },
            { name: 'Contact', href: '#contact', id: 'contact', onClick: (e: any) => scrollToSection(e, 'contact') }
          ].map((item) => (
            <a 
              key={item.name}
              href={item.href}
              onClick={item.onClick}
              className="px-5 py-2.5 rounded-lg relative group transition-all duration-500 hover:text-white"
            >
              {/* Spherical Glow Background (Hidden until hover) */}
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20 blur-md -z-10" />
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 border border-white/10 bg-white/[0.03] -z-10 shadow-[0_0_20px_rgba(168,85,247,0.15)]" />
              
              <span className="relative z-10">{item.name}</span>
            </a>
          ))}
        </div>

        {/* CTA Button (Right) */}
        <div className="min-w-[150px] flex justify-end">
          <a 
            href="#contact" 
            onClick={(e) => scrollToSection(e, 'contact')}
            className="group flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-white/20 rounded-xl hover:border-white/50 transition-all duration-300"
          >
            <span>Contact Me</span>
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold group-hover:scale-110 transition-transform duration-300">↗</span>
          </a>
        </div>
      </nav>

      {/* Fixed 3D Particle Globe Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 45 }}
          eventSource={document.getElementById('root') as HTMLElement}
          eventPrefix="client"
        >
          <ParticleGlobe scrollY={smoothScroll} />
        </Canvas>
      </div>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden z-10">
        {/* Ambient Top-Left Purple Light Ray */}
        <div className="absolute top-[-15%] left-[-10%] w-[50vw] h-[30vw] bg-[#6633ff]/20 blur-[120px] -rotate-45 pointer-events-none z-0" />


        {/* Center Headline — overlapping the globe */}
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
            onClick={(e) => scrollToSection(e, 'contact')}
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] hover:from-[#6d28d9] hover:to-[#2563eb] shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105"
          >
            Contact Me
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
      <section id="services" className="pt-32 pb-64 px-4 relative z-10 bg-transparent">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row">
          {/* Left 50% Empty space as requested */}
          <div className="hidden md:block w-[50%]" />
          
          {/* Right 50% Content area */}
          <div className="w-full md:w-[50%]">
            <div className="mb-16">
              <h2 
                ref={servicesRef}
                onMouseMove={handleMouseMoveServices}
                onMouseLeave={handleMouseLeaveServices}
                className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-white animated-gradient-text cursor-default"
              >
                What I do
              </h2>
              <p className="text-xl text-gray-400 max-w-xl">
                I design it. I build it. I make it work.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service Cards */}
              {[
                { id: '01', title: 'Design', desc: 'From rough ideas to refined experiences—interfaces that feel intuitive, intentional, and alive.' },
                { id: '02', title: 'Build', desc: 'I turn concepts into real, working products—fast, scalable, and built to last.' },
                { id: '03', title: 'Systems', desc: 'Creating structured, scalable systems that keep products consistent, flexible, and future-ready.' },
                { id: '04', title: 'Experiences', desc: 'Designing interactions that feel seamless, engaging, and actually enjoyable to use.' },
                { id: '05', title: 'Ideas → Reality', desc: 'From “what if” to “here it is”—bringing ideas to life through design and execution.' },
                { id: '06', title: 'Innovation', desc: 'Exploring new ways to build, design, and create—pushing beyond the obvious.' },
              ].map((service) => (
                <motion.div 
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 0.5, y: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ 
                    scale: 1.03,
                    translateY: -5,
                    opacity: 1,
                    transition: { duration: 0.3, ease: "easeOut" }
                  }}
                  className="glass-card p-8 group cursor-pointer overflow-hidden relative border border-white/5 hover:border-white/20 hover:bg-white/[0.03] transition-all duration-500 rounded-xl shadow-none hover:shadow-2xl hover:shadow-purple-500/10"
                >
                  {/* Animated vibrant inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-transparent to-blue-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_200%] animate-[gradient-shift_5s_ease_infinite]" />
                  
                  {/* Animated border line on hover */}
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                  <div className="text-sm font-mono text-gray-500 mb-8 group-hover:text-purple-400 transition-colors duration-300">{service.id}</div>
                  <h3 className="text-2xl font-semibold mb-4 text-white/90 group-hover:text-white transition-all duration-300">{service.title}</h3>
                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">{service.desc}</p>
                  
                  <div className="mt-8 flex items-center gap-2 text-sm font-medium text-white/60 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <span className="group-hover:text-white">Explore Services</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Work Section (Exact Replica of 'What I do' Section) */}
      <section id="work" className="py-32 px-4 relative z-10 bg-transparent">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row">
          {/* Left 50% Content area */}
          <div className="w-full md:w-[50%]">
            <div className="mb-16">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-white animated-gradient-text cursor-default">
                Selected Work
              </h2>
              <p className="text-xl text-gray-400 max-w-xl">
                Design across mediums — from pixels to print and motion, built with clarity and intent.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { id: '01', title: 'Graphic Design', cat: 'Visual concepts crafted to communicate, engage, and create strong brand presence.' },
                { id: '02', title: 'UI/UX Design', cat: 'User-focused interfaces designed for clarity, usability, and seamless digital experiences.' },
                { id: '03', title: 'Print Design', cat: 'Tangible design solutions created for impact — from layouts to brand collaterals that translate beautifully in print.' },
                { id: '04', title: 'Video Editing', cat: 'Dynamic visual storytelling through motion, transitions, and sound — crafted to capture attention and elevate content.' }
              ].map((project) => (
                <motion.div 
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 0.5, y: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ 
                    scale: 1.03,
                    translateY: -5,
                    opacity: 1,
                    transition: { duration: 0.3, ease: "easeOut" }
                  }}
                  className="glass-card p-8 group cursor-pointer overflow-hidden relative border border-white/5 hover:border-white/20 hover:bg-white/[0.03] transition-all duration-500 rounded-xl shadow-none hover:shadow-2xl hover:shadow-purple-500/10 aspect-square flex flex-col justify-between"
                >
                  {/* Animated vibrant inner glow (Identical to What I do) */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-transparent to-blue-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_200%] animate-[gradient-shift_5s_ease_infinite]" />
                  
                  {/* Animated border line on hover (Identical to What I do) */}
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <div className="text-sm font-mono text-gray-500 mb-8 group-hover:text-purple-400 transition-colors duration-300">
                        {project.id}
                      </div>
                      <h3 className="text-2xl font-semibold mb-4 text-white/90 group-hover:text-white transition-all duration-300">{project.title}</h3>
                      <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300 text-sm">
                        {project.cat}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm font-medium text-white/60 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      <span className="group-hover:text-white">View Work</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right 50% Empty space to mirror What I Do */}
          <div className="hidden md:block w-[50%]" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 pt-20 pb-10 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div>
            <h2 className="text-3xl font-bold mb-6">Bold ideas are easy. I make them real.</h2>
            <button className="px-6 py-3 bg-white text-black rounded-full font-medium hover:scale-105 transition-transform">
              Let's work together
            </button>
          </div>
          <div className="flex gap-16">
            <div className="flex flex-col gap-4 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Services</a>
              <a href="#" className="hover:text-white transition-colors">Portfolio</a>
              <a href="#" className="hover:text-white transition-colors">Demos</a>
            </div>
            <div className="flex flex-col gap-4 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Instagram</a>
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
