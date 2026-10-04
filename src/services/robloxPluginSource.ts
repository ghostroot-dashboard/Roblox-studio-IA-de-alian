/**
 * Generador del código fuente en Luau para el Plugin de Roblox Studio.
 * Este script es 100% compatible con la API de Plugins de Roblox Studio.
 */
export function generateRobloxPluginLuauCode(defaultServerUrl: string, samplePairingCode: string = 'ABC123'): string {
  return `--!strict
--[[
    ====================================================================
    ROBLOX AI BRIDGE - PLUGIN OFICIAL PARA ROBLOX STUDIO
    ====================================================================
    Canal Seguro: WEB (StudioForge AI) -> BACKEND -> PLUGIN -> JUEGO
    
    Instrucciones de Instalación:
    1. En Roblox Studio, abre la ventana "Game Settings" -> "Security" y activa:
       "Allow HTTP Requests" (HttpService.HttpEnabled = true).
    2. Guarda este archivo en tu carpeta de Plugins locales de Roblox:
       - Windows: %localappdata%\\Roblox\\Plugins\\StudioForgeBridge.server.luau
       - Mac: ~/Library/Application Support/Roblox/Plugins/StudioForgeBridge.server.luau
       O en la barra de menú: Model -> Plugins -> Guardar como Plugin Local (.rbxmx / .luau).
    3. Introduce el código de conexión generado en la web de StudioForge AI.
]]

local HttpService = game:GetService("HttpService")
local ChangeHistoryService = game:GetService("ChangeHistoryService")

-- CONFIGURACIÓN DE CONEXIÓN AL BACKEND
local DEFAULT_SERVER_URL = "${defaultServerUrl}"
local POLL_INTERVAL = 2.5 -- segundos entre consultas

-- ESTADO DEL PLUGIN
local isConnected = false
local sessionToken: string? = nil
local activeProjectId: string? = nil
local activeProjectName: string? = nil
local serverUrl = DEFAULT_SERVER_URL
local pollingThread: thread? = nil
local commandHistoryList = {}

-- CREAR BARRA DE HERRAMIENTAS Y BOTÓN EN STUDIO
local toolbar = plugin:CreateToolbar("StudioForge AI")
local toggleButton = toolbar:CreateButton(
    "Bridge",
    "Abrir panel de conexión con StudioForge AI",
    "rbxassetid://10709772559"
)

-- CREAR DOCK WIDGET GUI (VENTANA ACOPLABLE EN STUDIO)
local widgetInfo = DockWidgetPluginGuiInfo.new(
    Enum.InitialDockState.Right,
    false, -- inicialmente visible
    false, -- override previous state
    320,   -- ancho inicial
    460,   -- alto inicial
    260,   -- ancho mínimo
    320    -- alto mínimo
)

local dockWidget = plugin:CreateDockWidgetPluginGui("StudioForgeBridgeWidget", widgetInfo)
dockWidget.Title = "ROBLOX AI BRIDGE"

-- CONSTRUCCIÓN DE LA INTERFAZ DENTRO DEL WIDGET
local mainFrame = Instance.new("Frame")
mainFrame.Size = UDim2.new(1, 0, 1, 0)
mainFrame.BackgroundColor3 = Color3.fromRGB(24, 28, 36)
mainFrame.BorderSizePixel = 0
mainFrame.Parent = dockWidget

local padding = Instance.new("UIPadding")
padding.PaddingTop = UDim.new(0, 12)
padding.PaddingBottom = UDim.new(0, 12)
padding.PaddingLeft = UDim.new(0, 12)
padding.PaddingRight = UDim.new(0, 12)
padding.Parent = mainFrame

local listLayout = Instance.new("UIListLayout")
listLayout.SortOrder = Enum.SortOrder.LayoutOrder
listLayout.Padding = UDim.new(0, 10)
listLayout.Parent = mainFrame

-- TÍTULO
local titleLabel = Instance.new("TextLabel")
titleLabel.Text = "ROBLOX AI BRIDGE"
titleLabel.Font = Enum.Font.GothamBold
titleLabel.TextSize = 15
titleLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
titleLabel.Size = UDim2.new(1, 0, 0, 20)
titleLabel.BackgroundTransparency = 1
titleLabel.TextXAlignment = Enum.TextXAlignment.Left
titleLabel.LayoutOrder = 1
titleLabel.Parent = mainFrame

-- SECCIÓN DE ESTADO
local statusCard = Instance.new("Frame")
statusCard.Size = UDim2.new(1, 0, 0, 56)
statusCard.BackgroundColor3 = Color3.fromRGB(16, 19, 26)
statusCard.BorderSizePixel = 0
statusCard.LayoutOrder = 2
statusCard.Parent = mainFrame

local statusCorner = Instance.new("UICorner")
statusCorner.CornerRadius = UDim.new(0, 8)
statusCorner.Parent = statusCard

local statusLabelTitle = Instance.new("TextLabel")
statusLabelTitle.Text = "Estado:"
statusLabelTitle.Font = Enum.Font.GothamMedium
statusLabelTitle.TextSize = 11
statusLabelTitle.TextColor3 = Color3.fromRGB(140, 150, 165)
statusLabelTitle.Position = UDim2.new(0, 12, 0, 8)
statusLabelTitle.Size = UDim2.new(0, 60, 0, 16)
statusLabelTitle.BackgroundTransparency = 1
statusLabelTitle.TextXAlignment = Enum.TextXAlignment.Left
statusLabelTitle.Parent = statusCard

local statusValueLabel = Instance.new("TextLabel")
statusValueLabel.Text = "● Desconectado"
statusValueLabel.Font = Enum.Font.GothamBold
statusValueLabel.TextSize = 13
statusValueLabel.TextColor3 = Color3.fromRGB(240, 75, 75)
statusValueLabel.Position = UDim2.new(0, 12, 0, 28)
statusValueLabel.Size = UDim2.new(1, -24, 0, 20)
statusValueLabel.BackgroundTransparency = 1
statusValueLabel.TextXAlignment = Enum.TextXAlignment.Left
statusValueLabel.Parent = statusCard

-- PROYECTO ASOCIADO
local projectInfoLabel = Instance.new("TextLabel")
projectInfoLabel.Text = "Proyecto: Ninguno"
projectInfoLabel.Font = Enum.Font.GothamMedium
projectInfoLabel.TextSize = 11
projectInfoLabel.TextColor3 = Color3.fromRGB(180, 190, 205)
projectInfoLabel.Size = UDim2.new(1, 0, 0, 16)
projectInfoLabel.BackgroundTransparency = 1
projectInfoLabel.TextXAlignment = Enum.TextXAlignment.Left
projectInfoLabel.LayoutOrder = 3
projectInfoLabel.Visible = false
projectInfoLabel.Parent = mainFrame

-- SECCIÓN DE ENTRADA DE CÓDIGO
local connectSection = Instance.new("Frame")
connectSection.Size = UDim2.new(1, 0, 0, 95)
connectSection.BackgroundTransparency = 1
connectSection.LayoutOrder = 4
connectSection.Parent = mainFrame

local codeLabel = Instance.new("TextLabel")
codeLabel.Text = "Código de emparejamiento:"
codeLabel.Font = Enum.Font.GothamMedium
codeLabel.TextSize = 11
codeLabel.TextColor3 = Color3.fromRGB(180, 190, 205)
codeLabel.Size = UDim2.new(1, 0, 0, 16)
codeLabel.BackgroundTransparency = 1
codeLabel.TextXAlignment = Enum.TextXAlignment.Left
codeLabel.Parent = connectSection

local codeTextBox = Instance.new("TextBox")
codeTextBox.Text = "${samplePairingCode}"
codeTextBox.PlaceholderText = "ej. ABC123"
codeTextBox.Font = Enum.Font.GothamBold
codeTextBox.TextSize = 14
codeTextBox.TextColor3 = Color3.fromRGB(255, 255, 255)
codeTextBox.BackgroundColor3 = Color3.fromRGB(32, 38, 50)
codeTextBox.Position = UDim2.new(0, 0, 0, 20)
codeTextBox.Size = UDim2.new(1, 0, 0, 34)
codeTextBox.BorderSizePixel = 0
codeTextBox.ClearTextOnFocus = false
codeTextBox.Parent = connectSection

local codeCorner = Instance.new("UICorner")
codeCorner.CornerRadius = UDim.new(0, 6)
codeCorner.Parent = codeTextBox

local connectButton = Instance.new("TextButton")
connectButton.Text = "Conectar"
connectButton.Font = Enum.Font.GothamBold
connectButton.TextSize = 12
connectButton.TextColor3 = Color3.fromRGB(255, 255, 255)
connectButton.BackgroundColor3 = Color3.fromRGB(35, 110, 230)
connectButton.Position = UDim2.new(0, 0, 0, 60)
connectButton.Size = UDim2.new(1, 0, 0, 32)
connectButton.BorderSizePixel = 0
connectButton.Parent = connectSection

local connectCorner = Instance.new("UICorner")
connectCorner.CornerRadius = UDim.new(0, 6)
connectCorner.Parent = connectButton

-- BOTÓN PROBAR PING AL BACKEND
local pingBackendButton = Instance.new("TextButton")
pingBackendButton.Text = "Probar Conexión (Ping)"
pingBackendButton.Font = Enum.Font.GothamBold
pingBackendButton.TextSize = 12
pingBackendButton.TextColor3 = Color3.fromRGB(255, 255, 255)
pingBackendButton.BackgroundColor3 = Color3.fromRGB(40, 140, 75)
pingBackendButton.Size = UDim2.new(1, 0, 0, 30)
pingBackendButton.BorderSizePixel = 0
pingBackendButton.Visible = false
pingBackendButton.LayoutOrder = 5
pingBackendButton.Parent = mainFrame

local pingCorner = Instance.new("UICorner")
pingCorner.CornerRadius = UDim.new(0, 6)
pingCorner.Parent = pingBackendButton

-- BOTÓN DESCONECTAR
local disconnectButton = Instance.new("TextButton")
disconnectButton.Text = "Desconectar"
disconnectButton.Font = Enum.Font.GothamBold
disconnectButton.TextSize = 12
disconnectButton.TextColor3 = Color3.fromRGB(255, 255, 255)
disconnectButton.BackgroundColor3 = Color3.fromRGB(180, 45, 45)
disconnectButton.Size = UDim2.new(1, 0, 0, 30)
disconnectButton.BorderSizePixel = 0
disconnectButton.Visible = false
disconnectButton.LayoutOrder = 6
disconnectButton.Parent = mainFrame

local discCorner = Instance.new("UICorner")
discCorner.CornerRadius = UDim.new(0, 6)
discCorner.Parent = disconnectButton

-- MENSAJE DE ERROR O INFORMACIÓN
local messageLabel = Instance.new("TextLabel")
messageLabel.Text = ""
messageLabel.Font = Enum.Font.GothamMedium
messageLabel.TextSize = 11
messageLabel.TextColor3 = Color3.fromRGB(255, 175, 80)
messageLabel.Size = UDim2.new(1, 0, 0, 26)
messageLabel.BackgroundTransparency = 1
messageLabel.TextWrapped = true
messageLabel.LayoutOrder = 6
messageLabel.Parent = mainFrame

-- SECCIÓN HISTORIAL DE COMANDOS
local historyTitle = Instance.new("TextLabel")
historyTitle.Text = "Últimos comandos:"
historyTitle.Font = Enum.Font.GothamBold
historyTitle.TextSize = 12
historyTitle.TextColor3 = Color3.fromRGB(200, 210, 225)
historyTitle.Size = UDim2.new(1, 0, 0, 18)
historyTitle.BackgroundTransparency = 1
historyTitle.TextXAlignment = Enum.TextXAlignment.Left
historyTitle.LayoutOrder = 7
historyTitle.Parent = mainFrame

local historyScroll = Instance.new("ScrollingFrame")
historyScroll.Size = UDim2.new(1, 0, 1, -290)
historyScroll.BackgroundColor3 = Color3.fromRGB(16, 19, 26)
historyScroll.BorderSizePixel = 0
historyScroll.CanvasSize = UDim2.new(0, 0, 0, 0)
historyScroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
historyScroll.ScrollBarThickness = 4
historyScroll.LayoutOrder = 8
historyScroll.Parent = mainFrame

local scrollCorner = Instance.new("UICorner")
scrollCorner.CornerRadius = UDim.new(0, 6)
scrollCorner.Parent = historyScroll

local scrollLayout = Instance.new("UIListLayout")
scrollLayout.SortOrder = Enum.SortOrder.LayoutOrder
scrollLayout.Padding = UDim.new(0, 4)
scrollLayout.Parent = historyScroll

local scrollPadding = Instance.new("UIPadding")
scrollPadding.PaddingTop = UDim.new(0, 6)
scrollPadding.PaddingLeft = UDim.new(0, 6)
scrollPadding.PaddingRight = UDim.new(0, 6)
scrollPadding.Parent = historyScroll

-- FUNCIONES AUXILIARES DE RESOLUCIÓN DE JERARQUÍA EN ROBLOX STUDIO
local function resolveParent(locationPath: string?): (boolean, Instance?, string?)
    local path = locationPath or "Workspace"
    local segments = string.split(path, "/")
    local current: Instance? = game

    for _, segment in ipairs(segments) do
        if current then
            local nextChild = current:FindFirstChild(segment)
            if not nextChild then
                -- Si es una carpeta faltante en Workspace o ReplicatedStorage, no crearla a ciegas
                return false, nil, "No se encontró el contenedor: " .. segment .. " en ruta: " .. path
            end
            current = nextChild
        end
    end

    return true, current, nil
end

-- EJECUTOR DE COMANDOS PERMITIDOS (SIN loadstring NI CÓDIGO ARBITRARIO)
local function executePermittedCommand(cmd): (boolean, string)
    local cmdType = cmd.type
    local name = cmd.name or "PING"
    local locationPath = cmd.parent or cmd.location or "Workspace"

    -- 0. PRUEBA DE CONEXIÓN PING / PONG (No crea ni altera objetos en Roblox Studio)
    if cmdType == "ping" then
        messageLabel.Text = "Conexión funcionando."
        messageLabel.TextColor3 = Color3.fromRGB(75, 230, 120)
        return true, "PONG"
    end

    -- Validar contenedor
    local found, parentInstance, errLoc = resolveParent(locationPath)
    if not found or not parentInstance then
        return false, errLoc or "Ubicación destino inválida"
    end

    ChangeHistoryService:SetWaypoint("StudioForge AI: " .. tostring(cmdType) .. " " .. tostring(name))

    -- 1. CREATE_PART
    if cmdType == "create_part" then
        local part = Instance.new("Part")
        part.Name = name
        local props = cmd.properties or {}

        if props.Anchored ~= nil then part.Anchored = props.Anchored else part.Anchored = true end
        if props.CanCollide ~= nil then part.CanCollide = props.CanCollide end
        if props.Transparency ~= nil then part.Transparency = props.Transparency end

        if props.Size and typeof(props.Size) == "table" and #props.Size >= 3 then
            part.Size = Vector3.new(props.Size[1], props.Size[2], props.Size[3])
        end

        if props.Position and typeof(props.Position) == "table" and #props.Position >= 3 then
            part.Position = Vector3.new(props.Position[1], props.Position[2], props.Position[3])
        end

        if props.Color and typeof(props.Color) == "table" and #props.Color >= 3 then
            part.Color = Color3.fromRGB(props.Color[1], props.Color[2], props.Color[3])
        end

        part.Parent = parentInstance
        return true, "Part '" .. name .. "' creado correctamente en " .. locationPath

    -- 2. CREATE_FOLDER
    elseif cmdType == "create_folder" then
        local folder = Instance.new("Folder")
        folder.Name = name
        folder.Parent = parentInstance
        return true, "Folder '" .. name .. "' creado en " .. locationPath

    -- 3. CREATE_SCRIPT
    elseif cmdType == "create_script" then
        local scriptType = cmd.scriptType or "Server"
        local scriptInstance: LuaSourceContainer

        if scriptType == "Client" then
            scriptInstance = Instance.new("LocalScript")
        elseif scriptType == "Module" then
            scriptInstance = Instance.new("ModuleScript")
        else
            scriptInstance = Instance.new("Script")
        end

        scriptInstance.Name = name
        scriptInstance.Source = cmd.code or "-- StudioForge Generated Script"
        scriptInstance.Parent = parentInstance
        return true, scriptType .. "Script '" .. name .. "' creado en " .. locationPath

    -- 4. UPDATE_SCRIPT
    elseif cmdType == "update_script" then
        local existing = parentInstance:FindFirstChild(name)
        if not existing or not existing:IsA("LuaSourceContainer") then
            return false, "No se encontró el script '" .. name .. "' en " .. locationPath
        end
        (existing :: LuaSourceContainer).Source = cmd.code or ""
        return true, "Script '" .. name .. "' actualizado correctamente"

    -- 5. CREATE_REMOTE_EVENT
    elseif cmdType == "create_remote_event" then
        local remote = Instance.new("RemoteEvent")
        remote.Name = name
        remote.Parent = parentInstance
        return true, "RemoteEvent '" .. name .. "' creado en " .. locationPath

    -- 6. CREATE_REMOTE_FUNCTION
    elseif cmdType == "create_remote_function" then
        local func = Instance.new("RemoteFunction")
        func.Name = name
        func.Parent = parentInstance
        return true, "RemoteFunction '" .. name .. "' creado en " .. locationPath

    -- 7. RENAME_OBJECT
    elseif cmdType == "rename_object" then
        local existing = parentInstance:FindFirstChild(name)
        if not existing then
            return false, "Objeto a renombrar no encontrado: " .. name
        end
        local newName = cmd.newName or (name .. "_Renamed")
        existing.Name = newName
        return true, "Objeto '" .. name .. "' renombrado a '" .. newName .. "'"

    -- 8. DELETE_OBJECT
    elseif cmdType == "delete_object" then
        local target = parentInstance:FindFirstChild(name)
        if not target then
            return false, "Objeto a eliminar no encontrado: " .. name
        end
        target:Destroy()
        return true, "Objeto '" .. name .. "' eliminado de " .. locationPath
    end

    return false, "Tipo de comando no permitido o no implementado: " .. tostring(cmdType)
end

-- ACTUALIZAR HISTORIAL EN LA INTERFAZ DEL WIDGET
local function addHistoryEntry(success: boolean, text: string)
    local item = Instance.new("TextLabel")
    item.Size = UDim2.new(1, 0, 0, 20)
    item.BackgroundTransparency = 1
    item.Font = Enum.Font.GothamMedium
    item.TextSize = 11
    item.TextXAlignment = Enum.TextXAlignment.Left

    if success then
        item.Text = "✓ " .. text
        item.TextColor3 = Color3.fromRGB(100, 230, 140)
    else
        item.Text = "✗ " .. text
        item.TextColor3 = Color3.fromRGB(250, 100, 100)
    end

    item.Parent = historyScroll
end

-- BUCLE DE SONDEO (POLLING) CON EL BACKEND
local function startPolling()
    if pollingThread then
        task.cancel(pollingThread)
    end

    pollingThread = task.spawn(function()
        while isConnected and sessionToken do
            local pollUrl = serverUrl .. "/api/bridge/poll"
            local requestData = {
                sessionToken = sessionToken
            }

            local success, response = pcall(function()
                return HttpService:RequestAsync({
                    Url = pollUrl,
                    Method = "POST",
                    Headers = {
                        ["Content-Type"] = "application/json"
                    },
                    Body = HttpService:JSONEncode(requestData)
                })
            end)

            if success and response.Success then
                local bodySuccess, data = pcall(function()
                    return HttpService:JSONDecode(response.Body)
                end)

                if bodySuccess and data.success and data.commands then
                    for _, cmd in ipairs(data.commands) do
                        local execSuccess, execMsg = executePermittedCommand(cmd)
                        addHistoryEntry(execSuccess, (cmd.type or "cmd") .. ": " .. (cmd.name or ""))

                        -- Reportar resultado al backend
                        task.spawn(function()
                            local resultUrl = serverUrl .. "/api/bridge/result"
                            pcall(function()
                                HttpService:RequestAsync({
                                    Url = resultUrl,
                                    Method = "POST",
                                    Headers = { ["Content-Type"] = "application/json" },
                                    Body = HttpService:JSONEncode({
                                        sessionToken = sessionToken,
                                        commandId = cmd.commandId,
                                        success = execSuccess,
                                        message = if execSuccess then execMsg else nil,
                                        error = if not execSuccess then execMsg else nil
                                    })
                                })
                            end)
                        end)
                    end
                end
            else
                -- Si falla HTTP por no estar habilitado
                if response and string.find(tostring(response), "Http requests are not enabled") then
                    messageLabel.Text = "Error: Habilita 'Allow HTTP Requests' en Game Settings > Security."
                end
            end

            task.wait(POLL_INTERVAL)
        end
    end)
end

-- CONECTAR
connectButton.MouseButton1Click:Connect(function()
    local code = string.gsub(codeTextBox.Text, "%s+", ""):upper()
    if #code == 0 then
        messageLabel.Text = "Por favor ingresa un código válido."
        return
    end

    messageLabel.Text = "Verificando con StudioForge AI..."
    statusValueLabel.Text = "● Verificando..."
    statusValueLabel.TextColor3 = Color3.fromRGB(240, 190, 60)

    local pairUrl = serverUrl .. "/api/bridge/pair"
    local payload = {
        pairingCode = code,
        pluginVersion = "1.0.0"
    }

    task.spawn(function()
        local success, response = pcall(function()
            return HttpService:RequestAsync({
                Url = pairUrl,
                Method = "POST",
                Headers = { ["Content-Type"] = "application/json" },
                Body = HttpService:JSONEncode(payload)
            })
        end)

        if not success then
            statusValueLabel.Text = "● Desconectado"
            statusValueLabel.TextColor3 = Color3.fromRGB(240, 75, 75)
            messageLabel.Text = "No se pudo contactar al backend. Verifica tu conexión y que HttpService esté activo."
            return
        end

        local parseOk, data = pcall(function()
            return HttpService:JSONDecode(response.Body)
        end)

        if parseOk and data.success then
            isConnected = true
            sessionToken = data.sessionToken
            activeProjectId = data.projectId
            activeProjectName = data.projectName

            statusValueLabel.Text = "● Conectado"
            statusValueLabel.TextColor3 = Color3.fromRGB(75, 230, 120)
            projectInfoLabel.Text = "Proyecto: " .. (data.projectName or "Activo")
            projectInfoLabel.Visible = true

            connectSection.Visible = false
            pingBackendButton.Visible = true
            disconnectButton.Visible = true
            messageLabel.Text = "Conexión funcionando."
            messageLabel.TextColor3 = Color3.fromRGB(75, 230, 120)
            addHistoryEntry(true, "Enlace establecido con " .. (data.projectName or "Proyecto"))

            startPolling()
        else
            statusValueLabel.Text = "● Desconectado"
            statusValueLabel.TextColor3 = Color3.fromRGB(240, 75, 75)
            messageLabel.Text = data.error or "Error de emparejamiento. Verifica el código."
        end
    end)
end)

-- PROBAR PING AL BACKEND DESDE EL PLUGIN
pingBackendButton.MouseButton1Click:Connect(function()
    if not isConnected or not sessionToken then
        messageLabel.Text = "Debes conectar el plugin primero."
        return
    end

    messageLabel.Text = "Enviando PING al backend..."
    messageLabel.TextColor3 = Color3.fromRGB(240, 190, 60)

    task.spawn(function()
        local success, response = pcall(function()
            return HttpService:RequestAsync({
                Url = serverUrl .. "/api/bridge/plugin-ping",
                Method = "POST",
                Headers = { ["Content-Type"] = "application/json" },
                Body = HttpService:JSONEncode({ sessionToken = sessionToken })
            })
        end)

        if success and response.Success then
            local parseOk, resData = pcall(function()
                return HttpService:JSONDecode(response.Body)
            end)

            if parseOk and resData.success and resData.message == "PONG" then
                messageLabel.Text = "Conexión funcionando."
                messageLabel.TextColor3 = Color3.fromRGB(75, 230, 120)
                addHistoryEntry(true, "PING enviado -> PONG recibido")
                print("[StudioForge AI] PONG recibido del backend. Conexión funcionando.")
            else
                messageLabel.Text = "Respuesta no esperada del backend."
                messageLabel.TextColor3 = Color3.fromRGB(250, 100, 100)
            end
        else
            messageLabel.Text = "Error al contactar al backend."
            messageLabel.TextColor3 = Color3.fromRGB(250, 100, 100)
        end
    end)
end)

-- DESCONECTAR
disconnectButton.MouseButton1Click:Connect(function()
    isConnected = false
    if pollingThread then
        task.cancel(pollingThread)
        pollingThread = nil
    end

    -- Notificar al backend
    if activeProjectId then
        pcall(function()
            HttpService:RequestAsync({
                Url = serverUrl .. "/api/bridge/disconnect",
                Method = "POST",
                Headers = { ["Content-Type"] = "application/json" },
                Body = HttpService:JSONEncode({ projectId = activeProjectId })
            })
        end)
    end

    sessionToken = nil
    activeProjectId = nil
    activeProjectName = nil

    statusValueLabel.Text = "● Desconectado"
    statusValueLabel.TextColor3 = Color3.fromRGB(240, 75, 75)
    projectInfoLabel.Visible = false
    connectSection.Visible = true
    pingBackendButton.Visible = false
    disconnectButton.Visible = false
    messageLabel.Text = "Desconectado de StudioForge AI."
    addHistoryEntry(false, "Desconexión manual efectuada")
end)

-- BOTÓN DE BARRA DE HERRAMIENTAS
toggleButton.Click:Connect(function()
    dockWidget.Enabled = not dockWidget.Enabled
end)

print("[StudioForge AI] Plugin inicializado correctamente.")
`;
}
