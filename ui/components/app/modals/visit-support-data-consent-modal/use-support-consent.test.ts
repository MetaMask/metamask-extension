import { act } from '@testing-library/react';
import log from 'loglevel';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { SUPPORT_LINK } from '../../../../../shared/lib/ui-utils';
import { openWindow } from '../../../../helpers/utils/window';
import { getCustomerServiceToken } from '../../../../store/actions';
import {
  getSavedSupportDataSharingPreference,
  useOpenSupport,
} from './use-support-consent';

const mockTrackEvent = jest.fn();
const mockOpenTab = jest.fn();

jest.mock('../../../../helpers/utils/window', () => ({
  openWindow: jest.fn(),
}));

jest.mock('../../../../store/actions', () => ({
  ...jest.requireActual('../../../../store/actions'),
  getCustomerServiceToken: jest.fn(),
}));

jest.mock('../../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

jest.mock('../../../../hooks/useSegmentContext', () => ({
  useSegmentContext: jest.fn(() => ({
    page: { title: 'Settings' },
  })),
}));

const stateWithPreferences = (
  shouldShowSupportConsent: boolean | undefined,
  supportDataSharingPreference: boolean | null | undefined,
) => ({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    preferences: {
      ...mockState.metamask.preferences,
      shouldShowSupportConsent,
      supportDataSharingPreference,
    },
  },
});

describe('getSavedSupportDataSharingPreference', () => {
  const select = (
    shouldShowSupportConsent: boolean | undefined,
    supportDataSharingPreference: boolean | null | undefined,
  ) =>
    getSavedSupportDataSharingPreference({
      metamask: {
        preferences: { shouldShowSupportConsent, supportDataSharingPreference },
      },
    });

  it('returns null while the consent modal should be shown', () => {
    expect(select(true, true)).toBeNull();
    expect(select(true, null)).toBeNull();
    expect(select(undefined, true)).toBeNull();
  });

  it('returns null when remembering is on but no choice was saved', () => {
    expect(select(false, null)).toBeNull();
    expect(select(false, undefined)).toBeNull();
  });

  it('returns the saved choice when remembering is on', () => {
    expect(select(false, true)).toBe(true);
    expect(select(false, false)).toBe(false);
  });

  it('returns null when Redux state is unavailable', () => {
    expect(getSavedSupportDataSharingPreference(undefined)).toBeNull();
  });
});

describe('useOpenSupport', () => {
  const mockShowConsentModal = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.platform.openTab = mockOpenTab;
    mockOpenTab.mockResolvedValue(undefined);
    mockTrackEvent.mockResolvedValue(undefined);
    jest.mocked(getCustomerServiceToken).mockResolvedValue('test-token');
  });

  const renderOpenSupport = (
    shouldShowSupportConsent: boolean,
    supportDataSharingPreference: boolean | null,
  ) =>
    renderHookWithProvider(
      () => useOpenSupport(mockShowConsentModal),
      stateWithPreferences(
        shouldShowSupportConsent,
        supportDataSharingPreference,
      ),
    ).result;

  it('shows the consent modal when no choice is saved', async () => {
    const result = renderOpenSupport(true, null);

    await act(() => result.current());

    expect(mockShowConsentModal).toHaveBeenCalledTimes(1);
    expect(mockOpenTab).not.toHaveBeenCalled();
    expect(openWindow).not.toHaveBeenCalled();
  });

  it('opens support with the customer service token in a new tab when the saved choice is to share', async () => {
    const result = renderOpenSupport(false, true);

    await act(() => result.current());

    expect(mockShowConsentModal).not.toHaveBeenCalled();
    expect(getCustomerServiceToken).toHaveBeenCalledTimes(1);
    expect(mockOpenTab).toHaveBeenCalledTimes(1);
    expect(mockOpenTab).toHaveBeenCalledWith({
      url: expect.stringContaining('customer_service_token=test-token'),
    });
    expect(openWindow).not.toHaveBeenCalled();
  });

  it('tracks the support click without the customer service token', async () => {
    const result = renderOpenSupport(false, true);

    await act(() => result.current());

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.SupportLinkClicked,
        properties: expect.objectContaining({ url: SUPPORT_LINK }),
      }),
    );
  });

  it('opens support without personal data when retrieving the token fails', async () => {
    jest
      .mocked(getCustomerServiceToken)
      .mockRejectedValue(new Error('Token service unavailable'));
    const result = renderOpenSupport(false, true);

    await act(() => result.current());

    expect(mockShowConsentModal).not.toHaveBeenCalled();
    expect(mockOpenTab).toHaveBeenCalledTimes(1);
    const { url: openedUrl } = mockOpenTab.mock.calls[0][0];
    expect(openedUrl).toContain('metamask_version=MOCK_VERSION');
    expect(openedUrl).not.toContain('customer_service_token');
    expect(openedUrl).not.toContain('shield_id');
  });

  it('opens support without personal data when retrieving the token returns empty', async () => {
    jest.mocked(getCustomerServiceToken).mockResolvedValue('');
    const result = renderOpenSupport(false, true);

    await act(() => result.current());

    expect(mockShowConsentModal).not.toHaveBeenCalled();
    expect(mockOpenTab).toHaveBeenCalledTimes(1);
    const { url: openedUrl } = mockOpenTab.mock.calls[0][0];
    expect(openedUrl).toContain('metamask_version=MOCK_VERSION');
    expect(openedUrl).not.toContain('customer_service_token');
    expect(openedUrl).not.toContain('shield_id');
  });

  it('falls back to window.open when the extension tab API fails', async () => {
    jest.spyOn(log, 'warn').mockImplementation(() => undefined);
    mockOpenTab.mockRejectedValue(new Error('tabs.create failed'));
    const result = renderOpenSupport(false, true);

    await act(() => result.current());

    expect(openWindow).toHaveBeenCalledTimes(1);
    expect(jest.mocked(openWindow).mock.calls[0][0]).toContain(
      'customer_service_token=test-token',
    );
  });

  it('opens the support tab once when clicked repeatedly while the token is pending', async () => {
    let resolveToken: (token: string) => void = () => undefined;
    jest.mocked(getCustomerServiceToken).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveToken = resolve;
        }),
    );
    const result = renderOpenSupport(false, true);

    await act(async () => {
      const firstClick = result.current();
      const secondClick = result.current();
      resolveToken('test-token');
      await Promise.all([firstClick, secondClick]);
    });

    expect(getCustomerServiceToken).toHaveBeenCalledTimes(1);
    expect(mockOpenTab).toHaveBeenCalledTimes(1);
  });

  it('opens the support tab again on a click after the previous one settled', async () => {
    const result = renderOpenSupport(false, true);

    await act(() => result.current());
    await act(() => result.current());

    expect(getCustomerServiceToken).toHaveBeenCalledTimes(2);
    expect(mockOpenTab).toHaveBeenCalledTimes(2);
  });

  it('opens support without user data when the saved choice is not to share', async () => {
    const result = renderOpenSupport(false, false);

    await act(() => result.current());

    expect(mockShowConsentModal).not.toHaveBeenCalled();
    expect(getCustomerServiceToken).not.toHaveBeenCalled();
    expect(mockOpenTab).not.toHaveBeenCalled();
    expect(openWindow).toHaveBeenCalledWith(SUPPORT_LINK);
  });
});
