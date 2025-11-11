import {
  formatChainIdToCaip,
  getNativeAssetForChainId,
} from '@metamask/bridge-controller';
import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import {
  CaipAssetTypeStruct,
  CaipChainIdStruct,
  SolScope,
} from '@metamask/keyring-api';
import { MultichainNetwork } from '@metamask/multichain-transactions-controller';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { STATIC_MAINNET_TOKEN_LIST } from '../../../shared/constants/tokens';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { MINUTE } from '../../../shared/constants/time';
import type { BridgeToken } from '../../ducks/bridge/types';
import { useTokensWithFiltering } from './useTokensWithFiltering';
import { useTokenList } from './useTokenList';
import nock from 'nock';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import { toAssetId } from '../../../shared/lib/asset-utils';

describe('useTokenList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all tokens sorted by balance', async () => {
    nock(BRIDGE_API_BASE_URL)
      .post('/getTokens/popular')
      .once()
      .reply(200, [
        {
          assetId: 'eip155:1/slip44:60',
          chainId: 'eip155:1',
          decimals: 18,
          image:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
          name: 'Ethereum',
          symbol: 'ETH',
        },
        ...Object.values(STATIC_MAINNET_TOKEN_LIST)
          .slice(0, 10)
          .map((token) => ({
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals,
            image: token.image,
            assetId: toAssetId(token.address, 'eip155:1'),
            chainId: 'eip155:1',
          })),
      ]);
    const mockStore = createBridgeMockStore({});
    const { result, waitForNextUpdate } = renderHookWithProvider(() => {
      const { tokenList } = useTokenList(
        formatChainIdToCaip(CHAIN_IDS.MAINNET),
      );
      return tokenList;
    }, mockStore);
    await waitForNextUpdate();

    expect(result.current).toMatchSnapshot();
    expect(result.current).toHaveLength(11);
  });
});
