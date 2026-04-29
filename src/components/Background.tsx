export function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Radial green glow — bottom-left */}
      <div
        style={{
          position: "absolute",
          left: "-5%",
          top: "65%",
          width: "65%",
          height: "65%",
          background:
            "radial-gradient(ellipse at center, hsl(144 33% 46% / 0.14) 0%, transparent 65%)",
        }}
      />
      {/* Edge vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 120px rgba(0,0,0,0.45)",
        }}
      />
      {/* Film grain */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.035,
        }}
      >
        <filter id="bg-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#bg-grain)" />
      </svg>
    </div>
  );
}
