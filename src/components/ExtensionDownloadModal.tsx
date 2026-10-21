import React, { useState } from 'react';
import { Download, Code2, Copy, Check, X, FileCode, CheckCircle2, ExternalLink } from 'lucide-react';
import { getManifestV3Files, downloadExtensionZip, ExtensionFile } from '../services/extensionBuilder.ts';

interface ExtensionDownloadModalProps {
  onClose: () => void;
}

export const ExtensionDownloadModal: React.FC<ExtensionDownloadModalProps> = ({ onClose }) => {
  const files = getManifestV3Files();
  const [selectedFile, setSelectedFile] = useState<ExtensionFile>(files[0]);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadExtensionZip();
    } catch (err) {
      console.error('Failed to download zip:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-sky-950 text-sky-400 border border-sky-800/80">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Chrome Extension Package (Manifest V3)
              </h3>
              <p className="text-xs text-zinc-400">
                Ready to load into Google Chrome Side Panel & Action Popup
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Preparing ZIP...' : 'Download Extension (.zip)'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Instructions Banner */}
        <div className="px-5 py-2.5 bg-zinc-950/60 border-b border-zinc-800/80 flex items-center justify-between text-xs text-zinc-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Install Guide:</strong> Unzip package &rarr; open <code className="text-sky-300 bg-zinc-900 px-1 py-0.5 rounded">chrome://extensions</code> &rarr; enable <strong>Developer mode</strong> &rarr; click <strong>Load unpacked</strong>.
            </span>
          </div>
        </div>

        {/* File Browser & Code Viewer */}
        <div className="flex-1 flex overflow-hidden min-h-[380px]">
          {/* File sidebar */}
          <div className="w-52 border-r border-zinc-800 bg-zinc-950/70 p-2 space-y-1 overflow-y-auto">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-2 py-1">
              Extension Files
            </div>
            {files.map((file) => (
              <button
                key={file.name}
                type="button"
                onClick={() => setSelectedFile(file)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-left transition-colors ${
                  selectedFile.name === file.name
                    ? 'bg-zinc-800 text-white font-medium shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="truncate">{file.name}</span>
              </button>
            ))}
          </div>

          {/* Code display */}
          <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 text-xs text-zinc-400">
              <span className="font-mono text-zinc-300">{selectedFile.name}</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy File</span>
                  </>
                )}
              </button>
            </div>

            <pre className="flex-1 p-4 text-xs font-mono text-zinc-200 overflow-auto whitespace-pre leading-relaxed selection:bg-zinc-700">
              {selectedFile.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
