import React from 'react';
import {
  Sparkles,
  Zap,
  Layers,
  Terminal,
  Cpu,
  ShieldCheck,
  Code2,
  Boxes,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  onExploreDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, onExploreDemo }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Background radial highlights */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-blue-600/15 via-indigo-600/10 to-transparent blur-3xl"></div>
        <div className="absolute top-1/3 -left-48 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 -right-48 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25">
              <Boxes className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-300 bg-clip-text text-transparent">
                StudioForge<span className="text-blue-500">.AI</span>
              </span>
              <span className="hidden sm:inline-block ml-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                Roblox Copilot
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onSignIn}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Iniciar sesión
            </button>
            <button
              onClick={onSignIn}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-400 transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Empezar Gratis</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-6xl px-6 pt-16 pb-20 text-center sm:pt-24 sm:pb-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-400 backdrop-blur-sm shadow-inner mb-6">
          <Zap className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
          <span>Inteligencia Artificial Especializada en Luau & Roblox Studio</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
          Construye tu juego de Roblox{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            con instrucciones en lenguaje natural
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed">
          Diseña lobbies para <strong className="text-slate-200">Héroes vs Villanos</strong>, añade
          sistemas de <strong className="text-slate-200">matchmaking 1v1</strong>, crea tiendas de
          armas y depura scripts con arquitectura modular Luau de nivel profesional.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            onClick={onSignIn}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-600/30 hover:bg-blue-500 hover:shadow-blue-500/40 transition-all sm:w-auto cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>Empezar con Google</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={onExploreDemo}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-300 hover:border-slate-600 hover:bg-slate-800 hover:text-white transition-all sm:w-auto cursor-pointer"
          >
            <span>Ver Modo Demostración</span>
          </button>
        </div>

        {/* Live Interactive Preview Card */}
        <div className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl shadow-blue-950/40 text-left">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
              <div className="h-3 w-3 rounded-full bg-amber-500/80"></div>
              <div className="h-3 w-3 rounded-full bg-emerald-500/80"></div>
              <span className="ml-2 font-mono text-xs text-slate-400">
                StudioForge Assistant ~ Matchmaking1v1.server.luau
              </span>
            </div>
            <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
              Luau 5.1 Strict
            </span>
          </div>

          <div className="p-6">
            <div className="flex items-start gap-3 rounded-xl bg-slate-950/70 p-3.5 border border-slate-800/80">
              <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                TÚ
              </div>
              <p className="text-sm text-slate-300 font-medium">
                &ldquo;Agrega un sistema de matchmaking 1v1 con teletransporte a la arena y cola de
                espera.&rdquo;
              </p>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-xl bg-blue-950/20 p-4 border border-blue-500/30">
              <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                IA
              </div>
              <div className="space-y-3 text-xs sm:text-sm">
                <p className="text-slate-200">
                  He estructurado la cola con <span className="text-cyan-400 font-mono">RemoteEvent</span>,
                  teletransporte con <span className="text-purple-400 font-mono">PivotTo()</span> y
                  emparejamiento seguro en el servidor.
                </p>

                <div className="rounded-lg bg-slate-950 p-3.5 font-mono text-xs text-slate-300 overflow-x-auto border border-slate-800">
                  <div className="text-emerald-400">--!strict</div>
                  <div><span className="text-purple-400">local</span> Players = game:<span className="text-cyan-300">GetService</span>(<span className="text-emerald-300">&quot;Players&quot;</span>)</div>
                  <div><span className="text-purple-400">local</span> queue: &#123; Player &#125; = &#123;&#125;</div>
                  <div className="mt-1"><span className="text-purple-400">local function</span> <span className="text-blue-400">startMatch</span>(p1: Player, p2: Player)</div>
                  <div className="pl-4 text-slate-400">-- Teletransporte coordinado de duelistas</div>
                  <div className="pl-4">p1.Character:<span className="text-cyan-300">PivotTo</span>(workspace.ArenaSpawnA.CFrame)</div>
                  <div className="pl-4">p2.Character:<span className="text-cyan-300">PivotTo</span>(workspace.ArenaSpawnB.CFrame)</div>
                  <div><span className="text-purple-400">end</span></div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
                    📍 ServerScriptService
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
                    ⚡ RemoteEvent: MatchmakingQueueEvent
                  </span>
                  <span className="rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40 px-2 py-0.5">
                    ✓ Anti-Exploit Validado
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo Funciona (How it works) */}
      <section className="border-t border-slate-900 bg-slate-900/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Flujo de Trabajo
            </h2>
            <p className="mt-2 text-3xl font-extrabold sm:text-4xl text-slate-100">
              De la idea al juego en 3 simples pasos
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Terminal className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-100">1. Escribe tu instrucción</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Describe el sistema que necesitas: una tienda con monedas, controles táctiles para móvil,
                o un lobby con zonas seguras.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-100">2. La IA genera arquitectura</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Interpreta la jerarquía de Roblox (ServerScriptService, StarterPlayerScripts,
                ReplicatedStorage) y estructura comandos exactos.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-100">3. Aplica o sincroniza</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Revisa el inspector de diferencias (diff), descarga los archivos .luau o usa el puente
                preparado para el plugin de Roblox Studio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Características (Features) */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Potencia de Creación
            </h2>
            <p className="mt-2 text-3xl font-extrabold sm:text-4xl text-slate-100">
              Diseñado exclusivamente para el ecosistema de Roblox
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 hover:border-slate-700 transition-all">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 mb-4">
                <Code2 className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-100">Luau Moderno & Tipado</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Scripts construidos con <code className="text-slate-300 font-mono">--!strict</code>,
                task scheduler moderno (<code className="text-slate-300 font-mono">task.wait</code>,{' '}
                <code className="text-slate-300 font-mono">task.spawn</code>) y optimización de memoria.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 hover:border-slate-700 transition-all">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-100">Seguridad & Anti-Exploits</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Separación estricta de responsabilidades: el cliente jamás valida precios, monedas ni
                velocidad crítica. Prevención de inyecciones maliciosas.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 hover:border-slate-700 transition-all">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 mb-4">
                <Layers className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-100">Inspector de Diferencias (Diff)</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Compara el código original con el propuesto y el resultante antes de aplicar cambios en
                tu juego de Roblox.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección dedicada a Roblox Studio */}
      <section className="border-t border-slate-900 bg-gradient-to-b from-slate-900/50 to-slate-950 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl border border-blue-500/30 bg-slate-900/80 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="pointer-events-none absolute -right-20 -bottom-20 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl"></div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-400">
                  <Zap className="h-3.5 w-3.5" /> Arquitectura Bridge
                </span>
                <h3 className="mt-4 text-2xl font-extrabold sm:text-3xl text-slate-100">
                  Preparado para el Plugin de Roblox Studio
                </h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  StudioForge incluye una arquitectura desacoplada para comunicarse de forma segura con un
                  plugin de Roblox Studio. La web emite comandos estructurados y el plugin los ejecuta
                  directamente en el entorno de desarrollo:
                </p>

                <div className="mt-5 space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span>Crea scripts automáticamente en ServerScriptService y StarterPlayer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span>Genera RemoteEvents y RemoteFunctions en ReplicatedStorage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span>Registra waypoints en ChangeHistoryService para permitir Deshacer (Ctrl+Z)</span>
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <button
                    onClick={onSignIn}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all cursor-pointer"
                  >
                    Probar en el Panel
                  </button>
                </div>
              </div>

              {/* Diagrama arquitectónico */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 font-mono text-xs">
                <div className="text-slate-400 text-center font-bold pb-3 border-b border-slate-800">
                  PIPELINE DE COMUNICACIÓN SEGURA
                </div>

                <div className="my-4 space-y-3">
                  <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-3 text-center">
                    <div className="font-bold text-blue-400">1. Interfaz Web (StudioForge)</div>
                    <div className="text-[11px] text-slate-400">Prompt en lenguaje natural ➔ Comandos JSON</div>
                  </div>

                  <div className="flex justify-center text-slate-500">↓</div>

                  <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-3 text-center">
                    <div className="font-bold text-indigo-400">2. Backend / Firebase Cloud</div>
                    <div className="text-[11px] text-slate-400">Validación de UID + Cola de Comandos Segura</div>
                  </div>

                  <div className="flex justify-center text-slate-500">↓</div>

                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-center">
                    <div className="font-bold text-emerald-400">3. Plugin en Roblox Studio</div>
                    <div className="text-[11px] text-slate-400">Ejecución en vivo con ChangeHistoryService</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 text-center text-xs text-slate-500">
        <p>StudioForge AI © {new Date().getFullYear()}. Plataforma para desarrolladores de Roblox Studio.</p>
        <p className="mt-1">
          Roblox y Roblox Studio son marcas registradas de Roblox Corporation. StudioForge es una herramienta independiente.
        </p>
      </footer>
    </div>
  );
};
