import React, { useEffect, useRef } from 'react';

export default function LoginPage() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    let animId;

    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    }));

    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);

    function draw() {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        s.pulse += 0.012;
        const op = 0.2 + 0.8 * Math.abs(Math.sin(s.pulse));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,220,255,${op * 0.7})`;
        ctx.fill();
      });
      [
        { x: W*0.2, y: H*0.3, r: 350, c: '0,212,255' },
        { x: W*0.8, y: H*0.7, r: 280, c: '191,90,242' },
        { x: W*0.6, y: H*0.2, r: 200, c: '0,255,136' },
      ].forEach(b => {
        const g = ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);
        g.addColorStop(0, `rgba(${b.c},0.07)`);
        g.addColorStop(1, `rgba(${b.c},0)`);
        ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
      });
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
  }, []);

  return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#050510', position:'relative', overflow:'hidden' }}>
      <canvas ref={canvasRef} style={{ position:'absolute', inset:0, pointerEvents:'none' }} />
      <div style={{ textAlign:'center', animation:'fadeIn 0.8s ease', position:'relative', zIndex:1, padding:'0 20px' }}>
        <div style={{ marginBottom:40 }}>
          <div style={{ fontSize:52, marginBottom:4, filter:'drop-shadow(0 0 20px rgba(0,212,255,0.9))' }}>✦</div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:100, letterSpacing:18, lineHeight:1, background:'linear-gradient(135deg,#ffffff 0%,#00d4ff 50%,#bf5af2 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', filter:'drop-shadow(0 0 40px rgba(0,212,255,0.3))' }}>
            NOVA
          </div>
          <div style={{ fontSize:11, color:'rgba(180,220,255,0.45)', letterSpacing:6, marginTop:6, textTransform:'uppercase' }}>
            YOUR UNIVERSE OF SOUND
          </div>
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap', marginBottom:48 }}>
          {[{icon:'🎵',text:'All of YouTube'},{icon:'🎧',text:'8D Audio'},{icon:'🚫',text:'Zero Ads'},{icon:'∞',text:'Unlimited'},{icon:'⬇️',text:'Downloads'}].map(({icon,text}) => (
            <div key={text} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', padding:'8px 16px', borderRadius:99, color:'rgba(255,255,255,0.65)', fontSize:13, backdropFilter:'blur(10px)' }}>
              <span>{icon}</span>{text}
            </div>
          ))}
        </div>

        <a href="http://localhost:3001/auth/google" style={{ display:'inline-flex', alignItems:'center', gap:12, background:'rgba(255,255,255,0.96)', color:'#000', padding:'15px 36px', borderRadius:99, fontSize:15, fontWeight:700, textDecoration:'none', boxShadow:'0 0 40px rgba(0,212,255,0.35)', letterSpacing:0.3, transition:'all 0.25s' }}
          onMouseOver={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 50px rgba(0,212,255,0.6)';}}
          onMouseOut={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 0 40px rgba(0,212,255,0.35)';}}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </a>
        <div style={{ marginTop:24, fontSize:12, color:'rgba(180,220,255,0.3)' }}>Free forever · No credit card · No ads · No limits</div>
      </div>
    </div>
  );
}
