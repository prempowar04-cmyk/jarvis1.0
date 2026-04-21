/**
 * AnimatedAvatar.jsx  —  BULLETPROOF VERSION
 * ─────────────────────────────────────────────────────────────
 * Fixes:
 *  1. React StrictMode (effects fire twice) — hasSpokenRef set INSIDE setTimeout
 *  2. Voices not loaded — waits for voiceschanged event
 *  3. onSpeechTextChange inline function — speech doesn't depend on it via useCallback
 *  4. Subtitle display — calls prop directly from speech loop via ref
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ══ VISEME MAP ════════════════════════════════════════════════ */
const V = {
  rest: { openY: 0.00, wideX: 0.42, roundness: 0.0 },
  p:    { openY: 0.03, wideX: 0.36, roundness: 0.0 },
  b:    { openY: 0.03, wideX: 0.36, roundness: 0.0 },
  m:    { openY: 0.01, wideX: 0.38, roundness: 0.0 },
  f:    { openY: 0.04, wideX: 0.38, roundness: 0.0 },
  v:    { openY: 0.05, wideX: 0.38, roundness: 0.0 },
  t:    { openY: 0.09, wideX: 0.37, roundness: 0.0 },
  d:    { openY: 0.11, wideX: 0.37, roundness: 0.0 },
  n:    { openY: 0.08, wideX: 0.37, roundness: 0.0 },
  s:    { openY: 0.07, wideX: 0.37, roundness: 0.0 },
  z:    { openY: 0.07, wideX: 0.37, roundness: 0.0 },
  l:    { openY: 0.11, wideX: 0.37, roundness: 0.1 },
  r:    { openY: 0.10, wideX: 0.38, roundness: 0.3 },
  k:    { openY: 0.15, wideX: 0.38, roundness: 0.0 },
  g:    { openY: 0.15, wideX: 0.38, roundness: 0.0 },
  h:    { openY: 0.22, wideX: 0.42, roundness: 0.1 },
  w:    { openY: 0.13, wideX: 0.30, roundness: 0.8 },
  y:    { openY: 0.11, wideX: 0.36, roundness: 0.2 },
  a:    { openY: 0.52, wideX: 0.50, roundness: 0.0 },
  e:    { openY: 0.28, wideX: 0.55, roundness: 0.0 },
  i:    { openY: 0.22, wideX: 0.58, roundness: 0.0 },
  o:    { openY: 0.38, wideX: 0.36, roundness: 0.9 },
  u:    { openY: 0.30, wideX: 0.30, roundness: 0.95 },
};

const charToViseme = (ch) => {
  const c = ch.toLowerCase();
  if ('aeiou'.includes(c)) return V[c] ?? V.a;
  return V[c] ?? V.t;
};

const lp = (a, b, t) => a + (b - a) * t;

/* ══ HELPERS ════════════════════════════════════════════════════ */
const getTimeOfDay = () => {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
};

const getBattery = async () => {
  try {
    if (navigator.getBattery) {
      const b = await navigator.getBattery();
      return Math.round(b.level * 100);
    }
  } catch {}
  return 82;
};

/* Wait until voices are loaded */
const waitForVoices = () => new Promise((resolve) => {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) { resolve(voices); return; }
  window.speechSynthesis.addEventListener('voiceschanged', function handler() {
    window.speechSynthesis.removeEventListener('voiceschanged', handler);
    resolve(window.speechSynthesis.getVoices());
  });
  // Fallback timeout in case voiceschanged never fires
  setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1500);
});

/* ══════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════ */
const AnimatedAvatar = ({ 
  active, 
  onSpeechStart, 
  onSpeechEnd, 
  onSpeechTextChange,
  voiceText,        // New: text to speak dynamically
  gender = 'male'   // New: 'male' or 'female'
}) => {

  /* ── Stable prop refs (immune to re-render / useCallback deps issues) ── */
  const onStartRef  = useRef(onSpeechStart);
  const onEndRef    = useRef(onSpeechEnd);
  const onTextRef   = useRef(onSpeechTextChange);
  useEffect(() => { onStartRef.current  = onSpeechStart;  }, [onSpeechStart]);
  useEffect(() => { onEndRef.current    = onSpeechEnd;    }, [onSpeechEnd]);
  useEffect(() => { onTextRef.current   = onSpeechTextChange; }, [onSpeechTextChange]);

  /* ── Core refs ── */
  const canvasRef    = useRef(null);
  const synthRef     = useRef(null);
  const isAliveRef   = useRef(false);   // true while speaking sequence running
  const hasSpokenRef = useRef(false);   // one-shot guard (set INSIDE setTimeout)

  /* ── Animated value refs (rAF, no re-render) ── */
  const tgtMouth = useRef({ ...V.rest });
  const curMouth = useRef({ ...V.rest });
  const eyeGlow  = useRef(0);
  const tgtEye   = useRef(0);
  const blinkAmt = useRef(0);
  const breathT  = useRef(0);
  const mouthSparks = useRef([]);        // [ {x, y, life, size} ] inner sparks

  /* ── React state ── */
  const [speaking,    setSpeaking]    = useState(false);
  const [breathY,     setBreathY]     = useState(0);
  const [breathScale, setBreathScale] = useState(1);
  const speakingRef = useRef(false);  // mirror of `speaking` for use in canvas draw

  /* ══ BLINK ══════════════════════════════════════════════════ */
  useEffect(() => {
    let timer;
    const sched = () => {
      timer = setTimeout(() => {
        let t = 0;
        const iv = setInterval(() => {
          t += 16;
          if      (t < 100) blinkAmt.current = t / 100;
          else if (t < 220) blinkAmt.current = 1 - (t - 100) / 120;
          else { blinkAmt.current = 0; clearInterval(iv); sched(); }
        }, 16);
      }, 3200 + Math.random() * 2800);
    };
    sched();
    return () => clearTimeout(timer);
  }, []);

  /* ══ BREATHING ══════════════════════════════════════════════ */
  useEffect(() => {
    let raf, s0 = null;
    const loop = (ts) => {
      if (!s0) s0 = ts;
      const t = (ts - s0) / 1000;
      breathT.current = t;
      setBreathY(Math.sin(t * 0.52) * 3.5);
      setBreathScale(1 + Math.sin(t * 0.48) * 0.005);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ══ CANVAS DRAW ════════════════════════════════════════════ */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 560; canvas.height = 560;
    const ctx = canvas.getContext('2d');
    let raf;

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const m   = curMouth.current;
      const tgt = tgtMouth.current;
      m.openY     = lp(m.openY,     tgt.openY,     0.20);
      m.wideX     = lp(m.wideX,     tgt.wideX,     0.20);
      m.roundness = lp(m.roundness, tgt.roundness,  0.20);
      eyeGlow.current = lp(eyeGlow.current, tgtEye.current, 0.10);

      const isSpeaking = speakingRef.current;

      /* ── MOUTH ─────────────────────────────────────────── */
      const MX = W * 0.500, MY = H * 0.520;
      const JAW_MAX = H * 0.120, LIP_W = W * 0.240;
      const jawDrop = JAW_MAX * m.openY;
      const lipWide = LIP_W  * (0.55 + m.wideX * 0.55);

      if (jawDrop > 1.0) {
        ctx.save();
        ctx.beginPath();
        if (m.roundness > 0.55) {
          ctx.ellipse(MX, MY + jawDrop * 0.4, lipWide * 0.6, jawDrop * 0.9, 0, 0, Math.PI * 2);
        } else {
          ctx.moveTo(MX - lipWide, MY);
          ctx.quadraticCurveTo(MX, MY - jawDrop * 0.12, MX + lipWide, MY);
          ctx.quadraticCurveTo(MX + lipWide * 0.8, MY + jawDrop, MX, MY + jawDrop * 1.05);
          ctx.quadraticCurveTo(MX - lipWide * 0.8, MY + jawDrop, MX - lipWide, MY);
          ctx.closePath();
        }
        const ig = ctx.createRadialGradient(MX, MY + jawDrop * 0.5, 0, MX, MY + jawDrop * 0.5, lipWide);
        ig.addColorStop(0,   'rgba(0,0,0,0.97)');
        ig.addColorStop(0.5, 'rgba(5,0,0,0.92)');
        ig.addColorStop(1,   'rgba(15,0,0,0.35)');
        ctx.fillStyle = ig;
        ctx.fill();
        if (m.openY > 0.20) {
          ctx.save();
          ctx.globalAlpha = Math.min((m.openY - 0.20) * 2.2, 1) * 0.42;
          ctx.fillStyle = 'rgba(200,30,30,0.55)';
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();

        /* ── MOUTH SPARKS (INTENSE) ────────────────────────────── */
        if (isSpeaking && m.openY > 0.12) {
          // Increased generation rate for "large" effect
          if (Math.random() > 0.25) {
            mouthSparks.current.push({
              x: MX + (Math.random() - 0.5) * lipWide * 1.8,
              y: MY + (Math.random() - 0.3) * jawDrop,
              life: 1.0,
              v: 0.04 + Math.random() * 0.08,
              size: 1.0 + Math.random() * 2.5 // Larger sparks
            });
          }
          // Draw/Update sparks
          ctx.save();
          mouthSparks.current = mouthSparks.current.filter(s => {
            s.life -= s.v;
            if (s.life <= 0) return false;
            ctx.fillStyle = Math.random() > 0.7 ? '#fff' : '#ff1111';
            ctx.globalAlpha = s.life * 0.8;
            ctx.shadowBlur = 4;
            ctx.shadowColor = '#ff3333';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
            return true;
          });
          ctx.restore();
        } else {
          mouthSparks.current = [];
        }

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(MX - lipWide, MY);
        ctx.quadraticCurveTo(MX, MY - jawDrop * 0.12, MX + lipWide, MY);
        ctx.strokeStyle = `rgba(100,22,22,${0.55 + m.openY * 0.40})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(MX - lipWide * 0.78, MY + jawDrop);
        ctx.quadraticCurveTo(MX, MY + jawDrop * 1.06, MX + lipWide * 0.78, MY + jawDrop);
        ctx.stroke();
        ctx.restore();
      }

      /* ── EYES ──────────────────────────────────────────── */
      const gBase = active ? 0.48 + eyeGlow.current * 0.52 : 0.20;
      [{ cx: W * 0.395, cy: H * 0.340 }, { cx: W * 0.595, cy: H * 0.340 }].forEach(({ cx, cy }) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, Math.max(1 - blinkAmt.current, 0.02));
        ctx.translate(-cx, -cy);

        const col = active
          ? `rgba(255,${20 + Math.floor(gBase * 45)},${10 + Math.floor(gBase * 10)},`
          : 'rgba(160,10,10,';

        const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.068);
        cg.addColorStop(0,    `${col}${Math.min(gBase * 1.05, 1).toFixed(2)})`);
        cg.addColorStop(0.35, `${col}${(gBase * 0.75).toFixed(2)})`);
        cg.addColorStop(0.7,  `${col}${(gBase * 0.35).toFixed(2)})`);
        cg.addColorStop(1,    `${col}0)`);
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.ellipse(cx, cy, W * 0.068, H * 0.038, 0, 0, Math.PI * 2);
        ctx.fill();

        if (isSpeaking && eyeGlow.current > 0.15) {
          const hg = ctx.createRadialGradient(cx, cy, W*0.04, cx, cy, W*0.15);
          hg.addColorStop(0, `rgba(255,40,10,${(eyeGlow.current * 0.32).toFixed(2)})`);
          hg.addColorStop(1, 'transparent');
          ctx.globalAlpha = 1;
          ctx.fillStyle = hg;
          ctx.beginPath(); ctx.arc(cx, cy, W*0.15, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();

        if (active) {
          ctx.save();
          ctx.globalAlpha = eyeGlow.current * 0.22;
          ctx.beginPath();
          ctx.ellipse(cx, cy, W * 0.076, H * 0.044, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,50,10,${(gBase * 0.6).toFixed(2)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }
      });

      /* ── CHEEKS ─────────────────────────────────────────── */
      if (m.openY > 0.07) {
        [[W*0.38, H*0.58], [W*0.62, H*0.58]].forEach(([cx, cy]) => {
          ctx.save();
          ctx.globalAlpha = m.openY * 0.12;
          const cg2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.09);
          cg2.addColorStop(0, 'rgba(160,25,25,0.6)');
          cg2.addColorStop(1, 'transparent');
          ctx.fillStyle = cg2;
          ctx.beginPath(); ctx.arc(cx, cy, W * 0.09, 0, Math.PI*2); ctx.fill();
          ctx.restore();
        });
      }

      /* ── JAW TENSION ────────────────────────────────────── */
      if (isSpeaking && m.openY > 0.06) {
        ctx.save();
        ctx.globalAlpha = m.openY * 0.30;
        ctx.strokeStyle = 'rgba(100,15,15,0.9)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(W * 0.35, H * 0.78);
        ctx.quadraticCurveTo(MX, H * 0.78 + m.openY * H * 0.018, W * 0.65, H * 0.78);
        ctx.stroke();
        ctx.restore();
      }

      /* ── CIRCUIT NODES ──────────────────────────────────── */
      if (active) {
        const nodes = [
          [W*0.50, H*0.14], [W*0.35, H*0.35], [W*0.65, H*0.35],
          [W*0.42, H*0.55], [W*0.58, H*0.55], [W*0.50, H*0.72],
          [W*0.20, H*0.82], [W*0.80, H*0.82],
        ];
        nodes.forEach(([nx, ny], idx) => {
          const phase = Math.sin(breathT.current * 2.5 + idx * 0.9);
          ctx.save();
          ctx.globalAlpha = Math.max(0.18 + phase * 0.18, 0.04);
          const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, W*0.018);
          ng.addColorStop(0, 'rgba(255,40,10,0.9)');
          ng.addColorStop(1, 'transparent');
          ctx.fillStyle = ng;
          ctx.beginPath(); ctx.arc(nx, ny, W*0.018, 0, Math.PI*2); ctx.fill();
          ctx.restore();
        });
      }

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [active]);   // only depend on `active` — reading speakingRef avoids extra dep

  /* ── SPEAK LOGIC ───────────────────────────────────────────── */
  useEffect(() => {
    if (active && voiceText) {
      isAliveRef.current = true;
      speakFnRef.current?.(voiceText);
    }
  }, [active, voiceText]);

  /* ══ SPEECH ENGINE ═══════════════════════════════════════════ */
  useEffect(() => {
    speakFnRef.current = async (text) => {
      if (!window.speechSynthesis) return;
      const synth = window.speechSynthesis;
      synthRef.current = synth;
      synth.cancel();
      await new Promise(r => setTimeout(r, 100));

      const voices = await waitForVoices();

      setSpeaking(true);
      speakingRef.current = true;
      onStartRef.current?.();

      await speakSingleLine(synth, voices, text, true);

      speakingRef.current = false;
      setSpeaking(false);
      tgtMouth.current = { ...V.rest };
      tgtEye.current   = 0;
      onTextRef.current?.('');
      onEndRef.current?.();
    };
  }, []);

  /* ══ SPEAK SINGLE LINE ══════════════════════════════════════ */
  const speakSingleLine = (synth, voices, text, isLast) => new Promise((resolve) => {
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang   = 'en-US';
    utt.rate   = 0.82;
    utt.pitch  = 0.52;
    utt.volume = 1.0;

    // Select voice based on gender
    let preferred;
    if (gender === 'female') {
      preferred = voices.find(v => /zira|samantha|victoria|female|girl/i.test(v.name))
               || voices.find(v => v.lang?.startsWith('en') && v.name.includes('Female'));
    } else {
      preferred = voices.find(v => /david|mark|george|male/i.test(v.name))
               || voices.find(v => v.lang?.startsWith('en'));
    }
    if (preferred) utt.voice = preferred;

    // Update subtitle
    onTextRef.current?.(text);

    // Character-by-character mouth driver
    let charTimer, localIdx = 0;
    const driveChar = () => {
      if (!isAliveRef.current) return;
      if (localIdx < text.length) {
        const ch = text[localIdx];
        if (ch.trim()) {
          tgtMouth.current = charToViseme(ch);
          tgtEye.current   = 0.40 + Math.random() * 0.60;
        }
        localIdx++;
        charTimer = setTimeout(driveChar, 60 + Math.random() * 35);
      }
    };

    utt.onboundary = (e) => {
      const idx = e.charIndex ?? 0;
      if (idx < text.length && text[idx].trim()) {
        tgtMouth.current = charToViseme(text[idx]);
        tgtEye.current   = 0.55 + Math.random() * 0.45;
      }
    };

    utt.onstart = () => {
      tgtEye.current = 0.92;
      driveChar();
    };

    utt.onend = () => {
      clearTimeout(charTimer);
      tgtMouth.current = { ...V.rest };
      tgtEye.current   = 0.18;
      setTimeout(resolve, isLast ? 100 : 320);
    };

    utt.onerror = (e) => {
      console.warn('[PREMEX] speech error:', e.error);
      clearTimeout(charTimer);
      resolve();
    };

    synth.speak(utt);
  });

  /* Reference to speak function */
  const speakFnRef = useRef(null);

  /* ══ ACTIVATION EFFECT ══════════════════════════════════════
     Key: hasSpokenRef.current is set INSIDE the setTimeout,
     so React StrictMode's cleanup + re-run pair works correctly:
       1. Setup → start timer T1
       2. Cleanup (StrictMode) → cancel T1, hasSpoken still false
       3. Re-run → start timer T2
       4. T2 fires → hasSpoken is false → set true → speak!
  ══════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (active) {
      isAliveRef.current = true;
    } else {
      // Turned OFF
      isAliveRef.current   = false;
      hasSpokenRef.current = false;
      if (synthRef.current) synthRef.current.cancel();
      speakingRef.current = false;
      setSpeaking(false);
      tgtMouth.current = { ...V.rest };
      tgtEye.current   = 0;
      onTextRef.current?.('');
    }
  }, [active]);

  /* ══ RENDER ═════════════════════════════════════════════════ */
  return (
    <motion.div
      style={{ position: 'relative', width: 560, height: 560, y: breathY, scale: breathScale }}
      animate={speaking
        ? { x: [0, -0.7, 0.7, -0.35, 0.35, 0], transition: { duration: 0.42, repeat: Infinity, ease: 'easeInOut' } }
        : { x: 0 }
      }
    >
      {/* ── Base image (untouched) ── */}
      <img
        src="/premex_v2.png"
        alt="PREMEX AI"
        draggable={false}
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center 35%',
          display: 'block',
          userSelect: 'none', pointerEvents: 'none',
          borderRadius: '50%',
        }}
      />

      {/* ── Canvas overlays: lips, eyes, nodes ── */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none', borderRadius: '50%',
        }}
      />

      {/* ── Body aura (active) ── */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ borderRadius: '50%' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.06, 0.25, 0.06] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div style={{
              width:'100%', height:'100%', borderRadius:'50%',
              background: 'radial-gradient(ellipse at 50% 60%, rgba(0,255,80,0.05) 0%, transparent 60%)',
              filter: 'blur(18px)',
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Throat pulse (speaking) ── */}
      <AnimatePresence>
        {speaking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.04, 0.18, 0.04] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.36, repeat: Infinity }}
            style={{
              position: 'absolute', top:'73%', left:'35%', width:'30%', height:'10%',
              background: 'radial-gradient(ellipse at center, rgba(255,40,10,0.35) 0%, transparent 70%)',
              filter: 'blur(8px)', pointerEvents: 'none', borderRadius: '50%',
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AnimatedAvatar;
