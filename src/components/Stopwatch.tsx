import { motion, AnimatePresence } from "motion/react";
import { Play, RotateCcw, ThumbsUp, ThumbsDown, CheckCircle2, X } from "lucide-react";

interface VoteResult {
  buy: number;
  leave: number;
}

interface StopwatchProps {
  onComplete?: () => void;
  onClose: () => void;
  isAdmin: boolean;
  isActive: boolean;
  onToggle: () => void;
  onReset: () => void;
  secondsRemaining: number;
  onVote?: (choice: 'buy' | 'leave') => void;
  userVote?: 'buy' | 'leave' | null;
  results?: VoteResult;
  winnerName: string;
}

export default function Stopwatch({ 
  onClose, 
  isAdmin, 
  isActive, 
  onToggle, 
  onReset, 
  secondsRemaining,
  onVote,
  userVote,
  results,
  winnerName
}: StopwatchProps) {
  const progress = (secondsRemaining / 60) * 100;
  const strokeDasharray = 2 * Math.PI * 44; // Radius is 44

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 40 }}
      className="glass-card p-6 md:p-10 flex flex-col items-center gap-6 md:gap-8 w-full max-w-lg mx-auto relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

      {isAdmin && (
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all z-20"
        >
          <X size={20} />
        </button>
      )}

      {/* Winner Identity */}
      <div className="flex flex-col items-center text-center relative z-10 pt-2">
        <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-100 mb-5 animate-float">
          <CheckCircle2 size={32} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-2">Verdict in Progress</span>
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">{winnerName}</h2>
      </div>

      <div className="w-full h-px bg-white/60 relative z-10" />

      <div className="flex w-full gap-8 items-center justify-center flex-col md:flex-row relative z-10">
        {/* Timer Circle */}
        <div className="relative w-36 h-36 md:w-48 md:h-48 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="transparent" stroke="rgba(0,0,0,0.03)" strokeWidth="8" />
            <motion.circle
              cx="50" cy="50" r="44"
              fill="transparent"
              stroke="#4f46e5"
              strokeWidth="8"
              strokeDasharray={strokeDasharray}
              animate={{ strokeDashoffset: strokeDasharray - (strokeDasharray * progress) / 100 }}
              transition={{ duration: 1, ease: "linear" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="flex flex-col items-center relative z-10">
            <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">
              {Math.floor(secondsRemaining / 60)}:{(secondsRemaining % 60).toString().padStart(2, "0")}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Remaining</span>
          </div>
        </div>

        {/* Real-time Results (Admin Only) */}
        {results && isAdmin && (
          <div className="flex flex-col gap-4 flex-1 w-full md:w-auto">
             <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buy It</span>
                    <span className="text-sm font-black text-emerald-600">{results.buy}</span>
                </div>
                <div className="h-2.5 bg-slate-100/50 rounded-full overflow-hidden border border-white">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(results.buy / (Math.max(1, results.buy + results.leave))) * 100}%` }}
                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                    />
                </div>
             </div>
             <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Leave It</span>
                    <span className="text-sm font-black text-rose-600">{results.leave}</span>
                </div>
                <div className="h-2.5 bg-slate-100/50 rounded-full overflow-hidden border border-white">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(results.leave / (Math.max(1, results.buy + results.leave))) * 100}%` }}
                        className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]" 
                    />
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Interaction Zone */}
      <div className="w-full relative z-10 pb-2">
        {!isAdmin ? (
          <div className="space-y-6">
             <AnimatePresence mode="wait">
               {!userVote && isActive && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0 }}
                   className="text-center p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100"
                 >
                   <p className="text-[10px] font-black text-white uppercase tracking-widest animate-pulse">
                     Your opinion counts! Choose below.
                   </p>
                 </motion.div>
               )}
             </AnimatePresence>
             
            {userVote ? (
              <div className="flex items-center justify-center gap-3 p-5 bg-indigo-50 text-indigo-600 rounded-3xl border-2 border-indigo-100 font-black text-sm tracking-widest">
                 <CheckCircle2 size={24} className="animate-pulse" />
                 LOCKED: {userVote.toUpperCase()}
              </div>
            ) : !isActive ? (
               <div className="flex flex-col items-center gap-4 p-8 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2rem]">
                  <div className="relative flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                    <div className="absolute w-6 h-6 bg-indigo-50 rounded-full" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Waiting for session to start</span>
               </div>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => onVote?.('buy')}
                  className="flex-1 flex flex-col items-center gap-3 p-6 bg-emerald-50 border-2 border-emerald-100 rounded-3xl hover:bg-emerald-500 hover:text-white transition-all group premium-shadow active:scale-95"
                >
                  <ThumbsUp className="text-emerald-500 group-hover:text-white transition-transform group-hover:scale-110" size={28} />
                  <span className="text-[10px] font-black tracking-[0.2em]">BUY IT</span>
                </button>
                <button
                  onClick={() => onVote?.('leave')}
                  className="flex-1 flex flex-col items-center gap-3 p-6 bg-rose-50 border-2 border-rose-100 rounded-3xl hover:bg-rose-500 hover:text-white transition-all group premium-shadow active:scale-95"
                >
                  <ThumbsDown className="text-rose-500 group-hover:text-white transition-transform group-hover:scale-110" size={28} />
                  <span className="text-[10px] font-black tracking-[0.2em]">LEAVE IT</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4 w-full">
            <button
              onClick={onToggle}
              className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-3xl font-black tracking-[0.15em] text-sm transition-all premium-shadow active:scale-95 ${
                isActive 
                  ? "bg-slate-900 text-white hover:bg-slate-800" 
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100"
              }`}
            >
              {isActive ? "PAUSE SESSION" : (
                 <>
                   <Play className="w-5 h-5 fill-current" />
                   START PITCH
                 </>
              )}
            </button>
            <button
              onClick={onReset}
              className="p-5 bg-white border-2 border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 rounded-3xl transition-all premium-shadow"
              title="Reset Timer"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}


