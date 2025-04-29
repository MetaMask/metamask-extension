import * as Redux from 'react-redux';

import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import { useNetworkClientId } from './useNetworkClientId';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

const SEPOLIA_CAIP_CHAINID = 'eip155:11155111';

function runHook() {
  const { result } = renderHookWithProvider(() => useNetworkClientId(), {});
  return result.current;
}

describe('useNetworkClientId - getNetworkClientIdForChainId', () => {
  it('returns networkClientId if data is present', async () => {
    jest.spyOn(Redux, 'useSelector').mockReturnValue([
      undefined,
      {
        '0xaa36a7': {
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
          chainId: '0xaa36a7',
          defaultBlockExplorerUrlIndex: 0,
          defaultRpcEndpointIndex: 0,
          name: 'Sepolia',
          nativeCurrency: 'SepoliaETH',
          rpcEndpoints: [
            {
              failoverUrls: [],
              networkClientId: 'sepolia',
              type: 'infura',
              url: 'https://sepolia.infura.io/v3/{infuraProjectId}',
            },
          ],
        },
      },
    ]);
    const result = await runHook().getNetworkClientIdForChainId(
      SEPOLIA_CAIP_CHAINID,
    );
    expect(result).toBe('sepolia');
  });

  it('throw error if data is not present', async () => {
    jest.spyOn(Redux, 'useSelector').mockReturnValue([]);
    expect(async () => {
      await runHook().getNetworkClientIdForChainId('eip155:1');
    }).rejects.toThrow();
  });
});
