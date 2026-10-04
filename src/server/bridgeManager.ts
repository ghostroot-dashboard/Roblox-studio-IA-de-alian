import {
  AllowedRobloxCommandType,
  BridgeCommandPayload,
  BridgeCommandResult,
  BridgeSessionInfo,
  CommandHistoryItem,
} from '../types/bridge';

class BridgeManager {
  private static instance: BridgeManager;

  // Sesiones de emparejamiento indexadas por pairingCode y sessionToken
  private sessionsByCode = new Map<string, BridgeSessionInfo>();
  private sessionsByToken = new Map<string, BridgeSessionInfo>();
  private sessionsByProject = new Map<string, BridgeSessionInfo>();

  // Cola de comandos pendientes por projectId
  private commandQueue = new Map<string, BridgeCommandPayload[]>();

  // Historial de comandos ejecutados indexados por projectId
  private commandHistory = new Map<string, CommandHistoryItem[]>();

  private constructor() {}

  public static getInstance(): BridgeManager {
    if (!BridgeManager.instance) {
      BridgeManager.instance = new BridgeManager();
    }
    return BridgeManager.instance;
  }

  /**
   * Genera un código de emparejamiento único de 6 caracteres (ej. A7K9X2)
   * con caducidad de 10 minutos para un usuario y proyecto.
   */
  public createPairing(projectId: string, projectName: string, userId: string): BridgeSessionInfo {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const sessionToken = `sf_tok_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();

    const session: BridgeSessionInfo = {
      sessionToken,
      pairingCode: code,
      projectId,
      projectName,
      userId,
      status: 'pending',
      createdAt: now.toISOString(),
      expiresAt,
    };

    // Guardar indexado
    this.sessionsByCode.set(code, session);
    this.sessionsByToken.set(sessionToken, session);
    this.sessionsByProject.set(projectId, session);

    return session;
  }

  /**
   * Llamado por el Plugin de Roblox Studio para canjear el código de emparejamiento.
   * Valida estrictamente: código, expiración, existencia de usuario y proyecto asociado.
   */
  public verifyAndPair(
    pairingCode: string,
    pluginVersion?: string,
    expectedProjectId?: string,
    expectedUserId?: string
  ): {
    success: boolean;
    sessionToken?: string;
    projectId?: string;
    projectName?: string;
    userId?: string;
    error?: string;
  } {
    if (!pairingCode || typeof pairingCode !== 'string' || pairingCode.trim() === '') {
      return {
        success: false,
        error: 'El código de emparejamiento es obligatorio y no puede estar vacío.',
      };
    }

    const cleanCode = pairingCode.trim().toUpperCase();
    const session = this.sessionsByCode.get(cleanCode);

    if (!session) {
      return {
        success: false,
        error: 'Código de emparejamiento no encontrado o ya utilizado. Genera uno nuevo en la web.',
      };
    }

    // 1. Validación de expiración
    const expiresTime = new Date(session.expiresAt).getTime();
    const nowTime = Date.now();
    if (expiresTime < nowTime) {
      this.sessionsByCode.delete(cleanCode);
      session.status = 'disconnected';
      return {
        success: false,
        error: 'El código de emparejamiento ha expirado. Los códigos son válidos durante 10 minutos.',
      };
    }

    // 2. Validación de usuario y proyecto
    if (!session.userId || session.userId.trim() === '') {
      return {
        success: false,
        error: 'Error de integridad: la sesión no tiene un usuario propietario válido.',
      };
    }

    if (!session.projectId || session.projectId.trim() === '') {
      return {
        success: false,
        error: 'Error de integridad: la sesión no está asociada a ningún proyecto válido.',
      };
    }

    if (expectedProjectId && session.projectId !== expectedProjectId) {
      return {
        success: false,
        error: `El código no corresponde al proyecto especificado (${expectedProjectId}).`,
      };
    }

    if (expectedUserId && session.userId !== expectedUserId) {
      return {
        success: false,
        error: 'El código no corresponde al usuario autenticado.',
      };
    }

    // 3. Código de un solo uso: eliminar el código del índice de códigos pendientes
    this.sessionsByCode.delete(cleanCode);

    // 4. Actualizar estado a Conectado en ambos lados
    session.status = 'connected';
    session.pluginVersion = pluginVersion || '1.0.0';
    session.lastPingAt = new Date().toISOString();

    return {
      success: true,
      sessionToken: session.sessionToken,
      projectId: session.projectId,
      projectName: session.projectName,
      userId: session.userId,
    };
  }

  /**
   * Procesa un mensaje de prueba PING enviado directamente desde el Plugin de Roblox Studio
   */
  public handlePluginPing(sessionToken: string): {
    success: boolean;
    message?: string;
    serverTime?: string;
    projectName?: string;
    projectId?: string;
    error?: string;
  } {
    const session = this.sessionsByToken.get(sessionToken);
    if (!session) {
      return { success: false, error: 'Sesión no autorizada o no encontrada.' };
    }

    if (session.status !== 'connected') {
      return { success: false, error: 'El plugin no está en estado conectado.' };
    }

    session.lastPingAt = new Date().toISOString();

    // Registrar en historial el PING recibido desde el plugin
    const historyItem: CommandHistoryItem = {
      id: `ping_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      commandId: `ping_${Date.now().toString(36)}`,
      projectId: session.projectId,
      type: 'ping',
      name: 'Plugin Ping (Roblox -> Backend)',
      location: 'RobloxStudioPlugin',
      status: 'executed',
      resultMessage: 'PONG',
      createdAt: new Date().toISOString(),
      executedAt: new Date().toISOString(),
    };

    const history = this.commandHistory.get(session.projectId) || [];
    history.unshift(historyItem);
    this.commandHistory.set(session.projectId, history.slice(0, 50));

    return {
      success: true,
      message: 'PONG',
      serverTime: new Date().toISOString(),
      projectName: session.projectName,
      projectId: session.projectId,
    };
  }

  /**
   * Obtiene la sesión activa por token
   */
  public getSessionByToken(token: string): BridgeSessionInfo | null {
    const session = this.sessionsByToken.get(token);
    if (!session) return null;
    return session;
  }

  /**
   * Obtiene la sesión activa por proyecto
   */
  public getSessionByProject(projectId: string): BridgeSessionInfo | null {
    return this.sessionsByProject.get(projectId) || null;
  }

  /**
   * Desconecta la sesión activa de un proyecto
   */
  public disconnectSession(projectId: string): boolean {
    const session = this.sessionsByProject.get(projectId);
    if (!session) return false;

    session.status = 'disconnected';
    session.lastPingAt = new Date().toISOString();
    this.sessionsByCode.delete(session.pairingCode);
    return true;
  }

  /**
   * Valida estrictamente un comando antes de ingresarlo a la cola
   */
  public validateCommand(cmd: Partial<BridgeCommandPayload>): { valid: boolean; error?: string } {
    const allowedTypes: AllowedRobloxCommandType[] = [
      'ping',
      'create_part',
      'delete_object',
      'rename_object',
      'create_folder',
      'create_script',
      'update_script',
      'create_remote_event',
      'create_remote_function',
    ];

    if (!cmd.type || !allowedTypes.includes(cmd.type)) {
      return {
        valid: false,
        error: `Comando no permitido o desconocido: ${cmd.type}. Comandos válidos: ${allowedTypes.join(', ')}`,
      };
    }

    if (!cmd.name || cmd.name.trim() === '') {
      return { valid: false, error: 'El campo "name" es obligatorio.' };
    }

    // Validación de nombres para prevenir path injection o inyecciones de escape
    if (cmd.name.includes('..') || cmd.name.includes('\0')) {
      return { valid: false, error: 'El nombre del objeto contiene caracteres prohibidos.' };
    }

    const parentLocation = cmd.parent || cmd.location || 'Workspace';
    const allowedLocations = [
      'Workspace',
      'ServerScriptService',
      'ReplicatedStorage',
      'StarterPlayer/StarterPlayerScripts',
      'StarterPlayer/StarterCharacterScripts',
      'StarterGui',
      'ServerStorage',
      'Lighting',
      'Teams',
    ];

    const isAllowedLocation = allowedLocations.some(
      (loc) => parentLocation === loc || parentLocation.startsWith(loc + '/')
    );

    if (!isAllowedLocation) {
      return {
        valid: false,
        error: `Ubicación no permitida: "${parentLocation}". Solo se admiten servicios estándar de Roblox Studio.`,
      };
    }

    // Para scripts, asegurar que no sea código malicioso directo
    if (cmd.type === 'create_script' || cmd.type === 'update_script') {
      if (typeof cmd.code !== 'string') {
        return { valid: false, error: 'Los comandos de script requieren el campo "code" en formato string.' };
      }
    }

    return { valid: true };
  }

  /**
   * Encola un comando estructurado para ser recogido por el plugin
   */
  public enqueueCommand(cmd: Omit<BridgeCommandPayload, 'commandId' | 'createdAt'>): {
    success: boolean;
    command?: BridgeCommandPayload;
    error?: string;
  } {
    const validation = this.validateCommand(cmd);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const commandId = `cmd_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const fullCommand: BridgeCommandPayload = {
      ...cmd,
      commandId,
      createdAt: new Date().toISOString(),
    };

    // Añadir a cola de despacho
    const queue = this.commandQueue.get(cmd.projectId) || [];
    queue.push(fullCommand);
    this.commandQueue.set(cmd.projectId, queue);

    // Registrar en historial inicial como "queued"
    const historyItem: CommandHistoryItem = {
      id: commandId,
      commandId,
      projectId: cmd.projectId,
      type: cmd.type,
      name: cmd.name,
      location: cmd.parent || cmd.location || 'Workspace',
      status: 'queued',
      createdAt: fullCommand.createdAt,
    };

    const history = this.commandHistory.get(cmd.projectId) || [];
    history.unshift(historyItem);
    this.commandHistory.set(cmd.projectId, history.slice(0, 50)); // conservar los últimos 50

    return { success: true, command: fullCommand };
  }

  /**
   * El plugin sondea los comandos pendientes para su proyecto
   */
  public pollCommands(sessionToken: string): {
    success: boolean;
    commands?: BridgeCommandPayload[];
    error?: string;
  } {
    const session = this.sessionsByToken.get(sessionToken);
    if (!session) {
      return { success: false, error: 'Sesión no autorizada o expirada.' };
    }

    if (session.status !== 'connected') {
      return { success: false, error: 'El plugin no está en estado conectado.' };
    }

    // Actualizar ping
    session.lastPingAt = new Date().toISOString();

    const queue = this.commandQueue.get(session.projectId) || [];
    if (queue.length === 0) {
      return { success: true, commands: [] };
    }

    // Extraer todos los comandos pendientes
    const commandsToDispatch = [...queue];
    this.commandQueue.set(session.projectId, []);

    // Actualizar estado en historial a "dispatched"
    const history = this.commandHistory.get(session.projectId) || [];
    for (const dispatched of commandsToDispatch) {
      const match = history.find((h) => h.commandId === dispatched.commandId);
      if (match && match.status === 'queued') {
        match.status = 'dispatched';
      }
    }

    return { success: true, commands: commandsToDispatch };
  }

  /**
   * El plugin reporta el resultado de ejecución de un comando
   */
  public reportResult(
    sessionToken: string,
    result: BridgeCommandResult
  ): { success: boolean; error?: string } {
    const session = this.sessionsByToken.get(sessionToken);
    if (!session) {
      return { success: false, error: 'Sesión no autorizada.' };
    }

    session.lastPingAt = new Date().toISOString();

    const history = this.commandHistory.get(session.projectId) || [];
    const match = history.find((h) => h.commandId === result.commandId);

    if (match) {
      match.status = result.success ? 'executed' : 'failed';
      match.resultMessage = result.message;
      match.resultError = result.error;
      match.executedAt = result.executedAt || new Date().toISOString();
    } else {
      // Si por alguna razón no estaba, registrarlo
      history.unshift({
        id: result.commandId,
        commandId: result.commandId,
        projectId: session.projectId,
        type: 'create_script',
        name: 'ReportedCommand',
        location: 'Unknown',
        status: result.success ? 'executed' : 'failed',
        resultMessage: result.message,
        resultError: result.error,
        createdAt: new Date().toISOString(),
        executedAt: result.executedAt || new Date().toISOString(),
      });
    }

    return { success: true };
  }

  /**
   * Obtiene el historial de comandos para un proyecto
   */
  public getHistory(projectId: string): CommandHistoryItem[] {
    return this.commandHistory.get(projectId) || [];
  }
}

export const bridgeManager = BridgeManager.getInstance();
