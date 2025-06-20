import { existsSync } from 'fs';
import { join } from 'path';
import {
  CHAIN_IDS,
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  FEATURED_RPCS,
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
  describe('popularNetwork', () => {
    it('should have correct chainIds for all popular network', () => {
      const expectedChainIds: { [key: string]: string } = {
        'Arbitrum One': CHAIN_IDS.ARBITRUM,
        'Avalanche Network C-Chain': CHAIN_IDS.AVALANCHE,
        'Binance Smart Chain': CHAIN_IDS.BSC,
        'OP Mainnet': CHAIN_IDS.OPTIMISM,
        'Polygon Mainnet': CHAIN_IDS.POLYGON,
        'zkSync Era Mainnet': CHAIN_IDS.ZKSYNC_ERA,
        'Base Mainnet': CHAIN_IDS.BASE,
        'Linea Mainnet': CHAIN_IDS.LINEA_MAINNET,
        'Sei Network': CHAIN_IDS.SEI,
      };

      FEATURED_RPCS.forEach((rpc) => {
        expect(rpc.chainId).toBe(expectedChainIds[rpc.name]);
      });
    });
  });

  describe('FEATURED_RPCS Infura Usage Tests', () => {
    it('arbitrum entry should use Infura', () => {
      const [arbitrumRpc] = FEATURED_RPCS.filter(
        (rpc) => rpc.chainId === CHAIN_IDS.ARBITRUM,
      );
      expect(arbitrumRpc.rpcEndpoints[0].url).toContain('infura.io');
    });

    it('avalanche entry should use Infura', () => {
      const [avalancheRpc] = FEATURED_RPCS.filter(
        (rpc) => rpc.chainId === CHAIN_IDS.AVALANCHE,
      );
      expect(avalancheRpc.rpcEndpoints[0].url).toContain('infura.io');
    });

    it('bsc entry should not use Infura', () => {
      const [bscRpc] = FEATURED_RPCS.filter(
        (rpc) => rpc.chainId === CHAIN_IDS.BSC,
      );
      expect(bscRpc.rpcEndpoints[0].url).not.toContain('infura.io');
    });

    it('optimism entry should use Infura', () => {
      const [optimismRpc] = FEATURED_RPCS.filter(
        (rpc) => rpc.chainId === CHAIN_IDS.OPTIMISM,
      );
      expect(optimismRpc.rpcEndpoints[0].url).toContain('infura.io');
    });

    it('polygon entry should use Infura', () => {
      const [polygonRpc] = FEATURED_RPCS.filter(
        (rpc) => rpc.chainId === CHAIN_IDS.POLYGON,
      );
      expect(polygonRpc.rpcEndpoints[0].url).toContain('infura.io');
    });

    it('zkSync Era entry should not use Infura', () => {
      const [zksyncEraRpc] = FEATURED_RPCS.filter(
        (rpc) => rpc.chainId === CHAIN_IDS.ZKSYNC_ERA,
      );
      expect(zksyncEraRpc.rpcEndpoints[0].url).not.toContain('infura.io');
    });

    it('base entry should use Infura', () => {
      const [baseRpc] = FEATURED_RPCS.filter(
        (rpc) => rpc.chainId === CHAIN_IDS.BASE,
      );
      expect(baseRpc.rpcEndpoints[0].url).toContain('infura.io');
    });
  });
});
