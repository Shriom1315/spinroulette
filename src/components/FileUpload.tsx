import { Upload } from "lucide-react";
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
        className="w-full p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group flex items-center gap-4 text-left"
      >
        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 transition-all duration-300">
          <Upload className="text-indigo-600 group-hover:text-white transition-colors w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-slate-800 font-bold text-sm">Upload Member List</p>
          <p className="text-slate-400 text-xs mt-0.5">Select CSV or TXT file</p>
        </div>
        <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
            IMPORT
        </div>
      </button>
    </div>
  );
}
