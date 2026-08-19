// Mahasul Sanket brand — a premium seal-style emblem: a deep-green government
// seal with a gold double-ring, a specular highlight for depth, a white
// land-record ledger, wheat sprigs (agriculture/revenue) and a saffron "संकेत"
// (signal) radiating knowledge. A custom mark — NOT the national emblem
// (legally protected).

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="महसूल संकेत">
      <defs>
        <radialGradient id="ms-seal" cx="34%" cy="24%" r="86%">
          <stop offset="0" stopColor="#57b585" />
          <stop offset="48%" stopColor="#1f6640" />
          <stop offset="100%" stopColor="#0d3720" />
        </radialGradient>
        <linearGradient id="ms-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2cf7a" />
          <stop offset="45%" stopColor="#d9a441" />
          <stop offset="100%" stopColor="#b9822a" />
        </linearGradient>
        <linearGradient id="ms-ledger" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#eaf3ec" />
        </linearGradient>
      </defs>

      {/* seal body */}
      <circle cx="32" cy="32" r="30" fill="url(#ms-seal)" />
      {/* gold double ring */}
      <circle cx="32" cy="32" r="30" fill="none" stroke="url(#ms-ring)" strokeWidth="2" />
      <circle cx="32" cy="32" r="25.5" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
      {/* specular highlight for depth */}
      <ellipse cx="24" cy="18" rx="15" ry="9" fill="#ffffff" opacity="0.14" />

      {/* wheat sprigs flanking the ledger (agriculture / revenue) */}
      <g stroke="#e7b64d" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.9">
        <path d="M18.5 44 L20.6 30" />
        <path d="M20.4 33 q-3 -1.4 -4.4 -3.6" />
        <path d="M20.7 37 q-3 -1.4 -4.4 -3.6" />
        <path d="M21 41 q-3 -1.4 -4.4 -3.6" />
        <path d="M45.5 44 L43.4 30" />
        <path d="M43.6 33 q3 -1.4 4.4 -3.6" />
        <path d="M43.3 37 q3 -1.4 4.4 -3.6" />
        <path d="M43 41 q3 -1.4 4.4 -3.6" />
      </g>

      {/* land-record ledger with a folded corner */}
      <path d="M22 19.5 h13 l4 4 v20.5 a1.6 1.6 0 0 1 -1.6 1.6 H22 a1.6 1.6 0 0 1 -1.6 -1.6 V21.1 A1.6 1.6 0 0 1 22 19.5 Z" fill="url(#ms-ledger)" />
      <path d="M35 19.5 v3 a1.5 1.5 0 0 0 1.5 1.5 H39 Z" fill="#c7ded0" />
      <rect x="24.5" y="28" width="10.5" height="1.8" rx="0.9" fill="#bcd6c6" />
      <rect x="24.5" y="32" width="10.5" height="1.8" rx="0.9" fill="#bcd6c6" />
      <rect x="24.5" y="36" width="6.5" height="1.8" rx="0.9" fill="#e07b00" />

      {/* संकेत — knowledge signal */}
      <g fill="none" stroke="#f2cf7a" strokeWidth="2" strokeLinecap="round">
        <path d="M41.5 23.4a5 5 0 0 1 5 5" />
        <path d="M41.5 18.7a9.7 9.7 0 0 1 9.7 9.7" />
      </g>
      <circle cx="41.5" cy="28.4" r="2" fill="#e07b00" />
    </svg>
  );
}

export function Logo({ className = "", subtitle = true }: { className?: string; subtitle?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-10 w-10 shrink-0 drop-shadow-sm" />
      <div className="leading-tight">
        <div className="text-[18px] font-extrabold tracking-tight text-primary">महसूल संकेत</div>
        {subtitle && (
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            महाराष्ट्र महसूल विभाग
          </div>
        )}
      </div>
    </div>
  );
}
