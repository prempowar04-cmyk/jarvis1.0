import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedAvatar from './AnimatedAvatar';
import { voiceEngine } from '../services/VoiceEngine';
import { getGeminiResponse } from '../services/GeminiBrain';

/* ── Clock ─────────────────────────────────────────────────── */
const useClock = () => {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = now.getHours(), m = now.getMinutes().toString().padStart(2,'0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hr = ((h % 12) || 12).toString().padStart(2,'0');
      setTime(`${hr}:${m} ${ampm}`);
      const days   = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
      const months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
                      'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
      setDate(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return { time, date };
};

/* ── Spark Canvas ──────────────────────────────────────────── */
const SparkCanvas = ({ active }) => {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const sparks = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    let t = 0;
    const run = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t++;
      if (t % 6 === 0) {
        const horiz = Math.random() > 0.5;
        sparks.push(horiz
          ? { x: 0, y: Math.random() * canvas.height, vx: 4 + Math.random()*5, vy: (Math.random()-.5)*1.5, life: 1, decay: .018+Math.random()*.02, c: active?'#00ff9d':'#00e5ff', s: 1+Math.random()*2 }
          : { x: Math.random() * canvas.width, y: 0, vx: (Math.random()-.5)*1.5, vy: 4+Math.random()*5, life: 1, decay: .018+Math.random()*.02, c: active?'#00ff9d':'#00e5ff', s: 1+Math.random()*2 });
      }
      sparks.forEach((s, i) => {
        s.x += s.vx; s.y += s.vy; s.life -= s.decay;
        if (s.life <= 0) { sparks.splice(i,1); return; }
        ctx.save();
        ctx.globalAlpha = s.life * .75;
        ctx.strokeStyle = s.c; ctx.shadowColor = s.c; ctx.shadowBlur = 8; ctx.lineWidth = s.s;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx*10, s.y - s.vy*10); ctx.stroke();
        ctx.restore();
      });
      raf = requestAnimationFrame(run);
    };
    run();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [active]);
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-10" />;
};

/* ── Data Bar Row ──────────────────────────────────────────── */
const DataBar = ({ label, value, color = '#00ff9d', delay = 0 }) => (
  <div className="flex flex-col gap-[3px]">
    <div className="flex justify-between items-center">
      <span style={{ color: '#00ff9d88', fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.15em' }}>{label}</span>
      <motion.span
        style={{ color, fontSize: 9, fontFamily: 'monospace' }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, delay }}
      >{value}%</motion.span>
    </div>
    <div style={{ height: 3, background: '#00ff9d15', borderRadius: 2, overflow: 'hidden' }}>
      <motion.div
        style={{ height: '100%', background: color, boxShadow: `0 0 6px ${color}`, borderRadius: 2 }}
        animate={{ width: [`${value * 0.6}%`, `${value}%`, `${value * 0.8}%`, `${value}%`] }}
        transition={{ duration: 3 + delay, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  </div>
);

/* ── Left Panel ────────────────────────────────────────────── */
const LeftPanel = ({ active }) => (
  <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none z-30"
    style={{ width: 200, padding: '60px 16px 32px 16px' }}>
    {/* Top block */}
    <div className="flex flex-col gap-3">
      <div style={{ color: '#00ff9d', fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.3em' }}>◈ SYS MONITOR</div>
      <DataBar label="CPU LOAD"   value={74} color="#00ff9d" delay={0}   />
      <DataBar label="MEMORY"     value={58} color="#00e5ff" delay={0.3} />
      <DataBar label="NEURAL NET" value={91} color="#00ff9d" delay={0.6} />
      <DataBar label="SECURE LVL" value={100} color="#00ff9d" delay={0.9} />
      <DataBar label="FIREWALL"   value={88} color="#00e5ff" delay={1.2} />

      {/* Mini chart area */}
      <div style={{ marginTop: 8, border: '1px solid #00ff9d22', padding: '6px 8px' }}>
        <div style={{ color: '#00ff9d55', fontSize: 8, fontFamily: 'monospace', marginBottom: 4 }}>ACTIVITY LOG</div>
        {['SCAN COMPLETE','AUTH OK','LINK STABLE','AI BOOT','SYS CHECK'].map((t,i) => (
          <motion.div key={i}
            style={{ color: '#00ff9d77', fontSize: 8, fontFamily: 'monospace', letterSpacing: '0.1em', marginBottom: 2 }}
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
          >▸ {t}</motion.div>
        ))}
      </div>
    </div>

    {/* Middle block */}
    <div className="flex flex-col gap-2">
      <div style={{ color: '#00ff9d', fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.3em' }}>◈ NETWORK</div>
      <DataBar label="UPLINK"   value={96} color="#00ff9d" delay={0.2} />
      <DataBar label="DOWNLINK" value={78} color="#00e5ff" delay={0.5} />
      <DataBar label="LATENCY"  value={12} color="#aaff00" delay={0.8} />
      {/* Mini vertical bars */}
      <div className="flex items-end gap-1 mt-1" style={{ height: 30 }}>
        {[60,40,75,55,80,45,70,85,50,65].map((h,i) => (
          <motion.div key={i}
            style={{ flex: 1, background: '#00ff9d', borderRadius: 1,
              boxShadow: '0 0 4px #00ff9d', opacity: 0.7 }}
            animate={{ height: [`${h * 0.4}%`, `${h}%`, `${h * 0.6}%`] }}
            transition={{ duration: 1.5+i*0.15, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>

    {/* Bottom block */}
    <div className="flex flex-col gap-2">
      <div style={{ color: '#00ff9d', fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.3em' }}>◈ SENSORS</div>
      {['THERMAL','OPTICAL','AUDIO','MOTION'].map((s,i) => (
        <div key={i} className="flex items-center gap-2">
          <motion.div style={{ width: 6, height: 6, borderRadius: '50%', background: active?'#00ff9d':'#ff2222', boxShadow: active?'0 0 6px #00ff9d':'0 0 6px #ff2222' }}
            animate={{ scale: [1,1.3,1], opacity: [0.6,1,0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i*0.2 }}
          />
          <span style={{ color: '#00ff9d88', fontSize: 8, fontFamily: 'monospace', letterSpacing: '0.1em' }}>{s}</span>
          <span style={{ color: active?'#00ff9d':'#ff2222', fontSize: 8, fontFamily: 'monospace', marginLeft: 'auto' }}>{active?'ON':'--'}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ── Right Panel ───────────────────────────────────────────── */
const RightPanel = ({ active }) => (
  <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none z-30"
    style={{ width: 200, padding: '60px 16px 32px 16px' }}>
    {/* Top block */}
    <div className="flex flex-col gap-3">
      <div style={{ color: '#00ff9d', fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.3em', textAlign: 'right' }}>SYS VITALS ◈</div>
      <DataBar label="CORE TEMP" value={42} color="#ff8800" delay={0.1} />
      <DataBar label="POWER"     value={87} color="#00ff9d" delay={0.4} />
      <DataBar label="SHIELDS"   value={active?100:30} color={active?"#00ff9d":"#ff2222"} delay={0.7} />
      <DataBar label="AI ENGINE" value={active?95:20}  color={active?"#00e5ff":"#ff2222"} delay={1.0} />
      <DataBar label="QUANTUM"   value={66} color="#aa00ff" delay={1.3} />

      {/* Radar mini */}
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
        <svg width={80} height={80} viewBox="0 0 80 80">
          <defs>
            <filter id="rglow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          {[36,27,18,9].map(r => <circle key={r} cx="40" cy="40" r={r} fill="none" stroke="#00ff9d" strokeWidth="0.5" opacity="0.3"/>)}
          <line x1="4" y1="40" x2="76" y2="40" stroke="#00ff9d" strokeWidth="0.4" opacity="0.3"/>
          <line x1="40" y1="4" x2="40" y2="76" stroke="#00ff9d" strokeWidth="0.4" opacity="0.3"/>
          <motion.line x1="40" y1="40" x2="40" y2="4" stroke="#00ff9d" strokeWidth="1.5" opacity="0.8" filter="url(#rglow)"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '40px 40px' }}
          />
          {[[28,22],[52,48],[35,55],[58,30]].map(([x,y],i) => (
            <motion.circle key={i} cx={x} cy={y} r="2.5" fill="#00ff9d" filter="url(#rglow)"
              animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i*0.4 }}/>
          ))}
        </svg>
      </div>
    </div>

    {/* Middle block */}
    <div className="flex flex-col gap-2">
      <div style={{ color: '#00ff9d', fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.3em', textAlign: 'right' }}>AI STATUS ◈</div>
      {['PROCESSING','LEARNING','PATTERN REC','VOICE SYN','ENCRYPT'].map((s,i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <motion.div style={{ width: 5, height: 5, background: '#00ff9d', borderRadius: '50%', boxShadow: '0 0 5px #00ff9d' }}
            animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 1+i*0.2, repeat: Infinity }}/>
          <span style={{ color: '#00ff9d66', fontSize: 8, fontFamily: 'monospace' }}>{s}</span>
          <span style={{ color: '#00ff9d', fontSize: 8, fontFamily: 'monospace' }}>ACTIVE</span>
        </div>
      ))}
    </div>

    {/* Bottom block */}
    <div className="flex flex-col gap-2">
      <div style={{ color: '#00ff9d', fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.3em', textAlign: 'right' }}>COORDINATES ◈</div>
      {[['LAT','28.6139°N'],['LON','77.2090°E'],['ALT','216m'],['UTC','+05:30']].map(([k,v],i) => (
        <div key={i} style={{ display:'flex', justifyContent:'space-between' }}>
          <span style={{ color:'#00ff9d55', fontSize:8, fontFamily:'monospace' }}>{k}</span>
          <span style={{ color:'#00ff9d', fontSize:8, fontFamily:'monospace' }}>{v}</span>
        </div>
      ))}
      {/* Waveform */}
      <div style={{ height: 24, display:'flex', alignItems:'center', gap:1, marginTop:4, overflow:'hidden' }}>
        {Array.from({length:28},(_,i)=>(
          <motion.div key={i}
            style={{ flex:1, background: active?'#00ff9d':'#00e5ff', borderRadius:1, opacity:0.7 }}
            animate={{ height: [`${10+Math.sin(i)*60}%`,`${10+Math.cos(i*0.7)*60}%`,`${10+Math.sin(i)*60}%`] }}
            transition={{ duration: 1.2+i*0.05, repeat: Infinity, ease:'easeInOut' }}
          />
        ))}
      </div>
    </div>
  </div>
);

/* ── Rings (large, viewport-filling) ─────────────────────── */
const BigRings = ({ active }) => {
  // r must be >= half-diagonal of image (270²+310²)^0.5 ≈ 411px so rings cover square corners
  const rings = [
    { r: 420, speed: 22,  dash:'14 8',  w:1.5, opacity:0.5  },
    { r: 460, speed:-30,  dash:'6 16',  w:1,   opacity:0.35 },
    { r: 505, speed: 38,  dash:'3 22',  w:1,   opacity:0.25 },
    { r: 550, speed:-46,  dash:'20 6',  w:0.8, opacity:0.18 },
    { r: 600, speed: 55,  dash:'2 28',  w:0.6, opacity:0.12 },
    { r: 650, speed:-64,  dash:'10 20', w:0.5, opacity:0.08 },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex:2 }}>
      {rings.map((ring, i) => {
        const sz = ring.r * 2;
        return (
          <motion.div key={i} className="absolute" style={{ width:sz, height:sz }}
            animate={{ rotate: active ? (ring.speed > 0 ? 360 : -360) : (ring.speed > 0 ? 15 : -15) }}
            transition={{ duration: Math.abs(ring.speed), repeat: Infinity, ease:'linear' }}>
            <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
              <defs>
                <filter id={`rg${i}`}><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
              <circle cx={ring.r} cy={ring.r} r={ring.r-3}
                fill="none"
                stroke={active ? '#00ff9d' : '#00e5ff'}
                strokeWidth={ring.w}
                strokeDasharray={ring.dash}
                opacity={active ? ring.opacity + 0.08 : ring.opacity}
                filter={`url(#rg${i})`}
              />
              {/* tick marks */}
              {Array.from({length:12},(_,t) => {
                const a = (t/12)*Math.PI*2;
                const rr = ring.r - 3;
                const x1 = ring.r + Math.cos(a)*rr, y1 = ring.r + Math.sin(a)*rr;
                const x2 = ring.r + Math.cos(a)*(rr-8), y2 = ring.r + Math.sin(a)*(rr-8);
                return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={active?'#00ff9d':'#00e5ff'} strokeWidth="1.5"
                  opacity={active?0.7:0.3} filter={`url(#rg${i})`}/>;
              })}
            </svg>
          </motion.div>
        );
      })}

      {/* Innermost glow ring — framing the face circle */}
      <motion.div className="absolute rounded-full" style={{ width:700, height:700, border:`1.5px solid ${active?'#00ff9d':'#ff2222'}` }}
        animate={{ boxShadow: active
          ? ['0 0 30px #00ff9d55, inset 0 0 60px #00ff9d22','0 0 80px #00ff9daa, inset 0 0 120px #00ff9d44','0 0 30px #00ff9d55, inset 0 0 60px #00ff9d22']
          : ['0 0 20px #ff222233','0 0 50px #ff222266','0 0 20px #ff222233'] }}
        transition={{ duration: active?2.5:1.2, repeat: Infinity }}
      />
      {/* 2nd inner solid ring */}
      <motion.div className="absolute rounded-full" style={{ width:580, height:580, border:`2px solid ${active?'#00ff9d':'#ff2222'}` }}
        animate={{ boxShadow: active
          ? ['0 0 15px #00ff9d66, inset 0 0 30px #00ff9d33','0 0 50px #00ff9dcc, inset 0 0 80px #00ff9d55','0 0 15px #00ff9d66, inset 0 0 30px #00ff9d33']
          : ['0 0 8px #ff222244','0 0 25px #ff222288','0 0 8px #ff222244'] }}
        transition={{ duration: active?2:1, repeat: Infinity, delay:0.4 }}
      />
    </div>
  );
};

/* ── Top Status Bar ─────────────────────────────────────────── */
const TopBar = ({ time, date }) => (
  <div className="absolute top-0 left-0 right-0 flex items-center justify-between z-40 pointer-events-none"
    style={{ height: 54, padding: '0 16px', borderBottom: '1px solid #00ff9d22',
             background: 'linear-gradient(180deg, rgba(0,255,157,0.05) 0%, transparent 100%)' }}>
    {/* Left section */}
    <div className="flex items-center gap-3">
      <motion.div style={{ width:8, height:8, borderRadius:'50%', background:'#00ff9d', boxShadow:'0 0 10px #00ff9d' }}
        animate={{ scale:[1,1.5,1], opacity:[0.6,1,0.6] }} transition={{ duration:1.5, repeat: Infinity }}/>
      <span style={{ color:'#00ff9d', fontSize:10, fontFamily:'monospace', letterSpacing:'0.3em' }}>PREMEX AI v2.4</span>
      <span style={{ color:'#00ff9d33', fontSize:10, fontFamily:'monospace' }}>|</span>
      <span style={{ color:'#00ff9d66', fontSize:9, fontFamily:'monospace', letterSpacing:'0.15em' }}>NEURAL INTERFACE</span>
    </div>

    {/* Center clock */}
    <div className="flex flex-col items-center">
      <motion.div style={{ textAlign:'center' }}
        animate={{ textShadow:['0 0 8px #00ff9d','0 0 25px #00ff9d, 0 0 50px #00ff9d88','0 0 8px #00ff9d'] }}
        transition={{ duration:2.5, repeat: Infinity }}>
        <span style={{ color:'#fff', fontSize:22, fontFamily:'Space Mono, monospace', letterSpacing:'0.25em', fontWeight:300 }}>{time}</span>
        <span style={{ color:'#00ff9d66', fontSize:18, margin:'0 8px' }}>||</span>
        <span style={{ color:'rgba(255,255,255,0.75)', fontSize:11, fontFamily:'monospace', letterSpacing:'0.18em' }}>{date}</span>
      </motion.div>
      <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
        <div style={{ width:40, height:1, background:'linear-gradient(90deg, transparent, #00ff9d66)' }}/>
        <span style={{ color:'#00ff9d44', fontSize:7, fontFamily:'monospace', letterSpacing:'0.3em' }}>JARVIS HUD</span>
        <div style={{ width:40, height:1, background:'linear-gradient(90deg, #00ff9d66, transparent)' }}/>
      </div>
    </div>

    {/* Right section */}
    <div className="flex items-center gap-3">
      <span style={{ color:'#00ff9d66', fontSize:9, fontFamily:'monospace', letterSpacing:'0.15em' }}>SEC LVL: ALPHA</span>
      <span style={{ color:'#00ff9d33', fontSize:10, fontFamily:'monospace' }}>|</span>
      <span style={{ color:'#00ff9d', fontSize:10, fontFamily:'monospace', letterSpacing:'0.2em' }}>ONLINE</span>
      <motion.div style={{ width:8, height:8, borderRadius:'50%', background:'#00ff9d', boxShadow:'0 0 10px #00ff9d' }}
        animate={{ scale:[1,1.5,1], opacity:[0.6,1,0.6] }} transition={{ duration:1.5, repeat: Infinity, delay:0.3 }}/>
    </div>
  </div>
);

/* ── Bottom Bar ─────────────────────────────────────────────── */
const BottomBar = ({ active, systemState, onStateChange }) => (
  <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center z-40"
    style={{ padding: '0 16px 8px', borderTop: '1px solid #00ff9d22',
             background: 'linear-gradient(0deg, rgba(0,255,157,0.05) 0%, transparent 100%)' }}>
    {/* Ticker */}
    <div style={{ width:'100%', height:16, overflow:'hidden', display:'flex', alignItems:'center', borderBottom:'1px solid #00ff9d11', marginBottom:8 }}>
      <motion.span
        style={{ color:'#00ff9d44', fontSize:8, fontFamily:'monospace', letterSpacing:'0.3em', whiteSpace:'nowrap' }}
        animate={{ x:['100vw','-200%'] }}
        transition={{ duration:18, repeat: Infinity, ease:'linear' }}>
        PREMEX AI ◈ NEURAL LINK ACTIVE ◈ FIREWALL ENGAGED ◈ CORE TEMP: 42°C ◈ UPTIME: 99.98% ◈ CPU: 18% ◈ MEMORY: 64% ◈ NET: 1.2Gbps ◈ QUANTUM BRIDGE STABLE ◈ SEC LEVEL: ALPHA-1 ◈
      </motion.span>
    </div>

    {/* Controls row */}
    <div className="flex items-center justify-between w-full">
      {/* Left mini stats */}
      <div className="flex gap-4">
        {[['CORE','42°C'],['UPTIME','99.98%'],['THREAT','NULL']].map(([k,v],i) => (
          <div key={i} style={{ textAlign:'center' }}>
            <div style={{ color:'#00ff9d44', fontSize:7, fontFamily:'monospace', letterSpacing:'0.2em' }}>{k}</div>
            <div style={{ color:'#00ff9d', fontSize:10, fontFamily:'monospace' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Center buttons */}
      <div className="flex items-center gap-4">
        <motion.button onClick={() => onStateChange('off')}
          style={{ width:100, height:38, background: !active ? 'rgba(0,255,157,0.15)' : 'rgba(0,0,0,0.5)',
            border: `1px solid ${!active?'#00ff9d':'#00ff9d44'}`,
            boxShadow: !active ? '0 0 25px #00ff9d88, inset 0 0 15px #00ff9d22' : '0 0 5px #00ff9d22',
            color: !active ? '#00ff9d' : '#ffffff55', fontFamily:'monospace', fontSize:13,
            letterSpacing:'0.3em', fontWeight:'bold', cursor:'pointer', position:'relative', overflow:'hidden' }}
          whileHover={{ scale:1.06, boxShadow:'0 0 35px #00ff9d99' }} whileTap={{ scale:0.95 }}>
          {/* corner accents */}
          <div style={{ position:'absolute', top:0, left:0, width:8, height:8, borderTop:'1px solid #00ff9d', borderLeft:'1px solid #00ff9d' }}/>
          <div style={{ position:'absolute', top:0, right:0, width:8, height:8, borderTop:'1px solid #00ff9d', borderRight:'1px solid #00ff9d' }}/>
          <div style={{ position:'absolute', bottom:0, left:0, width:8, height:8, borderBottom:'1px solid #00ff9d', borderLeft:'1px solid #00ff9d' }}/>
          <div style={{ position:'absolute', bottom:0, right:0, width:8, height:8, borderBottom:'1px solid #00ff9d', borderRight:'1px solid #00ff9d' }}/>
          OFF
        </motion.button>

        {/* Status pip */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
          <div style={{ width:1, height:12, background:'#00ff9d44' }}/>
          <motion.div style={{ width:8, height:8, background: active?'#00ff9d':'#ff2222', borderRadius:'50%', boxShadow: active?'0 0 10px #00ff9d':'0 0 10px #ff2222' }}
            animate={{ scale:[1,1.4,1] }} transition={{ duration:1.5, repeat: Infinity }}/>
          <div style={{ width:1, height:12, background:'#00ff9d44' }}/>
        </div>

        <motion.button onClick={() => onStateChange('on')}
          style={{ width:100, height:38, background: active ? 'rgba(0,255,157,0.18)' : 'rgba(0,0,0,0.5)',
            border: `1px solid ${active?'#00ff9d':'#00ff9d44'}`,
            boxShadow: active ? '0 0 25px #00ff9d88, inset 0 0 15px #00ff9d22' : '0 0 5px #00ff9d22',
            color: active ? '#00ff9d' : '#ffffff55', fontFamily:'monospace', fontSize:13,
            letterSpacing:'0.3em', fontWeight:'bold', cursor:'pointer', position:'relative', overflow:'hidden' }}
          whileHover={{ scale:1.06, boxShadow:'0 0 35px #00ff9d99' }} whileTap={{ scale:0.95 }}>
          <div style={{ position:'absolute', top:0, left:0, width:8, height:8, borderTop:'1px solid #00ff9d', borderLeft:'1px solid #00ff9d' }}/>
          <div style={{ position:'absolute', top:0, right:0, width:8, height:8, borderTop:'1px solid #00ff9d', borderRight:'1px solid #00ff9d' }}/>
          <div style={{ position:'absolute', bottom:0, left:0, width:8, height:8, borderBottom:'1px solid #00ff9d', borderLeft:'1px solid #00ff9d' }}/>
          <div style={{ position:'absolute', bottom:0, right:0, width:8, height:8, borderBottom:'1px solid #00ff9d', borderRight:'1px solid #00ff9d' }}/>
          ON
        </motion.button>


      </div>

      {/* Right mini stats */}
      <div className="flex gap-4">
        {[['NET','1.2Gb'],['SEC','ALPHA'],['AI','ACTIVE']].map(([k,v],i) => (
          <div key={i} style={{ textAlign:'center' }}>
            <div style={{ color:'#00ff9d44', fontSize:7, fontFamily:'monospace', letterSpacing:'0.2em' }}>{k}</div>
            <div style={{ color:'#00ff9d', fontSize:10, fontFamily:'monospace' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ── HUD Frame Corners ───────────────────────────────────────── */
const FrameCorners = () => (
  <>
    {[
      'top-0 left-0 border-t-2 border-l-2 shadow-[-4px_-4px_16px_#00ff9d]',
      'top-0 right-0 border-t-2 border-r-2 shadow-[4px_-4px_16px_#00ff9d]',
      'bottom-0 left-0 border-b-2 border-l-2 shadow-[-4px_4px_16px_#00ff9d]',
      'bottom-0 right-0 border-b-2 border-r-2 shadow-[4px_4px_16px_#00ff9d]',
    ].map((cls,i) => (
      <div key={i} className={`absolute ${cls} border-[#00ff9d] w-10 h-10 pointer-events-none z-50`}/>
    ))}
    {/* Animated outer border */}
    <motion.div className="absolute inset-0 border border-[#00ff9d] pointer-events-none z-40"
      animate={{ opacity:[0.3,0.7,0.4,1,0.3],
        boxShadow:['inset 0 0 20px #00ff9d11, 0 0 20px #00ff9d11','inset 0 0 50px #00ff9d33, 0 0 50px #00ff9d33','inset 0 0 20px #00ff9d11, 0 0 20px #00ff9d11'] }}
      transition={{ duration:3, repeat: Infinity }}
    />
  </>
);

/* ── Tech grid bg ────────────────────────────────────────────── */
const TechLines = ({ active }) => (
  <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
    {Array.from({length:18},(_,i) => (
      <motion.div key={i} className="absolute left-0 right-0" style={{ height:1, top:`${5+i*5.2}%`,
          background:`linear-gradient(90deg,transparent 0%,rgba(0,255,157,${0.02+(i%3)*0.015}) 30%,rgba(0,255,157,${0.04+(i%3)*0.02}) 50%,rgba(0,255,157,${0.02+(i%3)*0.015}) 70%,transparent 100%)` }}
        animate={{ opacity:[0.3,0.8,0.3], scaleX:[0.97,1.01,0.97] }}
        transition={{ duration:3+i*0.3, repeat: Infinity, delay:i*0.15 }}/>
    ))}
    {/* Moving scan */}
    <motion.div className="absolute left-0 right-0" style={{ height:2, background:'linear-gradient(90deg,transparent,rgba(0,255,157,0.12) 40%,rgba(0,229,255,0.18) 60%,transparent)' }}
      animate={{ top:['-1%','101%'] }} transition={{ duration:7, repeat: Infinity, ease:'linear' }}/>
  </div>
);

/* EyeGlow removed — handled inside AnimatedAvatar canvas overlay */

/* ── MAIN ───────────────────────────────────────────────────── */
const JarvisHUD = () => {
  const { time, date } = useClock();
  const [systemState, setSystemState] = useState('off');
  const [isBooting, setIsBooting] = useState(false);
  const [bootLogs, setBootLogs] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [voiceGender, setVoiceGender] = useState('male');
  const [activeVoiceText, setActiveVoiceText] = useState('');
  const [isGreeting, setIsGreeting] = useState(false);
  const [taskStatus, setTaskStatus] = useState(null); // 'executing' | 'done' | null
  
  const [burst, setBurst] = useState(false);
  const [avatarSpeaking, setAvatarSpeaking] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [micLevel, setMicLevel] = useState(0.5);
  const [authPending, setAuthPending] = useState(null); // { cmd, payload } for system actions
  const active = systemState === 'on';

  // Wake Word Effect
  useEffect(() => {
    if (!isListening && !avatarSpeaking && !isBooting && !isThinking) {
      voiceEngine.startWakeWord(() => {
        if (!active) {
          handleStateChange('on'); // Automatically boot
        }
        setTimeout(() => {
          setSpeechText("Hey Boss. How can I help you?");
          setActiveVoiceText("Hey Boss. How can I help you?");
          setIsGreeting(true); // Flags that we should auto-listen after speaking
        }, !active ? 5200 : 200); // longer delay if we need to let boot finish
      }, setMicLevel);
    } else {
      voiceEngine.stopWakeWord();
    }
    return () => voiceEngine.stopWakeWord();
  }, [active, isListening, avatarSpeaking, isBooting, isThinking]);

  // Handle system ON/OFF with 5s boot
  const handleStateChange = (s) => {
    if (s === systemState) return;
    
    if (s === 'on') {
      setBurst(true);
      setIsBooting(true);
      setBootLogs([]);
      
      // Start 5s boot sequence
      const logs = [
        'INITIALIZING PREMEX CORE...',
        'CONNECTING TO NEURAL LINK...',
        'CALIBRATING OPTICAL SENSORS...',
        'SCANNING BIO-SIGNATURES...',
        'BYPASSING FIREWALL...',
        'ENCRYPTING UPLINK...',
        'ALL SYSTEMS GO.'
      ];
      
      let logIdx = 0;
      const logInterval = setInterval(() => {
        if (logIdx < logs.length) {
          setBootLogs(prev => [...prev, logs[logIdx]]);
          logIdx++;
        }
      }, 600);

      setTimeout(() => {
        clearInterval(logInterval);
        setIsBooting(false);
        setSystemState('on');
        setBurst(false);
        
        // --- Restore hardcoded "Common Lines" for initial boot ---
        const commonLines = "Hello, I am PREMEX. Version 1.0 initialized. All systems are now online. Good day, Boss. System performance is optimal.";
        setIsGreeting(true);
        setActiveVoiceText(commonLines);
      }, 5000);
    } else {
      setSystemState('off');
      setIsBooting(false);
      setActiveVoiceText('');
      setSpeechText('');
    }
  };

  const handleAIPrompt = async (prompt) => {
    setIsThinking(true);
    let response;
    try {
      response = await getGeminiResponse(prompt);
      console.log("[JARVIS AI Response]:", response);
    } catch(err) {
      console.error("[JARVIS AI Error]:", err);
      response = "Sorry Boss, my neural path encountered an exception.";
    }
    let cleanText = response;

    // Handle Metadata/Tool Markers
    // 1. Voice Markers
    if (response.includes('[[SET_VOICE: FEMALE]]')) {
      setVoiceGender('female');
      cleanText = cleanText.replace('[[SET_VOICE: FEMALE]]', '');
    } else if (response.includes('[[SET_VOICE: MALE]]')) {
      setVoiceGender('male');
      cleanText = cleanText.replace('[[SET_VOICE: MALE]]', '');
    }

    // 2. Action Markers
    const actionMatch = response.match(/\[\[ACTION:\s*([^,\]]+),?\s*(.*?)\]\]/);
    if (actionMatch) {
      const type = actionMatch[1].trim();
      const payloadStr = actionMatch[2].trim();
      executeAction(type, payloadStr);
      cleanText = cleanText.replace(/\[\[ACTION:.*?\]\]/g, '');
    }

    cleanText = cleanText.trim();
    setIsThinking(false);
    setUserTranscript('');
    setSpeechText(cleanText); // Force UI update here!
    setActiveVoiceText(cleanText);
  };

  const executeAction = (type, payload) => {
    setTaskStatus('executing');
    console.log(`[JARVIS] Executing: ${type} ${payload}`);
    
    setTimeout(async () => {
      try {
        if (type === 'SYSTEM_CMD' || type === 'SET_ALARM') {
           // These require PC access.
           if (type === 'SYSTEM_CMD' && payload.includes('close_apps')) {
               // Dangerous, ask for password override
               setAuthPending({ cmd: 'CLOSE_APPS', payload, type });
               setSpeechText("Boss, this is a destructive action. Voice or password override required.");
               setActiveVoiceText("Boss, this is a destructive action. Voice or password override required.");
               setIsGreeting(true);
           } else {
               // Safe system commands (like alarm) execute directly
               setSpeechText("Accessing local system link...");
               const req = await fetch('http://localhost:3001/api/sys/execute', {
                   method: 'POST', headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ command: type, payload: type === 'SET_ALARM' ? { mins: payload } : payload })
               });
               const res = await req.json();
               if (res.success) {
                   setSpeechText(res.message);
                   setActiveVoiceText(res.message);
               } else {
                   setSpeechText("Failed to access system link.");
                   setActiveVoiceText("Failed to access system link.");
               }
           }
        } 
        else if (type === 'OPEN_WHATSAPP') {
          const phone = payload.match(/PHONE:\s*["']?([^"']+)["']?/)?.[1] || "";
          const msg = payload.match(/MESSAGE:\s*["']?([^"']+)["']?/)?.[1] || "Hello from JARVIS";
          window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`, 'jarvis_view');
        } else if (type === 'OPEN_APP') {
          const app = payload.match(/APP:\s*["']?([^"']+)["']?/)?.[1] || "";
          const maps = { 'GMAIL': 'https://mail.google.com', 'YOUTUBE': 'https://youtube.com', 'GITHUB': 'https://github.com', 'WHATSAPP': 'https://web.whatsapp.com' };
          if (maps[app]) window.open(maps[app], 'jarvis_view');
        } else if (type === 'OPEN_URL') {
          const url = payload.match(/URL:\s*["']?([^"']+)["']?/)?.[1] || "";
          if (url) window.open(url.startsWith('http') ? url : `https://${url}`, 'jarvis_view');
        } else if (type === 'SEARCH') {
          const query = payload.match(/QUERY:\s*["']?([^"']+)["']?/)?.[1] || "";
          if (query) window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, 'jarvis_view');
        }
        setTaskStatus('done');
      } catch (e) {
        console.error("Action Failed", e);
        setTaskStatus(null);
      }
      setTimeout(() => setTaskStatus(null), 2000);
    }, 1200);
  };

  const verifyOverride = async () => {
    if (!authPending) return;
    setAuthPending(null);
    setSpeechText("Override accepted. Executing system sequence...");
    try {
        const req = await fetch('http://localhost:3001/api/sys/execute', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: authPending.cmd, payload: authPending.payload })
        });
        const res = await req.json();
        if (res.success) {
            setSpeechText(res.message);
            setActiveVoiceText(res.message);
        }
    } catch(e) {
        setSpeechText("Server link failed.");
        setActiveVoiceText("Server link failed.");
    }
  };

  const startListening = async () => {
    if (isListening || isThinking || avatarSpeaking) return;
    setIsListening(true);
    setUserTranscript('LISTENING...');
    setSpeechText(''); // Clear any previous AI text
    try {
      const transcript = await voiceEngine.listen((interim) => {
        setUserTranscript(interim || 'LISTENING...');
      });
      setUserTranscript(transcript);
      if (transcript.trim().length > 0) {
        handleAIPrompt(transcript);
      } else {
        setSpeechText("I didn't catch that, Boss.");
        setActiveVoiceText("I didn't catch that, Boss.");
      }
    } catch (e) {
      console.warn("STT Error:", e);
      setUserTranscript('MIC ERROR');
      setTimeout(() => setUserTranscript(''), 2000);
    } finally {
      setIsListening(false);
    }
  };

  // Stable callbacks
  const handleSpeechStart    = useCallback(() => {
    setAvatarSpeaking(true);
    setUserTranscript('');
  }, []);
  const handleSpeechEnd      = useCallback(() => {
    setAvatarSpeaking(false);
    setActiveVoiceText(''); // Clear to allow re-trigger
    if (isGreeting) {
       setIsGreeting(false);
       setTimeout(() => {
         startListening(); // Automatically turn on mic after greeting finishes
       }, 500); 
    }
  }, [isGreeting]);

  const handleSpeechTextChange = useCallback((t) => setSpeechText(t), []);

  return (
    <div className="fixed inset-0 overflow-hidden select-none"
      style={{ background: active
        ? 'radial-gradient(ellipse at center, #071a0e 0%, #02100600 60%, #000 100%)'
        : 'radial-gradient(ellipse at center, #0f0404 0%, #050202 60%, #000 100%)',
        transition:'background 1.5s ease' }}>

      {/* Layers */}
      <div className="bg-grid absolute inset-0 z-0 opacity-25" />
      <div className="bg-noise" />
      <TechLines active={active} />
      <SparkCanvas active={active} />

      {/* Frame */}
      <FrameCorners />

      {/* Top + bottom bars */}
      <TopBar time={time} date={date} />
      <BottomBar active={active} systemState={systemState} onStateChange={handleStateChange} />

      {/* Side panels */}
      <LeftPanel active={active} />
      <RightPanel active={active} />

      {/* ── CENTER STAGE ── */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex:20 }}>

        {/* Big rings container */}
        <div className="relative flex items-center justify-center"
          style={{ width:'min(90vh, 1160px)', height:'min(90vh, 1160px)' }}>
          <BigRings active={active} />

          {/* Character — 560×560 circle */}
          <motion.div className="relative z-10"
            style={{ width: 560, height: 560, display:'flex', alignItems:'center', justifyContent:'center',
              borderRadius: '50%', overflow: 'hidden' }}
            animate={{ filter: active
              ? ['drop-shadow(0 0 25px #ff000099) brightness(1.1)','drop-shadow(0 0 60px #ff0000cc) brightness(1.18)','drop-shadow(0 0 25px #ff000099) brightness(1.1)']
              : isBooting 
                ? 'drop-shadow(0 0 40px #00ff9d88) brightness(1)'
                : ['drop-shadow(0 0 10px #22000088) brightness(0.78)','drop-shadow(0 0 22px #44000066) brightness(0.86)','drop-shadow(0 0 10px #22000088) brightness(0.78)'] }}
            transition={{ duration: active ? 2.2 : 1.5, repeat: Infinity }}>

            <AnimatedAvatar
              active={active || isBooting}
              onSpeechStart={handleSpeechStart}
              onSpeechEnd={handleSpeechEnd}
              onSpeechTextChange={handleSpeechTextChange}
              voiceText={activeVoiceText}
              gender={voiceGender}
            />

            {/* Booting Logs Overlay */}
            <AnimatePresence>
              {isBooting && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-10 z-50">
                  <div className="w-full flex flex-col gap-2">
                    {bootLogs.map((log, i) => (
                      <motion.div key={`${log}-${i}`} 
                        initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                        style={{ color: '#00ff9d', fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.1em' }}>
                        {`> ${log}`}
                      </motion.div>
                    ))}
                  </div>
                  <motion.div 
                    animate={{ width: ['0%', '100%'] }} transition={{ duration: 5, ease: 'linear' }}
                    style={{ height: 2, background: '#00ff9d', marginTop: 20, boxShadow: '0 0 10px #00ff9d' }} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Task Execution Overlay */}
            <AnimatePresence>
              {taskStatus && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
                  className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
                  <motion.div 
                    animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 40, height: 40, border: '2px solid #00ff9d', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  <div style={{ color: '#00ff9d', fontSize: 12, marginTop: 15, fontFamily: 'monospace', letterSpacing: '0.2em' }}>
                    {taskStatus === 'executing' ? 'INITIALIZING UPLINK...' : 'TASK COMPLETED'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Neural Mic / Wake Word Status Indicator */}
          <AnimatePresence>
            {(!isBooting) && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                onClick={!isListening ? startListening : undefined}
                className="absolute z-50 flex items-center justify-center"
                style={{ 
                  bottom: '2%', left: '50%', transform: 'translateX(-50%)', width: 80, height: 80, 
                  borderRadius: '50%', background: isListening ? '#ff2222' : 'rgba(0,255,157,0.15)',
                  border: `2px solid ${isListening ? '#ff2222' : '#00ff9d'}`,
                  boxShadow: isListening 
                              ? '0 0 30px #ff2222' 
                              : (micLevel > 0.6 ? '0 0 25px #00ff9d' : '0 0 10px #00ff9d44'),
                  cursor: 'pointer'
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isListening ? (
                  /* Audio Waves Animation */
                  <div className="flex items-center justify-center gap-1 h-full w-full">
                    {[1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [`${30}%`, `${90}%`, `${30}%`] }}
                        transition={{ duration: 0.4 + (i * 0.1), repeat: Infinity, ease: 'easeInOut' }}
                        style={{ width: 4, background: '#ffffff', borderRadius: 4 }}
                      />
                    ))}
                  </div>
                ) : (
                  <motion.div animate={{ scale: [1, 1.05 + micLevel * 0.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00ff9d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="23"/>
                      <line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            )}
          </AnimatePresence>

          {/* Thinking Indicator */}
          <AnimatePresence>
            {isThinking && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute z-50 top-[10%] left-[50%] -translate-x-1/2"
                style={{ color: '#00ff9d', fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.2em' }}
              >
                NEURAL PROCESSING...
              </motion.div>
            )}
          </AnimatePresence>

          {/* Burst on switch */}
          <AnimatePresence>
            {burst && (
              <motion.div className="absolute inset-0 rounded-full pointer-events-none"
                initial={{ scale:0.4, opacity:0.9 }}
                animate={{ scale:2.5, opacity:0 }}
                exit={{ opacity:0 }}
                transition={{ duration:0.55, ease:'easeOut' }}
                style={{ background:`radial-gradient(circle, ${active?'#00ff9d':'#ff2222'}55 0%, transparent 70%)` }}/>
            )}
          </AnimatePresence>

          {/* ── Speech subtitle — Aside Panel ── */}
          <AnimatePresence mode="wait">
            {(speechText || userTranscript) && (
              <motion.div
                key="captions-aside"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                style={{
                  position: 'fixed',
                  top: '50%',
                  right: '4%',
                  transform: 'translateY(-50%)',
                  width: '320px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  zIndex: 100,
                  pointerEvents: 'none',
                }}
              >
                {userTranscript && (
                  <div style={{
                    padding: '12px 18px', background: 'rgba(0,40,60,0.85)', backdropFilter: 'blur(10px)',
                    border: '1px solid #00e5ff33', borderLeft: '4px solid #00e5ff',
                    color: '#00e5ff', fontFamily: 'Space Mono, monospace', fontSize: 13,
                    boxShadow: '0 0 20px #00e5ff22', textTransform: 'uppercase'
                  }}>
                    <span style={{opacity:0.6, fontSize:10, display:'block', marginBottom:4}}>YOU:</span>
                    {userTranscript}
                  </div>
                )}
                {speechText && (
                  <div style={{
                    padding: '12px 18px', background: 'rgba(0,40,20,0.85)', backdropFilter: 'blur(10px)',
                    border: '1px solid #00ff9d33', borderRight: '4px solid #00ff9d',
                    color: '#00ff9d', fontFamily: 'Space Mono, monospace', fontSize: 13,
                    boxShadow: '0 0 20px #00ff9d22', textTransform: 'uppercase', textAlign: 'right'
                  }}>
                    <span style={{opacity:0.6, fontSize:10, display:'block', marginBottom:4}}>PREMEX:</span>
                    {speechText}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Auth Override Overlay */}
          <AnimatePresence>
            {authPending && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center z-[100] bg-black bg-opacity-70 backdrop-blur-sm">
                <div className="border border-red-500 bg-red-900 bg-opacity-30 p-8 rounded-lg text-center" style={{ boxShadow:'0 0 40px #ff2222' }}>
                  <h2 className="text-red-500 text-2xl font-mono mb-4 tracking-widest">SECURITY OVERRIDE REQUIRED</h2>
                  <p className="text-red-300 font-mono text-sm mb-6 max-w-sm mx-auto">
                    Command '{authPending.cmd}' requires administrative bypass. Speak the passcode or enter it to authorize.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button onClick={() => setAuthPending(null)} className="px-6 py-2 border border-red-500 text-red-500 font-mono hover:bg-red-500 hover:text-black transition">CANCEL</button>
                    <button onClick={verifyOverride} className="px-6 py-2 bg-red-500 text-black font-mono hover:bg-red-400 transition shadow-[0_0_15px_#ff2222]">AUTHORIZE</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Flash overlay on state change */}
      <AnimatePresence>
        {burst && (
          <motion.div className="fixed inset-0 pointer-events-none z-50"
            initial={{ opacity:0.5 }} animate={{ opacity:0 }} exit={{ opacity:0 }} transition={{ duration:0.5 }}
            style={{ background: active ? 'rgba(0,255,157,0.07)' : 'rgba(255,0,0,0.07)' }}/>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JarvisHUD;
