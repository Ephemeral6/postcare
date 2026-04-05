'use client';

export default function LoadingSpinner({ text = '加载中...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <svg width="200" height="60" viewBox="0 0 200 60" className="overflow-visible">
        <defs>
          <linearGradient id="heartbeat-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
            <stop offset="50%" stopColor="var(--primary)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.2" />
          </linearGradient>
          <clipPath id="reveal">
            <rect x="-200" y="0" width="200" height="60">
              <animate attributeName="x" from="-200" to="200" dur="2s" repeatCount="indefinite" />
            </rect>
          </clipPath>
        </defs>
        {/* Background line */}
        <path
          d="M 0,30 L 30,30 L 40,30 L 55,10 L 65,50 L 75,20 L 85,40 L 95,30 L 130,30 L 140,30 L 155,15 L 165,45 L 175,25 L 185,35 L 195,30 L 200,30"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Animated line */}
        <path
          d="M 0,30 L 30,30 L 40,30 L 55,10 L 65,50 L 75,20 L 85,40 L 95,30 L 130,30 L 140,30 L 155,15 L 165,45 L 175,25 L 185,35 L 195,30 L 200,30"
          fill="none"
          stroke="url(#heartbeat-gradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          clipPath="url(#reveal)"
        />
        {/* Glowing dot */}
        <circle r="4" fill="var(--primary)" opacity="0.8">
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path="M 0,30 L 30,30 L 40,30 L 55,10 L 65,50 L 75,20 L 85,40 L 95,30 L 130,30 L 140,30 L 155,15 L 165,45 L 175,25 L 185,35 L 195,30 L 200,30"
          />
        </circle>
        <circle r="8" fill="var(--primary)" opacity="0.2">
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path="M 0,30 L 30,30 L 40,30 L 55,10 L 65,50 L 75,20 L 85,40 L 95,30 L 130,30 L 140,30 L 155,15 L 165,45 L 175,25 L 185,35 L 195,30 L 200,30"
          />
        </circle>
      </svg>
      <p className="text-sm text-text-secondary">{text}</p>
    </div>
  );
}
