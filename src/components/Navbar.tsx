import React from 'react';
import { Menu, Radio, Sparkles, Sun, Moon, ChevronDown, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Project } from '../types';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  title: string;
  projects: Project[];
  onOpenNewProject: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  title,
  projects,
  onOpenNewProject,
}) => {
  const { currentProject, setCurrentProject, theme, setTheme } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 md:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="text-sm font-bold text-white sm:text-base capitalize">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Project Selector Dropdown */}
        {projects.length > 0 && (
          <div className="relative">
            <select
              value={currentProject?.id || ''}
              onChange={(e) => {
                const found = projects.find((p) => p.id === e.target.value);
                if (found) setCurrentProject(found);
              }}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  🎮 {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={onOpenNewProject}
          title="Crear Proyecto"
          className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Proyecto</span>
        </button>

        {/* Roblox Bridge Status Indicator */}
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border ${
            currentProject?.robloxStatus === 'connected'
              ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
              : 'border-slate-800 bg-slate-950/80 text-slate-400'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              currentProject?.robloxStatus === 'connected'
                ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                : 'bg-amber-500'
            }`}
          ></span>
          <span className="hidden sm:inline">
            Roblox Studio:
          </span>
          <span className="font-semibold">
            {currentProject?.robloxStatus === 'connected' ? 'Conectado' : 'Desconectado'}
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
};
