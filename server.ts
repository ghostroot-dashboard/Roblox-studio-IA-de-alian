import express from 'express';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { bridgeManager } from './src/server/bridgeManager.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Middleware de JSON y CORS permisivo para que el plugin de Roblox Studio pueda enviar solicitudes HTTP
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// --- RUTAS DEL PUENTE CON ROBLOX STUDIO (API BACKEND) ---

// 1. Web genera código de emparejamiento para un proyecto
app.post('/api/bridge/create-pairing', (req, res) => {
  const { projectId, projectName, userId } = req.body;
  if (!projectId || !userId) {
    return res.status(400).json({ success: false, error: 'projectId y userId son requeridos.' });
  }

  const session = bridgeManager.createPairing(projectId, projectName || 'Proyecto Roblox', userId);
  return res.json({
    success: true,
    pairingCode: session.pairingCode,
    expiresAt: session.expiresAt,
    sessionToken: session.sessionToken,
    status: session.status,
  });
});

// 2. Plugin de Roblox Studio introduce código para verificar y emparejar
// Valida: usuario, proyecto, código y expiración
app.post('/api/bridge/pair', (req, res) => {
  const { pairingCode, pluginVersion, projectId, userId } = req.body;
  if (!pairingCode) {
    return res.status(400).json({ success: false, error: 'Código de emparejamiento requerido.' });
  }

  const result = bridgeManager.verifyAndPair(pairingCode, pluginVersion, projectId, userId);
  if (!result.success) {
    return res.status(400).json(result);
  }

  return res.json(result);
});

// 2b. Plugin de Roblox Studio envía un PING de prueba al backend
app.post('/api/bridge/plugin-ping', (req, res) => {
  const { sessionToken } = req.body;
  if (!sessionToken) {
    return res.status(401).json({ success: false, error: 'sessionToken no provisto.' });
  }

  const result = bridgeManager.handlePluginPing(sessionToken);
  if (!result.success) {
    return res.status(401).json(result);
  }

  return res.json(result);
});

// 3. Consulta de estado del puente desde la Web
app.get('/api/bridge/status/:projectId', (req, res) => {
  const { projectId } = req.params;
  const session = bridgeManager.getSessionByProject(projectId);

  if (!session) {
    return res.json({
      success: true,
      status: 'disconnected',
      message: 'Sin sesión activa para este proyecto.',
    });
  }

  // Verificar si la sesión expiró mientras estaba pendiente
  if (session.status === 'pending' && new Date(session.expiresAt).getTime() < Date.now()) {
    session.status = 'disconnected';
  }

  return res.json({
    success: true,
    status: session.status,
    pairingCode: session.status === 'pending' ? session.pairingCode : undefined,
    expiresAt: session.expiresAt,
    sessionToken: session.sessionToken,
    projectName: session.projectName,
    lastPingAt: session.lastPingAt,
    pluginVersion: session.pluginVersion,
  });
});

// 4. Plugin de Roblox Studio sondea (poll) comandos pendientes
app.post('/api/bridge/poll', (req, res) => {
  const { sessionToken } = req.body;
  if (!sessionToken) {
    return res.status(401).json({ success: false, error: 'sessionToken no provisto.' });
  }

  const result = bridgeManager.pollCommands(sessionToken);
  if (!result.success) {
    return res.status(401).json(result);
  }

  return res.json(result);
});

// 5. Web envía un comando estructurado a la cola
app.post('/api/bridge/command', (req, res) => {
  const { projectId, type, name, parent, location, properties, code, scriptType, newName, targetPath } = req.body;

  if (!projectId || !type || !name) {
    return res.status(400).json({ success: false, error: 'projectId, type y name son requeridos.' });
  }

  const result = bridgeManager.enqueueCommand({
    projectId,
    type,
    name,
    parent,
    location,
    properties,
    code,
    scriptType,
    newName,
    targetPath,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  return res.json(result);
});

// 5b. Web envía un PING de prueba al plugin de Roblox Studio
app.post('/api/bridge/ping', (req, res) => {
  const { projectId } = req.body;
  if (!projectId) {
    return res.status(400).json({ success: false, error: 'projectId es requerido.' });
  }

  const result = bridgeManager.enqueueCommand({
    projectId,
    type: 'ping',
    name: 'PING',
    parent: 'Workspace',
    location: 'Workspace',
  });

  return res.json(result);
});

// 6. Plugin de Roblox Studio reporta el resultado de ejecución de un comando
app.post('/api/bridge/result', (req, res) => {
  const { sessionToken, commandId, success, message, error } = req.body;
  if (!sessionToken || !commandId) {
    return res.status(400).json({ success: false, error: 'sessionToken y commandId son requeridos.' });
  }

  const result = bridgeManager.reportResult(sessionToken, {
    commandId,
    success: Boolean(success),
    message,
    error,
    executedAt: new Date().toISOString(),
  });

  return res.json(result);
});

// 7. Web obtiene el historial de comandos para el proyecto
app.get('/api/bridge/history/:projectId', (req, res) => {
  const { projectId } = req.params;
  const history = bridgeManager.getHistory(projectId);
  return res.json({ success: true, history });
});

// 8. Desconectar sesión del puente
app.post('/api/bridge/disconnect', (req, res) => {
  const { projectId } = req.body;
  if (!projectId) {
    return res.status(400).json({ success: false, error: 'projectId requerido.' });
  }

  bridgeManager.disconnectSession(projectId);
  return res.json({ success: true, status: 'disconnected' });
});

// --- INTEGRACIÓN VITE (FRONTEND) ---
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.resolve(__dirname, 'dist', 'assets'))
      ? path.resolve(__dirname, 'dist')
      : __dirname;

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[StudioForge AI Server] Ejecutando en puerto ${PORT} (dev: ${isDev})`);
  });
}

startServer().catch((err) => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});
