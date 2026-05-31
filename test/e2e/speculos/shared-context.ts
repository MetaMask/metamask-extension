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

/** Lifecycle context returned by {@link startSharedSpeculos} and consumed by test suites. */
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

/** Read the device model from SPECULOS_DEVICE (defaults to flex). */
function getDeviceModelFromEnv(): DeviceModel {
  const id = process.env.SPECULOS_DEVICE ?? 'flex';
  return getDeviceModel(id);
}

/** Set SPECULOS_DEVICE and SPECULOS_ELF env vars from the resolved device model. */
function ensureDeviceEnv(): void {
  const model = getDeviceModelFromEnv();
  if (!process.env.SPECULOS_DEVICE) {
    process.env.SPECULOS_DEVICE = model.id;
  }
  if (!process.env.SPECULOS_ELF) {
    process.env.SPECULOS_ELF = model.elfFile;
  }
}

/**
 * Start a shared Speculos instance for use across multiple test cases.
 *
 * The instance (container or native process) is started once in a `before()`
 * hook and reused by every `it()` block, then torn down in `after()`.
 *
 * @param options - Optional overrides for APDU/API ports and device config.
 * @returns A {@link SharedSpeculosContext} with the live Speculos, client, bridge, and interaction handle.
 */
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

/**
 * Stop a shared Speculos instance and clean up ports.
 *
 * Safe to call even if the instance was never started or already stopped.
 *
 * @param ctx - The context returned by {@link startSharedSpeculos}.
 */
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
