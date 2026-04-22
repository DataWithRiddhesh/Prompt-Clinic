interface LogoProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 36, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0EA5E9" />
          <stop offset="1" stopColor="#0369A1" />
        </linearGradient>
      </defs>
      <path
        d="M12 8h32a8 8 0 0 1 8 8v24a8 8 0 0 1-8 8H30l-10 10v-10h-8a8 8 0 0 1-8-8V16a8 8 0 0 1 8-8z"
        fill="url(#logoGrad)"
      />
      <path d="M28 18h8v8h8v8h-8v8h-8v-8h-8v-8h8z" fill="white" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark size={32} />
      <span
        className="font-bold text-[19px] tracking-tight"
        style={{ fontFamily: "var(--app-font-display)" }}
      >
        Medi<span className="text-primary">Sync</span>
      </span>
    </div>
  );
}
