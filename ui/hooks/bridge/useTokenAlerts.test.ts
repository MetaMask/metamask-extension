import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { useTokenAlerts } from './useTokenAlerts';

const renderUseSolanaAlerts = (mockStoreState: object) =>
  renderHookWithProvider(() => useTokenAlerts(), mockStoreState);

const mockResponse = {
  type: 'warning',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  feature_id: 'UNSTABLE_TOKEN_PRICE',
  description:
    'The price of this token in USD is highly volatile, indicating a high risk of losing significant value by interacting with it.',
  titleId: 'unstableTokenPriceTitle',
  descriptionId: 'unstableTokenPriceDescription',
};
jest.mock(
  '../../../shared/modules/bridge-utils/security-alerts-api.util',
  () => ({
    ...jest.requireActual(
      '../../../shared/modules/bridge-utils/security-alerts-api.util',
    ),
    fetchTokenAlert: () => mockResponse,
  }),
);

// For now we have to mock toChain Solana, remove once it is truly implemented
const mockGetToChain = { chainId: MultichainNetworks.SOLANA };
jest.mock('../../ducks/bridge/selectors', () => ({
  ...jest.requireActual('../../ducks/bridge/selectors'),
  getToChain: () => mockGetToChain,
}));

describe('useTokenAlerts', () => {
  it('should set token alert when toChain is Solana', async () => {
    const mockStoreState = createBridgeMockStore({
      bridgeSliceOverrides: {
        fromToken: {
          address: '0x3fa807b6f8d4c407e6e605368f4372d14658b38c',
        },
        fromChain: {
          chainId: CHAIN_IDS.MAINNET,
        },
        toToken: {
          address: '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
        },
        toChain: {
          chainId: MultichainNetworks.SOLANA,
        },
      },
    });

    const { result, waitForNextUpdate } = renderUseSolanaAlerts(mockStoreState);
    await waitForNextUpdate();

    expect(result.current.tokenAlert).toBeTruthy();
  });
});
