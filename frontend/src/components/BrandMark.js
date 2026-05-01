export default function BrandMark({ compact = false }) {
  return (
    <div className="brand-mark" style={{ display: 'flex', alignItems: 'center', gap: compact ? 8 : 10 }}>
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="taskflowBrandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="24" height="24" rx="8" fill="url(#taskflowBrandGradient)" />
        <path d="M8 10h6.4c2.4 0 4.4 2 4.4 4.4S16.8 18.8 14.4 18.8H11" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12.2 7.8L16.2 14l-3.8 6.2" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!compact && <span style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>TaskFlow</span>}
    </div>
  );
}