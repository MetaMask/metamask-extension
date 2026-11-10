import { NetworkId, NetworkName } from './network-constants';

describe('network-constants', () => {
  describe('NetworkId', () => {
    it('maps each network to its CAIP-2 chain id', () => {
      expect(NetworkId).toStrictEqual({
        ARBITRUM: 'eip155:42161',
        AVALANCHE: 'eip155:43114',
        BASE: 'eip155:8453',
        BSC: 'eip155:56',
        ETHEREUM: 'eip155:1',
        LINEA: 'eip155:59144',
        OPTIMISM: 'eip155:10',
        POLYGON: 'eip155:137',
        XDC: 'eip155:50',
      });
    });
  });

  describe('NetworkName', () => {
    it('maps each network to the display name shown in the UI', () => {
      expect(NetworkName).toStrictEqual({
        BITCOIN: 'Bitcoin',
        ETHEREUM: 'Ethereum',
        SEPOLIA: 'Sepolia',
        TRON: 'Tron',
      });
    });
  });
});
