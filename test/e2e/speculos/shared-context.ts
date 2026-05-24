import { SpeculosTestHelper } from './test-helper';
import { SpeculosClient } from './client';
import { ApduBridge } from './apdu-bridge';
import { validateSpeculosTestEnv } from './build-config';
import { SPECULOS_COMPOSE_FILE, SPECULOS_WS_BRIDGE_PORT } from './constants';
import { cleanupSpeculosEnvironment } from './cleanup';

export type SharedSpeculosContext = {
  helper: SpeculosTestHelper;
  client: SpeculosClient;
  apduBridge: ApduBridge;
  wsBridgePort: number;
};

let registeredSignalHandlers = false;

export async function startSharedSpeculos(
  options: {
    composeFile?: string;
    apduPort?: number;
    apiPort?: number;
  } = {},
): Promise<SharedSpeculosContext> {
  validateSpeculosTestEnv();

  const { composeFile = SPECULOS_COMPOSE_FILE, apduPort, apiPort } = options;

  const helper = new SpeculosTestHelper({ composeFile, apduPort, apiPort });
  await helper.start();

  const client = helper.getClient();

  const wsBridgePort = SPECULOS_WS_BRIDGE_PORT;
  const apduBridge = new ApduBridge(client, wsBridgePort);
  await apduBridge.start();

  const ctx: SharedSpeculosContext = {
    helper,
    client,
    apduBridge,
    wsBridgePort,
  };

  if (!registeredSignalHandlers) {
    registeredSignalHandlers = true;
    const cleanup = async () => {
      console.log('[SharedSpeculos] Signal received, cleaning up...');
      await stopSharedSpeculos(ctx);
      process.exit(1);
    };
    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
  }

  console.log(`[SharedSpeculos] Ready — bridge on :${wsBridgePort}`);

  return ctx;
}

export async function stopSharedSpeculos(
  ctx: SharedSpeculosContext,
): Promise<void> {
  try {
    await ctx.apduBridge.stop();
  } catch {
    // may already be stopped
  }
  try {
    await ctx.helper.stop();
  } catch {
    // may already be stopped
  }
  await cleanupSpeculosEnvironment();
  console.log('[SharedSpeculos] Stopped');
}
