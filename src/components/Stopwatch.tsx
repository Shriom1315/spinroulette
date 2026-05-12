import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Play, RotateCcw, Timer as TimerIcon, ThumbsUp, ThumbsDown, CheckCircle2 } from "lucide-react";

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
  onComplete, 
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="sleek-card p-5 md:p-8 flex flex-col items-center gap-6 w-[95%] max-w-md mx-auto bg-white border-2 border-indigo-100 shadow-2xl relative overflow-hidden"
    >
      {isAdmin && (
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors text-2xl"
        >
          ×
        </button>
      )}

      {/* Winner Identity */}
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100 mb-4 animate-bounce">
          <CheckCircle2 size={24} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-1">Selected for Pitch</span>
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">{winnerName}</h2>
      </div>

      <div className="w-full h-px bg-slate-100" />

      <div className="flex w-full gap-6 md:gap-8 items-center justify-center flex-col md:flex-row">
        {/* Timer Circle */}
        <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="80" cy="80" r="70" fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
            <motion.circle
              cx="80" cy="80" r="70"
              fill="transparent"
              stroke="#4f46e5"
              strokeWidth="10"
              strokeDasharray="439.8"
              animate={{ strokeDashoffset: 439.8 - (439.8 * progress) / 100 }}
              transition={{ duration: 1, ease: "linear" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="flex flex-col items-center z-10">
            <span className="text-4xl font-black text-slate-900 tracking-tighter">
              {Math.floor(secondsRemaining / 60)}:{(secondsRemaining % 60).toString().padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Real-time Results (Only show if votes exist or time is running) */}
        {(results && (results.buy > 0 || results.leave > 0)) && (
          <div className="flex flex-col gap-3 flex-1">
             <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>Buy It</span>
                    <span>{results.buy}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(results.buy / (results.buy + results.leave || 1)) * 100}%` }}
                        className="h-full bg-emerald-500" 
                    />
                </div>
             </div>
             <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>Leave It</span>
                    <span>{results.leave}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(results.leave / (results.buy + results.leave || 1)) * 100}%` }}
                        className="h-full bg-rose-500" 
                    />
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Interaction Zone */}
      <div className="w-full space-y-4 px-1 md:px-0">
        {!isAdmin ? (
          <div className="space-y-4">
             {!userVote && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="text-center p-3 bg-indigo-600/10 rounded-xl border border-indigo-200"
               >
                 <p className="text-[11px] font-black text-indigo-700 uppercase tracking-widest animate-pulse">
                   Time is running! Cast your verdict now.
                 </p>
               </motion.div>
             )}
            <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Your Verdict</p>
            {userVote ? (
              <div className="flex items-center justify-center gap-2 p-4 bg-indigo-50 text-indigo-600 rounded-2xl border-2 border-indigo-100 font-bold">
                 <CheckCircle2 size={20} />
                 VOTED: {userVote.toUpperCase()}
              </div>
            ) : !isActive ? (
               <div className="flex flex-col items-center gap-2 p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Waiting for Admin to start pitch</span>
               </div>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => onVote?.('buy')}
                  className="flex-1 flex flex-col items-center gap-2 p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl hover:bg-emerald-100 hover:border-emerald-200 transition-all group"
                >
                  <ThumbsUp className="text-emerald-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black text-emerald-700">BUY IT</span>
                </button>
                <button
                  onClick={() => onVote?.('leave')}
                  className="flex-1 flex flex-col items-center gap-2 p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl hover:bg-rose-100 hover:border-rose-200 transition-all group"
                >
                  <ThumbsDown className="text-rose-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black text-rose-700">LEAVE IT</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4 w-full">
            <button
              onClick={onToggle}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all ${
                isActive 
                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200"
              }`}
            >
              {isActive ? "PAUSE" : (
                 <>
                   <Play className="w-4 h-4 fill-current" />
                   START PITCH
                 </>
              )}
            </button>
            <button
              onClick={onReset}
              className="p-4 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
