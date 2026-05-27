export type DeviceConfig = {
  id: string;
  apduPort: number;
  apiPort: number;
  wsBridgePort: number;
};

// Speculos APDU/API ports are kept off 9999/5000 on every platform:
//   - 9999 is reserved for PhishingWarningPageServer (hardcoded in
//     test/e2e/tests/phishing-controller/mock-page-with-disallowed-iframe/
//     index.html and the extension's phishing flow).
//   - 5000 collides with macOS Control Center.
// On Linux native, the helper passes these ports to speculos via
// --apdu-port/--api-port. On macOS the docker-compose maps host
// 9998->container 9999 and host 5001->container 5000.
export const DEFAULT_DEVICE: DeviceConfig = {
  id: 'default',
  apduPort: 9998,
  apiPort: 5001,
  wsBridgePort: 9876,
};

export const DEVICE_PRESETS: DeviceConfig[] = [
  DEFAULT_DEVICE,
  {
    id: 'second',
    apduPort: 9997,
    apiPort: 5002,
    wsBridgePort: 9875,
  },
];

export const SPECULOS_APDU_PORT = DEFAULT_DEVICE.apduPort;
export const SPECULOS_API_PORT = DEFAULT_DEVICE.apiPort;
export const SPECULOS_WS_BRIDGE_PORT = DEFAULT_DEVICE.wsBridgePort;

/**
 * Ethereum accounts derived from Speculos seed in docker-compose.yml:
 * "urban secret spare tunnel rubber rally ladder spatial feature elite success"
 * Paths: m/44'/60'/0'/0/{0..4}
 * Verified via GET_PUBLIC_KEY APDU against running Speculos with ethereum-nanosp.elf.
 */
export const SPECULOS_LEDGER_ADDRESSES = [
  '0x24fC293546A31F5Ce73bAfecE37969A95CCd1aBf',
  '0x730A5c73bC3ACcf56daba2D5D897bEb10F852865',
  '0x805c2797CCBa57887F5fA0DD95C017145d67604a',
  '0x2Bf9972F600D8C3B3f0AEe8f1e17Fc4631242fF4',
  '0xDc660e6D52F6f774d0879f99929711155Bc03902',
] as const;

export const SPECULOS_LEDGER_ADDRESS = SPECULOS_LEDGER_ADDRESSES[0];

/** All E2E ports that may need cleanup between runs. */
export const SPECULOS_E2E_PORTS = [
  8111, 8088, 8089, 8090, 9876, 9998, 9999, 5000, 5001,
];

export type InteractionType = 'button' | 'touch';

export type DeviceModel = {
  id: string;
  name: string;
  speculosModel: string;
  interactionType: InteractionType;
  elfFile: string;
  screenSize: { width: number; height: number };
  confirmButton?: { x: number; y: number };
  rejectButton?: { x: number; y: number };
  backButton?: { x: number; y: number };
  reviewConfirmButton?: { x: number; y: number };
  reviewRejectButton?: { x: number; y: number };
  homeButton?: { x: number; y: number };
};

export const DEVICE_MODELS: Record<string, DeviceModel> = {
  nanosp: {
    id: 'nanosp',
    name: 'Nano S+',
    speculosModel: 'nanosp',
    interactionType: 'button',
    elfFile: 'ethereum-nanosp.elf',
    screenSize: { width: 128, height: 64 },
  },
  nanox: {
    id: 'nanox',
    name: 'Nano X',
    speculosModel: 'nanox',
    interactionType: 'button',
    elfFile: 'ethereum-nanox.elf',
    screenSize: { width: 128, height: 64 },
  },
  stax: {
    id: 'stax',
    name: 'Stax',
    speculosModel: 'stax',
    interactionType: 'touch',
    elfFile: 'ethereum-stax.elf',
    screenSize: { width: 400, height: 672 },
    backButton: { x: 36, y: 36 },
    confirmButton: { x: 200, y: 606 },
    rejectButton: { x: 36, y: 606 },
    reviewConfirmButton: { x: 200, y: 515 },
    reviewRejectButton: { x: 36, y: 606 },
    homeButton: { x: 200, y: 606 },
  },
  flex: {
    id: 'flex',
    name: 'Flex',
    speculosModel: 'flex',
    interactionType: 'touch',
    elfFile: 'ethereum-flex.elf',
    screenSize: { width: 480, height: 600 },
    backButton: { x: 45, y: 45 },
    confirmButton: { x: 240, y: 550 },
    rejectButton: { x: 55, y: 530 },
    reviewConfirmButton: { x: 240, y: 435 },
    reviewRejectButton: { x: 55, y: 530 },
    homeButton: { x: 240, y: 550 },
  },
};

export const DEFAULT_DEVICE_MODEL: DeviceModel = DEVICE_MODELS.flex;

export function getDeviceModel(): DeviceModel {
  const id = process.env.SPECULOS_DEVICE ?? 'flex';
  const model = DEVICE_MODELS[id];
  if (!model) {
    throw new Error(
      `Unknown SPECULOS_DEVICE "${id}". Valid: ${Object.keys(DEVICE_MODELS).join(', ')}`,
    );
  }
  return model;
}

export function ensureDeviceEnv(): void {
  const model = getDeviceModel();
  if (!process.env.SPECULOS_DEVICE) {
    process.env.SPECULOS_DEVICE = model.id;
  }
  if (process.env.SPECULOS_ELF) {
    const basename = process.env.SPECULOS_ELF.replace(/^.*[\\/]/u, '');
    process.env.SPECULOS_ELF = basename;
  } else {
    process.env.SPECULOS_ELF = model.elfFile;
  }
}
