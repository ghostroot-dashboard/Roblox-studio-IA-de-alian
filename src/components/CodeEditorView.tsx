import React, { useState, useEffect } from 'react';
import {
  FileCode,
  FolderTree,
  Download,
  Copy,
  Check,
  Save,
  Plus,
  Trash2,
  Split,
  Code,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Project, GeneratedFile, RobloxDiffComparison } from '../types';
import { FirestoreService } from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';
import { DiffViewer } from './DiffViewer';

interface CodeEditorViewProps {
  project: Project | null;
  initialCode?: string;
  initialFileName?: string;
  initialLocation?: string;
}

export const CodeEditorView: React.FC<CodeEditorViewProps> = ({
  project,
  initialCode,
  initialFileName,
  initialLocation,
}) => {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [currentCode, setCurrentCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [activeDiff, setActiveDiff] = useState<RobloxDiffComparison | null>(null);

  // Modal para nuevo script
  const [showNewScriptModal, setShowNewScriptModal] = useState(false);
  const [newScriptName, setNewScriptName] = useState('');
  const [newScriptLocation, setNewScriptLocation] = useState('ServerScriptService');
  const [newScriptType, setNewScriptType] = useState<'Server' | 'Client' | 'Module'>('Server');

  // Cargar archivos del proyecto
  useEffect(() => {
    if (!project || !currentUser) return;

    const loadFiles = async () => {
      try {
        const list = await FirestoreService.getProjectFiles(project.id, currentUser.uid);
        if (list.length > 0) {
          setFiles(list);
          const first = list[0];
          setActiveFileId(first.id);
          setCurrentCode(first.content);
        } else {
          // Generar archivo de demostración por defecto si está vacío
          const defaultFile: GeneratedFile = {
            id: `file-init-${Date.now()}`,
            userId: currentUser.uid,
            projectId: project.id,
            name: 'GameManager.server.luau',
            path: 'ServerScriptService/GameManager.server.luau',
            content: `--!strict
-- GameManager: Controlador principal para ${project.name}
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

print("[StudioForge] Inicializando arquitectura de ${project.name}")

Players.PlayerAdded:Connect(function(player: Player)
    print("Jugador conectado: " .. player.Name)
    
    -- Crear leaderstats
    local leaderstats = Instance.new("Folder")
    leaderstats.Name = "leaderstats"
    leaderstats.Parent = player

    local coins = Instance.new("IntValue")
    coins.Name = "Coins"
    coins.Value = 100
    coins.Parent = leaderstats
end)
`,
            action: 'create_script',
            status: 'draft',
            scriptType: 'Server',
            updatedAt: new Date().toISOString(),
          };
          await FirestoreService.saveGeneratedFile(defaultFile);
          setFiles([defaultFile]);
          setActiveFileId(defaultFile.id);
          setCurrentCode(defaultFile.content);
        }
      } catch (err) {
        console.error('Error cargando archivos:', err);
      }
    };

    loadFiles();
  }, [project, currentUser]);

  // Si se abre desde el Chat con un código inicial
  useEffect(() => {
    if (initialCode && initialFileName) {
      const match = files.find((f) => f.name === initialFileName);
      if (match) {
        setActiveFileId(match.id);
        setCurrentCode(match.content);
      } else {
        // Crear archivo temporalmente para edición
        const tempFile: GeneratedFile = {
          id: `file-temp-${Date.now()}`,
          userId: currentUser?.uid || 'user',
          projectId: project?.id || 'proj',
          name: initialFileName,
          path: `${initialLocation || 'ServerScriptService'}/${initialFileName}`,
          content: initialCode,
          action: 'create_script',
          status: 'draft',
          scriptType: initialFileName.includes('.client') ? 'Client' : 'Server',
          updatedAt: new Date().toISOString(),
        };
        setFiles((prev) => [tempFile, ...prev]);
        setActiveFileId(tempFile.id);
        setCurrentCode(initialCode);
      }
    }
  }, [initialCode, initialFileName]);

  const activeFile = files.find((f) => f.id === activeFileId);

  const handleSelectFile = (file: GeneratedFile) => {
    setActiveFileId(file.id);
    setCurrentCode(file.content);
    setIsDiffMode(false);
  };

  const handleSaveCode = async () => {
    if (!activeFile || !project || !currentUser) return;
    try {
      const updated: GeneratedFile = {
        ...activeFile,
        content: currentCode,
        updatedAt: new Date().toISOString(),
      };
      await FirestoreService.saveGeneratedFile(updated);
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setSavedNotification(true);
      setTimeout(() => setSavedNotification(false), 2000);
    } catch (err) {
      console.error('Error al guardar archivo:', err);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownload = () => {
    if (!activeFile) return;
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name.endsWith('.luau') ? activeFile.name : `${activeFile.name}.luau`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateNewScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScriptName.trim() || !project || !currentUser) return;

    let fullFileName = newScriptName.trim();
    if (!fullFileName.endsWith('.luau')) {
      if (newScriptType === 'Server') fullFileName += '.server.luau';
      else if (newScriptType === 'Client') fullFileName += '.client.luau';
      else fullFileName += '.luau';
    }

    const newFile: GeneratedFile = {
      id: `file-${Date.now()}`,
      userId: currentUser.uid,
      projectId: project.id,
      name: fullFileName,
      path: `${newScriptLocation}/${fullFileName}`,
      content: `--!strict
-- ${fullFileName}
-- Creado en StudioForge para Roblox Studio

local Players = game:GetService("Players")

print("[StudioForge] Script listo: ${fullFileName}")
`,
      action: 'create_script',
      status: 'draft',
      scriptType: newScriptType,
      updatedAt: new Date().toISOString(),
    };

    await FirestoreService.saveGeneratedFile(newFile);
    setFiles((prev) => [newFile, ...prev]);
    setActiveFileId(newFile.id);
    setCurrentCode(newFile.content);
    setNewScriptName('');
    setShowNewScriptModal(false);
  };

  const handleOpenDiffSample = () => {
    if (!activeFile) return;
    const sampleDiff: RobloxDiffComparison = {
      fileName: activeFile.name,
      location: activeFile.path.split('/')[0],
      originalCode: activeFile.content,
      proposedCode: `--!strict\n-- Optimizado con buenas prácticas Luau y task.wait\n` + activeFile.content.replace(/wait\(/g, 'task.wait('),
      resultCode: `--!strict\n-- Optimizado con buenas prácticas Luau y task.wait\n` + activeFile.content.replace(/wait\(/g, 'task.wait('),
      summaryOfChanges: 'Sustitución de wait() obsoleto por task.wait() y tipado Luau estricto.',
    };
    setActiveDiff(sampleDiff);
    setIsDiffMode(true);
  };

  if (!project) {
    return (
      <div className="flex h-96 flex-col items-center justify-center p-6 text-center">
        <FileCode className="h-12 w-12 text-slate-600" />
        <h3 className="mt-3 text-lg font-bold text-white">Selecciona un proyecto primero</h3>
        <p className="mt-1 text-xs text-slate-400">
          Los scripts se organizan bajo la arquitectura de cada proyecto.
        </p>
      </div>
    );
  }

  const lines = currentCode.split('\n');

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row bg-slate-950 text-slate-100 overflow-hidden">
      {/* Explorador de Archivos / Jerarquía Roblox Studio */}
      <div className="w-full md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Roblox Explorer
              </span>
            </div>
            <button
              onClick={() => setShowNewScriptModal(true)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title="Crear nuevo script"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2">
              Scripts del Proyecto ({files.length})
            </div>
            {files.map((file) => {
              const isSelected = file.id === activeFileId;
              return (
                <button
                  key={file.id}
                  onClick={() => handleSelectFile(file)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileCode className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] uppercase font-bold shrink-0 ${
                      isSelected ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {file.scriptType || 'Server'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800/80">
          <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-2.5 text-[11px] text-blue-300">
            <div className="font-bold flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Luau 5.1 Syntax</span>
            </div>
            <p className="mt-0.5 text-slate-400 text-[10px]">
              Tipado estricto (--!strict) y compatibilidad con el Task Scheduler de Roblox Studio.
            </p>
          </div>
        </div>
      </div>

      {/* Área del Editor de Código o Inspector de Diferencias */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Barra de herramientas del archivo activo */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-2.5 text-xs backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-white text-sm">
              {activeFile?.name || 'Selecciona un script'}
            </span>
            {activeFile?.path && (
              <span className="hidden sm:inline-block rounded-md bg-slate-800 px-2.5 py-0.5 text-[11px] text-slate-400">
                📍 {activeFile.path}
              </span>
            )}
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
              Generado con IA
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Modo Diff */}
            <button
              onClick={handleOpenDiffSample}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold transition-all ${
                isDiffMode
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'border border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Split className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ver Diferencias (Diff)</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 font-semibold text-slate-300 hover:text-white transition-all"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 font-semibold text-slate-300 hover:text-white transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Descargar</span>
            </button>

            <button
              onClick={handleSaveCode}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-500 transition-all cursor-pointer"
            >
              {savedNotification ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> : <Save className="h-3.5 w-3.5" />}
              <span>{savedNotification ? '¡Guardado!' : 'Guardar'}</span>
            </button>
          </div>
        </div>

        {/* Cuerpo del Editor o Diff */}
        <div className="flex-1 overflow-auto p-4">
          {isDiffMode && activeDiff ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-200">
                  Inspector de Cambios: Original ➔ Propuesta ➔ Resultado
                </h4>
                <button
                  onClick={() => setIsDiffMode(false)}
                  className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700"
                >
                  Volver al Editor
                </button>
              </div>
              <DiffViewer diff={activeDiff} />
            </div>
          ) : (
            <div className="relative flex min-h-full font-mono text-xs text-slate-200 leading-relaxed">
              {/* Números de línea */}
              <div className="select-none pr-4 text-right text-slate-600">
                {lines.map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Textarea editable de código Luau */}
              <textarea
                value={currentCode}
                onChange={(e) => setCurrentCode(e.target.value)}
                spellCheck={false}
                className="w-full resize-none bg-transparent font-mono text-xs md:text-sm leading-relaxed text-slate-200 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal para Nuevo Script */}
      {showNewScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold">Crear Nuevo Script Luau</h3>
            <p className="text-xs text-slate-400 mt-1">
              Define el nombre y la ubicación en la jerarquía de Roblox Studio.
            </p>

            <form onSubmit={handleCreateNewScript} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Nombre del Script
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. CombatHandler, ShopGui, Leaderstats"
                  value={newScriptName}
                  onChange={(e) => setNewScriptName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Ubicación en Roblox
                </label>
                <select
                  value={newScriptLocation}
                  onChange={(e) => setNewScriptLocation(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="ServerScriptService">ServerScriptService (Lógica de Servidor)</option>
                  <option value="StarterPlayer/StarterPlayerScripts">StarterPlayerScripts (Controladores Cliente)</option>
                  <option value="ReplicatedStorage">ReplicatedStorage (Módulos Compartidos)</option>
                  <option value="StarterGui">StarterGui (Interfaces y HUD)</option>
                  <option value="ServerStorage">ServerStorage (Herramientas y Datos)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Tipo de Script
                </label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {(['Server', 'Client', 'Module'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewScriptType(t)}
                      className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                        newScriptType === t
                          ? 'border-blue-500 bg-blue-600 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {t}Script
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewScriptModal(false)}
                  className="rounded-xl px-4 py-2 text-xs text-slate-400 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
                >
                  Crear Archivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
