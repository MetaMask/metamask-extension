import {
  Speculos,
  SpeculosClient,
  ApduBridge,
  DEFAULT_DEVICE,
  getDeviceModel,
  type DeviceConfig,
  type DeviceModel,
  type LedgerDeviceInteraction,
} from '@metamask/hw-emulator';
import { validateSpeculosTestEnv } from './build-config';
import { cleanupSpeculosEnvironment } from './cleanup';

export type SharedSpeculosContext = {
  speculos: Speculos;
  client: SpeculosClient;
  apduBridge: ApduBridge;
  wsBridgePort: number;
  device: DeviceConfig;
  interaction: LedgerDeviceInteraction;
  deviceModel: DeviceModel;
};

let registeredSignalHandlers = false;

/**
 * Read the device model from the SPECULOS_DEVICE env var (falls back to flex).
 * The package's `getDeviceModel` takes an explicit id, so we bridge the env var here.
 */
function getDeviceModelFromEnv(): DeviceModel {
  const id = process.env.SPECULOS_DEVICE ?? 'flex';
  return getDeviceModel(id);
}

/**
 * Ensure SPECULOS_DEVICE and SPECULOS_ELF env vars are set.
 * These are read by docker-compose.yml when running in Docker mode.
 */
function ensureDeviceEnv(): void {
  const model = getDeviceModelFromEnv();
  if (!process.env.SPECULOS_DEVICE) {
    process.env.SPECULOS_DEVICE = model.id;
  }
  if (!process.env.SPECULOS_ELF) {
    process.env.SPECULOS_ELF = model.elfFile;
  }
}

export async function startSharedSpeculos(
  options: {
    apduPort?: number;
    apiPort?: number;
    device?: DeviceConfig;
  } = {},
): Promise<SharedSpeculosContext> {
  validateSpeculosTestEnv();
  ensureDeviceEnv();

  const device = options.device ?? DEFAULT_DEVICE;
  const {
    apduPort = device.apduPort,
    apiPort = device.apiPort,
  } = options;

  const deviceModel = getDeviceModelFromEnv();

  const speculos = new Speculos({
    device: deviceModel.id,
    apduPort,
    apiPort,
    wsBridgePort: device.wsBridgePort,
  });

  if (process.env.SKIP_SPECULOS_TESTS !== 'true') {
    await speculos.start();
  }

  const client = speculos.getClient();

  const { wsBridgePort } = device;
  const apduBridge = await speculos.startBridge(wsBridgePort);

  const interaction = speculos.getInteraction() as LedgerDeviceInteraction;
  await interaction.enableBlindSigning();

  const ctx: SharedSpeculosContext = {
    speculos,
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
    await ctx.speculos.stop();
  } catch {
    // may already be stopped
  }
  await cleanupSpeculosEnvironment();
  console.log('[SharedSpeculos] Stopped');
}
