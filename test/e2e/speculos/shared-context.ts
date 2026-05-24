import { SpeculosTestHelper } from './test-helper';
import { SpeculosClient } from './client';
import { ApduBridge } from './apdu-bridge';
import { validateSpeculosTestEnv } from './build-config';
import {
  SPECULOS_COMPOSE_FILE,
  DEFAULT_DEVICE,
  type DeviceConfig,
  getDeviceModel,
  type DeviceModel,
  ensureDeviceEnv,
} from './constants';
import { createDeviceInteraction, type DeviceInteraction } from './device-interaction';
import { cleanupSpeculosEnvironment } from './cleanup';

export type SharedSpeculosContext = {
  helper: SpeculosTestHelper;
  client: SpeculosClient;
  apduBridge: ApduBridge;
  wsBridgePort: number;
  device: DeviceConfig;
  interaction: DeviceInteraction;
  deviceModel: DeviceModel;
};

let registeredSignalHandlers = false;

export async function startSharedSpeculos(
  options: {
    composeFile?: string;
    apduPort?: number;
    apiPort?: number;
    device?: DeviceConfig;
  } = {},
): Promise<SharedSpeculosContext> {
  validateSpeculosTestEnv();
  ensureDeviceEnv();

  const device = options.device ?? DEFAULT_DEVICE;
  const {
    composeFile = SPECULOS_COMPOSE_FILE,
    apduPort = device.apduPort,
    apiPort = device.apiPort,
  } = options;

  const helper = new SpeculosTestHelper({ composeFile, apduPort, apiPort });
  await helper.start();

  const client = helper.getClient();

  const {wsBridgePort} = device;
  const apduBridge = new ApduBridge(client, wsBridgePort);
  await apduBridge.start();

  const deviceModel = getDeviceModel();
  const interaction = createDeviceInteraction(client, deviceModel);
  await interaction.enableBlindSigning();

  const ctx: SharedSpeculosContext = {
    helper,
    client,
    apduBridge,
    wsBridgePort,
    device,
    interaction,
    deviceModel,
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

  console.log(
    `[SharedSpeculos] Device "${deviceModel.name}" (${deviceModel.id}) ready — bridge on :${wsBridgePort}`,
  );

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
