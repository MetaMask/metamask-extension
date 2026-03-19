import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { useTransactionMetadataRequest } from '../useTransactionMetadataRequest';
import { useTransactionNativeTicker } from './useTransactionNativeTicker';

const CHAIN_ID_MOCK = '0x1';

jest.mock('../useTransactionMetadataRequest', () => ({
  useTransactionMetadataRequest: jest.fn(),
}));

const mockUseTransactionMetadataRequest = jest.mocked(
  useTransactionMetadataRequest,
);

describe('useTransactionNativeTicker', () => {
  beforeEach(() => {
    mockUseTransactionMetadataRequest.mockReturnValue({
      chainId: CHAIN_ID_MOCK,
    } as never);
  });

  it('returns native currency for the transaction chain', () => {
    const { result } = renderHookWithProvider(
      () => useTransactionNativeTicker(),
      {
        metamask: {
          networkConfigurationsByChainId: {
            [CHAIN_ID_MOCK]: {
              nativeCurrency: 'ETH',
            },
          },
        },
      },
    );

    expect(result.current).toBe('ETH');
  });

  it('returns undefined when network configuration is not found', () => {
    const { result } = renderHookWithProvider(
      () => useTransactionNativeTicker(),
      {
        metamask: {
          networkConfigurationsByChainId: {},
        },
      },
    );

    expect(result.current).toBeUndefined();
  });
});
