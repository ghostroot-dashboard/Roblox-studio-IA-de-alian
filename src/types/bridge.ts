export type AllowedRobloxCommandType =
  | 'create_part'
  | 'delete_object'
  | 'rename_object'
  | 'create_folder'
  | 'create_script'
  | 'update_script'
  | 'create_remote_event'
  | 'create_remote_function';

export interface CommandProperties {
  Anchored?: boolean;
  CanCollide?: boolean;
  Transparency?: number;
  Color?: [number, number, number]; // RGB 0-255
  BrickColor?: string;
  Material?: string;
  Size?: [number, number, number];
  Position?: [number, number, number];
  [key: string]: any;
}

export interface BridgeCommandPayload {
  commandId: string;
  type: AllowedRobloxCommandType;
  projectId: string;
  name: string;
  parent?: string;
  location?: string;
  scriptType?: 'Server' | 'Client' | 'Module';
  code?: string;
  properties?: CommandProperties;
  newName?: string; // para rename_object
  targetPath?: string; // para delete_object o rename_object
  createdAt: string;
}

export interface BridgeCommandResult {
  commandId: string;
  success: boolean;
  message?: string;
  error?: string;
  executedAt: string;
}

export interface BridgeSessionInfo {
  sessionToken: string;
  pairingCode: string;
  projectId: string;
  projectName: string;
  userId: string;
  status: 'pending' | 'connected' | 'disconnected';
  createdAt: string;
  expiresAt: string;
  lastPingAt?: string;
  pluginVersion?: string;
  lastCommandAt?: string;
}

export interface CommandHistoryItem {
  id: string;
  commandId: string;
  projectId: string;
  type: AllowedRobloxCommandType;
  name: string;
  location: string;
  status: 'queued' | 'dispatched' | 'executed' | 'failed';
  resultMessage?: string;
  resultError?: string;
  createdAt: string;
  executedAt?: string;
}
