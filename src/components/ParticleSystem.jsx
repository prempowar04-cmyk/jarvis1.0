import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const ParticleSystem = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate static initial particles for background depth
    const initial = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
      isSpark: Math.random() > 0.8
    }));
    setParticles(initial);

    // Dynamic sparks that appear and disappear randomly
    const interval = setInterval(() => {
      setParticles(prev => {
        const id = Date.now();
        const newSpark = {
          id,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 2,
          duration: Math.random() * 2 + 1,
          delay: 0,
          isSpark: true
        };
        // Keep array size manageable
        return [...prev.slice(-40), newSpark];
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className={`absolute rounded-full ${
            p.isSpark 
              ? 'bg-cyber-cyan shadow-[0_0_10px_#00e5ff]' 
              : 'bg-neon-green shadow-[0_0_5px_#00ff9d] opacity-30'
          }`}
          style={{
            left: `${p.x}vw`,
            top: `${p.y}vh`,
            width: `${p.size}px`,
            height: `${p.size}px`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: p.isSpark ? [0, 1, 0] : [0.1, 0.5, 0.1], 
            scale: p.isSpark ? [0, 1.5, 0] : [1, 1.2, 1] 
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: p.isSpark ? 0 : Infinity,
            repeatType: 'reverse'
          }}
        />
      ))}

      {/* Occasional lightning streaks */}
      <motion.div 
        className="absolute top-0 left-1/3 w-[2px] h-[30vh] bg-neon-green shadow-[0_0_15px_#00ff9d]"
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: [0, 0.8, 0], scaleY: [0, 1, 0] }}
        transition={{ duration: 0.2, delay: 5, repeat: Infinity, repeatDelay: 8 }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-1/4 w-[10vw] h-[1px] bg-cyber-cyan shadow-[0_0_15px_#00e5ff]"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: [0, 1, 0], scaleX: [0, 1, 0] }}
        transition={{ duration: 0.15, delay: 3, repeat: Infinity, repeatDelay: 6 }}
      />
    </div>
  );
};

export default ParticleSystem;
