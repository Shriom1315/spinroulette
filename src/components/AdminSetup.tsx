import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Shield, Mail, Save, LogIn, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { User } from "firebase/auth";
import { db, signIn } from "../lib/firebase";

interface AdminSetupProps {
  currentUser: User | null;
  onBack: () => void;
  onSaved: () => void;
}

type Status = 'idle' | 'loading' | 'saving' | 'success' | 'error';

export default function AdminSetup({ currentUser, onBack, onSaved }: AdminSetupProps) {
  const [emailInput, setEmailInput] = useState("");
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Load existing admin config
  useEffect(() => {
    const loadConfig = async () => {
      setStatus('loading');
      try {
        const snap = await getDoc(doc(db, 'config', 'admin'));
        if (snap.exists()) {
          const data = snap.data();
          setCurrentAdminEmail(data.adminEmail ?? null);
          setEmailInput(data.adminEmail ?? "");

          // Authorized if: no admin email set yet (first time) OR current user IS the admin
          if (!data.adminEmail) {
            setIsAuthorized(true);
          } else if (currentUser && currentUser.email === data.adminEmail) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
          }
        } else {
          // No config doc at all — first time setup, authorize anyone signed in
          setCurrentAdminEmail(null);
          setIsAuthorized(!!currentUser);
        }
      } catch (e) {
        setErrorMsg("Failed to load config. Check your Firestore rules.");
        setStatus('error');
        return;
      }
      setStatus('idle');
    };

    loadConfig();
  }, [currentUser]);

  const handleSave = async () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!currentUser) {
      setErrorMsg("You must be signed in to save changes.");
      return;
    }
    if (!isAuthorized) {
      setErrorMsg("You are not authorized to change the admin email.");
      return;
    }

    setStatus('saving');
    setErrorMsg("");
    try {
      await setDoc(doc(db, 'config', 'admin'), { adminEmail: trimmed });
      setCurrentAdminEmail(trimmed);
      setStatus('success');
      setTimeout(() => {
        onSaved();
      }, 1500);
    } catch (e) {
      setErrorMsg("Failed to save. Make sure Firestore rules allow writing to config/admin.");
      setStatus('error');
    }
  };

  const isFirstTime = !currentAdminEmail;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(79,70,229,0.08),transparent_60%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm mb-8 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to App
        </button>

        {/* Card */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl shadow-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4 border border-white/30">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Admin Setup</h1>
            <p className="text-indigo-200 text-sm font-medium mt-1">
              {isFirstTime ? "Configure the admin for the first time" : "Manage admin access"}
            </p>
          </div>

          <div className="p-8 space-y-6">

            {/* Loading state */}
            {status === 'loading' && (
              <div className="flex flex-col items-center py-6 gap-3 text-slate-500">
                <Loader2 className="animate-spin w-6 h-6 text-indigo-500" />
                <span className="text-sm font-medium">Loading config...</span>
              </div>
            )}

            {status !== 'loading' && (
              <>
                {/* Current admin email badge */}
                {currentAdminEmail && (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                      <Mail size={16} className="text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Current Admin</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{currentAdminEmail}</p>
                    </div>
                  </div>
                )}

                {/* Not signed in */}
                {!currentUser && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-amber-700">
                        {isFirstTime
                          ? "Sign in with Google to set up the admin account."
                          : "You must sign in as the current admin to make changes."}
                      </p>
                    </div>
                    <button
                      onClick={signIn}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm tracking-widest transition-all active:scale-95 shadow-lg"
                    >
                      <LogIn size={18} />
                      SIGN IN WITH GOOGLE
                    </button>
                  </div>
                )}

                {/* Signed in but NOT authorized */}
                {currentUser && !isAuthorized && (
                  <div className="flex items-start gap-3 p-4 bg-rose-50 rounded-2xl border border-rose-100">
                    <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-rose-700">Access Denied</p>
                      <p className="text-xs font-medium text-rose-500 mt-0.5">
                        You're signed in as <span className="font-black">{currentUser.email}</span>, but the admin is{" "}
                        <span className="font-black">{currentAdminEmail}</span>. Sign in with the correct account.
                      </p>
                    </div>
                  </div>
                )}

                {/* Authorized — show form */}
                {currentUser && isAuthorized && (
                  <div className="space-y-4">
                    {/* Signed in as */}
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <img
                        src={currentUser.photoURL || ""}
                        alt="profile"
                        className="w-8 h-8 rounded-xl bg-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-0.5">Signed in as</p>
                        <p className="text-xs font-bold text-slate-700 truncate">{currentUser.email}</p>
                      </div>
                      <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                    </div>

                    {/* Email input */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block pl-1">
                        {isFirstTime ? "Set Admin Email" : "New Admin Email"}
                      </label>
                      <div className="flex items-center gap-3 p-1 bg-slate-50 border-2 border-slate-100 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50 rounded-2xl transition-all">
                        <div className="pl-3 text-slate-400">
                          <Mail size={18} />
                        </div>
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="admin@example.com"
                          className="flex-1 bg-transparent py-3 pr-3 outline-none text-sm font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium"
                          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium pl-1">
                        Only this Gmail can sign in as the organizer/admin.
                      </p>
                    </div>

                    {/* Error message */}
                    {errorMsg && (
                      <div className="flex items-start gap-2 p-3 bg-rose-50 rounded-xl border border-rose-100">
                        <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                        <p className="text-xs font-medium text-rose-600">{errorMsg}</p>
                      </div>
                    )}

                    {/* Save button */}
                    <button
                      onClick={handleSave}
                      disabled={status === 'saving' || status === 'success'}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-2xl font-black text-sm tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-100"
                    >
                      {status === 'saving' ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          SAVING...
                        </>
                      ) : status === 'success' ? (
                        <>
                          <CheckCircle size={18} />
                          SAVED!
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          {isFirstTime ? "SET ADMIN" : "UPDATE ADMIN"}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-6">
          Admin Configuration · Career Glow Up Night
        </p>
      </motion.div>
    </div>
  );
}
