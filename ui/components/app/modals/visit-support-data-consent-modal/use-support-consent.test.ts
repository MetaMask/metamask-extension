import { act } from '@testing-library/react';
import log from 'loglevel';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { SUPPORT_LINK } from '../../../../../shared/lib/ui-utils';
import { openWindow } from '../../../../helpers/utils/window';
import { getCustomerServiceToken } from '../../../../store/actions';
import { useOpenSupport } from './use-support-consent';

const mockTrackEvent = jest.fn();
const mockOpenTab = jest.fn();
const mockShowConsentModal = jest.fn();

jest.mock('../../../../helpers/utils/window', () => ({
  openWindow: jest.fn(),
}));

jest.mock('../../../../store/actions', () => ({
  ...jest.requireActual('../../../../store/actions'),
  getCustomerServiceToken: jest.fn(),
}));

jest.mock('../../../../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: mockTrackEvent,
    createEventBuilder: jest.requireActual(
      '../../../../../shared/lib/analytics/create-event-builder',
    ).createEventBuilder,
  }),
}));

jest.mock('../../../../hooks/useSegmentContext', () => ({
  useSegmentContext: jest.fn(() => ({ page: { title: 'Settings' } })),
}));

const renderOpenSupport = (
  shouldShowSupportConsent: boolean,
  supportDataSharingPreference: boolean | null,
) =>
  renderHookWithProvider(() => useOpenSupport(mockShowConsentModal), {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      preferences: {
        ...mockState.metamask.preferences,
        shouldShowSupportConsent,
        supportDataSharingPreference,
      },
    },
  }).result;

describe('useOpenSupport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.platform.openTab = mockOpenTab;
    mockOpenTab.mockResolvedValue(undefined);
    mockTrackEvent.mockResolvedValue(undefined);
    jest.mocked(getCustomerServiceToken).mockResolvedValue('test-token');
  });

  it('shows the consent modal when no choice is saved', async () => {
    const result = renderOpenSupport(true, null);

    await act(() => result.current());

    expect(mockShowConsentModal).toHaveBeenCalledTimes(1);
    expect(mockOpenTab).not.toHaveBeenCalled();
    expect(openWindow).not.toHaveBeenCalled();
  });

  it('opens support with the token in a new tab and tracks the link without it when the saved choice is to share', async () => {
    const result = renderOpenSupport(false, true);

    await act(() => result.current());

    expect(mockShowConsentModal).not.toHaveBeenCalled();
    expect(mockOpenTab).toHaveBeenCalledWith({
      url: expect.stringContaining('customer_service_token=test-token'),
    });
    expect(openWindow).not.toHaveBeenCalled();
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.SupportLinkClicked,
        properties: expect.objectContaining({ url: SUPPORT_LINK }),
      }),
    );
  });

  it('opens support without user data when the saved choice is not to share', async () => {
    const result = renderOpenSupport(false, false);

    await act(() => result.current());

    expect(mockShowConsentModal).not.toHaveBeenCalled();
    expect(getCustomerServiceToken).not.toHaveBeenCalled();
    expect(mockOpenTab).not.toHaveBeenCalled();
    expect(openWindow).toHaveBeenCalledWith(SUPPORT_LINK);
  });

  it('opens support without personal data when retrieving the token fails', async () => {
    jest
      .mocked(getCustomerServiceToken)
      .mockRejectedValue(new Error('Token service unavailable'));
    const result = renderOpenSupport(false, true);

    await act(() => result.current());

    expect(mockOpenTab).toHaveBeenCalledTimes(1);
    const { url } = mockOpenTab.mock.calls[0][0];
    expect(url).toContain('metamask_version=MOCK_VERSION');
    expect(url).not.toMatch(/customer_service_token|shield_id/u);
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

  it('opens one tab for repeated clicks while the token is pending and another after it settles', async () => {
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

    jest.mocked(getCustomerServiceToken).mockResolvedValue('test-token');
    await act(() => result.current());

    expect(mockOpenTab).toHaveBeenCalledTimes(2);
  });
});
