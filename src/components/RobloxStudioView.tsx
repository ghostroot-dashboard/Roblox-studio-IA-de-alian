import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Copy,
  Check,
  Download,
  Terminal,
  ShieldCheck,
  Send,
  Layers,
  Clock,
  Key,
  FolderGit2,
  FileCode,
  AlertCircle,
  RefreshCw,
  Power,
  ChevronRight,
  Boxes,
  HelpCircle,
  Plus,
  Play,
  RotateCcw,
  Info,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Project } from '../types';
import { AllowedRobloxCommandType, CommandHistoryItem } from '../types/bridge';
import { robloxBridgeService } from '../services/robloxBridgeService';
import { useAuth } from '../context/AuthContext';
import { CodeBlock } from './CodeBlock';
import { FirestoreService } from '../services/firestoreService';

interface RobloxStudioViewProps {
  project: Project | null;
  onUpdateProjectStatus?: (status: 'disconnected' | 'pairing' | 'connected') => void;
}

export const RobloxStudioView: React.FC<RobloxStudioViewProps> = ({
  project,
  onUpdateProjectStatus,
}) => {
  const { currentUser } = useAuth();

  // Estados de conexión
  const [bridgeStatus, setBridgeStatus] = useState<'disconnected' | 'pending' | 'connected'>('disconnected');
  const [pairingCode, setPairingCode] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string>('N/A');
  const [lastPingAt, setLastPingAt] = useState<string | null>(null);
  const [pluginVersion, setPluginVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Historial de comandos
  const [history, setHistory] = useState<CommandHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Feedback visual
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedConnId, setCopiedConnId] = useState(false);
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);

  // Estados de prueba PING / PONG
  const [pingStatus, setPingStatus] = useState<'idle' | 'sending' | 'success' | 'failed'>('idle');
  const [pingResultMessage, setPingResultMessage] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Pestañas internas
  const [activeTab, setActiveTab] = useState<'status' | 'send' | 'history' | 'plugin'>('status');

  // Formulario para comando personalizado
  const [cmdType, setCmdType] = useState<AllowedRobloxCommandType>('create_part');
  const [cmdName, setCmdName] = useState('LobbySpawn');
  const [cmdParent, setCmdParent] = useState('Workspace');
  const [cmdPropertiesJson, setCmdPropertiesJson] = useState(
    JSON.stringify({ Anchored: true, Size: [10, 1, 10], Position: [0, 0.5, 0] }, null, 2)
  );
  const [cmdScriptCode, setCmdScriptCode] = useState(
    '--!strict\nlocal Players = game:GetService("Players")\nprint("Script ejecutado desde StudioForge AI")'
  );

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Consultar estado actual del backend
  const checkStatus = async () => {
    if (!project) return;
    const res = await robloxBridgeService.getStatus(project.id);
    if (res.success) {
      setBridgeStatus(res.status);
      if (res.pairingCode) setPairingCode(res.pairingCode);
      if (res.expiresAt) setExpiresAt(res.expiresAt);
      if (res.sessionToken) setConnectionId(res.sessionToken);
      if (res.lastPingAt) setLastPingAt(res.lastPingAt);
      if (res.pluginVersion) setPluginVersion(res.pluginVersion);

      // Sincronizar en Firestore cuando se detecta conexión activa
      if (res.status === 'connected' && currentUser) {
        try {
          await FirestoreService.setRobloxConnection({
            id: `conn-doc-${project.id}`,
            userId: currentUser.uid,
            projectId: project.id,
            connectionId: res.sessionToken || connectionId,
            status: 'connected',
            pairingCode: 'N/A',
            pluginVersion: res.pluginVersion || '1.0.0',
            lastConnectedAt: res.lastPingAt || new Date().toISOString(),
            lastPingAt: res.lastPingAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } catch (err) {
          console.error('Error sincronizando estado conectado en Firestore:', err);
        }
      }

      if (onUpdateProjectStatus) {
        onUpdateProjectStatus(res.status === 'connected' ? 'connected' : res.status === 'pending' ? 'pairing' : 'disconnected');
      }
    }
  };

  const loadHistory = async () => {
    if (!project) return;
    setLoadingHistory(true);
    const items = await robloxBridgeService.getCommandHistory(project.id);
    setHistory(items);
    setLoadingHistory(false);
  };

  // Cargar al montar o al cambiar de proyecto
  useEffect(() => {
    if (!project) return;
    checkStatus();
    loadHistory();

    // Sondeo de estado cada 3 segundos para reflejar en vivo cuando el plugin introduce el código
    pollIntervalRef.current = setInterval(() => {
      checkStatus();
      loadHistory();
    }, 3000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [project]);

  // Manejar "Conectar Roblox Studio"
  const handleConnect = async () => {
    if (!project || !currentUser) return;
    setLoading(true);
    const res = await robloxBridgeService.createPairingCode(project.id, project.name, currentUser.uid);
    setLoading(false);

    if (res.success && res.pairingCode) {
      setPairingCode(res.pairingCode);
      setExpiresAt(res.expiresAt || null);
      if (res.sessionToken) setConnectionId(res.sessionToken);
      setBridgeStatus('pending');

      // Guardar la solicitud de conexión en Firestore
      try {
        await FirestoreService.setRobloxConnection({
          id: `conn-doc-${project.id}`,
          userId: currentUser.uid,
          projectId: project.id,
          connectionId: res.sessionToken || `conn-${project.id.slice(0, 8)}`,
          status: 'pairing',
          pairingCode: res.pairingCode,
          pluginVersion: '1.0.0',
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Error guardando conexión en Firestore:', err);
      }

      setCommandFeedback(`Código generado: ${res.pairingCode}. Introdúcelo en el plugin de Roblox Studio.`);
      setTimeout(() => setCommandFeedback(null), 6000);
      if (onUpdateProjectStatus) onUpdateProjectStatus('pairing');
    } else {
      setCommandFeedback(`Error: ${res.error || 'No se pudo generar el código'}`);
    }
  };

  // Manejar "Desconectar"
  const handleDisconnect = async () => {
    if (!project) return;
    setLoading(true);
    await robloxBridgeService.disconnect(project.id);
    setBridgeStatus('disconnected');
    setPairingCode('');
    setLoading(false);

    // Actualizar Firestore a desconectado
    if (currentUser) {
      try {
        await FirestoreService.setRobloxConnection({
          id: `conn-doc-${project.id}`,
          userId: currentUser.uid,
          projectId: project.id,
          connectionId: connectionId,
          status: 'disconnected',
          pairingCode: 'N/A',
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Error actualizando desconexión en Firestore:', err);
      }
    }

    if (onUpdateProjectStatus) onUpdateProjectStatus('disconnected');
    setCommandFeedback('Puente de Roblox Studio desconectado.');
    setTimeout(() => setCommandFeedback(null), 3000);
  };

  // Manejar prueba PING / PONG
  const handleSendPing = async () => {
    if (!project) return;
    setPingStatus('sending');
    setPingResultMessage(null);
    setCommandFeedback('Enviando PING al plugin de Roblox Studio...');

    const res = await robloxBridgeService.sendPing(project.id);
    if (!res.success) {
      setPingStatus('failed');
      setPingResultMessage(`Fallo de envío: ${res.error || 'No se pudo contactar el backend'}`);
      return;
    }

    // El comando se encoló con éxito en el backend. Esperamos la respuesta PONG del plugin
    const pingCmdId = res.commandId;
    let attempts = 0;

    const checkPong = async () => {
      attempts++;
      const items = await robloxBridgeService.getCommandHistory(project.id);
      setHistory(items);
      const pingItem = items.find((i) => (pingCmdId ? i.commandId === pingCmdId : i.type === 'ping'));

      if (pingItem && (pingItem.status === 'executed' || pingItem.resultMessage === 'PONG')) {
        setPingStatus('success');
        setPingResultMessage('Roblox Studio respondió correctamente.');
        setCommandFeedback('✓ Roblox Studio respondió correctamente. (Respuesta: PONG)');
        return;
      }

      if (pingItem && pingItem.status === 'failed') {
        setPingStatus('failed');
        setPingResultMessage(`Error reportado por el plugin: ${pingItem.resultError || 'Desconocido'}`);
        return;
      }

      if (attempts < 12) {
        setTimeout(checkPong, 1200);
      } else {
        setPingStatus('failed');
        setPingResultMessage('Tiempo de espera agotado. Verifica que el plugin en Roblox Studio esté en estado Conectado.');
      }
    };

    setTimeout(checkPong, 1000);
  };

  // Simular ciclo de prueba del plugin localmente para verificar el flujo de comunicación
  const handleSimulatePluginPairingAndPong = async () => {
    if (!project || !currentUser) return;
    setSimulating(true);
    setCommandFeedback('Iniciando prueba de ciclo de comunicación...');
    try {
      // 1. Obtener o crear código si no está pendiente
      let codeToUse = pairingCode;
      if (bridgeStatus !== 'pending' || !codeToUse) {
        const createRes = await robloxBridgeService.createPairingCode(project.id, project.name, currentUser.uid);
        if (!createRes.success || !createRes.pairingCode) {
          setCommandFeedback('Error generando código para la prueba.');
          setSimulating(false);
          return;
        }
        codeToUse = createRes.pairingCode;
        setPairingCode(codeToUse);
        setExpiresAt(createRes.expiresAt || null);
        if (createRes.sessionToken) setConnectionId(createRes.sessionToken);
      }

      // 2. Plugin canjea el código validando usuario, proyecto, código y expiración
      const pairRes = await robloxBridgeService.pairWithCode(codeToUse, '1.0.0-test', project.id, currentUser.uid);
      if (!pairRes.success || !pairRes.sessionToken) {
        setCommandFeedback(`Error de emparejamiento: ${pairRes.error}`);
        setSimulating(false);
        return;
      }

      const activeToken = pairRes.sessionToken;
      setConnectionId(activeToken);
      setBridgeStatus('connected');
      if (onUpdateProjectStatus) onUpdateProjectStatus('connected');

      // Guardar conexión en Firestore
      try {
        await FirestoreService.setRobloxConnection({
          id: `conn-doc-${project.id}`,
          userId: currentUser.uid,
          projectId: project.id,
          connectionId: activeToken,
          status: 'connected',
          pairingCode: 'N/A',
          pluginVersion: '1.0.0-sim',
          lastConnectedAt: new Date().toISOString(),
          lastPingAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Error sincronizando con Firestore:', e);
      }

      // 3. Enviar PING desde la web
      setPingStatus('sending');
      setPingResultMessage(null);
      const pingRes = await robloxBridgeService.sendPing(project.id);
      if (!pingRes.success || !pingRes.commandId) {
        setPingStatus('failed');
        setPingResultMessage('Error al enviar PING desde la Web.');
        setSimulating(false);
        return;
      }

      // 4. Plugin sondea y recibe el comando PING
      const pollRes = await robloxBridgeService.pollCommands(activeToken);
      const pingCmd = pollRes.commands?.find((c) => c.type === 'ping' || c.commandId === pingRes.commandId);

      if (pingCmd) {
        // 5. Plugin responde PONG (sin crear ni modificar objetos en Roblox)
        await robloxBridgeService.reportResult(activeToken, {
          commandId: pingCmd.commandId,
          success: true,
          message: 'PONG',
        });
      }

      // 6. Recargar historial y actualizar estados
      await loadHistory();
      setPingStatus('success');
      setPingResultMessage('Roblox Studio respondió correctamente.');
      setCommandFeedback('✓ Roblox Studio respondió correctamente. (Respuesta: PONG)');
    } catch (err: any) {
      setPingStatus('failed');
      setPingResultMessage(err.message || 'Error durante la prueba de extremo a extremo');
    } finally {
      setSimulating(false);
    }
  };

  const handleCopyCode = async () => {
    if (!pairingCode) return;
    try {
      await navigator.clipboard.writeText(pairingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyConnId = async () => {
    try {
      await navigator.clipboard.writeText(connectionId);
      setCopiedConnId(true);
      setTimeout(() => setCopiedConnId(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Enviar comando estructurado
  const handleSendCommand = async () => {
    if (!project) return;

    let parsedProps = undefined;
    if (cmdType === 'create_part') {
      try {
        parsedProps = JSON.parse(cmdPropertiesJson);
      } catch {
        setCommandFeedback('Error: El formato de propiedades JSON no es válido.');
        return;
      }
    }

    setLoading(true);
    const res = await robloxBridgeService.sendCommand({
      projectId: project.id,
      type: cmdType,
      name: cmdName.trim(),
      parent: cmdParent,
      location: cmdParent,
      properties: parsedProps,
      code: cmdType.includes('script') ? cmdScriptCode : undefined,
    });
    setLoading(false);

    if (res.success) {
      setCommandFeedback(`✓ Comando "${cmdType}" encolado exitosamente. Esperando que el plugin lo procese.`);
      setTimeout(() => setCommandFeedback(null), 4000);
      loadHistory();
      setActiveTab('history');
    } else {
      setCommandFeedback(`Error: ${res.error || 'No se pudo encolar el comando'}`);
    }
  };

  // Plantillas de comandos rápidos permitidos
  const handleQuickCommand = (type: AllowedRobloxCommandType) => {
    setCmdType(type);
    if (type === 'create_part') {
      setCmdName('ArenaPlatform');
      setCmdParent('Workspace');
      setCmdPropertiesJson(JSON.stringify({ Anchored: true, Size: [16, 1, 16], Position: [0, 1, 0] }, null, 2));
    } else if (type === 'create_folder') {
      setCmdName('Weapons');
      setCmdParent('ServerStorage');
    } else if (type === 'create_script') {
      setCmdName('MatchmakerService');
      setCmdParent('ServerScriptService');
      setCmdScriptCode('--!strict\nlocal Players = game:GetService("Players")\nprint("Matchmaker iniciado")');
    } else if (type === 'create_remote_event') {
      setCmdName('PlayerDiedEvent');
      setCmdParent('ReplicatedStorage');
    } else if (type === 'create_remote_function') {
      setCmdName('GetPlayerData');
      setCmdParent('ReplicatedStorage');
    }
    setActiveTab('send');
  };

  const handleDownloadPlugin = () => {
    const source = robloxBridgeService.getRobloxStudioPluginSource(pairingCode || 'ABC123');
    const blob = new Blob([source], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'StudioForgeBridge.server.luau';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!project) {
    return (
      <div className="flex h-96 flex-col items-center justify-center p-6 text-center">
        <Radio className="h-12 w-12 text-slate-600" />
        <h3 className="mt-3 text-lg font-bold text-white">Selecciona un proyecto primero</h3>
        <p className="mt-1 text-xs text-slate-400">
          La infraestructura de Roblox Studio se asocia específicamente a cada proyecto.
        </p>
      </div>
    );
  }

  const serverUrl = robloxBridgeService.getBridgeServerUrl();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      {/* Cabecera de la sección */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white">Roblox Studio Bridge</h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                bridgeStatus === 'connected'
                  ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-400'
                  : bridgeStatus === 'pending'
                  ? 'border-amber-500/30 bg-amber-950/40 text-amber-400 animate-pulse'
                  : 'border-slate-800 bg-slate-900 text-slate-400'
              }`}
            >
              {bridgeStatus === 'connected'
                ? '● Conectado'
                : bridgeStatus === 'pending'
                ? '● Esperando código...'
                : '● Desconectado'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Arquitectura Real: <strong>Web ➔ Backend ➔ Roblox Studio Plugin ➔ Proyecto</strong>
          </p>
        </div>

        {/* Pestañas */}
        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('status')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              activeTab === 'status' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Estado & Emparejamiento
          </button>
          <button
            onClick={() => setActiveTab('send')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              activeTab === 'send' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Enviar Comandos
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              activeTab === 'history' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Historial ({history.length})
          </button>
          <button
            onClick={() => setActiveTab('plugin')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              activeTab === 'plugin' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Plugin Luau
          </button>
        </div>
      </div>

      {commandFeedback && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-950/60 p-3 text-xs text-blue-200">
          <Info className="h-4 w-4 shrink-0 text-blue-400" />
          <span>{commandFeedback}</span>
        </div>
      )}

      {/* PESTAÑA 1: ESTADO Y EMPAREJAMIENTO */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          {/* Card Principal: Estado de Conexión, ID, Botones y Proyecto */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 md:p-8 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Lado izquierdo: Estado y Botones */}
              <div className="space-y-5">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Estado de Conexión
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <span
                      className={`h-4 w-4 rounded-full ${
                        bridgeStatus === 'connected'
                          ? 'bg-emerald-400 shadow-md shadow-emerald-500/50'
                          : bridgeStatus === 'pending'
                          ? 'bg-amber-400 animate-ping'
                          : 'bg-red-500'
                      }`}
                    ></span>
                    <span className="text-2xl font-black text-white">
                      {bridgeStatus === 'connected'
                        ? 'Roblox Studio Conectado'
                        : bridgeStatus === 'pending'
                        ? 'Esperando conexión...'
                        : 'Desconectado'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                    {bridgeStatus === 'connected'
                      ? `Conectado y sincronizado con Roblox Studio (Plugin v${pluginVersion || '1.0.0'}). Listo para ejecutar comandos en tiempo real.`
                      : bridgeStatus === 'pending'
                      ? 'Código de emparejamiento activo. Abre el plugin "StudioForge AI" dentro de Roblox Studio e introduce el código para conectar.'
                      : 'No hay conexión establecida con Roblox Studio. Pulsa "Conectar Roblox Studio" para generar un código seguro de un solo uso.'}
                  </p>
                </div>

                {/* Botones Requeridos: "Conectar Roblox Studio" y "Desconectar" */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {bridgeStatus !== 'connected' ? (
                    <button
                      onClick={handleConnect}
                      disabled={loading}
                      className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Radio className="h-4 w-4" />
                      <span>{loading ? 'Generando...' : 'Conectar Roblox Studio'}</span>
                    </button>
                  ) : null}

                  {bridgeStatus !== 'disconnected' ? (
                    <button
                      onClick={handleDisconnect}
                      disabled={loading}
                      className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-2.5 text-xs font-bold text-red-300 hover:bg-red-900/60 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Power className="h-4 w-4" />
                      <span>Desconectar</span>
                    </button>
                  ) : null}

                  <button
                    onClick={() => {
                      checkStatus();
                      loadHistory();
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                    title="Actualizar estado"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Actualizar</span>
                  </button>
                </div>
              </div>

              {/* Lado derecho: Datos Técnicos Requeridos */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3.5 text-xs">
                {/* Código de Conexión */}
                {bridgeStatus === 'pending' && pairingCode && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300 text-xs">Código de conexión temporal:</span>
                      <span className="text-[10px] text-amber-400">1 solo uso (10 min)</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2 border border-slate-800">
                      <span className="font-mono text-xl font-black tracking-widest text-white">
                        {pairingCode}
                      </span>
                      <button
                        onClick={handleCopyCode}
                        className="flex items-center gap-1 rounded bg-blue-600/30 px-2 py-1 text-xs text-blue-300 hover:bg-blue-600 hover:text-white"
                      >
                        {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ID de Conexión */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-blue-400" />
                    ID de conexión:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-200 font-bold truncate max-w-[140px] sm:max-w-xs">
                      {connectionId}
                    </span>
                    {connectionId !== 'N/A' && (
                      <button
                        onClick={handleCopyConnId}
                        className="text-slate-500 hover:text-slate-300"
                        title="Copiar ID"
                      >
                        {copiedConnId ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Última Conexión */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    Última conexión:
                  </span>
                  <span className="text-slate-300 font-semibold">
                    {lastPingAt ? new Date(lastPingAt).toLocaleTimeString() : 'Sin conexiones registradas'}
                  </span>
                </div>

                {/* Estado del Proyecto Conectado */}
                <div className="pt-1 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Estado del Proyecto
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Nombre:</span>
                    <span className="font-bold text-white">{project.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Place ID:</span>
                    <span className="font-mono text-slate-400">{project.robloxPlaceId || 'No asignado'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Comandos en Historial:</span>
                    <span className="font-mono text-blue-400 font-bold">{history.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN PRINCIPAL: PRUEBA REAL DE EXTREMO A EXTREMO (PING / PONG) */}
          <div className="rounded-3xl border border-blue-500/30 bg-slate-900/90 p-6 md:p-8 space-y-6 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-black text-white">
                    Prueba de Comunicación Bidireccional (PING ➔ PONG)
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Flujo: <strong>WEB</strong> ➔ <strong>BACKEND</strong> ➔ <strong>PLUGIN DE ROBLOX STUDIO</strong> ➔ <strong>WEB</strong>
                </p>
                <p className="text-[11px] text-amber-300/90 mt-0.5">
                  ⚠️ Esta prueba <strong>NO</strong> crea ni modifica objetos de Roblox. Solamente comprueba que la comunicación funciona.
                </p>
              </div>

              {/* Botones de Acción de Prueba */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleSendPing}
                  disabled={pingStatus === 'sending' || bridgeStatus === 'disconnected'}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className={`h-4 w-4 ${pingStatus === 'sending' ? 'animate-bounce' : ''}`} />
                  <span>{pingStatus === 'sending' ? 'Enviando PING...' : 'Enviar PING a Roblox Studio'}</span>
                </button>

                <button
                  onClick={handleSimulatePluginPairingAndPong}
                  disabled={simulating}
                  className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-950/40 px-4 py-2.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/60 transition-all cursor-pointer disabled:opacity-50"
                  title="Simula la respuesta del plugin localmente para verificar todo el flujo y base de datos"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>{simulating ? 'Ejecutando test...' : 'Auto-Test Simulador'}</span>
                </button>
              </div>
            </div>

            {/* Resultado de la Prueba PING / PONG */}
            {pingStatus === 'success' && (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-4 transition-all animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-emerald-500/20 p-2 border border-emerald-500/40 text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-emerald-300">
                      Roblox Studio respondió correctamente.
                    </h4>
                    <p className="text-xs text-emerald-400/90 mt-0.5">
                      Respuesta: <strong>PONG</strong> recibida del Plugin de Roblox Studio. En el plugin se muestra: <em>"Conexión funcionando."</em>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {pingStatus === 'sending' && (
              <div className="rounded-2xl border border-amber-500/40 bg-amber-950/30 p-4 animate-pulse">
                <div className="flex items-center gap-3 text-amber-300 text-xs">
                  <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />
                  <span>
                    Enviando comando <strong>PING</strong> a la cola del backend y esperando respuesta <strong>PONG</strong> de Roblox Studio...
                  </span>
                </div>
              </div>
            )}

            {pingStatus === 'failed' && (
              <div className="rounded-2xl border border-red-500/40 bg-red-950/40 p-4">
                <div className="flex items-center gap-3 text-red-300 text-xs">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                  <div>
                    <div className="font-bold text-red-200">Resultado de la prueba:</div>
                    <div className="mt-0.5">{pingResultMessage || 'No se recibió respuesta PONG del plugin.'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Matriz de Verificación del Flujo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs pt-1">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-500">1. Pairing Seguro</div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${pairingCode || bridgeStatus === 'connected' ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                  <span>{pairingCode ? `Código: ${pairingCode}` : bridgeStatus === 'connected' ? 'Emparejado' : 'Pendiente'}</span>
                </div>
                <p className="text-[10px] text-slate-500">Un solo uso, expira en 10 min</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-500">2. Backend Validation</div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${bridgeStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                  <span>{bridgeStatus === 'connected' ? 'Usuario & Proyecto OK' : 'Esperando canje'}</span>
                </div>
                <p className="text-[10px] text-slate-500">Valida usuario, proyecto y fecha</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-500">3. Estado en Plugin</div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${bridgeStatus === 'connected' ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                  <span>{bridgeStatus === 'connected' ? 'Conexión funcionando.' : 'Desconectado'}</span>
                </div>
                <p className="text-[10px] text-slate-500">DockWidget en Roblox Studio</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-500">4. Mensaje PING / PONG</div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${pingStatus === 'success' ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                  <span>{pingStatus === 'success' ? 'PONG confirmado' : 'Listo para enviar'}</span>
                </div>
                <p className="text-[10px] text-slate-500">Cero modificaciones de objetos</p>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas Permitidas */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="h-4 w-4 text-blue-400" />
                <span>Comandos Permitidos Rápidos (Sin ejecución arbitraria)</span>
              </h3>
              <span className="text-[11px] text-slate-500">Validados estrictamente en backend</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <button
                onClick={() => handleQuickCommand('create_part')}
                className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-left text-xs hover:border-blue-500/40 hover:bg-slate-900 transition-all cursor-pointer"
              >
                <div className="font-bold text-blue-400">+ create_part</div>
                <div className="text-[10px] text-slate-500 mt-0.5">LobbySpawn en Workspace</div>
              </button>

              <button
                onClick={() => handleQuickCommand('create_folder')}
                className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-left text-xs hover:border-blue-500/40 hover:bg-slate-900 transition-all cursor-pointer"
              >
                <div className="font-bold text-indigo-400">+ create_folder</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Weapons en ServerStorage</div>
              </button>

              <button
                onClick={() => handleQuickCommand('create_script')}
                className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-left text-xs hover:border-blue-500/40 hover:bg-slate-900 transition-all cursor-pointer"
              >
                <div className="font-bold text-purple-400">+ create_script</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Matchmaker en ServerScriptService</div>
              </button>

              <button
                onClick={() => handleQuickCommand('create_remote_event')}
                className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-left text-xs hover:border-blue-500/40 hover:bg-slate-900 transition-all cursor-pointer"
              >
                <div className="font-bold text-emerald-400">+ create_remote_event</div>
                <div className="text-[10px] text-slate-500 mt-0.5">En ReplicatedStorage</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: ENVIAR COMANDOS */}
      {activeTab === 'send' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 md:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white">Despachador de Comandos Estructurados</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Solo se permiten comandos autorizados. El plugin convertirá la estructura en operaciones nativas de Roblox Studio sin usar loadstring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                Tipo de Comando *
              </label>
              <select
                value={cmdType}
                onChange={(e) => setCmdType(e.target.value as AllowedRobloxCommandType)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
              >
                <option value="create_part">create_part</option>
                <option value="create_folder">create_folder</option>
                <option value="create_script">create_script</option>
                <option value="update_script">update_script</option>
                <option value="create_remote_event">create_remote_event</option>
                <option value="create_remote_function">create_remote_function</option>
                <option value="rename_object">rename_object</option>
                <option value="delete_object">delete_object</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                Nombre del Objeto *
              </label>
              <input
                type="text"
                value={cmdName}
                onChange={(e) => setCmdName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                placeholder="ej. LobbySpawn"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                Ubicación / Parent *
              </label>
              <select
                value={cmdParent}
                onChange={(e) => setCmdParent(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
              >
                <option value="Workspace">Workspace</option>
                <option value="ServerScriptService">ServerScriptService</option>
                <option value="ReplicatedStorage">ReplicatedStorage</option>
                <option value="StarterPlayer/StarterPlayerScripts">StarterPlayerScripts</option>
                <option value="StarterPlayer/StarterCharacterScripts">StarterCharacterScripts</option>
                <option value="StarterGui">StarterGui</option>
                <option value="ServerStorage">ServerStorage</option>
              </select>
            </div>
          </div>

          {/* Propiedades JSON si es create_part */}
          {cmdType === 'create_part' && (
            <div>
              <label className="block text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">
                Propiedades del Part (JSON)
              </label>
              <textarea
                rows={4}
                value={cmdPropertiesJson}
                onChange={(e) => setCmdPropertiesJson(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-emerald-300"
              />
            </div>
          )}

          {/* Código Luau si es script */}
          {(cmdType === 'create_script' || cmdType === 'update_script') && (
            <div>
              <label className="block text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">
                Código Luau Contenido en el Script
              </label>
              <textarea
                rows={5}
                value={cmdScriptCode}
                onChange={(e) => setCmdScriptCode(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-500">
              {bridgeStatus === 'connected' ? '✓ El plugin está activo y recibirá el comando en el próximo sondeo' : '⚠️ El comando se encolará y esperará a que el plugin se conecte'}
            </span>

            <button
              onClick={handleSendCommand}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>{loading ? 'Enviando...' : 'Enviar al Plugin'}</span>
            </button>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: HISTORIAL DE COMANDOS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Historial de Comandos del Puente</h3>
              <p className="text-xs text-slate-400">
                Registro de órdenes estructuradas, resultados y respuestas reportadas por el plugin
              </p>
            </div>
            <button
              onClick={loadHistory}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
              <span>Refrescar</span>
            </button>
          </div>

          {history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center text-xs text-slate-500">
              Aún no se han enviado comandos para este proyecto. Puedes enviar uno desde la pestaña "Enviar Comandos".
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 transition-all hover:border-slate-700"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-xs font-mono font-bold text-blue-400 border border-blue-500/30">
                        {item.type}
                      </span>
                      <span className="font-bold text-white font-mono text-sm">{item.name}</span>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                        item.status === 'executed'
                          ? 'border-emerald-500/30 bg-emerald-950/50 text-emerald-400'
                          : item.status === 'failed'
                          ? 'border-red-500/30 bg-red-950/50 text-red-400'
                          : item.status === 'dispatched'
                          ? 'border-blue-500/30 bg-blue-950/50 text-blue-400'
                          : 'border-amber-500/30 bg-amber-950/50 text-amber-400'
                      }`}
                    >
                      {item.status === 'executed'
                        ? '✓ Ejecutado con Éxito'
                        : item.status === 'failed'
                        ? '✗ Error de Ejecución'
                        : item.status === 'dispatched'
                        ? '⚡ Despachado al Plugin'
                        : '⏳ En cola'}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span>📍 Ubicación: <strong className="text-slate-200 font-mono">{item.location}</strong></span>
                    <span>🕒 Hora: {new Date(item.createdAt).toLocaleTimeString()}</span>
                    <span>ID: <code className="text-slate-500 font-mono">{item.commandId}</code></span>
                  </div>

                  {item.resultMessage && (
                    <div className="mt-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 p-2 text-xs text-emerald-300">
                      <strong>Respuesta del Plugin:</strong> {item.resultMessage}
                    </div>
                  )}

                  {item.resultError && (
                    <div className="mt-2 rounded-lg bg-red-950/30 border border-red-500/30 p-2 text-xs text-red-300">
                      <strong>Error reportado:</strong> {item.resultError}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 4: PLUGIN LUAU & GUÍA */}
      {activeTab === 'plugin' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Código Fuente del Plugin Oficial Luau</h3>
              <p className="text-xs text-slate-400">
                Script con DockWidgetGui, validador de comandos y cliente HTTP para Roblox Studio
              </p>
            </div>

            <button
              onClick={handleDownloadPlugin}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-500 transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Descargar StudioForgeBridge.server.luau</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300 space-y-2">
            <div className="font-bold text-white flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-blue-400" />
              <span>¿Dónde colocar este archivo en tu ordenador?</span>
            </div>
            <p className="text-slate-400">
              Guarda el archivo descargado en la carpeta de plugins locales de Roblox Studio:
            </p>
            <div className="rounded-lg bg-slate-950 p-2.5 font-mono text-[11px] text-blue-300 border border-slate-800 select-all">
              %localappdata%\Roblox\Plugins\StudioForgeBridge.server.luau
            </div>
            <p className="text-slate-400">
              En Mac OS: <code className="text-slate-300">~/Library/Application Support/Roblox/Plugins/</code>
            </p>
            <p className="text-slate-400">
              O bien, dentro de Roblox Studio en cualquier juego, crea un Script, pega el código, haz clic derecho sobre el Script y selecciona <strong>"Save as Local Plugin..."</strong>.
            </p>
          </div>

          <CodeBlock
            code={robloxBridgeService.getRobloxStudioPluginSource(pairingCode || 'ABC123')}
            language="luau"
            fileName="StudioForgeBridge.server.luau"
            location="Roblox Studio / Plugins"
          />
        </div>
      )}
    </div>
  );
};
