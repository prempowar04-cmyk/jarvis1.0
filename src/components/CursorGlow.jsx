import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const CursorGlow = () => {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.div
      className="fixed pointer-events-none z-50 rounded-full blur-2xl opacity-40 bg-neon-green"
      style={{
        width: '150px',
        height: '150px',
      }}
      animate={{
        x: mousePos.x - 75,
        y: mousePos.y - 75,
      }}
      transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 0.5 }}
    />
  );
};

export default CursorGlow;
