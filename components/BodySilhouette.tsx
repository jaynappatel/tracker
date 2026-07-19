// An abstract, line-art body silhouette. `factor` multiplies the figure's
// horizontal proportions — 1.0 is neutral, and the weight trend nudges it a
// few percent either way. Purely a soft visual feedback loop: no BMI, no
// targets, nothing judgmental.

export default function BodySilhouette({ factor = 1 }: { factor?: number }) {
  // clamp so even an odd data point never distorts the figure
  const f = Math.min(1.08, Math.max(0.92, factor));
  const cx = 70;
  const L = (n: number) => (cx - n * f).toFixed(1); // left of center
  const R = (n: number) => (cx + n * f).toFixed(1); // right of center

  const body = [
    // left side: neck → shoulder → waist → hip → outer leg
    `M ${L(9)} 52`,
    `C ${L(11)} 60, ${L(30)} 58, ${L(33)} 70`,
    `C ${L(36)} 82, ${L(24)} 98, ${L(21)} 112`,
    `C ${L(19)} 126, ${L(30)} 134, ${L(31)} 150`,
    `C ${L(32)} 168, ${L(22)} 190, ${L(19)} 212`,
    // left foot
    `L ${L(6)} 212`,
    // inner left leg up to crotch, then inner right leg down
    `C ${L(7)} 192, ${L(3)} 172, ${cx} 158`,
    `C ${R(3)} 172, ${R(7)} 192, ${R(6)} 212`,
    // right foot
    `L ${R(19)} 212`,
    // right side back up: outer leg → hip → waist → shoulder → neck
    `C ${R(22)} 190, ${R(32)} 168, ${R(31)} 150`,
    `C ${R(30)} 134, ${R(19)} 126, ${R(21)} 112`,
    `C ${R(24)} 98, ${R(36)} 82, ${R(33)} 70`,
    `C ${R(30)} 58, ${R(11)} 60, ${R(9)} 52`,
    'Z',
  ].join(' ');

  return (
    <svg width="120" height="196" viewBox="0 0 140 228" aria-hidden="true">
      <circle
        cx={cx}
        cy="30"
        r="16"
        fill="rgba(62,107,100,0.10)"
        stroke="var(--teal)"
        strokeWidth="2"
      />
      <path
        d={body}
        fill="rgba(62,107,100,0.10)"
        stroke="var(--teal)"
        strokeWidth="2"
        strokeLinejoin="round"
        style={{ transition: 'd .5s ease' }}
      />
    </svg>
  );
}
