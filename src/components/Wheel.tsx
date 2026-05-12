import { motion, useAnimation } from "motion/react";
import { forwardRef, useImperativeHandle, useState } from "react";

interface WheelProps {
  items: string[];
  onSpinEnd: (winner: string) => void;
  isSpinning: boolean;
  setIsSpinning: (val: boolean) => void;
}

export interface WheelRef {
  spin: () => Promise<void>;
}

const COLORS = [
  "#4f46e5", // Indigo 600
  "#6366f1", // Indigo 500
  "#818cf8", // Indigo 400
  "#3b82f6", // Blue 500
  "#0ea5e9", // Sky 500
  "#10b981", // Emerald 500
  "#6366f1", // Indigo 500
  "#4338ca", // Indigo 700
];

const Wheel = forwardRef<WheelRef, WheelProps>(({ items, onSpinEnd, isSpinning, setIsSpinning }, ref) => {
  const controls = useAnimation();
  const [rotation, setRotation] = useState(0);
  const itemsCount = items.length;
  const anglePerItem = 360 / itemsCount;

  useImperativeHandle(ref, () => ({
    spin: async () => {
      if (isSpinning || itemsCount === 0) return;

      setIsSpinning(true);
      
      const extraRotations = 8 + Math.random() * 4;
      const totalRotation = rotation + (extraRotations * 360) + (Math.random() * 360);
      
      await controls.start({
        rotate: totalRotation,
        transition: {
          duration: 6,
          ease: [0.15, 0, 0.05, 1], // Custom cubic-bezier for a very smooth, suspenseful stop
        },
      });

      setRotation(totalRotation);
      setIsSpinning(false);

      const normalizedRotation = totalRotation % 360;
      const winningAngle = (360 - normalizedRotation) % 360;
      const winnerIndex = Math.floor(winningAngle / anglePerItem);
      onSpinEnd(items[winnerIndex]);
    }
  }));

  if (itemsCount === 0) {
    return (
      <div className="w-full aspect-square flex items-center justify-center glass-card relative group overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50/50 to-white/50 pointer-events-none" />
        <div className="text-center relative z-10 px-8">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
            <span className="text-2xl">🎡</span>
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mb-2">Pool is Empty</p>
          <h3 className="text-slate-800 font-extrabold text-xl leading-tight">Add names to<br/><span className="text-indigo-600">Start the Game</span></h3>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-square p-2 md:p-4">
      {/* Outer Glow & Decoration */}
      <div className="absolute inset-0 bg-indigo-600/5 rounded-full blur-3xl" />
      
      {/* Top Arrow Indicator - More Modern */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-40">
        <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center shadow-2xl border-2 border-white">
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white mt-1" />
            </div>
            <div className="w-1 h-4 bg-slate-900 -mt-1 rounded-full shadow-lg" />
        </div>
      </div>

      {/* The Wheel */}
      <div className="w-full h-full relative p-2 bg-white rounded-full premium-shadow border-4 border-white overflow-hidden">
        <motion.div
          animate={controls}
          className="w-full h-full rounded-full overflow-hidden relative"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {items.map((item, i) => {
              const startAngle = i * anglePerItem;
              const endAngle = (i + 1) * anglePerItem;
              
              const x1 = 50 + 50 * Math.cos((startAngle - 90) * (Math.PI / 180));
              const y1 = 50 + 50 * Math.sin((startAngle - 90) * (Math.PI / 180));
              const x2 = 50 + 50 * Math.cos((endAngle - 90) * (Math.PI / 180));
              const y2 = 50 + 50 * Math.sin((endAngle - 90) * (Math.PI / 180));
              
              const largeArcFlag = anglePerItem > 180 ? 1 : 0;
              const d = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

              return (
                <g key={i} className="transition-opacity duration-300">
                  <path
                    d={d}
                    fill={COLORS[i % COLORS.length]}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="0.1"
                  />
                  <text
                    x="75"
                    y="50"
                    transform={`rotate(${(startAngle + endAngle) / 2 - 90}, 50, 50)`}
                    fill="white"
                    fontSize={Math.max(1.8, 4.5 - itemsCount / 8)}
                    fontWeight="800"
                    className="pointer-events-none select-none uppercase tracking-widest font-sans drop-shadow-sm"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {item.length > 12 ? item.slice(0, 10) + ".." : item}
                  </text>
                </g>
              );
            })}
          </svg>
          
          {/* Inner Shadow for Depth */}
          <div className="absolute inset-0 rounded-full pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.05)]" />
        </motion.div>

        {/* Center Hub - Premium Style */}
        <div className="absolute inset-[38%] bg-white rounded-full premium-shadow flex items-center justify-center z-30 border-4 border-slate-50">
            <div className="w-[70%] h-[70%] bg-slate-900 rounded-full shadow-xl flex items-center justify-center overflow-hidden">
                 <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-slate-700 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]" />
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
});

export default Wheel;
