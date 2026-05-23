/**
 * Speculos docker-compose defaults (host ports mapped in docker-compose.yml).
 */
export const SPECULOS_COMPOSE_FILE = 'test/e2e/speculos/docker-compose.yml';

export const SPECULOS_CONTAINER_NAME = 'metamask-speculos';

/** Host APDU port (maps to container 9999). */
export const SPECULOS_APDU_PORT = 9998;

/** Host REST API port (maps to container 5000). */
export const SPECULOS_API_PORT = 5001;

/** Default WebSocket port for ApduBridge (browser ↔ Node). */
export const SPECULOS_WS_BRIDGE_PORT = 9876;

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
