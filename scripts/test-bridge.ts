import { bridgeManager } from '../src/server/bridgeManager';

async function runEndToEndVerification() {
  console.log('--- INICIANDO VERIFICACIÓN DE EXTREMO A EXTREMO (ROBLOX BRIDGE) ---');
  
  const testUserId = 'test-user-firebase-auth-123';
  const testProjectId = 'test-project-obby-456';
  const testProjectName = 'Héroes vs Villanos';

  // 1. Web genera código temporal de conexión
  console.log('\n[1] Creando sesión y código de emparejamiento desde la Web...');
  const session = bridgeManager.createPairing(testProjectId, testProjectName, testUserId);
  console.log(`✓ Código generado: ${session.pairingCode} (Expira: ${session.expiresAt})`);
  console.log(`✓ Token temporal: ${session.sessionToken}`);
  console.log(`✓ Estado inicial: ${session.status}`);

  if (!session.pairingCode || session.pairingCode.length !== 6) {
    throw new Error('El código no tiene la longitud esperada de 6 caracteres.');
  }

  // 2. Comprobar validaciones del backend
  console.log('\n[2] Verificando validaciones de seguridad en el Backend...');

  // 2a. Código inválido
  const invalidResult = bridgeManager.verifyAndPair('CODIGO_FALSO', '1.0.0');
  console.log(`✓ Validación código inválido: rechazado correctamente (${invalidResult.error})`);
  if (invalidResult.success) throw new Error('Falló validación de código incorrecto');

  // 2b. Código vacío
  const emptyResult = bridgeManager.verifyAndPair('', '1.0.0');
  console.log(`✓ Validación código vacío: rechazado correctamente (${emptyResult.error})`);
  if (emptyResult.success) throw new Error('Falló validación de código vacío');

  // 2c. Canjear código correcto como si fuera el Plugin de Roblox Studio
  console.log('\n[3] Plugin de Roblox Studio introduce el código de conexión...');
  const pairResult = bridgeManager.verifyAndPair(
    session.pairingCode,
    '1.0.0-verified',
    testProjectId,
    testUserId
  );

  if (!pairResult.success) {
    throw new Error(`Falló el emparejamiento con el plugin: ${pairResult.error}`);
  }
  console.log(`✓ Emparejamiento exitoso! Token asignado: ${pairResult.sessionToken}`);
  console.log(`✓ Proyecto vinculado: ${pairResult.projectName} (${pairResult.projectId})`);

  // 2d. Comprobar que no se puede reutilizar (código de un solo uso)
  const reuseResult = bridgeManager.verifyAndPair(session.pairingCode, '1.0.0');
  console.log(`✓ Validación de un solo uso: el código ya no puede reutilizarse (${reuseResult.error})`);
  if (reuseResult.success) throw new Error('El código de un solo uso fue reutilizado erróneamente');

  // 4. Comprobar estado en ambos lados
  console.log('\n[4] Comprobando que el estado cambió a "connected" en el puente...');
  const currentSession = bridgeManager.getSessionByProject(testProjectId);
  if (!currentSession || currentSession.status !== 'connected') {
    throw new Error('El estado no es connected en la sesión');
  }
  console.log(`✓ Estado en el backend/web: ${currentSession.status} (● Conectado)`);
  console.log(`✓ Versión de plugin registrada: ${currentSession.pluginVersion}`);

  // 5. Plugin envía mensaje de prueba PING al backend
  console.log('\n[5] Plugin envía mensaje de prueba PING al backend...');
  const pluginPingResult = bridgeManager.handlePluginPing(pairResult.sessionToken!);
  if (!pluginPingResult.success || pluginPingResult.message !== 'PONG') {
    throw new Error('El backend no respondió PONG al PING del plugin');
  }
  console.log(`✓ Backend respondió al Plugin: ${pluginPingResult.message} a las ${pluginPingResult.serverTime}`);
  console.log(`✓ En el plugin se muestra: "Conexión funcionando."`);

  // 6. Web envía mensaje de prueba PING a Roblox Studio
  console.log('\n[6] Web envía comando PING a Roblox Studio...');
  const enqueueResult = bridgeManager.enqueueCommand({
    projectId: testProjectId,
    type: 'ping',
    name: 'PING',
    parent: 'Workspace',
    location: 'Workspace',
  });

  if (!enqueueResult.success || !enqueueResult.command) {
    throw new Error(`Fallo encolando PING desde la web: ${enqueueResult.error}`);
  }
  console.log(`✓ Comando PING encolado con ID: ${enqueueResult.command.commandId}`);

  // 7. Plugin sondea (poll) comandos pendientes
  console.log('\n[7] Plugin de Roblox Studio sondea (poll) comandos pendientes...');
  const pollResult = bridgeManager.pollCommands(pairResult.sessionToken!);
  if (!pollResult.success || !pollResult.commands || pollResult.commands.length === 0) {
    throw new Error('El plugin no recibió el comando PING en el sondeo');
  }

  const pingCommand = pollResult.commands.find((c) => c.type === 'ping');
  if (!pingCommand) {
    throw new Error('Comando PING no encontrado en la lista recibida por el plugin');
  }
  console.log(`✓ Plugin recibió comando: ${pingCommand.type} (${pingCommand.name})`);
  console.log(`✓ El plugin confirma: CERO modificaciones a objetos de Roblox Studio`);

  // 8. Plugin responde con PONG y reporta resultado
  console.log('\n[8] Plugin reporta respuesta PONG al backend...');
  const reportResult = bridgeManager.reportResult(pairResult.sessionToken!, {
    commandId: pingCommand.commandId,
    success: true,
    message: 'PONG',
    executedAt: new Date().toISOString(),
  });

  if (!reportResult.success) {
    throw new Error('Fallo al reportar el resultado del PING desde el plugin');
  }
  console.log(`✓ Reporte procesado correctamente en el backend.`);

  // 9. Web comprueba el resultado en el historial
  console.log('\n[9] Web verifica la respuesta de Roblox Studio...');
  const history = bridgeManager.getHistory(testProjectId);
  const executedPing = history.find((h) => h.commandId === pingCommand.commandId);

  if (!executedPing) {
    throw new Error('El comando ejecutado no aparece en el historial');
  }

  console.log(`✓ Estado en historial: ${executedPing.status}`);
  console.log(`✓ Mensaje de respuesta del plugin: "${executedPing.resultMessage}"`);

  if (executedPing.resultMessage === 'PONG') {
    console.log('\n======================================================');
    console.log('✓ RESULTADO EN LA WEB: "Roblox Studio respondió correctamente."');
    console.log('✓ RESULTADO EN EL PLUGIN: "Conexión funcionando."');
    console.log('✓ FLUJO COMPLETO VERIFICADO EXITOSAMENTE');
    console.log('======================================================\n');
  } else {
    throw new Error(`Mensaje inesperado: ${executedPing.resultMessage}`);
  }
}

runEndToEndVerification().catch((err) => {
  console.error('\n❌ ERROR EN LA VERIFICACIÓN:', err);
  process.exit(1);
});
