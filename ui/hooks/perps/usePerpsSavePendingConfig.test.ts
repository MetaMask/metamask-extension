import { renderHook } from '@testing-library/react';
import type { OrderFormState } from '../../components/app/perps/order-entry/order-entry.types';
import { submitRequestToBackground } from '../../store/background-connection';
import { usePerpsSavePendingConfig } from './usePerpsSavePendingConfig';

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

const formState: OrderFormState = {
  asset: 'BTC',
  direction: 'long',
  closePercent: 100,
  amount: '250',
  leverage: 8,
  balancePercent: 10,
  takeProfitPrice: '',
  stopLossPrice: '',
  limitPrice: '',
  type: 'market',
  autoCloseEnabled: false,
};

describe('usePerpsSavePendingConfig', () => {
  beforeEach(() => {
    mockSubmitRequestToBackground.mockClear();
  });

  it('saves the draft for the current asset on unmount', () => {
    const skipRef = { current: false };
    const { unmount } = renderHook(() =>
      usePerpsSavePendingConfig({
        asset: 'BTC',
        formState,
        enabled: true,
        skipRef,
      }),
    );

    unmount();

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsSavePendingTradeConfiguration',
      [
        'BTC',
        expect.objectContaining({
          amount: '250',
          leverage: 8,
          orderType: 'market',
          direction: 'long',
        }),
      ],
    );
  });

  it('saves the previous asset when the symbol changes', () => {
    const skipRef = { current: false };
    const { rerender } = renderHook(
      ({ asset }: { asset: string }) =>
        usePerpsSavePendingConfig({
          asset,
          formState,
          enabled: true,
          skipRef,
        }),
      { initialProps: { asset: 'BTC' } },
    );

    rerender({ asset: 'ETH' });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsSavePendingTradeConfiguration',
      ['BTC', expect.objectContaining({ amount: '250' })],
    );
  });

  it('does not save when skipRef is set', () => {
    const skipRef = { current: true };
    const { unmount } = renderHook(() =>
      usePerpsSavePendingConfig({
        asset: 'BTC',
        formState,
        enabled: true,
        skipRef,
      }),
    );

    unmount();

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  it('does not save when disabled', () => {
    const skipRef = { current: false };
    const { unmount } = renderHook(() =>
      usePerpsSavePendingConfig({
        asset: 'BTC',
        formState,
        enabled: false,
        skipRef,
      }),
    );

    unmount();

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  it('does not save when the form has not hydrated', () => {
    const skipRef = { current: false };
    const { unmount } = renderHook(() =>
      usePerpsSavePendingConfig({
        asset: 'BTC',
        formState: null,
        enabled: true,
        skipRef,
      }),
    );

    unmount();

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
  });
});
