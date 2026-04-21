import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AccessScreen from './components/AccessScreen'
import JarvisHUD from './components/JarvisHUD'

function App() {
  const [authenticated, setAuthenticated] = useState(false)

  return (
    <AnimatePresence mode="wait">
      {!authenticated ? (
        <motion.div
          key="login"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8 }}
        >
          <AccessScreen onSuccess={() => setAuthenticated(true)} />
        </motion.div>
      ) : (
        <motion.div
          key="hud"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <JarvisHUD />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default App
