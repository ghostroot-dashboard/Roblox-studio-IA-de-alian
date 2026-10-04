import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { Sidebar, NavTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ChatView } from './components/ChatView';
import { ProjectsView } from './components/ProjectsView';
import { RobloxStudioView } from './components/RobloxStudioView';
import { CodeEditorView } from './components/CodeEditorView';
import { SettingsView } from './components/SettingsView';
import { NewProjectModal } from './components/NewProjectModal';
import { FirestoreService } from './services/firestoreService';
import { Project } from './types';
import { Loader2, AlertCircle, X } from 'lucide-react';

function AppContent() {
  const {
    currentUser,
    loading,
    signInWithGoogle,
    currentProject,
    setCurrentProject,
    error,
    clearError,
  } = useAuth();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Estados para saltos directos desde el Dashboard o Chat
  const [pendingPromptForChat, setPendingPromptForChat] = useState<string | undefined>(undefined);
  const [editorInitPayload, setEditorInitPayload] = useState<{
    code?: string;
    fileName?: string;
    location?: string;
  }>({});

  // Cargar proyectos de Firestore cuando el usuario esté autenticado
  useEffect(() => {
    if (!currentUser) {
      setProjects([]);
      return;
    }

    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const userProjects = await FirestoreService.getUserProjects(currentUser.uid);
        if (userProjects.length > 0) {
          setProjects(userProjects);
          if (!currentProject) {
            setCurrentProject(userProjects[0]);
          }
        } else {
          // Crear un proyecto inicial por defecto "Héroes vs Villanos"
          const defaultProject: Project = {
            id: `proj-${Date.now()}`,
            userId: currentUser.uid,
            name: 'Héroes vs Villanos',
            description: 'Juego de combate por equipos con lobby seguro, arena y matchmaking.',
            robloxStatus: 'disconnected',
            genre: 'lobby',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await FirestoreService.createProject(defaultProject);
          setProjects([defaultProject]);
          setCurrentProject(defaultProject);
        }
      } catch (err) {
        console.error('Error cargando proyectos del usuario:', err);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [currentUser]);

  const handleCreateProject = async (
    data: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!currentUser) return;
    const newProj: Project = {
      ...data,
      id: `proj-${Date.now()}`,
      userId: currentUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await FirestoreService.createProject(newProj);
    setProjects((prev) => [newProj, ...prev]);
    setCurrentProject(newProj);
    setCurrentTab('chat');
  };

  const handleUpdateProjectName = async (projectId: string, newName: string) => {
    try {
      await FirestoreService.updateProject(projectId, { name: newName });
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, name: newName } : p))
      );
      if (currentProject?.id === projectId) {
        setCurrentProject({ ...currentProject, name: newName });
      }
    } catch (err) {
      console.error('Error renombrando proyecto:', err);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await FirestoreService.deleteProject(projectId);
      const remaining = projects.filter((p) => p.id !== projectId);
      setProjects(remaining);
      if (currentProject?.id === projectId) {
        setCurrentProject(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err) {
      console.error('Error eliminando proyecto:', err);
    }
  };

  const handleUpdateRobloxStatus = async (status: 'disconnected' | 'pairing' | 'connected') => {
    if (!currentProject) return;
    try {
      await FirestoreService.updateProject(currentProject.id, { robloxStatus: status });
      const updated = { ...currentProject, robloxStatus: status };
      setCurrentProject(updated);
      setProjects((prev) => prev.map((p) => (p.id === currentProject.id ? updated : p)));
    } catch (err) {
      console.error('Error actualizando estado de Roblox Studio:', err);
    }
  };

  const handleNavigateToChatWithPrompt = (prompt: string) => {
    setPendingPromptForChat(prompt);
    setCurrentTab('chat');
  };

  const handleOpenInEditor = (code: string, fileName?: string, location?: string) => {
    setEditorInitPayload({ code, fileName, location });
    setCurrentTab('scripts');
  };

  // Pantalla de carga inicial
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="text-xs font-semibold text-slate-400">Iniciando StudioForge AI...</span>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar Landing Page
  if (!currentUser) {
    return (
      <LandingPage
        onSignIn={signInWithGoogle}
        onExploreDemo={signInWithGoogle}
      />
    );
  }

  // Título de la pestaña actual para el navbar
  const tabTitles: Record<NavTab, string> = {
    dashboard: 'Panel de Control',
    projects: 'Mis Proyectos',
    chat: 'Chat con IA (Luau Studio)',
    roblox: 'Roblox Studio Bridge',
    scripts: 'Editor Luau & Inspector de Cambios',
    settings: 'Configuración',
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Notificación de Error Global */}
      {error && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-2xl border border-red-500/40 bg-red-950/90 px-4 py-3 text-xs text-red-200 shadow-2xl backdrop-blur-md">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
          <button
            onClick={clearError}
            className="ml-2 text-red-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Sidebar Responsive */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenNewProject={() => setIsNewProjectModalOpen(true)}
        recentProjects={projects}
      />

      {/* Contenido Principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          title={tabTitles[currentTab]}
          projects={projects}
          onOpenNewProject={() => setIsNewProjectModalOpen(true)}
        />

        {/* Vistas según la pestaña activa */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              projects={projects}
              onOpenNewProject={() => setIsNewProjectModalOpen(true)}
              onSelectProject={(p) => {
                setCurrentProject(p);
                setCurrentTab('chat');
              }}
              onNavigateToChatWithPrompt={handleNavigateToChatWithPrompt}
              onNavigateToRoblox={() => setCurrentTab('roblox')}
              onNavigateToScripts={() => setCurrentTab('scripts')}
            />
          )}

          {currentTab === 'projects' && (
            <ProjectsView
              projects={projects}
              onOpenNewProject={() => setIsNewProjectModalOpen(true)}
              onSelectProject={(p) => setCurrentProject(p)}
              onUpdateProjectName={handleUpdateProjectName}
              onDeleteProject={handleDeleteProject}
              onNavigateToChat={(p) => {
                setCurrentProject(p);
                setCurrentTab('chat');
              }}
              onNavigateToScripts={(p) => {
                setCurrentProject(p);
                setCurrentTab('scripts');
              }}
            />
          )}

          {currentTab === 'chat' && (
            <ChatView
              project={currentProject}
              projects={projects}
              onSelectProject={(p) => setCurrentProject(p)}
              onOpenInEditor={handleOpenInEditor}
              initialPrompt={pendingPromptForChat}
              onClearInitialPrompt={() => setPendingPromptForChat(undefined)}
            />
          )}

          {currentTab === 'roblox' && (
            <RobloxStudioView
              project={currentProject}
              onUpdateProjectStatus={handleUpdateRobloxStatus}
            />
          )}

          {currentTab === 'scripts' && (
            <CodeEditorView
              project={currentProject}
              initialCode={editorInitPayload.code}
              initialFileName={editorInitPayload.fileName}
              initialLocation={editorInitPayload.location}
            />
          )}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Modal de Nuevo Proyecto */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
