import { waitFor } from '@testing-library/react';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { submitRequestToBackground } from '../../store/background-connection';
import { reportMoneyQueryErrorOnce } from '../../helpers/money/report-money-error';
import { useMoneyAccountAvailability } from './use-money-account-availability';

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

jest.mock('../../helpers/money/report-money-error', () => ({
  ...jest.requireActual('../../helpers/money/report-money-error'),
  reportMoneyQueryErrorOnce: jest.fn(),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);
const mockReportMoneyQueryErrorOnce = jest.mocked(reportMoneyQueryErrorOnce);
const stateWith = ({
  useExternalServices = true,
  flagEnabled = true,
} = {}) => ({
  metamask: {
    useExternalServices,
    remoteFeatureFlags: flagEnabled
      ? {
          moneyEnableMoneyAccount: {
            enabled: true,
            minimumVersion: '0.0.1',
          },
        }
      : {},
  },
});

describe('useMoneyAccountAvailability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the derived address when Money is available', async () => {
    const availability = {
      isAvailable: true as const,
      address: '0x0000000000000000000000000000000000000001' as const,
    };
    mockSubmitRequestToBackground.mockResolvedValue(availability);

    const { result } = renderHookWithProvider(
      () => useMoneyAccountAvailability(),
      stateWith(),
    );

    await waitFor(() => {
      expect(result.current.availability).toStrictEqual(availability);
    });
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'messengerCall',
      ['MoneyAccountAvailabilityService:getAvailability', []],
    );
  });

  it('does not request availability when the feature flag is disabled', () => {
    const { result } = renderHookWithProvider(
      () => useMoneyAccountAvailability(),
      stateWith({ flagEnabled: false }),
    );

    expect(result.current.availability).toStrictEqual({ isAvailable: false });
    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  it('does not request availability when basic functionality is off', () => {
    const { result } = renderHookWithProvider(
      () => useMoneyAccountAvailability(),
      stateWith({ useExternalServices: false }),
    );

    expect(result.current.availability).toStrictEqual({ isAvailable: false });
    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    expect(mockReportMoneyQueryErrorOnce).not.toHaveBeenCalled();
  });

  it('forwards an availability query failure to Sentry', async () => {
    const error = new Error('availability down');
    mockSubmitRequestToBackground.mockRejectedValue(error);

    renderHookWithProvider(() => useMoneyAccountAvailability(), stateWith());

    await waitFor(() => {
      expect(mockReportMoneyQueryErrorOnce).toHaveBeenCalledWith(
        'getAvailability',
        '[Money Account] Availability query failed',
        error,
        { query: 'getAvailability' },
      );
    });
  });
});
