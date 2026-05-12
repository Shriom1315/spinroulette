import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { onSnapshot, doc, setDoc, updateDoc, collection, query, where, arrayUnion, serverTimestamp, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { db, auth, signIn, signOutUser } from "./lib/firebase";
import FileUpload from "./components/FileUpload";
import History from "./components/History";
import Wheel, { WheelRef } from "./components/Wheel";
import ManualEntry from "./components/ManualEntry";
import Stopwatch from "./components/Stopwatch";
import { RotateCw, Trash2, Users, Play, LogIn, Crown, User as UserIcon, LogOut, Trophy, History as HistoryIcon } from "lucide-react";

const SESSION_ID = 'main-session';

interface SessionData {
  names: string[];
  pitchedMembers: string[];
  currentWinner: string | null;
  stopwatchActive: boolean;
  stopwatchEndTime: number;
  stopwatchRemaining: number;
  adminId: string;
  syncTimestamp?: number; // Added for clock synchronization
}

interface VoteData {
  choice: 'buy' | 'leave';
  userId: string;
  winnerName: string;
  timestamp: number;
}

export default function App() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [localWinner, setLocalWinner] = useState<string | null>(null);
  const [votes, setVotes] = useState<VoteData[]>([]);
  const [clockOffset, setClockOffset] = useState(0); // State for clock synchronization
  const wheelRef = useRef<WheelRef>(null);

  // Auth State
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
  }, []);

  // Firestore Sync
  useEffect(() => {
    if (!currentUser) return;

    const sessionRef = doc(db, 'sessions', SESSION_ID);
    const unsubSession = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SessionData;
        setSession(data);
        
        // Calculate clock offset if syncTimestamp exists
        if (data.syncTimestamp) {
          setClockOffset(data.syncTimestamp - Date.now());
        }
      } else if (currentUser) {
        // Create initial session if user is signed in and it doesn't exist
        const initial: SessionData = {
          names: [],
          pitchedMembers: [],
          currentWinner: null,
          stopwatchActive: false,
          stopwatchEndTime: 0,
          stopwatchRemaining: 60,
          adminId: currentUser.uid,
          syncTimestamp: Date.now()
        };
        setDoc(sessionRef, initial);
      }
    });

    const votesQuery = collection(db, 'sessions', SESSION_ID, 'votes');
    const unsubVotes = onSnapshot(votesQuery, (snap) => {
      setVotes(snap.docs.map(d => d.data() as VoteData));
    });

    return () => {
      unsubSession();
      unsubVotes();
    };
  }, [currentUser]);

  // Handle Wheel Winner
  useEffect(() => {
    if (session?.currentWinner && !isSpinning && !localWinner) {
      setLocalWinner(session.currentWinner);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#818cf8", "#ffffff"]
      });
      
      // Clear winner display after 3s
      setTimeout(() => {
        setLocalWinner(null);
      }, 4000);
    }
  }, [session?.currentWinner, isSpinning]);

  const isAdmin = currentUser?.uid === session?.adminId;

  // Actions
  const handleNamesLoaded = async (newNames: string[]) => {
    if (!isAdmin) return;
    await updateDoc(doc(db, 'sessions', SESSION_ID), {
      names: arrayUnion(...newNames)
    });
  };

  const handleAddManualName = async (name: string) => {
    if (!isAdmin) return;
    await updateDoc(doc(db, 'sessions', SESSION_ID), {
      names: arrayUnion(name)
    });
  };

  const handleSpinEnd = async (selectedWinner: string) => {
    if (!isAdmin) return;
    // Update Firestore with the winner
    await updateDoc(doc(db, 'sessions', SESSION_ID), {
      currentWinner: selectedWinner,
      names: session!.names.filter(n => n !== selectedWinner),
      pitchedMembers: [selectedWinner, ...session!.pitchedMembers]
    });
  };

  const startSpin = () => {
    if (!isAdmin) return;
    wheelRef.current?.spin();
  };

  const clearAll = async () => {
    if (!isAdmin) return;
    if (window.confirm("Are you sure you want to clear everything?")) {
        await updateDoc(doc(db, 'sessions', SESSION_ID), {
            names: [],
            pitchedMembers: [],
            currentWinner: null,
            stopwatchActive: false,
            stopwatchRemaining: 60,
            syncTimestamp: Date.now()
        });
    }
  };

  const resetPool = async () => {
    if (!isAdmin) return;
    await updateDoc(doc(db, 'sessions', SESSION_ID), {
        names: [...session!.names, ...session!.pitchedMembers],
        pitchedMembers: []
    });
  };

  const toggleStopwatch = async () => {
    if (!isAdmin || !session) return;
    const now = Date.now();
    
    if (!session.stopwatchActive) {
      // Starting or Resuming
      const remaining = session.stopwatchRemaining !== undefined ? session.stopwatchRemaining : 60;
      await updateDoc(doc(db, 'sessions', SESSION_ID), {
        stopwatchActive: true,
        stopwatchEndTime: now + (remaining * 1000),
        syncTimestamp: now // Anchor point for participants
      });
    } else {
      // Pausing
      const remaining = Math.max(0, Math.floor((session.stopwatchEndTime - now) / 1000));
      await updateDoc(doc(db, 'sessions', SESSION_ID), {
        stopwatchActive: false,
        stopwatchRemaining: remaining,
        syncTimestamp: now
      });
    }
  };

  const resetStopwatch = async () => {
    if (!isAdmin) return;
    const now = Date.now();
    await updateDoc(doc(db, 'sessions', SESSION_ID), {
      stopwatchActive: true,
      stopwatchEndTime: now + 60000,
      stopwatchRemaining: 60,
      syncTimestamp: now
    });
  };

  const closeStopwatch = async () => {
    if (!isAdmin) return;
    await updateDoc(doc(db, 'sessions', SESSION_ID), {
      stopwatchActive: false,
      stopwatchRemaining: 60,
      currentWinner: null,
      syncTimestamp: Date.now()
    });
  };

  const castVote = async (choice: 'buy' | 'leave') => {
    if (!currentUser || !session?.currentWinner) return;
    const voteId = `${currentUser.uid}_${session.currentWinner}`;
    await setDoc(doc(db, 'sessions', SESSION_ID, 'votes', voteId), {
      choice,
      userId: currentUser.uid,
      winnerName: session.currentWinner,
      timestamp: Date.now()
    });
  };

  // Timer calculation with Sync/Resume support
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  useEffect(() => {
    if (!session) return;

    if (session.stopwatchActive && session.stopwatchEndTime > 0) {
      const updateTimer = () => {
        // Source of truth: Admin's clock corrected by our local offset
        const correctedNow = Date.now() + clockOffset;
        const remaining = Math.max(0, Math.floor((session.stopwatchEndTime - correctedNow) / 1000));
        
        setSecondsRemaining(remaining);
        
        if (remaining === 0) {
           // Auto-pause when reaching 0 if admin
           if (isAdmin && session.stopwatchActive) {
              updateDoc(doc(db, 'sessions', SESSION_ID), { 
                stopwatchActive: false, 
                stopwatchRemaining: 0,
                syncTimestamp: Date.now()
              });
           }
        }
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setSecondsRemaining(session.stopwatchRemaining !== undefined ? session.stopwatchRemaining : 60);
    }
  }, [session?.stopwatchActive, session?.stopwatchEndTime, session?.stopwatchRemaining, clockOffset, isAdmin]);


  // Vote Aggregation
  const currentVotes = votes.filter(v => v.winnerName === session?.currentWinner);
  const voteResults = {
    buy: currentVotes.filter(v => v.choice === 'buy').length,
    leave: currentVotes.filter(v => v.choice === 'leave').length
  };
  const myVote = currentVotes.find(v => v.userId === currentUser?.uid)?.choice;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(79,70,229,0.1),transparent_50%)] pointer-events-none" />
        
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-200 mb-10 animate-float relative z-10"
        >
          <RotateCw className="w-12 h-12 text-white" />
        </motion.div>
        
        <div className="relative z-10">
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 mb-4">
              Spin Roulette <span className="text-indigo-600">Pro</span>
            </h1>
            <p className="text-slate-500 max-w-sm mx-auto mb-12 text-lg font-medium leading-relaxed">
              The high-fidelity selection engine for competitive pitches and decision making.
            </p>
            
            <button 
              onClick={signIn}
              className="group relative inline-flex items-center gap-4 px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black tracking-widest hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95"
            >
              <LogIn size={22} className="group-hover:translate-x-1 transition-transform" />
              SIGN IN WITH GOOGLE
            </button>
            
            <p className="mt-12 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Powered by Gemini AI</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-[#f1f5f9] text-slate-900 selection:bg-indigo-100 no-scrollbar">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
          <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] bg-sky-500/5 blur-[150px] rounded-full" />
      </div>

      {/* Global Navigation */}
      <nav className="h-20 bg-white/70 backdrop-blur-xl border-b border-white/50 px-6 md:px-12 flex items-center justify-between shadow-sm z-[100] sticky top-0">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 shrink-0 transform rotate-3">
            <RotateCw className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 leading-none">
                Roulette <span className="text-indigo-500">Pro</span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Live Session</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 md:gap-6">
          {/* Quick Stats Dashboard (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
             <div className="px-4 py-2 bg-white rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-black text-slate-700">{session?.names.length || 0} Pool</span>
             </div>
             <div className="px-4 py-2 bg-indigo-600 rounded-2xl flex items-center gap-3 shadow-lg shadow-indigo-100">
                <Trophy size={14} className="text-indigo-200" />
                <span className="text-xs font-black text-white">{session?.pitchedMembers.length || 0} Winners</span>
             </div>
          </div>

          <div className="w-px h-8 bg-slate-200 hidden sm:block mx-2" />

          {/* User Profile Area */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col items-end mr-1">
                <span className="text-xs font-black text-slate-900">{currentUser.displayName || "User"}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">
                    {isAdmin ? "Organizer" : "Participant"}
                </span>
            </div>
            
            <div className="relative">
                <img 
                    src={currentUser.photoURL || ""} 
                    alt="profile" 
                    className="w-10 h-10 rounded-2xl border-2 border-white shadow-md bg-slate-100"
                />
                {isAdmin && <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                    <Crown size={8} className="text-white fill-current" />
                </div>}
            </div>

            <button
               onClick={signOutUser}
               className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
               title="Log Out"
            >
               <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row relative z-10 overflow-hidden">
        
        {/* Workspace (Wheel & Controls) */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24 lg:pb-0">
          <div className="max-w-6xl mx-auto w-full min-h-full flex flex-col items-center justify-center p-6 md:p-12">
            
            <AnimatePresence>
              {localWinner && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 1.2, rotate: 5 }}
                  className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6 pointer-events-none"
                >
                  <div className="bg-white p-2 rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
                      <div className="bg-indigo-600 text-white px-12 md:px-20 py-10 md:py-16 rounded-[2.5rem] border-8 border-indigo-500 flex flex-col items-center gap-6 relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]" />
                         <div className="flex items-center gap-4 relative z-10">
                            <Trophy className="w-8 h-8 text-amber-300 animate-bounce" />
                            <span className="text-xs font-black uppercase tracking-[0.5em] text-indigo-200">Winner Selected</span>
                         </div>
                         <h2 className="text-6xl md:text-9xl font-black tracking-tighter relative z-10 drop-shadow-2xl">{localWinner}</h2>
                         <div className="w-24 h-2 bg-indigo-400/50 rounded-full relative z-10" />
                      </div>
                  </div>
                </motion.div>
              )}

              {session?.currentWinner && (
                 <div className="fixed inset-0 z-[90] bg-slate-900/20 backdrop-blur-md overflow-y-auto no-scrollbar pt-24 pb-12 px-4 md:px-8">
                    <div className="min-h-full flex items-center justify-center">
                        <Stopwatch 
                          isAdmin={isAdmin}
                          isActive={session.stopwatchActive}
                          secondsRemaining={secondsRemaining}
                          onToggle={toggleStopwatch}
                          onReset={resetStopwatch}
                          onClose={closeStopwatch} 
                          onVote={castVote}
                          userVote={myVote}
                          results={voteResults}
                          winnerName={session.currentWinner}
                        />
                    </div>
                 </div>
              )}
            </AnimatePresence>

            {/* The Stage */}
            <div className="w-full flex flex-col items-center gap-12">
              <div className="w-full max-w-xl aspect-square relative flex items-center justify-center">
                <Wheel 
                  ref={wheelRef}
                  items={session?.names || []} 
                  isSpinning={isSpinning} 
                  setIsSpinning={setIsSpinning}
                  onSpinEnd={handleSpinEnd} 
                />
              </div>
              
              {/* Central Actions Area */}
              <div className="w-full max-w-2xl flex flex-col items-center gap-10">
                {isAdmin ? (
                  <div className="w-full space-y-10">
                    {/* Main Spin Button */}
                    <div className="flex justify-center">
                       <button
                          onClick={startSpin}
                          disabled={isSpinning || (session?.names.length || 0) === 0}
                          className="group relative disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                       >
                          <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-60 transition duration-500 animate-pulse"></div>
                          <div className="relative px-16 py-6 bg-indigo-600 text-white rounded-[1.8rem] font-black text-2xl tracking-[0.15em] shadow-2xl flex items-center gap-6 overflow-hidden">
                             <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                             <span className="relative z-10">SPIN NOW</span>
                             <Play className="w-7 h-7 relative z-10 fill-current" />
                          </div>
                       </button>
                    </div>

                    {/* Admin Tools Shelf */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
                        <ManualEntry onAddName={handleAddManualName} />
                        <FileUpload onNamesLoaded={handleNamesLoaded} />
                    </div>
                    
                    {/* Advanced Controls */}
                    <div className="flex items-center justify-center gap-4 px-4">
                        <button 
                            onClick={resetPool}
                            className="flex-1 md:flex-none flex items-center gap-3 px-6 py-3 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-2xl border border-slate-100 transition-all premium-shadow"
                        >
                            <Users size={16} />
                            REFILL POOL
                        </button>
                        <button 
                            onClick={clearAll}
                            className="flex-1 md:flex-none flex items-center gap-3 px-6 py-3 bg-white hover:bg-rose-50 text-rose-500 font-bold text-xs rounded-2xl border border-slate-100 transition-all premium-shadow"
                        >
                            <Trash2 size={16} />
                            RESET SESSION
                        </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 glass-card max-w-sm w-full border-indigo-100/50">
                      <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                          <Users className="text-indigo-600" size={20} />
                      </div>
                      <h3 className="text-lg font-black text-slate-800">Ready to Vote?</h3>
                      <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
                          Wait for the Organizer to spin the wheel. You'll be able to cast your verdict as soon as a winner is picked!
                      </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Sidebar Navigation / History (Desktop: Side, Mobile: Bottom Sheet style) */}
        <aside className="w-full lg:w-[400px] bg-white border-t lg:border-t-0 lg:border-l border-slate-100 shrink-0 z-40 lg:block hidden">
           <History members={session?.pitchedMembers || []} />
        </aside>
        
        {/* Mobile History Toggle (FAB) */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
            <button 
                onClick={() => {
                    const aside = document.querySelector('aside');
                    if (aside) aside.classList.toggle('hidden');
                }}
                className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
            >
                <HistoryIcon size={24} />
            </button>
        </div>

      </main>
      
      {/* Visual Ticker Tape (Footer) */}
      <footer className="h-10 bg-slate-900 overflow-hidden flex items-center relative z-[60]">
          <div className="flex whitespace-nowrap animate-marquee group">
              {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex items-center gap-8 px-8">
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Spin Roulette Pro</span>
                      <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Live Competition</span>
                      <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Google AI Powered</span>
                      <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                  </div>
              ))}
          </div>
      </footer>
      
      <style>{`
        @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
        .animate-marquee {
            animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}


