import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Boxes,
  Plus,
  Radio,
  FileCode,
  Shield,
  Layers,
  ChevronRight,
  Clock,
  Swords,
  Gamepad2,
  Smartphone,
  Wrench,
} from 'lucide-react';
import { Project } from '../types';

interface DashboardViewProps {
  projects: Project[];
  onOpenNewProject: () => void;
  onSelectProject: (project: Project) => void;
  onNavigateToChatWithPrompt: (prompt: string) => void;
  onNavigateToRoblox: () => void;
  onNavigateToScripts: () => void;
}

const SUGGESTED_PROMPTS = [
  {
    icon: Swords,
    title: 'Crea un sistema de combate 1v1',
    category: 'PVP & Arena',
    prompt: 'Agrega un sistema de matchmaking 1v1 con arena de combate, cola de espera y teletransporte coordinado.',
  },
  {
    icon: Gamepad2,
    title: 'Construye un lobby para Héroes vs Villanos',
    category: 'Lobby & Equipos',
    prompt: 'Crea un lobby para mi juego Héroes vs Villanos con zonas seguras sin daño y selección de equipos.',
  },
  {
    icon: Wrench,
    title: 'Corrige y optimiza mi script',
    category: 'Bug Fix & Luau',
    prompt: 'Corrige este script reemplazando wait obsoleto por task.wait y solucionando fugas de memoria.',
  },
  {
    icon: Smartphone,
    title: 'Agrega controles móviles de deslizar',
    category: 'Mobile UX',
    prompt: 'Agrega un botón de deslizar para dispositivos móviles usando ContextActionService y física LinearVelocity.',
  },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  onOpenNewProject,
  onSelectProject,
  onNavigateToChatWithPrompt,
  onNavigateToRoblox,
  onNavigateToScripts,
}) => {
  const [promptInput, setPromptInput] = useState('');

  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    onNavigateToChatWithPrompt(promptInput.trim());
  };

  const handleSuggestionClick = (prompt: string) => {
    onNavigateToChatWithPrompt(prompt);
  };

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Hero Prompt Card: "¿Qué quieres construir?" */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 md:p-10 shadow-2xl">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-600/15 blur-3xl"></div>
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-600/15 blur-3xl"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>StudioForge Assistant para Roblox Studio</span>
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-white md:text-5xl">
            ¿Qué quieres construir hoy?
          </h2>

          <p className="mt-3 text-sm md:text-base text-slate-400">
            Escribe tu idea en lenguaje natural. Generaremos la arquitectura de scripts Luau,
            los RemoteEvents necesarios y las instrucciones paso a paso.
          </p>

          <form onSubmit={handleSendPrompt} className="mt-6">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="ej. Crea una tienda de armas con catálogo de monedas, o Agrega un sistema de sprint..."
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/90 px-5 py-4 pr-14 text-sm md:text-base text-white placeholder-slate-500 shadow-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
              <button
                type="submit"
                disabled={!promptInput.trim()}
                className="absolute right-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </form>

          {/* Sugerencias Rápidas */}
          <div className="mt-6">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Ejemplos sugeridos:
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {SUGGESTED_PROMPTS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestionClick(item.prompt)}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-left transition-all hover:border-slate-700 hover:bg-slate-900 group cursor-pointer"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {item.category}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Proyectos Recientes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Proyectos Recientes</h3>
            <p className="text-xs text-slate-400">Juegos y experiencias administrados con IA</p>
          </div>
          <button
            onClick={onOpenNewProject}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Crear Proyecto</span>
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
            <Boxes className="mx-auto h-10 w-10 text-slate-600" />
            <h4 className="mt-3 text-sm font-bold text-slate-300">Aún no tienes proyectos</h4>
            <p className="mt-1 text-xs text-slate-500">
              Crea tu primer proyecto de Roblox Studio para comenzar a generar scripts e interfaces.
            </p>
            <button
              onClick={onOpenNewProject}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-blue-500 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Crear mi primer proyecto</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((project) => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg transition-all hover:border-slate-700 hover:bg-slate-900 cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors text-base truncate">
                      {project.name}
                    </h4>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                        project.robloxStatus === 'connected'
                          ? 'border-emerald-500/30 bg-emerald-950/50 text-emerald-400'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          project.robloxStatus === 'connected' ? 'bg-emerald-400' : 'bg-slate-600'
                        }`}
                      ></span>
                      {project.robloxStatus === 'connected' ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                    {project.description || 'Proyecto de Roblox Studio configurado con StudioForge.'}
                  </p>
                </div>

                <div className="mt-5 border-t border-slate-800/80 pt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      Modificado: {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </span>
                  <span className="text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Abrir <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Resumen de Módulos y Accesos Rápidos */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div
          onClick={onNavigateToRoblox}
          className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-400 border border-purple-500/20 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Radio className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                  Roblox Studio Bridge Hub
                </h4>
                <p className="text-xs text-slate-400">
                  Conexión segura con el plugin oficial de Roblox Studio
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white transition-colors" />
          </div>
        </div>

        <div
          onClick={onNavigateToScripts}
          className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400 border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FileCode className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                  Editor de Código Luau & Diff
                </h4>
                <p className="text-xs text-slate-400">
                  Visualiza archivos, jerarquía y compara cambios propuestos
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white transition-colors" />
          </div>
        </div>
      </section>
    </div>
  );
};
