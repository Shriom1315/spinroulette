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
      className="w-full flex items-center p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:layer-shadow focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50 transition-all group"
    >
      <div className="pl-3 text-slate-300 group-focus-within:text-indigo-400 transition-colors">
        <UserPlus size={18} />
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add member name..."
        className="flex-1 bg-transparent px-3 py-2 outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400"
      />
      <button
        type="submit"
        disabled={!name.trim()}
        className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl transition-all flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0"
      >
        <Plus className="w-5 h-5" />
      </button>
    </form>
  );
}
