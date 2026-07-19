// Illustrated banner: simple line-art florals and stars framing the app
// name, with a scalloped bottom edge (drawn in CSS — see .scallop).

function Flourish({ flip = false, className = '' }: { flip?: boolean; className?: string }) {
  return (
    <svg
      className={`flourish ${className}`}
      width="52"
      height="44"
      viewBox="0 0 52 44"
      fill="none"
      aria-hidden="true"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      {/* curving stem with leaves */}
      <path d="M4 40 C 14 34, 20 24, 24 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14 30 C 10 26, 9 22, 11 18 C 15 20, 17 24, 16 28 Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M20 20 C 24 19, 27 16, 28 12 C 24 12, 21 14, 19 17 Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      {/* five-petal flower */}
      <circle cx="27" cy="7" r="2" stroke="currentColor" strokeWidth="1.4" />
      <ellipse cx="27" cy="2.5" rx="1.8" ry="2.4" stroke="currentColor" strokeWidth="1.2" />
      <ellipse cx="31.5" cy="5.5" rx="1.8" ry="2.4" transform="rotate(72 31.5 5.5)" stroke="currentColor" strokeWidth="1.2" />
      <ellipse cx="30" cy="10.8" rx="1.8" ry="2.4" transform="rotate(144 30 10.8)" stroke="currentColor" strokeWidth="1.2" />
      <ellipse cx="24" cy="10.8" rx="1.8" ry="2.4" transform="rotate(216 24 10.8)" stroke="currentColor" strokeWidth="1.2" />
      <ellipse cx="22.5" cy="5.5" rx="1.8" ry="2.4" transform="rotate(288 22.5 5.5)" stroke="currentColor" strokeWidth="1.2" />
      {/* little stars */}
      <path d="M42 14 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M44 30 l0.8 2 2 0.8 -2 0.8 -0.8 2 -0.8 -2 -2 -0.8 2 -0.8 Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

export default function HeaderBanner({ title, tagline }: { title: string; tagline: string }) {
  return (
    <header className="top">
      <div className="banner">
        <Flourish />
        <div>
          <h1>{title}</h1>
          <div className="tagline">{tagline}</div>
        </div>
        <Flourish flip className="alt" />
      </div>
      <div className="scallop" />
    </header>
  );
}
