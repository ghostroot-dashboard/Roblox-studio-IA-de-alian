import React, { useState } from 'react';
import { Check, Copy, Download, Code, ExternalLink } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  fileName?: string;
  location?: string;
  onOpenInEditor?: (code: string, fileName?: string, location?: string) => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'luau',
  fileName,
  location,
  onOpenInEditor,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName ? (fileName.endsWith('.luau') ? fileName : `${fileName}.luau`) : 'script.luau';
    link.click();
    URL.revokeObjectURL(url);
  };

  const lines = code.trim().split('\n');

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-950 shadow-xl transition-all">
      {/* Barra de cabecera */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 bg-slate-900/90 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md bg-blue-500/10 px-2.5 py-1 font-mono font-medium text-blue-400 border border-blue-500/20">
            <Code className="h-3.5 w-3.5" />
            <span>{language.toUpperCase()}</span>
          </div>
          {fileName && (
            <span className="font-mono font-semibold text-slate-200">
              {fileName}
            </span>
          )}
          {location && (
            <span className="hidden sm:inline-block rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
              📍 {location}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenInEditor && (
            <button
              onClick={() => onOpenInEditor(code, fileName, location)}
              title="Abrir en Editor Luau"
              className="flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Editor</span>
            </button>
          )}

          <button
            onClick={handleDownload}
            title="Descargar archivo .luau"
            className="flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Descargar</span>
          </button>

          <button
            onClick={handleCopy}
            title="Copiar código"
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition-all ${
              copied
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                : 'bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 hover:text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor visual con números de línea */}
      <div className="overflow-x-auto p-4 text-[13px] font-mono leading-relaxed text-slate-200">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-slate-900/40">
                <td className="w-10 select-none pr-4 text-right text-xs text-slate-600">
                  {idx + 1}
                </td>
                <td className="whitespace-pre">
                  {renderLuauSyntax(line)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function renderLuauSyntax(line: string) {
  // Comentarios Luau
  if (line.trim().startsWith('--')) {
    return <span className="text-emerald-400/90 italic">{line}</span>;
  }

  // Resaltado de sintaxis ligero sin dependencias pesadas
  const parts = line.split(/(".*?"|'.*?'|\b(?:local|function|return|if|then|else|elseif|end|for|in|do|while|repeat|until|export|type|nil|true|false)\b)/g);

  return (
    <span>
      {parts.map((part, i) => {
        if (
          [
            'local',
            'function',
            'return',
            'if',
            'then',
            'else',
            'elseif',
            'end',
            'for',
            'in',
            'do',
            'while',
            'repeat',
            'until',
            'export',
            'type',
          ].includes(part)
        ) {
          return (
            <span key={i} className="font-semibold text-purple-400">
              {part}
            </span>
          );
        }
        if (['true', 'false', 'nil'].includes(part)) {
          return (
            <span key={i} className="text-amber-400 font-semibold">
              {part}
            </span>
          );
        }
        if (
          (part.startsWith('"') && part.endsWith('"')) ||
          (part.startsWith("'") && part.endsWith("'"))
        ) {
          return (
            <span key={i} className="text-emerald-300">
              {part}
            </span>
          );
        }
        if (part.includes('game:GetService') || part.includes('Instance.new') || part.includes('WaitForChild')) {
          return (
            <span key={i} className="text-cyan-300 font-medium">
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
