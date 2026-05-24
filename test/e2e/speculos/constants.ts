/**
 * Speculos docker-compose defaults (host ports mapped in docker-compose.yml).
 */
export const SPECULOS_COMPOSE_FILE = 'test/e2e/speculos/docker-compose.yml';

export type DeviceConfig = {
  id: string;
  containerName: string;
  apduPort: number;
  apiPort: number;
  wsBridgePort: number;
};

export const DEFAULT_DEVICE: DeviceConfig = {
  id: 'default',
  containerName: 'metamask-speculos',
  apduPort: 9998,
  apiPort: 5001,
  wsBridgePort: 9876,
};

export const DEVICE_PRESETS: DeviceConfig[] = [
  DEFAULT_DEVICE,
  {
    id: 'second',
    containerName: 'metamask-speculos-2',
    apduPort: 9997,
    apiPort: 5002,
    wsBridgePort: 9875,
  },
];

export const SPECULOS_CONTAINER_NAME = DEFAULT_DEVICE.containerName;
export const SPECULOS_APDU_PORT = DEFAULT_DEVICE.apduPort;
export const SPECULOS_API_PORT = DEFAULT_DEVICE.apiPort;
export const SPECULOS_WS_BRIDGE_PORT = DEFAULT_DEVICE.wsBridgePort;

/**
 * First Ethereum account for Speculos seed in docker-compose.yml:
 * "urban secret spare tunnel rubber rally ladder rally spatial feature elite success"
 * Path: m/44'/60'/0'/0/0 (verified via GET_PUBLIC_KEY APDU against running Speculos).
 */
export const SPECULOS_LEDGER_ADDRESSES = [
  '0x3FB034C6a9F4Da3F61709dBe720033A66984caf1',
  '0xFe20B747d3C303477ba25cA4F3D9355D7f70e859',
  '0x137560Ff91A3c23Fec7358f7951Fcca54640286C',
  '0x673092aEf16Fe80F1d70706542088bA70d56a958',
  '0xE4A7f01F07f2480689dCe33B91689c60D49a3ebF',
] as const;

export const SPECULOS_LEDGER_ADDRESS = SPECULOS_LEDGER_ADDRESSES[0];

/** All E2E ports that may need cleanup between runs. */
export const SPECULOS_E2E_PORTS = [
  8545, 8111, 8088, 8089, 8090, 9876, 9998, 5001,
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
    confirmButton: { x: 200, y: 600 },
    rejectButton: { x: 200, y: 60 },
    backButton: { x: 30, y: 40 },
  },
  flex: {
    id: 'flex',
    name: 'Flex',
    speculosModel: 'flex',
    interactionType: 'touch',
    elfFile: 'ethereum-flex.elf',
    screenSize: { width: 480, height: 600 },
    confirmButton: { x: 240, y: 540 },
    rejectButton: { x: 240, y: 60 },
    backButton: { x: 30, y: 40 },
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
  if (!process.env.SPECULOS_ELF) {
    process.env.SPECULOS_ELF = model.elfFile;
  }
}
