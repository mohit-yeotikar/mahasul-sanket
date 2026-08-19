// Mahasul Sanket brand — a seal-style emblem: a deep-green government seal with
// a gold ring, holding a white land-record ledger and a saffron "संकेत" (signal)
// radiating knowledge. Not the national emblem (legally protected) — a custom mark.

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="महसूल संकेत">
      <defs>
        <radialGradient id="ms-seal" cx="34%" cy="26%" r="82%">
          <stop offset="0" stopColor="#4aa574" />
          <stop offset="55%" stopColor="#1a5c38" />
          <stop offset="100%" stopColor="#0f3d24" />
        </radialGradient>
      </defs>
      {/* seal body + rings */}
      <circle cx="32" cy="32" r="30" fill="url(#ms-seal)" />
      <circle cx="32" cy="32" r="30" fill="none" stroke="#d9a441" strokeWidth="1.6" />
      <circle cx="32" cy="32" r="25.5" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
      {/* land-record ledger */}
      <rect x="21" y="20" width="18" height="24" rx="2.8" fill="#ffffff" />
      <rect x="24.5" y="26" width="11" height="2" rx="1" fill="#c7ded0" />
      <rect x="24.5" y="30.5" width="11" height="2" rx="1" fill="#c7ded0" />
      <rect x="24.5" y="35" width="7" height="2" rx="1" fill="#e07b00" />
      {/* संकेत — knowledge signal */}
      <g fill="none" stroke="#d9a441" strokeWidth="2" strokeLinecap="round">
        <path d="M40 22.6a5 5 0 0 1 5 5" />
        <path d="M40 18.1a9.5 9.5 0 0 1 9.5 9.5" />
      </g>
      <circle cx="40" cy="27.6" r="1.8" fill="#e07b00" />
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
