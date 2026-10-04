import {
  AllowedRobloxCommandType,
  BridgeCommandPayload,
  BridgeSessionInfo,
  CommandHistoryItem,
} from '../types/bridge';
import { generateRobloxPluginLuauCode } from './robloxPluginSource';

export class RobloxBridgeService {
  private static instance: RobloxBridgeService;

  private constructor() {}

  public static getInstance(): RobloxBridgeService {
    if (!RobloxBridgeService.instance) {
      RobloxBridgeService.instance = new RobloxBridgeService();
    }
    return RobloxBridgeService.instance;
  }

  /**
   * Obtiene la URL base actual donde corre la aplicación para el plugin de Roblox Studio
   */
  public getBridgeServerUrl(): string {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'http://localhost:3000';
  }

  /**
   * Solicita al backend crear un código de emparejamiento temporal (ABC123)
   */
  public async createPairingCode(
    projectId: string,
    projectName: string,
    userId: string
  ): Promise<{
    success: boolean;
    pairingCode?: string;
    expiresAt?: string;
    sessionToken?: string;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/bridge/create-pairing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, projectName, userId }),
      });
      return await res.json();
    } catch (err: any) {
      console.error('Error al generar código de emparejamiento:', err);
      return { success: false, error: err.message || 'Error de red con el backend' };
    }
  }

  /**
   * Consulta el estado en tiempo real del puente para el proyecto
   */
  public async getStatus(projectId: string): Promise<{
    success: boolean;
    status: 'disconnected' | 'pending' | 'connected';
    pairingCode?: string;
    expiresAt?: string;
    sessionToken?: string;
    projectName?: string;
    lastPingAt?: string;
    pluginVersion?: string;
    error?: string;
  }> {
    try {
      const res = await fetch(`/api/bridge/status/${projectId}`);
      return await res.json();
    } catch (err: any) {
      console.error('Error al consultar estado del puente:', err);
      return { success: false, status: 'disconnected', error: err.message };
    }
  }

  /**
   * Envía un comando estructurado para ser ejecutado en Roblox Studio
   */
  public async sendCommand(command: {
    projectId: string;
    type: AllowedRobloxCommandType;
    name: string;
    parent?: string;
    location?: string;
    properties?: Record<string, any>;
    code?: string;
    scriptType?: 'Server' | 'Client' | 'Module';
    newName?: string;
    targetPath?: string;
  }): Promise<{
    success: boolean;
    command?: BridgeCommandPayload;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/bridge/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });
      return await res.json();
    } catch (err: any) {
      console.error('Error al enviar comando estructurado:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Envía un comando de prueba PING al plugin de Roblox Studio
   */
  public async sendPing(projectId: string): Promise<{
    success: boolean;
    commandId?: string;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/bridge/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      return { success: data.success, commandId: data.command?.commandId, error: data.error };
    } catch (err: any) {
      console.error('Error al enviar PING:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Obtiene el historial de comandos enviados y ejecutados
   */
  public async getCommandHistory(projectId: string): Promise<CommandHistoryItem[]> {
    try {
      const res = await fetch(`/api/bridge/history/${projectId}`);
      const data = await res.json();
      return data.history || [];
    } catch (err) {
      console.error('Error al obtener historial de comandos:', err);
      return [];
    }
  }

  /**
   * Desconecta el proyecto del puente
   */
  public async disconnect(projectId: string): Promise<boolean> {
    try {
      const res = await fetch('/api/bridge/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch (err) {
      console.error('Error al desconectar del puente:', err);
      return false;
    }
  }

  /**
   * Empareja un código de conexión (usado por el plugin o por el test suite)
   */
  public async pairWithCode(
    pairingCode: string,
    pluginVersion: string = '1.0.0',
    projectId?: string,
    userId?: string
  ): Promise<{
    success: boolean;
    sessionToken?: string;
    projectId?: string;
    projectName?: string;
    userId?: string;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/bridge/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairingCode, pluginVersion, projectId, userId }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Envía un mensaje de prueba PING desde el Plugin hacia el backend
   */
  public async sendPluginPing(sessionToken: string): Promise<{
    success: boolean;
    message?: string;
    serverTime?: string;
    projectName?: string;
    projectId?: string;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/bridge/plugin-ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Sondea la cola de comandos (utilizado por el plugin o test runner)
   */
  public async pollCommands(sessionToken: string): Promise<{
    success: boolean;
    commands?: BridgeCommandPayload[];
    error?: string;
  }> {
    try {
      const res = await fetch('/api/bridge/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Reporta el resultado de ejecución de un comando (utilizado por el plugin o test runner)
   */
  public async reportResult(
    sessionToken: string,
    result: {
      commandId: string;
      success: boolean;
      message?: string;
      error?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/bridge/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken, ...result }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Genera el código fuente Luau del plugin con la URL del servidor inyectada
   */
  public getRobloxStudioPluginSource(pairingCode?: string, customServerUrl?: string): string {
    const serverUrl = customServerUrl || this.getBridgeServerUrl();
    return generateRobloxPluginLuauCode(serverUrl, pairingCode || 'ABC123');
  }
}

export const robloxBridgeService = RobloxBridgeService.getInstance();
