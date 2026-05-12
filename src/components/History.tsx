import { motion, AnimatePresence } from "motion/react";
import { History as HistoryIcon, Trophy, User } from "lucide-react";

interface HistoryProps {
  members: string[];
}

export default function History({ members }: HistoryProps) {
  return (
    <div className="w-full h-full glass-card border-none rounded-none flex flex-col overflow-hidden">
      <div className="p-8 border-b border-white/40 bg-white/30 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-100">
                <HistoryIcon size={16} className="text-white" />
            </div>
            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em]">Session History</h3>
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Pitched <span className="text-indigo-600 ml-1">{members.length}</span>
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-slate-50/30">
        <AnimatePresence initial={false}>
          {members.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-40 py-12 text-center px-6">
               <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mb-4">
                  <User size={24} className="text-slate-400" />
               </div>
               <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Waiting for<br/>First Pitch</p>
            </div>
          ) : (
            members.map((name, i) => {
              const isLatest = i === 0;
              return (
                <motion.div
                  key={`${name}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group ${
                    isLatest 
                      ? "bg-white border-indigo-100 shadow-xl shadow-indigo-100/50" 
                      : "bg-white/50 border-white/50 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-110 ${
                    isLatest 
                      ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-100" 
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {isLatest ? <Trophy size={20} /> : name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-slate-900 truncate tracking-tight">{name}</p>
                    <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${
                      isLatest ? "text-indigo-500 animate-pulse-soft" : "text-slate-400"
                    }`}>
                      {isLatest ? "Just Pitched" : `Session #${members.length - i}`}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

