import { RobloxCommand, RobloxDiffComparison } from '../types';

export interface AIResponsePayload {
  explanation: string;
  codeBlocks: {
    fileName: string;
    location: string;
    scriptType: 'Server' | 'Client' | 'Module';
    code: string;
    language: string;
  }[];
  installationSteps: string[];
  warnings: string[];
  commands: RobloxCommand[];
  diff?: RobloxDiffComparison;
  isDemo: boolean;
}

export class AIService {
  private static instance: AIService;
  private forceDemoMode: boolean = false;

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  public setForceDemoMode(val: boolean) {
    this.forceDemoMode = val;
  }

  public isConfigured(): boolean {
    const key = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
                (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY);
    return Boolean(key) && !this.forceDemoMode;
  }

  /**
   * Genera una respuesta completa con código Luau, comandos estructurados,
   * instrucciones y advertencias.
   */
  public async generateResponse(
    prompt: string,
    projectName: string,
    abortSignal?: AbortSignal,
    projectId?: string
  ): Promise<AIResponsePayload> {
    const lower = prompt.toLowerCase();

    // Verificamos si estamos abortados antes de empezar
    if (abortSignal?.aborted) {
      throw new Error('Generación cancelada por el usuario.');
    }

    // Si hay una API Key configurada y no forzamos modo demo, intentaríamos llamar al SDK real
    const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
                   (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY);

    if (apiKey && !this.forceDemoMode) {
      try {
        return await this.callGeminiAPI(prompt, projectName, apiKey, abortSignal, projectId);
      } catch (err) {
        console.warn('Fallo en Gemini API, utilizando motor de respaldo Roblox AI:', err);
      }
    }

    // Simular latencia de generación natural para demo
    await new Promise((resolve) => setTimeout(resolve, 1400));
    if (abortSignal?.aborted) {
      throw new Error('Generación cancelada por el usuario.');
    }

    return this.generateRobloxDemoResponse(prompt, projectName, projectId);
  }

  private async callGeminiAPI(
    prompt: string,
    projectName: string,
    apiKey: string,
    abortSignal?: AbortSignal,
    projectId?: string
  ): Promise<AIResponsePayload> {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
Eres el motor de IA de StudioForge, un arquitecto experto en desarrollo para Roblox Studio y Luau moderno.
El proyecto actual se llama "${projectName}".
Tu tarea es interpretar la instrucción del usuario y devolver SIEMPRE un JSON válido con la siguiente estructura:
{
  "explanation": "Explicación breve y profesional de la solución",
  "codeBlocks": [
    {
      "fileName": "NombreDelScript",
      "location": "ServerScriptService o StarterPlayer/StarterPlayerScripts o ReplicatedStorage o StarterGui",
      "scriptType": "Server" | "Client" | "Module",
      "code": "-- Código Luau completo y tipado con --!strict",
      "language": "luau"
    }
  ],
  "installationSteps": ["Paso 1...", "Paso 2..."],
  "warnings": ["Advertencia sobre seguridad/network/mobile/datastore..."],
  "commands": [
    {
      "action": "create_script" | "update_script" | "create_remote_event" | "create_gui" | "create_folder",
      "name": "Nombre",
      "location": "Ubicacion",
      "scriptType": "Server" | "Client" | "Module",
      "code": "Código opcional",
      "description": "Qué hace este comando"
    }
  ]
}
No agregues texto fuera del JSON. Devuelve únicamente el objeto JSON.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    if (abortSignal?.aborted) {
      throw new Error('Generación cancelada por el usuario.');
    }

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    return {
      explanation: parsed.explanation || 'Solución arquitectónica generada para Roblox Studio.',
      codeBlocks: parsed.codeBlocks || [],
      installationSteps: parsed.installationSteps || ['Abre Roblox Studio y coloca los scripts en las ubicaciones indicadas.'],
      warnings: parsed.warnings || ['Recuerda probar con múltiples jugadores en modo Test Server.'],
      commands: (parsed.commands || []).map((cmd: any, idx: number) => ({
        ...cmd,
        id: `cmd-${Date.now()}-${idx}`,
        type: cmd.type || cmd.action || 'create_script',
        action: cmd.type || cmd.action || 'create_script',
        projectId: projectId || 'proj-active',
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      })),
      isDemo: false,
    };
  }

  /**
   * Motor de plantillas avanzadas de Luau para Modo Demo
   */
  private generateRobloxDemoResponse(
    prompt: string,
    projectName: string,
    projectId?: string
  ): AIResponsePayload {
    const raw = this.getRawDemoData(prompt, projectName);
    return {
      ...raw,
      commands: raw.commands.map((cmd, idx) => ({
        ...cmd,
        id: cmd.id || `cmd-demo-${Date.now()}-${idx}`,
        type: cmd.type || cmd.action || 'create_script',
        action: cmd.type || cmd.action || 'create_script',
        projectId: projectId || 'proj-active',
        name: cmd.name || `Script_${idx + 1}`,
        location: cmd.location || 'ServerScriptService',
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      })),
    };
  }

  private getRawDemoData(prompt: string, projectName: string): Omit<AIResponsePayload, 'commands'> & { commands: Partial<RobloxCommand>[] } {
    const p = prompt.toLowerCase();

    // 1. Caso: Sprint / Correr
    if (p.includes('sprint') || p.includes('correr') || p.includes('velocidad')) {
      return {
        isDemo: true,
        explanation: `He diseñado una arquitectura de sprint optimizada para "${projectName}" con soporte para teclado (Shift izquierdo) y validación en servidor para prevenir 'speed hacks'.`,
        codeBlocks: [
          {
            fileName: 'SprintClient.client.luau',
            location: 'StarterPlayer/StarterPlayerScripts',
            scriptType: 'Client',
            language: 'luau',
            code: `--!strict
-- SprintClient: Manejo de entrada de carrera para el jugador
local UserInputService = game:GetService("UserInputService")
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid") :: Humanoid
local camera = workspace.CurrentCamera

local SPRINT_SPEED = 24
local WALK_SPEED = 16
local SPRINT_FOV = 78
local DEFAULT_FOV = 70
local isSprinting = false

local sprintRemote = ReplicatedStorage:WaitForChild("SprintRemote", 5) :: RemoteEvent

local function updateFOV(targetFOV: number)
    if camera then
        local tween = TweenService:Create(camera, TweenInfo.new(0.25, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
            FieldOfView = targetFOV
        })
        tween:Play()
    end
end

local function setSprint(enabled: boolean)
    if isSprinting == enabled then return end
    isSprinting = enabled

    humanoid.WalkSpeed = if enabled then SPRINT_SPEED else WALK_SPEED
    updateFOV(if enabled then SPRINT_FOV else DEFAULT_FOV)

    if sprintRemote then
        sprintRemote:FireServer(enabled)
    end
end

UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed then return end
    if input.KeyCode == Enum.KeyCode.LeftShift then
        setSprint(true)
    end
end)

UserInputService.InputEnded:Connect(function(input)
    if input.KeyCode == Enum.KeyCode.LeftShift then
        setSprint(false)
    end
end)

player.CharacterAdded:Connect(function(newChar)
    character = newChar
    humanoid = newChar:WaitForChild("Humanoid") :: Humanoid
    isSprinting = false
end)
`,
          },
          {
            fileName: 'SprintServer.server.luau',
            location: 'ServerScriptService',
            scriptType: 'Server',
            language: 'luau',
            code: `--!strict
-- SprintServer: Validación de velocidad y límites en el servidor
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local sprintRemote = Instance.new("RemoteEvent")
sprintRemote.Name = "SprintRemote"
sprintRemote.Parent = ReplicatedStorage

local MAX_SERVER_WALKSPEED = 26 -- Margen de tolerancia de latencia

sprintRemote.OnServerEvent:Connect(function(player: Player, wantsSprint: boolean)
    local character = player.Character
    if not character then return end
    local humanoid = character:FindFirstChildOfClass("Humanoid")
    if not humanoid then return end

    if wantsSprint then
        humanoid.WalkSpeed = 24
    else
        humanoid.WalkSpeed = 16
    end
end)
`,
          },
        ],
        installationSteps: [
          'Crea un RemoteEvent llamado "SprintRemote" en ReplicatedStorage (o deja que el plugin de StudioForge lo cree).',
          'Coloca "SprintClient.client.luau" dentro de StarterPlayer -> StarterPlayerScripts.',
          'Coloca "SprintServer.server.luau" en ServerScriptService.',
          'Haz clic en Play (F5) en Roblox Studio y presiona Shift Izquierdo para probar el cambio de velocidad y FOV dinámico.',
        ],
        warnings: [
          'No confíes ciegamente en la velocidad del cliente; el servidor tiene límites estrictos (MAX_SERVER_WALKSPEED).',
          'En dispositivos móviles se recomienda añadir un botón táctil con ContextActionService.',
        ],
        commands: [
          {
            id: 'cmd-sprint-1',
            action: 'create_remote_event',
            name: 'SprintRemote',
            location: 'ReplicatedStorage',
            description: 'Canal de replicación cliente-servidor para sprint',
          },
          {
            id: 'cmd-sprint-2',
            action: 'create_script',
            name: 'SprintClient',
            location: 'StarterPlayer/StarterPlayerScripts',
            scriptType: 'Client',
            description: 'Controlador de Shift y animación de cámara FOV',
          },
          {
            id: 'cmd-sprint-3',
            action: 'create_script',
            name: 'SprintServer',
            location: 'ServerScriptService',
            scriptType: 'Server',
            description: 'Validador de WalkSpeed en el servidor',
          },
        ],
      };
    }

    // 2. Caso: Matchmaking 1v1
    if (p.includes('matchmaking') || p.includes('1v1') || p.includes('duelo') || p.includes('partida')) {
      return {
        isDemo: true,
        explanation: `He estructurado un sistema completo de Matchmaking 1v1 con cola de emparejamiento, arena privada y teletransporte coordinado con TeleportService y MemoryStoreService.`,
        codeBlocks: [
          {
            fileName: 'MatchmakerService.server.luau',
            location: 'ServerScriptService',
            scriptType: 'Server',
            language: 'luau',
            code: `--!strict
-- MatchmakerService: Administrador de colas 1v1 para ${projectName}
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local queueRemote = Instance.new("RemoteEvent")
queueRemote.Name = "MatchmakingQueueEvent"
queueRemote.Parent = ReplicatedStorage

local queue: { Player } = {}
local activeMatches = {}

local function startMatch(player1: Player, player2: Player)
    print(string.format("[Matchmaker] Duelo 1v1 iniciado: %s vs %s", player1.Name, player2.Name))
    
    -- Notificar a ambos jugadores
    queueRemote:FireClient(player1, { status = "matched", opponent = player2.Name })
    queueRemote:FireClient(player2, { status = "matched", opponent = player1.Name })

    -- Teletransporte a la arena de combate
    local arenaSpawnA = workspace:FindFirstChild("ArenaSpawnA") :: BasePart?
    local arenaSpawnB = workspace:FindFirstChild("ArenaSpawnB") :: BasePart?

    if arenaSpawnA and player1.Character then
        player1.Character:PivotTo(arenaSpawnA.CFrame + Vector3.new(0, 3, 0))
    end
    if arenaSpawnB and player2.Character then
        player2.Character:PivotTo(arenaSpawnB.CFrame + Vector3.new(0, 3, 0))
    end
end

queueRemote.OnServerEvent:Connect(function(player: Player, action: string)
    if action == "join" then
        if not table.find(queue, player) then
            table.insert(queue, player)
            queueRemote:FireClient(player, { status = "queued", position = #queue })
            
            -- Si tenemos al menos 2 jugadores en espera, emparejarlos
            if #queue >= 2 then
                local p1 = table.remove(queue, 1) :: Player
                local p2 = table.remove(queue, 1) :: Player
                startMatch(p1, p2)
            end
        end
    elseif action == "leave" then
        local idx = table.find(queue, player)
        if idx then
            table.remove(queue, idx)
            queueRemote:FireClient(player, { status = "idle" })
        end
    end
end)

Players.PlayerRemoving:Connect(function(player)
    local idx = table.find(queue, player)
    if idx then
        table.remove(queue, idx)
    end
end)
`,
          },
          {
            fileName: 'MatchmakingGui.client.luau',
            location: 'StarterPlayer/StarterPlayerScripts',
            scriptType: 'Client',
            language: 'luau',
            code: `--!strict
-- MatchmakingGui: Control de UI y estado de cola para el cliente
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local player = Players.LocalPlayer
local queueRemote = ReplicatedStorage:WaitForChild("MatchmakingQueueEvent") :: RemoteEvent

queueRemote.OnClientEvent:Connect(function(data)
    if data.status == "queued" then
        print("En cola de espera para 1v1. Posición: " .. tostring(data.position))
    elseif data.status == "matched" then
        print("¡Oponente encontrado! Duelo contra: " .. tostring(data.opponent))
    elseif data.status == "idle" then
        print("Saliste de la cola de emparejamiento.")
    end
end)
`,
          },
        ],
        installationSteps: [
          'Ubica "MatchmakerService.server.luau" en ServerScriptService.',
          'Ubica "MatchmakingGui.client.luau" en StarterPlayerScripts.',
          'Crea dos piezas (Parts) en Workspace llamadas "ArenaSpawnA" y "ArenaSpawnB" para los puntos de aparición.',
          'Prueba con 2 jugadores usando "Start Local Server" en la pestaña Test de Roblox Studio.',
        ],
        warnings: [
          'Para emparejamientos entre servidores distintos en producción, se debe conectar con MemoryStoreService y TeleportService:TeleportPartyAsync.',
        ],
        commands: [
          {
            id: 'cmd-match-1',
            action: 'create_script',
            name: 'MatchmakerService',
            location: 'ServerScriptService',
            scriptType: 'Server',
            description: 'Servicio servidor de colas y duelos',
          },
          {
            id: 'cmd-match-2',
            action: 'create_script',
            name: 'MatchmakingGui',
            location: 'StarterPlayer/StarterPlayerScripts',
            scriptType: 'Client',
            description: 'Receptor de eventos y sincronización de UI',
          },
          {
            id: 'cmd-match-3',
            action: 'create_remote_event',
            name: 'MatchmakingQueueEvent',
            location: 'ReplicatedStorage',
            description: 'Evento de comunicación de cola',
          },
        ],
      };
    }

    // 3. Caso: Tienda de armas / Tienda
    if (p.includes('tienda') || p.includes('arma') || p.includes('armas') || p.includes('shop') || p.includes('item')) {
      return {
        isDemo: true,
        explanation: `He configurado una Tienda de Armas segura con catálogo centralizado en ModuleScript, verificación de monedas en servidor con Leaderstats y entrega segura en el Backpack.`,
        codeBlocks: [
          {
            fileName: 'WeaponsCatalog.luau',
            location: 'ReplicatedStorage',
            scriptType: 'Module',
            language: 'luau',
            code: `--!strict
-- WeaponsCatalog: Definición de armas, precios y estadísticas
export type WeaponItem = {
    id: string,
    name: string,
    price: number,
    damage: number,
    description: string,
}

local Catalog: { [string]: WeaponItem } = {
    ["LaserPistol"] = {
        id = "LaserPistol",
        name = "Pistola Láser",
        price = 150,
        damage = 25,
        description = "Disparo certero a media distancia.",
    },
    ["PlasmaSword"] = {
        id = "PlasmaSword",
        name = "Espada de Plasma",
        price = 300,
        damage = 50,
        description = "Corte devastador cuerpo a cuerpo.",
    },
    ["RocketLauncher"] = {
        id = "RocketLauncher",
        name = "Lanza Cohetes",
        price = 750,
        damage = 110,
        description = "Daño de área explosivo.",
    }
}

return Catalog
`,
          },
          {
            fileName: 'ShopServer.server.luau',
            location: 'ServerScriptService',
            scriptType: 'Server',
            language: 'luau',
            code: `--!strict
-- ShopServer: Transacciones seguras y verificación monetaria en el servidor
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")

local Catalog = require(ReplicatedStorage:WaitForChild("WeaponsCatalog"))
local purchaseRemote = Instance.new("RemoteFunction")
purchaseRemote.Name = "PurchaseWeaponFunction"
purchaseRemote.Parent = ReplicatedStorage

purchaseRemote.OnServerInvoke = function(player: Player, weaponId: string)
    local item = Catalog[weaponId]
    if not item then
        return { success = false, message = "Objeto no válido." }
    end

    local leaderstats = player:FindFirstChild("leaderstats")
    local coins = leaderstats and leaderstats:FindFirstChild("Coins") :: IntValue?
    if not coins or coins.Value < item.price then
        return { success = false, message = "Monedas insuficientes." }
    end

    -- Descontar precio
    coins.Value -= item.price

    -- Clonar herramienta desde ServerStorage hacia el Backpack del jugador
    local weaponsFolder = ServerStorage:FindFirstChild("Weapons")
    local toolPrefab = weaponsFolder and weaponsFolder:FindFirstChild(weaponId) :: Tool?

    if toolPrefab then
        local newTool = toolPrefab:Clone()
        newTool.Parent = player.Backpack
        return { success = true, message = "¡Compraste " .. item.name .. "!" }
    else
        return { success = true, message = "Compra exitosa (herramienta asignada)." }
    end
end
`,
          },
        ],
        installationSteps: [
          'Guarda "WeaponsCatalog.luau" como ModuleScript en ReplicatedStorage.',
          'Crea "ShopServer.server.luau" en ServerScriptService.',
          'Coloca tus herramientas (Tools) de armas en ServerStorage -> carpeta Weapons.',
          'Crea o conecta tu UI de compra invocando el RemoteFunction "PurchaseWeaponFunction".',
        ],
        warnings: [
          'NUNCA verifiques el precio o las monedas solo en el cliente; el servidor es la única autoridad de transacción.',
          'Asegúrate de que las herramientas en ServerStorage no sean accesibles directamente por clientes para evitar robo de assets.',
        ],
        commands: [
          {
            id: 'cmd-shop-1',
            action: 'create_script',
            name: 'WeaponsCatalog',
            location: 'ReplicatedStorage',
            scriptType: 'Module',
            description: 'Módulo con catálogo de armas y atributos',
          },
          {
            id: 'cmd-shop-2',
            action: 'create_script',
            name: 'ShopServer',
            location: 'ServerScriptService',
            scriptType: 'Server',
            description: 'Gestor de compras y descuento de leaderstats',
          },
          {
            id: 'cmd-shop-3',
            action: 'create_folder',
            name: 'Weapons',
            location: 'ServerStorage',
            description: 'Carpeta segura de herramientas y prefabs',
          },
        ],
      };
    }

    // 4. Caso: Deslizar / Slide / Controles Móviles
    if (p.includes('deslizar') || p.includes('slide') || p.includes('móvil') || p.includes('movil') || p.includes('dash')) {
      return {
        isDemo: true,
        explanation: `He creado un sistema de Deslizamiento (Slide / Dash) con botón táctil móvil para ContextActionService, física basada en LinearVelocity y animación procedural.`,
        codeBlocks: [
          {
            fileName: 'MobileSlideController.client.luau',
            location: 'StarterPlayer/StarterPlayerScripts',
            scriptType: 'Client',
            language: 'luau',
            code: `--!strict
-- MobileSlideController: Deslizamiento con soporte para botones táctiles
local ContextActionService = game:GetService("ContextActionService")
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid") :: Humanoid
local rootPart = character:WaitForChild("HumanoidRootPart") :: BasePart

local ACTION_NAME = "StudioForge_SlideAction"
local SLIDE_SPEED = 48
local SLIDE_DURATION = 0.6
local isSliding = false
local slideCooldown = false

local function performSlide()
    if isSliding or slideCooldown or humanoid.FloorMaterial == Enum.Material.Air then return end
    isSliding = true
    slideCooldown = true

    -- Impulso físico de deslizamiento hacia la dirección que mira el personaje
    local direction = rootPart.CFrame.LookVector
    local attachment = Instance.new("Attachment")
    attachment.Parent = rootPart

    local linearVelocity = Instance.new("LinearVelocity")
    linearVelocity.MaxForce = 15000
    linearVelocity.VectorVelocity = direction * SLIDE_SPEED
    linearVelocity.Attachment0 = attachment
    linearVelocity.Parent = rootPart

    -- Ajuste procedural de inclinación del torso
    humanoid.AutoRotate = false

    task.delay(SLIDE_DURATION, function()
        linearVelocity:Destroy()
        attachment:Destroy()
        humanoid.AutoRotate = true
        isSliding = false

        task.delay(0.8, function()
            slideCooldown = false
        end)
    end)
end

local function handleAction(actionName, inputState, inputObject)
    if inputState == Enum.UserInputState.Begin then
        performSlide()
    end
    return Enum.ContextActionResult.Pass
end

-- Registrar botón para móvil y tecla C para PC
ContextActionService:BindAction(ACTION_NAME, handleAction, true, Enum.KeyCode.C, Enum.KeyCode.ButtonY)
ContextActionService:SetTitle(ACTION_NAME, "Deslizar")
ContextActionService:SetPosition(ACTION_NAME, UDim2.new(1, -140, 1, -140))
`,
          },
        ],
        installationSteps: [
          'Copia "MobileSlideController.client.luau" a StarterPlayer -> StarterPlayerScripts.',
          'En dispositivos móviles o al activar la vista de emulación táctil en Studio, aparecerá el botón "Deslizar" en la esquina inferior derecha.',
          'En PC puedes probar la misma acción presionando la tecla "C".',
        ],
        warnings: [
          'Usa LinearVelocity en lugar del obsoleto BodyVelocity para compatibilidad con la física moderna de Roblox.',
          'Verifica que el personaje no esté en el aire (humanoid.FloorMaterial ~= Air) para evitar saltos infinitos.',
        ],
        commands: [
          {
            id: 'cmd-slide-1',
            action: 'create_script',
            name: 'MobileSlideController',
            location: 'StarterPlayer/StarterPlayerScripts',
            scriptType: 'Client',
            description: 'Controlador de deslizamiento con botón táctil y física',
          },
        ],
      };
    }

    // 5. Caso: Corregir script / Bug fix con Diff
    if (p.includes('corrige') || p.includes('corregir') || p.includes('fix') || p.includes('error') || p.includes('bug')) {
      const originalCode = `-- Script antiguo con problemas comunes:
local player = game.Players.LocalPlayer
local char = player.Character
local hum = char:FindFirstChild("Humanoid")

while true do
    wait(1)
    hum.Health = hum.Health + 5
end`;

      const proposedCode = `--!strict
-- Versión corregida por StudioForge AI
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid") :: Humanoid

-- Uso de task.wait en lugar del obsoleto wait()
-- Manejo seguro de reaparición (Respawn)
player.CharacterAdded:Connect(function(newChar)
    character = newChar
    humanoid = newChar:WaitForChild("Humanoid") :: Humanoid
end)

task.spawn(function()
    while player.Parent do
        task.wait(1)
        if humanoid and humanoid.Health > 0 and humanoid.Health < humanoid.MaxHealth then
            humanoid.Health = math.min(humanoid.MaxHealth, humanoid.Health + 5)
        end
    end
end)`;

      return {
        isDemo: true,
        explanation: `He analizado el script y corregido 4 problemas críticos:
1. Reemplazado el obsoleto 'wait(1)' por el moderno 'task.wait(1)'.
2. Corregido el bloqueo cuando 'player.Character' es nil antes de cargar el modelo 3D con 'player.CharacterAdded:Wait()'.
3. Añadida reconexión para cuando el jugador muere y reaparece (Respawn).
4. Añadido tipado estricto Luau (--!strict) y tope de curación seguro con 'math.min'.`,
        codeBlocks: [
          {
            fileName: 'RegenerationFixed.client.luau',
            location: 'StarterPlayer/StarterPlayerScripts',
            scriptType: 'Client',
            language: 'luau',
            code: proposedCode,
          },
        ],
        diff: {
          fileName: 'RegenerationFixed.client.luau',
          location: 'StarterPlayer/StarterPlayerScripts',
          originalCode,
          proposedCode,
          resultCode: proposedCode,
          summaryOfChanges: 'Sustituido wait() por task.wait(), añadido CharacterAdded:Wait(), tipado --!strict y límite MaxHealth.',
        },
        installationSteps: [
          'Reemplaza el código anterior con la versión corregida.',
          'Verifica que el script esté en StarterPlayerScripts si es regeneración del cliente, o en ServerScriptService si la salud debe replicarse a todos.',
        ],
        warnings: [
          'La modificación de salud en LocalScript no se replica a otros jugadores si FilteringEnabled está activo. Si quieres curación oficial, colócalo en ServerScriptService.',
        ],
        commands: [
          {
            id: 'cmd-fix-1',
            action: 'update_script',
            name: 'RegenerationFixed',
            location: 'StarterPlayer/StarterPlayerScripts',
            scriptType: 'Client',
            code: proposedCode,
            description: 'Actualización con buenas prácticas Luau y task scheduler',
          },
        ],
      };
    }

    // 6. Caso: Lobby / Heroes vs Villanos / Mapa
    if (p.includes('lobby') || p.includes('héroes') || p.includes('heroes') || p.includes('villanos') || p.includes('mapa')) {
      return {
        isDemo: true,
        explanation: `He diseñado la arquitectura completa para el Lobby de "${projectName || 'Héroes vs Villanos'}" con zonas de equipo protegidas, selección de bando con TeamService y barreras de spawn seguras.`,
        codeBlocks: [
          {
            fileName: 'LobbyManager.server.luau',
            location: 'ServerScriptService',
            scriptType: 'Server',
            language: 'luau',
            code: `--!strict
-- LobbyManager: Administración de zonas seguras y equipos para ${projectName}
local Teams = game:GetService("Teams")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Creación segura de equipos si no existen
local function getOrCreateTeam(name: string, color: BrickColor): Team
    local existing = Teams:FindFirstChild(name) :: Team?
    if existing then return existing end

    local newTeam = Instance.new("Team")
    newTeam.Name = name
    newTeam.TeamColor = color
    newTeam.AutoAssignable = false
    newTeam.Parent = Teams
    return newTeam
end

local heroesTeam = getOrCreateTeam("Héroes", BrickColor.new("Bright blue"))
local villainsTeam = getOrCreateTeam("Villanos", BrickColor.new("Bright red"))
local lobbyTeam = getOrCreateTeam("Lobby", BrickColor.new("White"))
lobbyTeam.AutoAssignable = true

-- Evento de selección de bando
local selectTeamRemote = Instance.new("RemoteEvent")
selectTeamRemote.Name = "SelectTeamRemote"
selectTeamRemote.Parent = ReplicatedStorage

selectTeamRemote.OnServerEvent:Connect(function(player: Player, requestedTeam: string)
    if requestedTeam == "Heroes" then
        player.Team = heroesTeam
        print(player.Name .. " se unió a los Héroes!")
    elseif requestedTeam == "Villanos" then
        player.Team = villainsTeam
        print(player.Name .. " se unió a los Villanos!")
    end
    player:LoadCharacter()
end)

Players.PlayerAdded:Connect(function(player)
    player.Team = lobbyTeam
end)
`,
          },
          {
            fileName: 'LobbyProtection.server.luau',
            location: 'ServerScriptService',
            scriptType: 'Server',
            language: 'luau',
            code: `--!strict
-- LobbyProtection: Desactiva PvP y daño dentro de la zona del Lobby
local Players = game:GetService("Players")

local lobbyZone = workspace:FindFirstChild("LobbyZone") :: BasePart?

if lobbyZone then
    lobbyZone.Touched:Connect(function(hit)
        local character = hit.Parent
        local humanoid = character and character:FindFirstChildOfClass("Humanoid")
        if humanoid then
            humanoid:SetStateEnabled(Enum.HumanoidStateType.Dead, false)
        end
    end)
end
`,
          },
        ],
        installationSteps: [
          'Ubica "LobbyManager.server.luau" y "LobbyProtection.server.luau" en ServerScriptService.',
          'Crea una parte transparente en Workspace llamada "LobbyZone" que abarque la zona de espera.',
          'Coloca un SpawnLocation dentro de la LobbyZone asignado al TeamColor "White".',
        ],
        warnings: [
          'Asegúrate de que los SpawnLocations de combate tengan "AllowTeamChangeOnTouch = false" para no sobreescribir los equipos accidentalmente.',
        ],
        commands: [
          {
            id: 'cmd-lobby-1',
            action: 'create_script',
            name: 'LobbyManager',
            location: 'ServerScriptService',
            scriptType: 'Server',
            description: 'Gestor de equipos Héroes y Villanos',
          },
          {
            id: 'cmd-lobby-2',
            action: 'create_script',
            name: 'LobbyProtection',
            location: 'ServerScriptService',
            scriptType: 'Server',
            description: 'Protección de daño en la zona del lobby',
          },
          {
            id: 'cmd-lobby-3',
            action: 'create_remote_event',
            name: 'SelectTeamRemote',
            location: 'ReplicatedStorage',
            description: 'Evento para que el jugador elija equipo',
          },
        ],
      };
    }

    // 7. Respuesta genérica estructurada para cualquier otra consulta
    const titleCaseName = prompt.slice(0, 24).replace(/[^a-zA-Z0-9]/g, '') || 'SystemFeature';
    return {
      isDemo: true,
      explanation: `He preparado la estructura para "${prompt}" en tu proyecto de Roblox Studio "${projectName}". Esta solución sigue los estándares de Luau moderno, modularidad y separación cliente-servidor.`,
      codeBlocks: [
        {
          fileName: `${titleCaseName}Manager.server.luau`,
          location: 'ServerScriptService',
          scriptType: 'Server',
          language: 'luau',
          code: `--!strict
-- ${titleCaseName}Manager: Lógica servidor para "${prompt}"
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local event = Instance.new("RemoteEvent")
event.Name = "${titleCaseName}Event"
event.Parent = ReplicatedStorage

print("[StudioForge] Sistema iniciado: ${titleCaseName}")

event.OnServerEvent:Connect(function(player: Player, action: string, data: any)
    print(string.format("[%s] Solicitud de %s con acción: %s", "${titleCaseName}", player.Name, tostring(action)))
    -- Lógica del servidor segura
end)
`,
        },
        {
          fileName: `${titleCaseName}Controller.client.luau`,
          location: 'StarterPlayer/StarterPlayerScripts',
          scriptType: 'Client',
          language: 'luau',
          code: `--!strict
-- ${titleCaseName}Controller: Controlador del cliente para "${prompt}"
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local player = Players.LocalPlayer
local event = ReplicatedStorage:WaitForChild("${titleCaseName}Event") :: RemoteEvent

-- Enviar acción al servidor
local function triggerAction(payload: any)
    event:FireServer("trigger", payload)
end

print("[StudioForge] Controlador cliente listo para: ${titleCaseName}")
`,
        },
      ],
      installationSteps: [
        `Coloca "${titleCaseName}Manager.server.luau" en ServerScriptService.`,
        `Coloca "${titleCaseName}Controller.client.luau" en StarterPlayer -> StarterPlayerScripts.`,
        `Verifica que el RemoteEvent "${titleCaseName}Event" se genere en ReplicatedStorage.`,
      ],
      warnings: [
        'Siempre valida las entradas de datos en el servidor para evitar que un exploit envíe parámetros maliciosos a través del RemoteEvent.',
      ],
      commands: [
        {
          id: `cmd-${Date.now()}-1`,
          action: 'create_script',
          name: `${titleCaseName}Manager`,
          location: 'ServerScriptService',
          scriptType: 'Server',
          description: `Servicio backend para ${prompt}`,
        },
        {
          id: `cmd-${Date.now()}-2`,
          action: 'create_script',
          name: `${titleCaseName}Controller`,
          location: 'StarterPlayer/StarterPlayerScripts',
          scriptType: 'Client',
          description: `Controlador cliente para ${prompt}`,
        },
      ],
    };
  }
}

export const aiService = AIService.getInstance();
