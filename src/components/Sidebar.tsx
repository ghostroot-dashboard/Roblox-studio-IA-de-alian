import React from 'react';
import {
  Boxes,
  Home,
  FolderKanban,
  MessageSquare,
  Radio,
  FileCode,
  Settings,
  Plus,
  LogOut,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Project } from '../types';

export type NavTab = 'dashboard' | 'projects' | 'chat' | 'roblox' | 'scripts' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenNewProject: () => void;
  recentProjects: Project[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  onOpenNewProject,
  recentProjects,
}) => {
  const { userProfile, logout, currentProject, setCurrentProject } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: Home },
    { id: 'projects', label: 'Proyectos', icon: FolderKanban },
    { id: 'chat', label: 'Chat con IA', icon: MessageSquare },
    { id: 'roblox', label: 'Roblox Studio', icon: Radio },
    { id: 'scripts', label: 'Scripts & Luau', icon: FileCode },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  const handleSelect = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const content = (
    <div className="flex h-full flex-col justify-between bg-slate-900/95 border-r border-slate-800 text-slate-300 backdrop-blur-xl">
      {/* Header & Logo */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 text-white">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white">
                StudioForge<span className="text-blue-500">.AI</span>
              </span>
              <div className="text-[10px] font-semibold text-slate-400">Roblox Studio Copilot</div>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onCloseMobile}
            className="md:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Botón Nuevo Proyecto */}
        <button
          onClick={() => {
            onOpenNewProject();
            onCloseMobile();
          }}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:from-blue-500 hover:to-indigo-500 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Proyecto</span>
        </button>

        {/* Proyecto Activo Selector */}
        {currentProject && (
          <div className="mt-4 rounded-xl border border-blue-500/30 bg-blue-950/30 p-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Proyecto Activo
            </div>
            <div className="mt-0.5 truncate text-xs font-bold text-white">
              {currentProject.name}
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    currentProject.robloxStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                ></span>
                {currentProject.robloxStatus === 'connected' ? 'Studio Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
        )}

        {/* Navegación Principal */}
        <nav className="mt-5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id as NavTab)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Proyectos Recientes */}
        {recentProjects.length > 0 && (
          <div className="mt-6 border-t border-slate-800/80 pt-4">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Proyectos Recientes
            </div>
            <div className="mt-2 space-y-1">
              {recentProjects.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setCurrentProject(p);
                    handleSelect('chat');
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-xs transition-colors ${
                    currentProject?.id === p.id
                      ? 'bg-slate-800 text-blue-400 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-300'
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  <span
                    className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      p.robloxStatus === 'connected' ? 'bg-emerald-400' : 'bg-slate-600'
                    }`}
                  ></span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer / User Profile */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-xs font-bold text-white shrink-0">
              {userProfile?.displayName?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <div className="truncate text-xs font-bold text-slate-200">
                {userProfile?.displayName || 'Desarrollador'}
              </div>
              <div className="truncate text-[10px] text-slate-500">
                {userProfile?.email}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            title="Cerrar sesión"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col shrink-0 z-30">{content}</aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCloseMobile}
          ></div>
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
