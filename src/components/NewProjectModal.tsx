import React, { useState } from 'react';
import { X, Sparkles, Box, Swords, DollarSign, Flag, Compass } from 'lucide-react';
import { Project } from '../types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (project: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const TEMPLATES = [
  {
    id: 'pvp',
    name: 'PVP & Combate',
    icon: Swords,
    desc: 'Matchmaking 1v1, zonas de respawn seguro, inventario de armas y leaderstats.',
  },
  {
    id: 'lobby',
    name: 'Lobby & Equipos',
    icon: Flag,
    desc: 'Héroes vs Villanos, selección de bando, teletransporte a rondas.',
  },
  {
    id: 'tycoon',
    name: 'Tycoon Simulator',
    icon: DollarSign,
    desc: 'Generadores automáticos, compras con botones de contacto y guardado de datos.',
  },
  {
    id: 'obby',
    name: 'Obby / Parkour',
    icon: Compass,
    desc: 'Checkpoints de etapa, bloques letales con KillScript y cronómetro.',
  },
  {
    id: 'blank',
    name: 'Lienzo en Blanco',
    icon: Box,
    desc: 'Estructura vacía de Roblox Studio lista para instrucciones a medida con IA.',
  },
];

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('pvp');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor escribe un nombre para el proyecto.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || `Proyecto Roblox con plantilla ${selectedTemplate}`,
        robloxStatus: 'disconnected',
        robloxPlaceId: placeId.trim() || undefined,
        genre: selectedTemplate,
      });
      setName('');
      setDescription('');
      setPlaceId('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al crear el proyecto.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 p-6 shadow-2xl text-slate-100">
        {/* Glow de fondo */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl"></div>
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl"></div>

        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 shadow-lg shadow-blue-500/20">
              <Box className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Crear Nuevo Proyecto</h3>
              <p className="text-xs text-slate-400">Configura la base de tu juego para Roblox Studio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Nombre del Proyecto *
            </label>
            <input
              type="text"
              required
              maxLength={100}
              placeholder="ej. Héroes vs Villanos, Cyber Arena, Obby Cósmico..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Descripción o Visión del Juego
            </label>
            <textarea
              rows={2}
              maxLength={400}
              placeholder="Describe mecánicas principales, modo de juego o detalles clave..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Plantilla Arquitectónica de Inicio
            </label>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {TEMPLATES.map((tmpl) => {
                const Icon = tmpl.icon;
                const isSelected = selectedTemplate === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-600/10 ring-1 ring-blue-500/40'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className={`mt-0.5 rounded-lg p-1.5 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">{tmpl.name}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{tmpl.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Roblox Place ID (Opcional)
            </label>
            <input
              type="text"
              placeholder="ej. 18274910283"
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-300 placeholder-slate-600 focus:border-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Puedes vincularlo con tu lugar en Roblox para el futuro puente con el plugin.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{submitting ? 'Creando...' : 'Crear Proyecto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
