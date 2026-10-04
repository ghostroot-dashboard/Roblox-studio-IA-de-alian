import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Radio,
  Clock,
  MessageSquare,
  FileCode,
  Search,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Project } from '../types';

interface ProjectsViewProps {
  projects: Project[];
  onOpenNewProject: () => void;
  onSelectProject: (p: Project) => void;
  onUpdateProjectName: (projectId: string, newName: string) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  onNavigateToChat: (p: Project) => void;
  onNavigateToScripts: (p: Project) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  onOpenNewProject,
  onSelectProject,
  onUpdateProjectName,
  onDeleteProject,
  onNavigateToChat,
  onNavigateToScripts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editNameInput, setEditNameInput] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const startEdit = (p: Project) => {
    setEditingProjectId(p.id);
    setEditNameInput(p.name);
  };

  const saveEdit = async (projectId: string) => {
    if (!editNameInput.trim()) return;
    await onUpdateProjectName(projectId, editNameInput.trim());
    setEditingProjectId(null);
  };

  const cancelEdit = () => {
    setEditingProjectId(null);
    setEditNameInput('');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white">Mis Proyectos de Roblox</h2>
          <p className="text-xs text-slate-400 mt-1">
            Administra tus experiencias, scripts generados y estados del puente con Roblox Studio.
          </p>
        </div>

        <button
          onClick={onOpenNewProject}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all cursor-pointer w-fit"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Proyecto</span>
        </button>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="flex items-center rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs">
        <Search className="h-4 w-4 text-slate-500 mr-2.5 shrink-0" />
        <input
          type="text"
          placeholder="Buscar proyectos por nombre o descripción..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-slate-500 hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Lista / Grid de Proyectos */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
          <Boxes className="mx-auto h-12 w-12 text-slate-600" />
          <h3 className="mt-4 text-base font-bold text-white">
            {searchQuery ? 'No se encontraron proyectos' : 'No tienes proyectos todavía'}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            {searchQuery
              ? 'Prueba con otra palabra clave.'
              : 'Comienza creando un proyecto para organizar tus scripts y la IA.'}
          </p>
          {!searchQuery && (
            <button
              onClick={onOpenNewProject}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Crear Proyecto Ahora</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((p) => {
            const isEditing = editingProjectId === p.id;
            return (
              <div
                key={p.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl transition-all hover:border-slate-700 hover:bg-slate-900"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 w-full">
                        <input
                          type="text"
                          value={editNameInput}
                          onChange={(e) => setEditNameInput(e.target.value)}
                          className="w-full rounded-lg border border-blue-500 bg-slate-950 px-2.5 py-1 text-xs font-bold text-white focus:outline-none"
                        />
                        <button
                          onClick={() => saveEdit(p.id)}
                          className="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-500"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:bg-slate-700"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 overflow-hidden">
                        <h3 className="font-extrabold text-white text-base truncate group-hover:text-blue-400 transition-colors">
                          {p.name}
                        </h3>
                        <button
                          onClick={() => startEdit(p)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 transition-opacity p-1"
                          title="Cambiar nombre"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                        p.robloxStatus === 'connected'
                          ? 'border-emerald-500/30 bg-emerald-950/50 text-emerald-400'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          p.robloxStatus === 'connected' ? 'bg-emerald-400' : 'bg-slate-600'
                        }`}
                      ></span>
                      {p.robloxStatus === 'connected' ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                    {p.description || 'Sin descripción.'}
                  </p>

                  {p.robloxPlaceId && (
                    <div className="mt-2 text-[11px] font-mono text-slate-500">
                      Place ID: {p.robloxPlaceId}
                    </div>
                  )}
                </div>

                <div className="mt-6 border-t border-slate-800/80 pt-4 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
                    </span>

                    <button
                      onClick={() => setDeletingId(p.id)}
                      className="text-slate-600 hover:text-red-400 p-1 transition-colors"
                      title="Eliminar proyecto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Botones de Navegación Rápida */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        onSelectProject(p);
                        onNavigateToChat(p);
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600/10 border border-blue-500/20 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Chat IA</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectProject(p);
                        onNavigateToScripts(p);
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
                    >
                      <FileCode className="h-3.5 w-3.5" />
                      <span>Scripts Luau</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-slate-900 p-6 shadow-2xl text-slate-100">
            <h4 className="text-base font-bold text-white">¿Eliminar proyecto?</h4>
            <p className="mt-2 text-xs text-slate-400">
              Esta acción eliminará el proyecto y sus scripts asociados. Los datos de Roblox Studio en tu ordenador no se verán afectados.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-xl px-4 py-2 text-xs text-slate-400 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await onDeleteProject(deletingId);
                  setDeletingId(null);
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
