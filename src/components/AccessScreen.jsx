import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import ParticleSystem from './ParticleSystem';
import AuthForm from './AuthForm';
import CursorGlow from './CursorGlow';

const AccessScreen = ({ onSuccess }) => {
  const [textIndex, setTextIndex] = useState(0);
  const subtitleText = "Enter Security Password to Access PREMEX";

  useEffect(() => {
    // Typing effect for subtitle
    if (textIndex < subtitleText.length) {
      const timeout = setTimeout(() => {
        setTextIndex((prev) => prev + 1);
      }, 50); // Speed of typing
      return () => clearTimeout(timeout);
    }
  }, [textIndex, subtitleText.length]);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-8 overflow-hidden bg-dark-bg">
      {/* Background Layers */}
      <div className="bg-noise"></div>
      <div className="bg-grid absolute inset-0 z-0 opacity-40"></div>
      
      {/* Moving Scanline */}
      <div className="fixed top-0 left-0 w-full h-[15vh] bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent animate-scanline z-30 pointer-events-none"></div>

      {/* Particle System */}
      <ParticleSystem />
      <CursorGlow />

      {/* Main UI Container */}
      <motion.div 
        className="relative z-20 w-full max-w-4xl p-1 lg:p-2 border border-neon-green/30"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        {/* Glowing border effects on corners */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-neon-green shadow-[-5px_-5px_20px_#00ff9d]"></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-neon-green shadow-[5px_-5px_20px_#00ff9d]"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-neon-green shadow-[-5px_5px_20px_#00ff9d]"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-neon-green shadow-[5px_5px_20px_#00ff9d]"></div>
        
        {/* Core content wrapper with inner glassmorphism and flicker effect */}
        <div className="relative w-full h-full p-10 flex flex-col items-center justify-center animate-flicker glass-panel" style={{ minHeight: '600px'}}>
          
          <div className="flex flex-col items-center mb-10 w-full">
            {/* Header section with slashes */}
            <motion.div 
              className="flex items-center space-x-6"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <div className="w-16 h-[2px] bg-gradient-to-r from-transparent to-cyber-cyan hidden sm:block"></div>
              <h1 className="text-3xl md:text-5xl font-sans tracking-[0.2em] font-light text-neon-green text-glow uppercase">
                Secure Access
              </h1>
              <div className="w-16 h-[2px] bg-gradient-to-l from-transparent to-cyber-cyan hidden sm:block"></div>
            </motion.div>

            {/* Glowing horizontal lines below header */}
            <motion.div 
              className="w-full max-w-lg flex items-center justify-center mt-6 mb-8"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1, duration: 1 }}
            >
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
            </motion.div>

            {/* Subtitle with typing effect */}
            <div className="h-8">
              <p className="text-neon-green/90 font-sans tracking-widest text-sm md:text-lg text-glow-sm">
                {subtitleText.substring(0, textIndex)}
                <span className="animate-pulse ml-1 inline-block w-2 border-b-2 border-neon-green top-1 relative"></span>
              </p>
            </div>
          </div>

          {/* Form */}
          <AuthForm onSuccess={onSuccess} />

          {/* Bottom decorative HUD element */}
          <div className="absolute bottom-6 w-full flex justify-center items-center px-10">
            <div className="h-[2px] w-1/3 bg-gradient-to-r from-transparent via-neon-green/20 to-transparent relative overflow-hidden">
               {/* Moving particle on line */}
               <motion.div 
                 className="absolute left-0 top-0 h-full w-[20%] bg-cyber-cyan shadow-[0_0_10px_#00e5ff]"
                 animate={{ left: ['-20%', '120%'] }}
                 transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
               />
            </div>
          </div>
          
        </div>
      </motion.div>
    </div>
  );
};

export default AccessScreen;
