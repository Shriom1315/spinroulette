import { motion } from "motion/react";
import { Trophy, ThumbsUp, ThumbsDown, ChevronLeft, Medal, Users } from "lucide-react";

interface VoteData {
  choice: 'buy' | 'leave';
  userId: string;
  winnerName: string;
  timestamp: number;
}

interface LeaderboardProps {
  pitchedMembers: string[];
  votes: VoteData[];
  onBack: () => void;
}

export default function Leaderboard({ pitchedMembers, votes, onBack }: LeaderboardProps) {
  // Aggregate data
  const stats = pitchedMembers.map(member => {
    const memberVotes = votes.filter(v => v.winnerName === member);
    const buy = memberVotes.filter(v => v.choice === 'buy').length;
    const leave = memberVotes.filter(v => v.choice === 'leave').length;
    const total = buy + leave;
    const score = total > 0 ? (buy / total) * 100 : 0;

    return {
      name: member,
      buy,
      leave,
      total,
      score: Math.round(score)
    };
  }).sort((a, b) => b.score - a.score || b.buy - a.buy);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all active:scale-95 border border-transparent hover:border-slate-100"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Verdict Dashboard</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Rankings & Analytics</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-2">
                <Users size={14} className="text-indigo-600" />
                <span className="text-xs font-black text-indigo-700">{votes.length} Total Votes</span>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {stats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-6 text-slate-300">
                    <Trophy size={40} />
                </div>
                <h3 className="text-xl font-black text-slate-900">No Pitches Yet</h3>
                <p className="text-slate-500 max-w-xs mt-2 font-medium">The leaderboard will populate as soon as the first pitch session concludes.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {stats.map((item, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={item.name}
                  className="bg-white rounded-3xl p-6 border border-slate-100 flex flex-col md:flex-row items-center gap-6 group hover:shadow-xl hover:shadow-indigo-50/50 transition-all"
                >
                  {/* Rank & Identity */}
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center font-black text-xl ${
                      index === 0 ? "bg-amber-100 text-amber-600 shadow-lg shadow-amber-50" : 
                      index === 1 ? "bg-slate-100 text-slate-500" :
                      index === 2 ? "bg-orange-50 text-orange-600" : "text-slate-300"
                    }`}>
                      {index < 3 ? <Medal size={24} /> : index + 1}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-slate-900 tracking-tight">{item.name}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Presenter</span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="flex-1 w-full space-y-2">
                     <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buy Confidence</span>
                        </div>
                        <span className="text-lg font-black text-indigo-600">{item.score}%</span>
                     </div>
                     <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-white p-0.5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${item.score}%` }}
                          className={`h-full rounded-full ${
                            item.score > 70 ? "bg-emerald-500" :
                            item.score > 40 ? "bg-amber-400" : "bg-rose-500"
                          }`}
                        />
                     </div>
                  </div>

                  {/* Raw Counts */}
                  <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <ThumbsUp size={14} className="text-emerald-500" />
                      <span className="text-sm font-black text-emerald-600">{item.buy}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 rounded-2xl border border-rose-100">
                      <ThumbsDown size={14} className="text-rose-500" />
                      <span className="text-sm font-black text-rose-600">{item.leave}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
