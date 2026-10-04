import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Square,
  Sparkles,
  Bot,
  User,
  AlertTriangle,
  CheckCircle2,
  Terminal,
  FolderGit2,
  Layers,
  ArrowRight,
  Code2,
  Download,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ChatMessage, Project, RobloxCommand, GeneratedFile } from '../types';
import { aiService, AIResponsePayload } from '../services/aiService';
import { FirestoreService } from '../services/firestoreService';
import { robloxBridgeService } from '../services/robloxBridgeService';
import { CodeBlock } from './CodeBlock';
import { DiffViewer } from './DiffViewer';

interface ChatViewProps {
  project: Project | null;
  projects: Project[];
  onSelectProject: (p: Project) => void;
  onOpenInEditor: (code: string, fileName?: string, location?: string) => void;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  project,
  projects,
  onSelectProject,
  onOpenInEditor,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string>('default-convo');
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Cargar historial de mensajes al cambiar de proyecto
  useEffect(() => {
    if (!project || !currentUser) {
      setMessages([]);
      return;
    }

    const loadHistory = async () => {
      try {
        const convos = await FirestoreService.getProjectConversations(project.id, currentUser.uid);
        let convoId = 'default-convo';
        if (convos.length > 0) {
          convoId = convos[0].id;
          setActiveConversationId(convoId);
        } else {
          // Crear conversación por defecto si no existe
          convoId = `convo-${Date.now()}`;
          setActiveConversationId(convoId);
          await FirestoreService.createConversation({
            id: convoId,
            userId: currentUser.uid,
            projectId: project.id,
            title: `Sesión de ${project.name}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        const msgs = await FirestoreService.getConversationMessages(convoId, currentUser.uid);
        if (msgs.length > 0) {
          setMessages(msgs);
        } else {
          // Mensaje inicial de bienvenida de la IA
          const welcomeMsg: ChatMessage = {
            id: `msg-welcome-${Date.now()}`,
            userId: currentUser.uid,
            conversationId: convoId,
            projectId: project.id,
            role: 'assistant',
            content: `¡Hola! Soy tu asistente de arquitectura para **${project.name}** en Roblox Studio.\n\nPuedes pedirme cualquier sistema en lenguaje natural:\n- *"Crea un lobby para mi juego Héroes vs Villanos"*\n- *"Agrega un sistema de matchmaking 1v1"*\n- *"Crea una tienda de armas"*\n- *"Corrige este script"*\n- *"Agrega un botón de deslizar para dispositivos móviles"*`,
            createdAt: new Date().toISOString(),
          };
          setMessages([welcomeMsg]);
        }
      } catch (err) {
        console.error('Error cargando historial de chat:', err);
      }
    };

    loadHistory();
  }, [project, currentUser]);

  // Ejecutar prompt inicial si viene desde el Dashboard
  useEffect(() => {
    if (initialPrompt && project && !isGenerating) {
      handleSendMessage(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt, project]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setIsGenerating(false);
      setAbortController(null);
      setStatusNotification('Generación cancelada por el usuario.');
      setTimeout(() => setStatusNotification(null), 3000);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend || inputPrompt).trim();
    if (!promptText || !project || !currentUser || isGenerating) return;

    setInputPrompt('');
    const userMsgId = `msg-u-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      userId: currentUser.uid,
      conversationId: activeConversationId,
      projectId: project.id,
      role: 'user',
      content: promptText,
      createdAt: new Date().toISOString(),
    };

    // Añadir mensaje a UI
    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Guardar mensaje de usuario en Firestore
      await FirestoreService.saveMessage(userMsg);

      // Llamar al motor de IA (con soporte real / demo)
      const aiResponse: AIResponsePayload = await aiService.generateResponse(
        promptText,
        project.name,
        controller.signal,
        project.id
      );

      // Formatear contenido textual del asistente
      let formattedContent = aiResponse.explanation;

      if (aiResponse.installationSteps && aiResponse.installationSteps.length > 0) {
        formattedContent += '\n\n### 📦 Instrucciones de Instalación en Roblox Studio:\n' +
          aiResponse.installationSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n');
      }

      if (aiResponse.warnings && aiResponse.warnings.length > 0) {
        formattedContent += '\n\n### ⚠️ Consideraciones de Rendimiento y Seguridad:\n' +
          aiResponse.warnings.map((w) => `• ${w}`).join('\n');
      }

      const assistantMsgId = `msg-a-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        userId: currentUser.uid,
        conversationId: activeConversationId,
        projectId: project.id,
        role: 'assistant',
        content: formattedContent,
        commands: aiResponse.commands,
        diff: aiResponse.diff,
        filesProposed: aiResponse.codeBlocks.map((b) => ({
          name: b.fileName,
          path: `${b.location}/${b.fileName}`,
          code: b.code,
        })),
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Guardar respuesta en Firestore
      await FirestoreService.saveMessage(assistantMsg);

      // Guardar automáticamente los archivos generados en la colección del proyecto
      if (aiResponse.codeBlocks && aiResponse.codeBlocks.length > 0) {
        for (const block of aiResponse.codeBlocks) {
          const generatedFile: GeneratedFile = {
            id: `file-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            userId: currentUser.uid,
            projectId: project.id,
            name: block.fileName,
            path: `${block.location}/${block.fileName}`,
            content: block.code,
            action: 'create_script',
            status: 'draft',
            scriptType: block.scriptType,
            updatedAt: new Date().toISOString(),
          };
          await FirestoreService.saveGeneratedFile(generatedFile);
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes('cancelada')) {
        // Ignorado porque el usuario canceló
      } else {
        console.error('Error durante la generación de IA:', err);
        const errorMsg: ChatMessage = {
          id: `msg-err-${Date.now()}`,
          userId: currentUser.uid,
          conversationId: activeConversationId,
          projectId: project.id,
          role: 'assistant',
          content: 'No se pudo completar la generación. Por favor, verifica tu conexión o intenta con otra instrucción.',
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  const handleApplyCommand = async (cmd: RobloxCommand) => {
    if (!project || !currentUser) return;
    try {
      const res = await robloxBridgeService.sendCommand({
        projectId: project.id,
        type: (cmd.type || cmd.action || 'create_script') as any,
        name: cmd.name,
        location: cmd.location,
        parent: cmd.location,
        code: cmd.code,
        scriptType: cmd.scriptType,
        properties: cmd.properties,
      });

      if (res.success) {
        setStatusNotification(`✓ Comando "${cmd.name}" (${cmd.type || cmd.action}) encolado para el plugin de Roblox Studio`);
      } else {
        setStatusNotification(`Aviso: ${res.error || 'No se pudo encolar'}`);
      }
    } catch {
      setStatusNotification(`Comando preparado en la cola de Roblox Studio: "${cmd.name}"`);
    }
    setTimeout(() => setStatusNotification(null), 4000);
  };

  if (!project) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center p-6 text-center">
        <FolderGit2 className="h-12 w-12 text-slate-600" />
        <h3 className="mt-3 text-lg font-bold text-white">Selecciona o crea un proyecto</h3>
        <p className="mt-1 max-w-sm text-xs text-slate-400">
          Para comenzar a chatear con la IA de StudioForge, selecciona un proyecto existente o crea uno nuevo.
        </p>
        {projects.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectProject(p)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                🎮 {p.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-slate-950 text-slate-100">
      {/* Barra superior de estado del chat */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-2.5 text-xs backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-white">Chat Asistente Luau</span>
            <span className="mx-2 text-slate-600">•</span>
            <span className="text-slate-400">{project.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[11px] text-blue-400">
            <Sparkles className="h-3 w-3" />
            <span>Motor Luau 5.1</span>
          </div>

          <span className="rounded-full border border-slate-800 bg-slate-950 px-2.5 py-0.5 text-[11px] text-slate-400">
            {aiService.isConfigured() ? 'Gemini 2.5 Active' : 'Modo Asistente Demo'}
          </span>
        </div>
      </div>

      {statusNotification && (
        <div className="bg-blue-600/90 text-white px-4 py-1.5 text-xs text-center font-medium shadow-md transition-all">
          {statusNotification}
        </div>
      )}

      {/* Área de mensajes con scroll automático */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 md:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-3xl rounded-2xl p-4 md:p-5 text-xs md:text-sm leading-relaxed shadow-lg ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'border border-slate-800 bg-slate-900/90 text-slate-200 rounded-bl-sm'
                }`}
              >
                {/* Texto del mensaje */}
                <div className="whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>

                {/* Inspector de diferencias si está presente */}
                {msg.diff && (
                  <div className="mt-4">
                    <DiffViewer
                      diff={msg.diff}
                      onApply={() => {
                        setStatusNotification(`Cambios aplicados con éxito al script ${msg.diff?.fileName}`);
                        setTimeout(() => setStatusNotification(null), 3000);
                      }}
                    />
                  </div>
                )}

                {/* Archivos de código propuestos */}
                {msg.filesProposed && msg.filesProposed.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Archivos Luau Generados:
                    </div>
                    {msg.filesProposed.map((file, idx) => (
                      <CodeBlock
                        key={idx}
                        code={file.code}
                        fileName={file.name}
                        location={file.path.split('/')[0]}
                        onOpenInEditor={onOpenInEditor}
                      />
                    ))}
                  </div>
                )}

                {/* Comandos Estructurados de Roblox */}
                {msg.commands && msg.commands.length > 0 && (
                  <div className="mt-4 rounded-xl border border-slate-700/80 bg-slate-950 p-3.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-xs">
                      <span className="font-bold text-blue-400 flex items-center gap-1.5">
                        <Terminal className="h-3.5 w-3.5" />
                        Comandos Estructurados para Roblox Studio
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {msg.commands.length} acciones
                      </span>
                    </div>

                    <div className="space-y-2">
                      {msg.commands.map((cmd) => (
                        <div
                          key={cmd.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/80 p-2.5 text-xs font-mono"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-300">
                                {cmd.action}
                              </span>
                              <span className="font-semibold text-slate-200">{cmd.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              📍 {cmd.location} {cmd.scriptType ? `(${cmd.scriptType}Script)` : ''}
                            </div>
                            {cmd.description && (
                              <div className="text-[11px] text-slate-400 font-sans">
                                {cmd.description}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleApplyCommand(cmd)}
                            className="flex items-center gap-1 rounded-md bg-blue-600/30 px-2 py-1 text-[11px] font-sans font-semibold text-blue-300 hover:bg-blue-600 hover:text-white transition-all"
                          >
                            <span>Encolar</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-200">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Indicador de Generación con botón de cancelar */}
        {isGenerating && (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white animate-pulse">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-slate-300 shadow-md">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping"></span>
                <span>Arquitectando scripts de Roblox Studio...</span>
              </span>
              <button
                onClick={handleStopGeneration}
                className="flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-950/40 px-2.5 py-1 text-xs font-semibold text-red-300 hover:bg-red-900/60 transition-all"
              >
                <Square className="h-3 w-3 fill-current" />
                <span>Detener</span>
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input de Chat */}
      <div className="border-t border-slate-800 bg-slate-900/90 p-4 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="mx-auto max-w-4xl"
        >
          <div className="relative flex items-end rounded-2xl border border-slate-700/80 bg-slate-950 p-2 shadow-xl focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Escribe una instrucción para ${project.name}... (ej. Crea un lobby para Héroes vs Villanos, Corrige mi script...)`}
              className="max-h-36 w-full resize-none bg-transparent px-3 py-2 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none"
            />

            <div className="flex items-center gap-1.5 pb-1 pr-1">
              {isGenerating ? (
                <button
                  type="button"
                  onClick={handleStopGeneration}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white hover:bg-red-500 transition-all cursor-pointer"
                  title="Detener generación"
                >
                  <Square className="h-4 w-4 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputPrompt.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  title="Enviar instrucción"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between px-2 text-[11px] text-slate-500">
            <span>Presiona <kbd className="rounded bg-slate-800 px-1 py-0.5 text-slate-400">Enter</kbd> para enviar, <kbd className="rounded bg-slate-800 px-1 py-0.5 text-slate-400">Shift + Enter</kbd> para salto de línea</span>
            <span className="hidden sm:inline">Modo seguro: No se modifica código real en Studio hasta tu confirmación</span>
          </div>
        </form>
      </div>
    </div>
  );
};
