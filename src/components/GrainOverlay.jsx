const GrainOverlay = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[1] opacity-[0.15]">
      <svg className="w-full h-full">
        <filter id="grain">
          <feTurbulence 
            type="fractalNoise" 
            baseFrequency="2.5" 
            numOctaves="3" 
            stitchTiles="stitch" 
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </div>
  );
};

export default GrainOverlay;
