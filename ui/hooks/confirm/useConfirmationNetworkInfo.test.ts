import mockState from '../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import useConfirmationNetworkInfo from './useConfirmationNetworkInfo';

describe('useConfirmationNetworkInfo', () => {
  it('returns network display name when confirmation chainId is present', () => {
    const { result } = renderHookWithProvider(
      () => useConfirmationNetworkInfo(),
      {
        ...mockState,
        confirm: {
          currentConfirmation: { id: '1', chainId: '0x1' },
        },
      },
    );

    expect(result.current.networkDisplayName).toBe('Ethereum Mainnet');
  });

  it('returns network display name of provider chainId when confirmation chainId is not present', () => {
    const { result } = renderHookWithProvider(
      () => useConfirmationNetworkInfo(),
      {
        ...mockState,
        confirm: {
          currentConfirmation: { id: '1', msgParams: {} },
        },
      },
    );

    expect(result.current.networkDisplayName).toBe('Goerli');
  });
});
