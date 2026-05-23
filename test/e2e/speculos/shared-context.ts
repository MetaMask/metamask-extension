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

  console.log(`[SharedSpeculos] Ready — bridge on :${wsBridgePort}`);

  return { helper, client, apduBridge, wsBridgePort };
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
