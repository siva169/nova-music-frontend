import React from 'react';

// ── Full animated NOVA logo (for loading screen) ──────────────────
export function NovaLogoFull({ size = 200 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="nfglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#00d4ff" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="nfloop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d4ff"/>
          <stop offset="50%" stopColor="#bf5af2"/>
          <stop offset="100%" stopColor="#00d4ff"/>
        </linearGradient>
        <style>{`
          @keyframes nfSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          @keyframes nfSpinR { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
          @keyframes nfPulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
          @keyframes nfBlink { 0%,100%{opacity:0.2} 50%{opacity:0.9} }
          .nf-ring1 { transform-origin:100px 95px; animation:nfSpin 7s linear infinite; }
          .nf-ring2 { transform-origin:100px 95px; animation:nfSpinR 11s linear infinite; }
          .nf-core  { animation:nfPulse 2.5s ease-in-out infinite; }
          .nf-s1    { animation:nfBlink 2.1s ease-in-out infinite; }
          .nf-s2    { animation:nfBlink 3.2s ease-in-out infinite 0.7s; }
          .nf-s3    { animation:nfBlink 1.9s ease-in-out infinite 1.3s; }
          .nf-s4    { animation:nfBlink 2.8s ease-in-out infinite 0.4s; }
        `}</style>
      </defs>

      {/* Background glow */}
      <circle cx="100" cy="95" r="90" fill="url(#nfglow)"/>

      {/* Stars */}
      <circle className="nf-s1" cx="28"  cy="28"  r="2"   fill="#00d4ff"/>
      <circle className="nf-s2" cx="172" cy="22"  r="1.5" fill="#bf5af2"/>
      <circle className="nf-s3" cx="178" cy="165" r="2"   fill="#00d4ff"/>
      <circle className="nf-s4" cx="22"  cy="160" r="1.5" fill="#ffffff"/>
      <circle className="nf-s1" cx="155" cy="175" r="1.5" fill="#bf5af2"/>
      <circle className="nf-s2" cx="45"  cy="178" r="1.2" fill="#00d4ff"/>

      {/* Outer orbit */}
      <g className="nf-ring1">
        <ellipse cx="100" cy="95" rx="82" ry="33" fill="none" stroke="#00d4ff" strokeWidth="0.7" strokeDasharray="5 9" opacity="0.3"/>
        <circle cx="182" cy="95" r="4.5" fill="#00d4ff" opacity="0.85"/>
      </g>

      {/* Inner orbit */}
      <g className="nf-ring2">
        <ellipse cx="100" cy="95" rx="62" ry="24" fill="none" stroke="#bf5af2" strokeWidth="0.7" strokeDasharray="3 7" opacity="0.25"/>
        <circle cx="100" cy="71" r="3.5" fill="#bf5af2" opacity="0.8"/>
      </g>

      {/* Infinity - left lobe */}
      <path d="M100,95 C84,73 52,64 37,82 C22,100 32,118 58,123 C78,127 94,108 100,95 Z"
        fill="none" stroke="url(#nfloop)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity="0.92"/>

      {/* Infinity - right lobe */}
      <path d="M100,95 C116,117 148,126 163,108 C178,90 168,72 142,68 C122,65 106,82 100,95 Z"
        fill="none" stroke="url(#nfloop)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity="0.92"/>

      {/* Inner fills */}
      <path d="M100,95 C84,73 52,64 37,82 C22,100 32,118 58,123 C78,127 94,108 100,95 Z" fill="#00d4ff" opacity="0.06"/>
      <path d="M100,95 C116,117 148,126 163,108 C178,90 168,72 142,68 C122,65 106,82 100,95 Z" fill="#bf5af2" opacity="0.06"/>

      {/* Core */}
      <circle cx="100" cy="95" r="14" fill="#00d4ff" opacity="0.12" className="nf-core"/>
      <circle cx="100" cy="95" r="7"  fill="#ffffff" opacity="0.95"/>
      <circle cx="100" cy="95" r="3.5" fill="#00d4ff"/>
    </svg>
  );
}

// ── Compact sidebar logo (static, clean) ─────────────────────────
export function NovaLogoSidebar() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="nsloop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d4ff"/>
          <stop offset="50%" stopColor="#bf5af2"/>
          <stop offset="100%" stopColor="#00d4ff"/>
        </linearGradient>
        <style>{`
          @keyframes nsSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          .ns-ring { transform-origin:18px 17px; animation:nsSpin 6s linear infinite; }
        `}</style>
      </defs>

      {/* Orbit ring */}
      <g className="ns-ring">
        <ellipse cx="18" cy="17" rx="15" ry="6" fill="none" stroke="#00d4ff" strokeWidth="0.7" strokeDasharray="3 5" opacity="0.4"/>
        <circle cx="33" cy="17" r="2.5" fill="#00d4ff" opacity="0.9"/>
      </g>

      {/* Infinity - left */}
      <path d="M18,17 C15,13 8,11 5,14 C2,18 4,22 9,23 C13,24 17,20 18,17 Z"
        fill="none" stroke="url(#nsloop)" strokeWidth="2.8" strokeLinecap="round" opacity="0.95"/>

      {/* Infinity - right */}
      <path d="M18,17 C21,21 28,23 31,20 C34,16 32,12 27,11 C23,11 19,15 18,17 Z"
        fill="none" stroke="url(#nsloop)" strokeWidth="2.8" strokeLinecap="round" opacity="0.95"/>

      {/* Core dot */}
      <circle cx="18" cy="17" r="3" fill="#ffffff" opacity="0.95"/>
      <circle cx="18" cy="17" r="1.5" fill="#00d4ff"/>
    </svg>
  );
}

export default NovaLogoFull;
