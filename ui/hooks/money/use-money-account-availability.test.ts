import { waitFor } from '@testing-library/react';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { submitRequestToBackground } from '../../store/background-connection';
import { useMoneyAccountAvailability } from './use-money-account-availability';

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);
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
  });
});
