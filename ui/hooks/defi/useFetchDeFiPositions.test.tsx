import { renderHook } from '@testing-library/react-hooks';
import { useFetchDeFiPositions } from './useFetchDeFiPositions';
import { DEFI_MESSENGER_CAPABILITIES } from './messenger';

const mockCall = jest.fn().mockResolvedValue(undefined);

jest.mock('../useMessenger', () => ({
  useMessenger: () => ({
    call: mockCall,
  }),
}));

describe('useFetchDeFiPositions', () => {
  beforeEach(() => {
    mockCall.mockClear();
  });

  it('calls DeFiPositionsControllerV2:fetchDeFiPositions without options', async () => {
    const { result } = renderHook(() => useFetchDeFiPositions());

    await result.current();

    expect(mockCall).toHaveBeenCalledWith(
      'DeFiPositionsControllerV2:fetchDeFiPositions',
      undefined,
    );
  });

  it('calls DeFiPositionsControllerV2:fetchDeFiPositions with forceRefresh', async () => {
    const { result } = renderHook(() => useFetchDeFiPositions());

    await result.current({ forceRefresh: true });

    expect(mockCall).toHaveBeenCalledWith(
      'DeFiPositionsControllerV2:fetchDeFiPositions',
      { forceRefresh: true },
    );
  });

  it('exposes DeFi messenger capabilities including fetchDeFiPositions', () => {
    expect(DEFI_MESSENGER_CAPABILITIES.actions).toContain(
      'DeFiPositionsControllerV2:fetchDeFiPositions',
    );
  });
});
