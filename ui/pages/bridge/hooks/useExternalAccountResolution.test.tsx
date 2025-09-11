import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import { useExternalAccountResolution } from './useExternalAccountResolution';

const renderUseExternalAccountResolution = (
  searchQuery: string,
  isDestinationSolana: boolean,
  mockStoreOverrides = {},
) => {
  return renderHookWithProvider(
    () =>
      useExternalAccountResolution({
        searchQuery,
        isDestinationSolana,
      }),
    createBridgeMockStore(mockStoreOverrides),
  );
};

describe('useExternalAccountResolution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when search query is not a valid address', () => {
    const { result } = renderUseExternalAccountResolution('0x123', false);
    expect(result.all.length).toBe(1);
    expect(result.all[0]).toBeNull();
  });

  it('returns null when search query is an internal account', () => {
    const { result } = renderUseExternalAccountResolution(
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      false,
    );
    expect(result.all.length).toBe(1);
    expect(result.all[0]).toBeNull();
  });

  it('returns external account when ENS search query is resolved', () => {
    const { result } = renderUseExternalAccountResolution('abc.eth', false, {
      stateOverrides: {
        DNS: {
          resolutions: [
            {
              resolvedAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7ba',
            },
          ],
        },
      },
    });
    expect(result.all.length).toBe(2);
    expect(result.all[0]).toStrictEqual({
      address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7ba',
      isExternal: true,
      type: 'any:account',
      displayName: 'abc.eth',
    });
  });

  it('returns null when ENS search query is not resolved', () => {
    const { result } = renderUseExternalAccountResolution('abc.eth', false, {
      stateOverrides: {
        DNS: {},
      },
    });
    expect(result.all.length).toBe(2);
    expect(result.all[0]).toBeNull();
  });
});
