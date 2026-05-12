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
import { RotateCw, Trash2, Users, Play, LogIn, Crown, User as UserIcon, LogOut } from "lucide-react";

const SESSION_ID = 'main-session';

interface SessionData {
  names: string[];
  pitchedMembers: string[];
  currentWinner: string | null;
  stopwatchActive: boolean;
  stopwatchEndTime: number;
  adminId: string;
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
        setSession(docSnap.data() as SessionData);
      } else if (currentUser) {
        // Create initial session if user is signed in and it doesn't exist
        const initial: SessionData = {
          names: [],
          pitchedMembers: [],
          currentWinner: null,
          stopwatchActive: false,
          stopwatchEndTime: 0,
          adminId: currentUser.uid
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
            stopwatchActive: false
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
    if (!isAdmin) return;
    await updateDoc(doc(db, 'sessions', SESSION_ID), {
      stopwatchActive: !session?.stopwatchActive,
      stopwatchEndTime: !session?.stopwatchActive ? Date.now() + 60000 : 0
    });
  };

  const resetStopwatch = async () => {
    if (!isAdmin) return;
    await updateDoc(doc(db, 'sessions', SESSION_ID), {
      stopwatchEndTime: Date.now() + 60000,
      stopwatchActive: true
    });
  };

  const closeStopwatch = async () => {
    if (!isAdmin) return;
    await updateDoc(doc(db, 'sessions', SESSION_ID), {
      stopwatchActive: false,
      currentWinner: null
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

  // Timer calculation
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  useEffect(() => {
    if (session?.stopwatchActive && session.stopwatchEndTime > 0) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((session.stopwatchEndTime - Date.now()) / 1000));
        setSecondsRemaining(remaining);
        if (remaining === 0) clearInterval(interval);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [session?.stopwatchActive, session?.stopwatchEndTime]);

  // Vote Aggregation
  const currentVotes = votes.filter(v => v.winnerName === session?.currentWinner);
  const voteResults = {
    buy: currentVotes.filter(v => v.choice === 'buy').length,
    leave: currentVotes.filter(v => v.choice === 'leave').length
  };
  const myVote = currentVotes.find(v => v.userId === currentUser?.uid)?.choice;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-200 mb-8 animate-float">
          <RotateCw className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-800 mb-2">Spin Roulette <span className="text-indigo-600">Pro</span></h1>
        <p className="text-slate-400 max-w-xs mb-8">Atmospheric selection tool for high-stakes decisions and multi-user participation.</p>
        <button 
          onClick={signIn}
          className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
        >
          <LogIn size={20} />
          SIGN IN WITH GOOGLE
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900 selection:bg-indigo-100">
      {/* Header Navigation */}
      <nav className="h-auto min-h-[80px] bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex flex-wrap items-center justify-between shadow-sm z-50 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-200 shadow-lg shrink-0">
            <RotateCw className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">
            Spin Roulette <span className="text-indigo-500 font-black">Pro</span>
          </span>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 mt-2 sm:mt-0 w-full sm:w-auto justify-end">
          {/* Stats in Nav */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-indigo-50 rounded-full border border-indigo-100 flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Staked</span>
              <span className="text-xs font-bold text-indigo-700">{session?.names.length || 0}</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100 flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">History</span>
              <span className="text-xs font-bold text-slate-700">{session?.pitchedMembers.length || 0}</span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block mx-1" />

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
              {isAdmin ? <Crown size={12} className="text-amber-500" /> : <UserIcon size={12} className="text-slate-400" />}
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                 {isAdmin ? "Admin" : "User"}
              </span>
            </div>

            <button
               onClick={signOutUser}
               className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
               title="Log Out"
            >
               <LogOut size={18} />
            </button>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-1 ml-2 border-l border-slate-200 pl-2">
              <button 
                onClick={resetPool}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all"
                title="Reset from history"
              >
                <Users size={20} />
              </button>
              <button 
                onClick={clearAll}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Clear all"
              >
                <Trash2 size={20} />
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden w-full">
        
        {/* Wheel Section */}
        <div className="flex-1 flex flex-col items-center justify-center relative p-4 md:p-8 min-h-[500px]">
          <AnimatePresence>
            {localWinner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                className="absolute inset-0 z-[60] bg-white/40 backdrop-blur-md flex items-center justify-center pointer-events-none"
              >
                <div className="bg-emerald-500 text-white px-12 py-6 rounded-[2rem] border-8 border-white shadow-[0_30px_60px_-15px_rgba(16,185,129,0.3)] flex flex-col items-center gap-4">
                   <div className="flex items-center gap-3">
                      <span className="text-3xl animate-bounce">🏆</span>
                      <span className="text-xs font-black uppercase tracking-[0.3em]">Selection Complete</span>
                   </div>
                   <h2 className="text-6xl md:text-8xl font-black tracking-tighter">{localWinner}</h2>
                </div>
              </motion.div>
            )}

            {session?.currentWinner && (
               <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
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
            )}
          </AnimatePresence>

          <div className="w-full flex-1 flex flex-col items-center justify-center transition-all duration-700 min-h-[400px]">
            <div className="w-full max-w-[min(80vw,500px)] aspect-square relative flex items-center justify-center">
              <Wheel 
                ref={wheelRef}
                items={session?.names || []} 
                isSpinning={isSpinning} 
                setIsSpinning={setIsSpinning}
                onSpinEnd={handleSpinEnd} 
              />
            </div>
            
            {/* Admin Spin Button */}
            {isAdmin && (
              <div className="mt-8 flex justify-center w-full">
                 <button
                    onClick={startSpin}
                    disabled={isSpinning || (session?.names.length || 0) === 0}
                    className="group relative scale-90 md:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative px-8 md:px-12 py-4 md:py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl md:text-2xl tracking-widest shadow-2xl flex items-center gap-4 transition-transform active:scale-95">
                      SPIN WHEEL
                      <Play className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                    </div>
                 </button>
              </div>
            )}
          </div>
          
          {isAdmin && (
            <div className="mt-8 md:mt-12 w-full max-w-sm space-y-4 px-4 pb-8 lg:pb-0">
              <ManualEntry onAddName={handleAddManualName} />
              <FileUpload onNamesLoaded={handleNamesLoaded} />
            </div>
          )}
        </div>

        {/* Sidebar Section */}
        <aside className="w-full lg:w-96 h-auto lg:h-full bg-white border-t lg:border-t-0 lg:border-l border-slate-200 shrink-0">
           <History members={session?.pitchedMembers || []} />
        </aside>

      </main>
    </div>
  );
}

