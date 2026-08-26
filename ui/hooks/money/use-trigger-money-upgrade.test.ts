import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { submitRequestToBackground } from '../../store/background-connection';
import { useTriggerMoneyUpgrade } from './use-trigger-money-upgrade';

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

describe('useTriggerMoneyUpgrade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
  });

  it('fires the upgrade trigger once per mount when enabled', () => {
    const { rerender } = renderHookWithProvider(
      () => useTriggerMoneyUpgrade({ enabled: true }),
      {},
    );

    rerender();

    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'messengerCall',
      ['MoneyAccountUpgradeService:triggerUpgrade', []],
    );
  });

  it('does not fire while disabled, then fires when enabled flips on', () => {
    let enabled = false;
    const { rerender } = renderHookWithProvider(
      () => useTriggerMoneyUpgrade({ enabled }),
      {},
    );

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();

    enabled = true;
    rerender();

    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
  });

  it('swallows a failed trigger call', () => {
    mockSubmitRequestToBackground.mockRejectedValue(
      new Error('disconnected'),
    );

    expect(() =>
      renderHookWithProvider(() => useTriggerMoneyUpgrade({ enabled: true }), {}),
    ).not.toThrow();
  });
});
