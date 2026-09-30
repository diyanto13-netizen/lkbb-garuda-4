import React, { useState } from 'react';
import { 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  Layers, 
  Terminal, 
  ShieldCheck, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { KODE_GS_CONTENT, INDEX_HTML_CONTENT, DEPLOYMENT_GUIDE_CONTENT } from '../gas/gasExportCode';

export const GasCodeViewer: React.FC = () => {
  const [activeFile, setActiveFile] = useState<'kodegs' | 'indexhtml' | 'guide'>('kodegs');
  const [copied, setCopied] = useState<string | null>(null);

  const getActiveContent = () => {
    switch (activeFile) {
      case 'kodegs':
        return KODE_GS_CONTENT;
      case 'indexhtml':
        return INDEX_HTML_CONTENT;
      case 'guide':
        return DEPLOYMENT_GUIDE_CONTENT;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveContent());
    setCopied(activeFile);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = () => {
    let filename = 'Kode.gs';
    let mime = 'text/javascript';
    if (activeFile === 'indexhtml') {
      filename = 'Index.html';
      mime = 'text/html';
    } else if (activeFile === 'guide') {
      filename = 'PANDUAN_DEPLOYMENT.md';
      mime = 'text/markdown';
    }

    const blob = new Blob([getActiveContent()], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
            SOURCE CODE & ARSITEKTUR GOOGLE APPS SCRIPT (GAS)
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <FileCode className="w-7 h-7 text-amber-400" />
            <span>Kode Siap Deploy ke Google Sheets & Drive</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kode backend lengkap dengan LockService konkurensi 50+ pengguna, CacheService, Drive API uploader, dan proteksi PIN server-side.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
          >
            {copied === activeFile ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Tersalin ke Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Salin File Ini</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Unduh File</span>
          </button>
        </div>
      </div>

      {/* File Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveFile('kodegs')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeFile === 'kodegs'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Kode.gs</span>
            <span className="text-[10px] opacity-75 font-sans">(Server & DB)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFile('indexhtml')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeFile === 'indexhtml'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Index.html</span>
            <span className="text-[10px] opacity-75 font-sans">(Web App Template)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFile('guide')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeFile === 'guide'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Panduan Deployment</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>LockService 20s Concurrency Safe</span>
        </div>
      </div>

      {/* Code Display Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono">
            {activeFile === 'kodegs' ? 'Kode.gs (Google Apps Script)' : activeFile === 'indexhtml' ? 'Index.html (GAS HTML Service)' : 'PANDUAN_DEPLOYMENT.md'}
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            {getActiveContent().split('\n').length} Baris Kode
          </span>
        </div>
        <pre className="p-6 text-xs font-mono text-slate-300 overflow-x-auto max-h-[580px] leading-relaxed selection:bg-amber-500/40">
          {getActiveContent()}
        </pre>
      </div>
    </div>
  );
};
