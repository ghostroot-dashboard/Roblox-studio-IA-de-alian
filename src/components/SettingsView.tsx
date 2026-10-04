import React, { useState } from 'react';
import {
  User,
  Settings,
  Sparkles,
  Radio,
  Sun,
  Moon,
  Shield,
  Check,
  Save,
  Key,
  Info,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { aiService } from '../services/aiService';

export const SettingsView: React.FC = () => {
  const { userProfile, theme, setTheme } = useAuth();

  const [useStrictLuau, setUseStrictLuau] = useState(true);
  const [forceDemo, setForceDemo] = useState(false);
  const [creativity, setCreativity] = useState(0.4);
  const [localBridgePort, setLocalBridgePort] = useState(8080);
  const [autoSyncWaypoints, setAutoSyncWaypoints] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSavePreferences = () => {
    aiService.setForceDemoMode(forceDemo);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      {/* Cabecera */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-black text-white">Configuración</h2>
        <p className="text-xs text-slate-400 mt-1">
          Gestiona tu cuenta, preferencias de IA y parámetros de conexión de Roblox Studio.
        </p>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-300">
          <Check className="h-4 w-4" />
          <span>¡Preferencias guardadas exitosamente!</span>
        </div>
      )}

      {/* 1. Perfil del Usuario */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400 border border-blue-500/20">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Perfil y Cuenta</h3>
            <p className="text-xs text-slate-400">Información del desarrollador vinculada a Firebase</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
            <span className="text-slate-500 block text-[10px] font-bold uppercase">Nombre Completo</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">{userProfile?.displayName || 'Desarrollador'}</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
            <span className="text-slate-500 block text-[10px] font-bold uppercase">Correo Electrónico</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">{userProfile?.email || 'N/A'}</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 sm:col-span-2">
            <span className="text-slate-500 block text-[10px] font-bold uppercase">ID Único de Usuario (UID)</span>
            <span className="font-mono text-xs text-blue-400 mt-0.5 block select-all break-all">
              {userProfile?.uid}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Preferencias Visuales (Tema) */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-purple-500/10 p-2 text-purple-400 border border-purple-500/20">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Apariencia y Tema</h3>
              <p className="text-xs text-slate-400">Personaliza la interfaz de usuario</p>
            </div>
          </div>

          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                theme === 'dark' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="h-3.5 w-3.5" />
              <span>Oscuro</span>
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                theme === 'light' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="h-3.5 w-3.5" />
              <span>Claro</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Configuración de IA */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Configuración del Motor de IA</h3>
            <p className="text-xs text-slate-400">Parámetros de generación de código Luau y modelos</p>
          </div>
        </div>

        <div className="space-y-4 pt-2 text-xs">
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div>
              <span className="font-bold text-slate-200 block">Modo Luau Estricto (--!strict)</span>
              <span className="text-slate-400 block text-[11px] mt-0.5">
                Genera siempre type annotations y comprobación estricta de tipos de Luau.
              </span>
            </div>
            <input
              type="checkbox"
              checked={useStrictLuau}
              onChange={(e) => setUseStrictLuau(e.target.checked)}
              className="h-4 w-4 rounded accent-blue-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div>
              <span className="font-bold text-slate-200 block">Forzar Modo Demostración de IA</span>
              <span className="text-slate-400 block text-[11px] mt-0.5">
                Utiliza las plantillas arquitectónicas integradas en lugar de consumir cuota de API.
              </span>
            </div>
            <input
              type="checkbox"
              checked={forceDemo}
              onChange={(e) => setForceDemo(e.target.checked)}
              className="h-4 w-4 rounded accent-blue-600 cursor-pointer"
            />
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-slate-200">Creatividad / Temperatura del Modelo</span>
              <span className="font-mono text-blue-400">{creativity}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={creativity}
              onChange={(e) => setCreativity(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Preciso (Arquitectura sólida)</span>
              <span>Creativo (Mecánicas experimentales)</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Configuración de Roblox Studio Bridge */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/20">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Configuración del Puente de Roblox Studio</h3>
            <p className="text-xs text-slate-400">Opciones para el plugin local y sincronización segura</p>
          </div>
        </div>

        <div className="space-y-4 pt-2 text-xs">
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div>
              <span className="font-bold text-slate-200 block">Waypoints de Deshacer (Undo)</span>
              <span className="text-slate-400 block text-[11px] mt-0.5">
                Registrar automáticamente puntos en ChangeHistoryService antes de cada comando aplicado.
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoSyncWaypoints}
              onChange={(e) => setAutoSyncWaypoints(e.target.checked)}
              className="h-4 w-4 rounded accent-blue-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div>
              <span className="font-bold text-slate-200 block">Puerto de Enlace Local para el Plugin</span>
              <span className="text-slate-400 block text-[11px] mt-0.5">
                Puerto HTTP seguro donde el plugin o backend se comunica.
              </span>
            </div>
            <input
              type="number"
              value={localBridgePort}
              onChange={(e) => setLocalBridgePort(parseInt(e.target.value) || 8080)}
              className="w-24 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </section>

      {/* Botón de Guardar */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSavePreferences}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all cursor-pointer"
        >
          <Save className="h-4 w-4" />
          <span>Guardar Configuración</span>
        </button>
      </div>
    </div>
  );
};
