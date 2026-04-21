import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const AuthForm = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle, checking, error, success

  const handleVerify = () => {
    if (!password) return;
    setStatus('checking');
    setTimeout(() => {
      if (password.toLowerCase() === 'premex') {
        setStatus('success');
        // Navigate to HUD after success animation
        setTimeout(() => { if (onSuccess) onSuccess(); }, 1800);
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      }
    }, 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleVerify();
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-10 z-20 relative w-full max-w-md">
      {/* Password Input Area */}
      <motion.div 
        className="w-full relative"
        whileFocus="focused"
        initial="idle"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-neon-green to-cyber-cyan opacity-20 blur rounded-sm group-focus-within:opacity-50 transition duration-500"></div>
        <motion.div 
          className="relative glass-panel rounded-sm flex justify-center items-center h-16 w-full"
          variants={{
            focused: { scale: 1.05, boxShadow: '0 0 20px rgba(0, 255, 157, 0.4)' },
            idle: { scale: 1, boxShadow: '0 0 0px rgba(0,0,0,0)' }
          }}
        >
          {/* Display dots instead of text to match the image precisely */}
          <div className="absolute inset-0 flex items-center justify-center space-x-3 pointer-events-none">
             {password.split('').map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-full bg-[#c0ffeb] shadow-[0_0_8px_#00ff9d]"></div>
             ))}
             {password.length === 0 && (
                <span className="text-neon-green/30 tracking-widest text-sm uppercase">Awaiting Input</span>
             )}
          </div>
          
          <input
              type="password"
              className="w-full h-full bg-transparent outline-none text-white caret-white cursor-text opacity-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
        </motion.div>
      </motion.div>

      {/* Verify Button */}
      <motion.button
        onClick={handleVerify}
        className="relative group border border-neon-green/40 px-16 py-3 overflow-hidden"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Glow behind the button */}
        <div className="absolute inset-0 bg-neon-green/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Metal corners matching Jarvis style */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400"></div>

        <span className="relative z-10 text-white font-sans tracking-widest text-lg font-semibold text-glow-sm">
          {status === 'checking' ? 'PROCESSING...' : 'VERIFY'}
        </span>
      </motion.button>

      {/* Divider */}
      <div className="w-full flex items-center justify-center space-x-2 my-4">
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent to-neon-green/40"></div>
        <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]"></div>
        <div className="h-[1px] w-full bg-gradient-to-l from-transparent to-neon-green/40"></div>
      </div>

      {/* Feedback State (Error / Success) */}
      <div className="h-24 flex items-center justify-center w-full relative">
        <AnimatePresence mode="wait">
          {status === 'error' && (
            <motion.div
              key="error"
              className="text-center absolute"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="text-red-500 font-sans font-bold text-3xl tracking-wider text-glow animate-glitch">
                ACCESS DENIED!
              </h2>
              <p className="text-white text-sm mt-2 opacity-80 uppercase tracking-widest">
                Invalid Password. Try Again
              </p>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              key="success"
              className="text-center absolute"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h2 className="text-neon-green font-sans font-bold text-3xl tracking-wider text-glow">
                ACCESS GRANTED
              </h2>
              <p className="text-white text-sm mt-2 opacity-80 uppercase tracking-widest">
                System Initializing...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Glitch flash overlay on error */}
      {status === 'error' && (
        <motion.div 
          className="fixed inset-0 bg-red-600/10 pointer-events-none mix-blend-overlay z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0, 0.5, 0] }}
          transition={{ duration: 0.4, times: [0, 0.2, 0.4, 0.6, 1] }}
        />
      )}
      
      {/* Green wash on success */}
      {status === 'success' && (
        <motion.div 
          className="fixed inset-0 bg-neon-green/20 pointer-events-none z-50 border-8 border-neon-green blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />
      )}
    </div>
  );
};

export default AuthForm;
