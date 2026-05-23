import { SpeculosTestHelper } from './test-helper';
import { SpeculosClient } from './client';
import { SpeculosAutomation } from './automation';
import { ApduBridge } from './apdu-bridge';
import { validateSpeculosTestEnv } from './build-config';
import { SPECULOS_COMPOSE_FILE, SPECULOS_WS_BRIDGE_PORT } from './constants';
import { cleanupSpeculosEnvironment } from './cleanup';

export type SharedSpeculosContext = {
  helper: SpeculosTestHelper;
  client: SpeculosClient;
  automation: SpeculosAutomation;
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
  const automation = new SpeculosAutomation(client);

  const net = await import('net');
  const wsBridgePort = await findAvailablePort(net, SPECULOS_WS_BRIDGE_PORT);

  const apduBridge = new ApduBridge(client, wsBridgePort);
  await apduBridge.start();

  console.log(`[SharedSpeculos] Ready — bridge on :${wsBridgePort}`);

  return { helper, client, automation, apduBridge, wsBridgePort };
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

function findAvailablePort(
  net: typeof import('net'),
  startPort: number,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const { port } = server.address() as net.AddressInfo;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      findAvailablePort(net, startPort + 1)
        .then(resolve)
        .catch(reject);
    });
  });
}
