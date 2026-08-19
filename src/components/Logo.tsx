// Mahasul Sanket brand mark + wordmark.
// The emblem: an official land record (white document) carrying an AI "signal"
// spark in saffron — "संकेत" = signal/knowledge, on the deep-green revenue theme.

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="महसूल संकेत">
      <defs>
        <linearGradient id="ms-badge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1a5c38" />
          <stop offset="1" stopColor="#3f9464" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#ms-badge)" />
      {/* land-record document */}
      <rect x="12.5" y="12" width="18" height="24" rx="3" fill="#ffffff" />
      <rect x="16" y="17" width="11" height="2" rx="1" fill="#cfe3d6" />
      <rect x="16" y="21.5" width="11" height="2" rx="1" fill="#cfe3d6" />
      <rect x="16" y="26" width="7.5" height="2" rx="1" fill="#e07b00" />
      {/* AI knowledge spark */}
      <path
        d="M33.5 10.5l1.7 3.6 3.6 1.7-3.6 1.7-1.7 3.6-1.7-3.6-3.6-1.7 3.6-1.7z"
        fill="#e07b00"
        stroke="#ffffff"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-9 w-9 shrink-0" />
      <div className="leading-tight">
        <div className="text-[17px] font-extrabold tracking-tight text-primary">महसूल संकेत</div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Mahasul Sanket</div>
      </div>
    </div>
  );
}
