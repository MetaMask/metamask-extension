import { renderHook, act } from '@testing-library/react-hooks';
import { PERPS_EVENT_VALUE } from '../../../shared/constants/perps-events';
import { PERPS_SLIPPAGE_DEFAULT_BPS } from '../../components/app/perps/constants/slippageConfig';
import { usePerpsMaxSlippage } from './usePerpsMaxSlippage';

const mockSubmitRequestToBackground = jest.fn();
jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

function setMaxSlippageResponse(value: number | undefined | Error) {
  mockSubmitRequestToBackground.mockImplementation((method: string) => {
    if (method === 'perpsGetMaxSlippage') {
      if (value instanceof Error) {
        return Promise.reject(value);
      }
      return Promise.resolve(value);
    }
    if (method === 'perpsSetMaxSlippage') {
      return Promise.resolve(undefined);
    }
    return Promise.resolve(undefined);
  });
}

describe('usePerpsMaxSlippage', () => {
  beforeEach(() => {
    mockSubmitRequestToBackground.mockReset();
  });

  it('falls back to the documented default when no value is stored', async () => {
    setMaxSlippageResponse(undefined);

    const { result, waitForNextUpdate } = renderHook(() =>
      usePerpsMaxSlippage(),
    );
    await waitForNextUpdate();

    expect(result.current.maxSlippageBps).toBe(PERPS_SLIPPAGE_DEFAULT_BPS);
    expect(result.current.maxSlippageSource).toBe(
      PERPS_EVENT_VALUE.MAX_SLIPPAGE_SOURCE.DEFAULT,
    );
    expect(result.current.isLoading).toBe(false);
  });

  it('resolves a persisted user-configured max slippage value', async () => {
    setMaxSlippageResponse(200);

    const { result, waitForNextUpdate } = renderHook(() =>
      usePerpsMaxSlippage(),
    );
    await waitForNextUpdate();

    expect(result.current.maxSlippageBps).toBe(200);
    expect(result.current.maxSlippageSource).toBe(
      PERPS_EVENT_VALUE.MAX_SLIPPAGE_SOURCE.USER_CONFIGURED,
    );
  });

  it('falls back to the default when the controller read rejects', async () => {
    setMaxSlippageResponse(new Error('background unavailable'));

    const { result } = renderHook(() => usePerpsMaxSlippage());
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.maxSlippageBps).toBe(PERPS_SLIPPAGE_DEFAULT_BPS);
    expect(result.current.maxSlippageSource).toBe(
      PERPS_EVENT_VALUE.MAX_SLIPPAGE_SOURCE.DEFAULT,
    );
    expect(result.current.isLoading).toBe(false);
  });

  it('persists a new max slippage value and updates the resolved source', async () => {
    setMaxSlippageResponse(undefined);

    const { result, waitForNextUpdate } = renderHook(() =>
      usePerpsMaxSlippage(),
    );
    await waitForNextUpdate();

    await act(async () => {
      await result.current.setMaxSlippage(150);
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsSetMaxSlippage',
      [150],
    );
    expect(result.current.maxSlippageBps).toBe(150);
    expect(result.current.maxSlippageSource).toBe(
      PERPS_EVENT_VALUE.MAX_SLIPPAGE_SOURCE.USER_CONFIGURED,
    );
  });
});
