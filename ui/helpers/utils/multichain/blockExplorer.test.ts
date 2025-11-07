import {
  MULTICHAIN_PROVIDER_CONFIGS,
  MultichainNetworks,
} from '../../../../shared/constants/multichain/networks';
import {
  CHAIN_IDS,
  MAINNET_DISPLAY_NAME,
  CHAIN_ID_TO_RPC_URL_MAP,
  ETH_TOKEN_IMAGE_URL,
  NETWORK_TYPES,
  CURRENCY_SYMBOLS,
} from '../../../../shared/constants/network';
import { MultichainNetwork } from '../../../selectors/multichain';
import {
  getMultichainBlockExplorerUrl,
  getMultichainAccountUrl,
} from './blockExplorer';

const mockEvmNetwork: MultichainNetwork = {
  nickname: 'Ethereum',
  isEvmNetwork: true,
  chainId: 'eip155:1',
  network: {
    chainId: CHAIN_IDS.MAINNET,
    nickname: MAINNET_DISPLAY_NAME,
    rpcUrl: CHAIN_ID_TO_RPC_URL_MAP[CHAIN_IDS.MAINNET],
    rpcPrefs: {
      imageUrl: ETH_TOKEN_IMAGE_URL,
      blockExplorerUrl: 'https://etherscan.io',
    },
    type: NETWORK_TYPES.MAINNET,
    ticker: CURRENCY_SYMBOLS.ETH,
    id: NETWORK_TYPES.MAINNET,
  },
};

const mockNonEvmNetwork: MultichainNetwork = {
  nickname: 'Bitcoin',
  isEvmNetwork: false,
  chainId: MultichainNetworks.BITCOIN,
  network: MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.BITCOIN],
};

describe('Block Explorer Tests', () => {
  describe('getMultichainBlockExplorerUrl', () => {
    it('returns the correct block explorer URL for Ethereum mainnet', () => {
      const expectedUrl = mockEvmNetwork.network?.rpcPrefs?.blockExplorerUrl;

      const result = getMultichainBlockExplorerUrl(mockEvmNetwork);

      expect(result).toBe(expectedUrl);
    });

    it('returns the correct block explorer URL for Bitcoin mainnet', () => {
      const expectedUrl = mockNonEvmNetwork.network?.rpcPrefs?.blockExplorerUrl;

      const result = getMultichainBlockExplorerUrl(mockNonEvmNetwork);

      expect(result).toBe(expectedUrl);
    });
  });

  describe('getMultichainAccountUrl', () => {
    it('returns the correct account URL for Ethereum mainnet', () => {
      const address = '0x1234567890abcdef';
      const expectedUrl = `https://etherscan.io/address/${address}#asset-multichain`;

      const result = getMultichainAccountUrl(address, mockEvmNetwork);

      expect(result).toBe(expectedUrl);
    });

    it('returns the correct account URL for BNB Chain', () => {
      const address = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
      const expectedUrl = `https://mempool.space/address/${address}`;

      const result = getMultichainAccountUrl(address, mockNonEvmNetwork);

      expect(result).toBe(expectedUrl);
    });
  });
});
