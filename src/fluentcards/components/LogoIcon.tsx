export function LogoIcon({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ borderRadius: size * 0.25 }}
    >
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#0fbd4f" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#logo-grad)" />
      {/* Wireframe globe */}
      <circle cx="32" cy="32" r="18" fill="none" stroke="white" strokeWidth="1.8" />
      <ellipse cx="32" cy="32" rx="8" ry="18" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <ellipse cx="32" cy="32" rx="18" ry="8" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <ellipse cx="32" cy="32" rx="12" ry="18" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.7" />
      <ellipse cx="32" cy="32" rx="18" ry="12" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.7" />
      <ellipse cx="32" cy="32" rx="4" ry="18" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
      <line x1="14" y1="32" x2="50" y2="32" stroke="rgba(255,255,255,0.3)" strokeWidth="0.7" />
      {/* Accent dots */}
      <circle cx="32" cy="14" r="1.5" fill="white" />
      <circle cx="32" cy="50" r="1.5" fill="white" />
    </svg>
  );
}
