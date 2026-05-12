import { Plus, UserPlus } from "lucide-react";
import { useState } from "react";

interface ManualEntryProps {
  onAddName: (name: string) => void;
}

export default function ManualEntry({ onAddName }: ManualEntryProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onAddName(trimmed);
      setName("");
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="w-full flex items-center p-1 bg-white/40 backdrop-blur-md border-2 border-white rounded-3xl premium-shadow hover:border-indigo-100 focus-within:border-indigo-400 focus-within:ring-8 focus-within:ring-indigo-50/50 transition-all group"
    >
      <div className="pl-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
        <UserPlus size={20} />
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Type name here..."
        className="flex-1 bg-transparent px-4 py-3.5 outline-none text-base font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium"
      />
      <button
        type="submit"
        disabled={!name.trim()}
        className="p-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-[1.25rem] transition-all flex items-center justify-center shadow-xl shadow-indigo-100 group-active:scale-95 shrink-0"
      >
        <Plus className="w-5 h-5 stroke-[3]" />
      </button>
    </form>
  );
}

