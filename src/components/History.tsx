import { motion, AnimatePresence } from "motion/react";
import { UserMinus } from "lucide-react";

interface HistoryProps {
  members: string[];
}

export default function History({ members }: HistoryProps) {
  return (
    <div className="w-full h-full bg-white lg:rounded-none rounded-3xl shadow-xl lg:shadow-none border border-slate-200 lg:border-0 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pitched Members</h3>
        <p className="text-2xl font-black text-slate-800 mt-1">
          Queue <span className="text-indigo-600">{members.length}</span>
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
        <AnimatePresence initial={false}>
          {members.length === 0 ? (
            <div className="h-full flex items-center justify-center opacity-20 py-10 text-center px-4">
               <p className="text-sm font-medium tracking-tight">Waiting for first pitch...</p>
            </div>
          ) : (
            members.map((name, i) => {
              const isLatest = i === 0;
              return (
                <motion.div
                  key={`${name}-${i}`}
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    isLatest 
                      ? "bg-emerald-50 border-emerald-100 shadow-sm shadow-emerald-100" 
                      : "bg-slate-50 border-slate-100 opacity-70"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    isLatest ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                  }`}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{name}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${
                      isLatest ? "text-emerald-600 italic" : "text-slate-400"
                    }`}>
                      {isLatest ? "Just Pitched! 🏆" : `#${members.length - i} Session`}
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
