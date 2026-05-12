import { Upload, FileSpreadsheet } from "lucide-react";
import Papa from "papaparse";
import { useRef } from "react";

interface FileUploadProps {
  onNamesLoaded: (names: string[]) => void;
}

export default function FileUpload({ onNamesLoaded }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const names = results.data
          .flat()
          .map((n) => String(n).trim())
          .filter((n) => n.length > 0 && n !== "null" && n !== "undefined");
        
        if (names.length > 0) {
          onNamesLoaded(names);
        }
      },
      header: false,
      skipEmptyLines: true,
    });
    
    // Reset input
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        accept=".csv,.txt"
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full p-6 glass-card border-2 border-white hover:border-indigo-200 transition-all group flex items-center gap-5 text-left active:scale-[0.98]"
      >
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:rotate-6 transition-all duration-500">
          <Upload className="text-indigo-600 group-hover:text-white transition-colors w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-slate-900 font-extrabold text-base tracking-tight">Upload List</p>
          <p className="text-slate-500 text-xs font-medium flex items-center gap-1.5 mt-0.5">
            <FileSpreadsheet size={12} className="text-slate-400" />
            CSV or Text files
          </p>
        </div>
        <div className="px-4 py-2 bg-indigo-50 text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
            IMPORT
        </div>
      </button>
    </div>
  );
}

