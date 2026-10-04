import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, XCircle, FileCode, Split, Layers } from 'lucide-react';
import { RobloxDiffComparison } from '../types';

interface DiffViewerProps {
  diff: RobloxDiffComparison;
  onApply?: () => void;
  onReject?: () => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diff, onApply, onReject }) => {
  const [activeTab, setActiveTab] = useState<'sideBySide' | 'result' | 'flow'>('sideBySide');

  const origLines = diff.originalCode.split('\n');
  const propLines = diff.proposedCode.split('\n');
  const resultLines = diff.resultCode.split('\n');

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-slate-950 p-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-indigo-500/20 p-1.5 text-indigo-400">
            <FileCode className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-100 flex items-center gap-2">
              <span>{diff.fileName}</span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                {diff.location}
              </span>
            </h4>
            <p className="text-xs text-slate-400">{diff.summaryOfChanges}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-900 p-0.5 text-xs border border-slate-800">
            <button
              onClick={() => setActiveTab('sideBySide')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-all ${
                activeTab === 'sideBySide'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Split className="h-3.5 w-3.5" />
              <span>Comparación</span>
            </button>
            <button
              onClick={() => setActiveTab('flow')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-all ${
                activeTab === 'flow'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Flujo 3-Pasos</span>
            </button>
            <button
              onClick={() => setActiveTab('result')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-all ${
                activeTab === 'result'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Resultado</span>
            </button>
          </div>

          {onApply && (
            <button
              onClick={onApply}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-emerald-500"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Aplicar</span>
            </button>
          )}

          {onReject && (
            <button
              onClick={onReject}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400 transition-all hover:bg-slate-700 hover:text-slate-200"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Descartar</span>
            </button>
          )}
        </div>
      </div>

      {/* Vista de flujo 3 pasos: Original -> Propuesto -> Resultado */}
      {activeTab === 'flow' && (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-red-500/20 bg-slate-900/60 p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-red-400">
              <span>1. CÓDIGO ORIGINAL</span>
              <span className="rounded bg-red-950/60 px-1.5 py-0.5 text-[10px] text-red-400 border border-red-800/40">Existente</span>
            </div>
            <pre className="max-h-72 overflow-y-auto text-[11px] font-mono text-slate-300 leading-relaxed">
              {diff.originalCode}
            </pre>
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-slate-900/60 p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-amber-400">
              <span className="flex items-center gap-1">
                <span>2. PROPUESTA IA</span>
                <ArrowRight className="h-3 w-3" />
              </span>
              <span className="rounded bg-amber-950/60 px-1.5 py-0.5 text-[10px] text-amber-400 border border-amber-800/40">Modificación</span>
            </div>
            <pre className="max-h-72 overflow-y-auto text-[11px] font-mono text-slate-300 leading-relaxed">
              {diff.proposedCode}
            </pre>
          </div>

          <div className="rounded-lg border border-emerald-500/20 bg-slate-900/60 p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-emerald-400">
              <span>3. RESULTADO FINAL</span>
              <span className="rounded bg-emerald-950/60 px-1.5 py-0.5 text-[10px] text-emerald-400 border border-emerald-800/40">Compilado</span>
            </div>
            <pre className="max-h-72 overflow-y-auto text-[11px] font-mono text-emerald-300/90 leading-relaxed">
              {diff.resultCode}
            </pre>
          </div>
        </div>
      )}

      {/* Vista de comparación lado a lado */}
      {activeTab === 'sideBySide' && (
        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
          {/* Lado Izquierdo: Original */}
          <div className="overflow-hidden rounded-lg border border-red-500/30 bg-slate-900">
            <div className="border-b border-red-500/20 bg-red-950/30 px-3 py-1.5 text-xs font-semibold text-red-300 flex items-center justify-between">
              <span>Código Anterior</span>
              <span className="text-[10px] text-red-400/80">-(Líneas a sustituir)</span>
            </div>
            <div className="max-h-80 overflow-y-auto p-3 font-mono text-xs text-slate-300">
              {origLines.map((l, i) => (
                <div key={i} className="flex gap-2 hover:bg-red-950/20">
                  <span className="w-6 select-none text-right text-slate-600">{i + 1}</span>
                  <span className="text-red-200/90 line-through decoration-red-500/60">{l || ' '}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lado Derecho: Propuesta */}
          <div className="overflow-hidden rounded-lg border border-emerald-500/30 bg-slate-900">
            <div className="border-b border-emerald-500/20 bg-emerald-950/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 flex items-center justify-between">
              <span>Código Nuevo Propuesto</span>
              <span className="text-[10px] text-emerald-400/80">+(Optimizaciones Luau)</span>
            </div>
            <div className="max-h-80 overflow-y-auto p-3 font-mono text-xs text-slate-200">
              {propLines.map((l, i) => (
                <div key={i} className="flex gap-2 bg-emerald-950/10 hover:bg-emerald-950/30">
                  <span className="w-6 select-none text-right text-slate-600">{i + 1}</span>
                  <span className="text-emerald-300">{l || ' '}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vista de código resultante limpio */}
      {activeTab === 'result' && (
        <div className="mt-4 overflow-hidden rounded-lg border border-emerald-500/30 bg-slate-900 p-3 font-mono text-xs text-slate-200">
          <div className="mb-2 text-xs font-bold text-emerald-400">
            Versión final lista para aplicar a Roblox Studio
          </div>
          <div className="max-h-80 overflow-y-auto">
            {resultLines.map((l, i) => (
              <div key={i} className="flex gap-3 hover:bg-slate-800/40">
                <span className="w-6 select-none text-right text-slate-600">{i + 1}</span>
                <span>{l || ' '}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
