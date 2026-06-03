import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { useTransactionNativeTicker } from './useTransactionNativeTicker';

const CHAIN_ID_MOCK = '0x1';

jest.mock('../../context/confirm', () => ({
  useConfirmContext: () => ({
    currentConfirmation: {
      chainId: CHAIN_ID_MOCK,
    },
  }),
}));

describe('useTransactionNativeTicker', () => {
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
