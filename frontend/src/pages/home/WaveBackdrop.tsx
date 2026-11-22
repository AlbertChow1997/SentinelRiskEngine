import { useId } from 'react'

/**
 * Decorative dark backdrop for the hero and closing call to action: black at the top left, a
 * navy-purple sky at the top right, and a soft wave rising from steel blue through sky blue to
 * white. Our own artwork, drawn with design tokens only.
 */
export function WaveBackdrop() {
  // Unique IDs so the backdrop can appear more than once on a page.
  const id = useId().replace(/:/g, '')
  const sky = `${id}-sky`
  const fill = `${id}-fill`
  const blur = `${id}-blur`

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-hero">
      <svg
        className="size-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={sky} cx="85%" cy="15%" r="70%">
            <stop offset="0%" style={{ stopColor: 'var(--hero-glow-4)' }} />
            <stop offset="45%" style={{ stopColor: 'var(--hero-glow-1)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--hero)', stopOpacity: 0 }} />
          </radialGradient>
          <linearGradient id={fill} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--hero-glow-1)' }} />
            <stop offset="30%" style={{ stopColor: 'var(--hero-glow-2)' }} />
            <stop offset="70%" style={{ stopColor: 'var(--hero-glow-3)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--hero-foreground)' }} />
          </linearGradient>
          <filter id={blur} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="28" />
          </filter>
        </defs>
        <rect width="1440" height="900" fill={`url(#${sky})`} />
        <path
          filter={`url(#${blur})`}
          fill={`url(#${fill})`}
          d="M-100 1000 L-100 980 C 300 990 640 940 860 700 C 1040 500 1180 330 1320 330 C 1420 330 1500 380 1560 420 L1560 1000 Z"
        />
      </svg>
    </div>
  )
}
