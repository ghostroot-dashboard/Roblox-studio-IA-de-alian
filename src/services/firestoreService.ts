import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import {
  UserProfile,
  Project,
  Conversation,
  ChatMessage,
  GeneratedFile,
  RobloxConnection,
} from '../types';

export class FirestoreService {
  // --- USERS ---
  static async syncUserProfile(user: UserProfile): Promise<void> {
    const path = `users/${user.uid}`;
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL || '',
          theme: user.theme || 'dark',
          createdAt: user.createdAt,
        });
      } else {
        await updateDoc(userRef, {
          displayName: user.displayName,
          photoURL: user.photoURL || '',
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    const path = `users/${uid}`;
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (!snap.exists()) return null;
      return snap.data() as UserProfile;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  }

  // --- PROJECTS ---
  static async getUserProjects(userId: string): Promise<Project[]> {
    const path = 'projects';
    try {
      const q = query(collection(db, path), where('userId', '==', userId));
      const snap = await getDocs(q);
      const list: Project[] = [];
      snap.forEach((d) => {
        list.push(d.data() as Project);
      });
      // Ordenar en cliente para evitar requerir índices compuestos inmediatos
      return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }

  static async createProject(project: Project): Promise<void> {
    const path = `projects/${project.id}`;
    try {
      await setDoc(doc(db, 'projects', project.id), project);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }

  static async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    const path = `projects/${projectId}`;
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  static async deleteProject(projectId: string): Promise<void> {
    const path = `projects/${projectId}`;
    try {
      await deleteDoc(doc(db, 'projects', projectId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  // --- CONVERSATIONS ---
  static async getProjectConversations(projectId: string, userId: string): Promise<Conversation[]> {
    const path = 'conversations';
    try {
      const q = query(
        collection(db, path),
        where('userId', '==', userId),
        where('projectId', '==', projectId)
      );
      const snap = await getDocs(q);
      const list: Conversation[] = [];
      snap.forEach((d) => {
        list.push(d.data() as Conversation);
      });
      return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }

  static async createConversation(convo: Conversation): Promise<void> {
    const path = `conversations/${convo.id}`;
    try {
      await setDoc(doc(db, 'conversations', convo.id), convo);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }

  // --- MESSAGES ---
  static async getConversationMessages(conversationId: string, userId: string): Promise<ChatMessage[]> {
    const path = 'messages';
    try {
      const q = query(
        collection(db, path),
        where('userId', '==', userId),
        where('conversationId', '==', conversationId)
      );
      const snap = await getDocs(q);
      const list: ChatMessage[] = [];
      snap.forEach((d) => {
        const data = d.data();
        let commands;
        if (data.commandsJson) {
          try {
            commands = JSON.parse(data.commandsJson);
          } catch {
            commands = [];
          }
        }
        list.push({
          ...(data as ChatMessage),
          commands,
        });
      });
      return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }

  static async saveMessage(msg: ChatMessage): Promise<void> {
    const path = `messages/${msg.id}`;
    try {
      const payload: Record<string, any> = {
        id: msg.id,
        userId: msg.userId,
        conversationId: msg.conversationId,
        projectId: msg.projectId,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
      };

      if (msg.commands && msg.commands.length > 0) {
        payload.commandsJson = JSON.stringify(msg.commands);
      }

      await setDoc(doc(db, 'messages', msg.id), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }

  // --- GENERATED FILES ---
  static async getProjectFiles(projectId: string, userId: string): Promise<GeneratedFile[]> {
    const path = 'generatedFiles';
    try {
      const q = query(
        collection(db, path),
        where('userId', '==', userId),
        where('projectId', '==', projectId)
      );
      const snap = await getDocs(q);
      const list: GeneratedFile[] = [];
      snap.forEach((d) => {
        list.push(d.data() as GeneratedFile);
      });
      return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }

  static async saveGeneratedFile(file: GeneratedFile): Promise<void> {
    const path = `generatedFiles/${file.id}`;
    try {
      await setDoc(doc(db, 'generatedFiles', file.id), file);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  static async deleteGeneratedFile(fileId: string): Promise<void> {
    const path = `generatedFiles/${fileId}`;
    try {
      await deleteDoc(doc(db, 'generatedFiles', fileId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  // --- ROBLOX CONNECTIONS ---
  static async getRobloxConnection(projectId: string, userId: string): Promise<RobloxConnection | null> {
    const path = 'robloxConnections';
    try {
      const q = query(
        collection(db, path),
        where('userId', '==', userId),
        where('projectId', '==', projectId)
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return snap.docs[0].data() as RobloxConnection;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  }

  static async setRobloxConnection(conn: RobloxConnection): Promise<void> {
    const path = `robloxConnections/${conn.id}`;
    try {
      await setDoc(doc(db, 'robloxConnections', conn.id), conn);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}
