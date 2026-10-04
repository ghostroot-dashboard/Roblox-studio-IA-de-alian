export type RobloxActionType =
  | 'ping'
  | 'create_script'
  | 'update_script'
  | 'delete_object'
  | 'rename_object'
  | 'create_folder'
  | 'create_remote_event'
  | 'create_gui'
  | 'create_part'
  | 'create_model'
  | 'modify_properties';

export type RobloxScriptType = 'Server' | 'Client' | 'Module';

export type RobloxServiceLocation =
  | 'Workspace'
  | 'ServerScriptService'
  | 'ReplicatedStorage'
  | 'StarterPlayer/StarterPlayerScripts'
  | 'StarterPlayer/StarterCharacterScripts'
  | 'StarterGui'
  | 'ServerStorage';

export interface RobloxCommand {
  id: string;
  type: RobloxActionType;
  action?: RobloxActionType; // Compatible con versiones previas
  projectId: string;
  name: string;
  location: RobloxServiceLocation | string;
  scriptType?: RobloxScriptType;
  code?: string;
  properties?: Record<string, string | number | boolean>;
  description?: string;
  status: 'pending' | 'queued' | 'dispatched' | 'executed' | 'failed';
  createdAt: string;
  applied?: boolean;
}

export interface RobloxDiffComparison {
  fileName: string;
  location: string;
  originalCode: string;
  proposedCode: string;
  resultCode: string;
  summaryOfChanges: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  theme?: 'dark' | 'light';
  createdAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  robloxStatus: 'disconnected' | 'pairing' | 'connected';
  robloxPlaceId?: string;
  lastConnectedAt?: string;
  createdAt: string;
  updatedAt: string;
  scriptCount?: number;
  genre?: string;
}

export interface Conversation {
  id: string;
  userId: string;
  projectId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  conversationId: string;
  projectId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  commands?: RobloxCommand[];
  commandsJson?: string;
  diff?: RobloxDiffComparison;
  filesProposed?: {
    name: string;
    path: string;
    code: string;
  }[];
  createdAt: string;
}

export interface GeneratedFile {
  id: string;
  userId: string;
  projectId: string;
  name: string;
  path: string;
  content: string;
  originalContent?: string;
  action: RobloxActionType;
  status: 'draft' | 'applied' | 'rejected';
  scriptType?: RobloxScriptType;
  updatedAt: string;
}

export interface RobloxConnection {
  id: string;
  userId: string;
  projectId: string;
  connectionId: string;
  status: 'disconnected' | 'pairing' | 'connected';
  pairingCode: string;
  pluginVersion?: string;
  lastConnectedAt?: string;
  lastPingAt?: string;
  updatedAt: string;
}

export interface RobloxHierarchyNode {
  name: string;
  type: 'service' | 'folder' | 'script' | 'localscript' | 'modulescript' | 'part' | 'model' | 'gui';
  path: string;
  children?: RobloxHierarchyNode[];
  fileId?: string;
}
