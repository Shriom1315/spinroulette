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
  "#7c3aed", // Violet 600
  "#2563eb", // Blue 600
  "#0891b2", // Cyan 600
  "#059669", // Emerald 600
  "#db2777", // Pink 600
  "#ea580c", // Orange 600
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
      
      const extraRotations = 7 + Math.random() * 5;
      const totalRotation = rotation + (extraRotations * 360) + (Math.random() * 360);
      
      await controls.start({
        rotate: totalRotation,
        transition: {
          duration: 5,
          ease: [0.15, 0, 0, 1], // Very slow ending for suspense
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
      <div className="w-full max-w-[500px] aspect-square flex items-center justify-center border-4 border-dashed border-slate-200 rounded-full bg-white shadow-inner">
        <p className="text-slate-400 font-medium text-sm border-t-slate-200 uppercase tracking-widest text-center px-12 leading-relaxed">
          Waiting for<br/><span className="text-indigo-600 font-bold">CSV Entry</span>
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[500px] aspect-square mx-auto">
      {/* Top Arrow Indicator */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2 z-30">
        <div className="w-10 h-12 bg-slate-900 rounded-b-xl flex items-center justify-center shadow-xl">
          <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[14px] border-t-white" />
        </div>
      </div>

      {/* The Wheel */}
      <motion.div
        animate={controls}
        className="w-full h-full rounded-full shadow-2xl shadow-slate-200 border-[12px] border-white overflow-hidden relative bg-white"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
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
              <g key={i}>
                <path
                  d={d}
                  fill={COLORS[i % COLORS.length]}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="0.2"
                />
                <text
                  x="72"
                  y="50"
                  transform={`rotate(${(startAngle + endAngle) / 2 - 90}, 50, 50)`}
                  fill="white"
                  fontSize={Math.max(1.5, 4.2 - itemsCount / 10)}
                  fontWeight="900"
                  className="pointer-events-none select-none uppercase tracking-widest font-sans drop-shadow-md"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {item.length > 10 ? item.slice(0, 8) + ".." : item}
                </text>
              </g>
            );
          })}
        </svg>
        
        {/* Center Hub */}
        <div className="absolute inset-[40%] bg-white rounded-full shadow-inner flex items-center justify-center border-4 border-slate-50">
            <div className="w-[60%] h-[60%] bg-slate-900 rounded-full shadow-lg flex items-center justify-center">
                 <div className="w-2 h-2 bg-white rounded-full" />
            </div>
        </div>
      </motion.div>
    </div>
  );
});

export default Wheel;
