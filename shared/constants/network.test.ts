import { existsSync } from 'fs';
import { join } from 'path';
import {
  CHAIN_IDS,
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
} from './network';

describe('NetworkConstants', () => {
  it('has images files that exist for defined networks', () => {
    Object.values(CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP).forEach((image) =>
      expect(existsSync(join('app', image))).toBe(true),
    );
  });

  it('returns network name for chain ids', () => {
    expect(NETWORK_TO_NAME_MAP[CHAIN_IDS.ARBITRUM]).toBe('Arbitrum One');
    expect(NETWORK_TO_NAME_MAP[CHAIN_IDS.AVALANCHE]).toBe(
      'Avalanche Network C-Chain',
    );
    expect(NETWORK_TO_NAME_MAP[CHAIN_IDS.BSC]).toBe('Binance Smart Chain');
    expect(NETWORK_TO_NAME_MAP[CHAIN_IDS.MAINNET]).toBe('Ethereum Mainnet');
    expect(NETWORK_TO_NAME_MAP[CHAIN_IDS.LINEA_MAINNET]).toBe('Linea Mainnet');
    expect(NETWORK_TO_NAME_MAP[CHAIN_IDS.OPTIMISM]).toBe('OP Mainnet');
    expect(NETWORK_TO_NAME_MAP[CHAIN_IDS.POLYGON]).toBe('Polygon');
  });
});
