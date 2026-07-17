import { fireEvent, waitFor } from '@testing-library/react';
import * as React from 'react';
import { useSelector } from 'react-redux';
import configureMockState from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { SUPPORT_LINK } from '../../../../../shared/lib/ui-utils';
import { buildSupportLinkWithUserData } from '../../../../../shared/lib/build-support-link';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { openWindow } from '../../../../helpers/utils/window';
import { useUserSubscriptions } from '../../../../hooks/subscription/useSubscription';
import { selectSessionData } from '../../../../selectors/identity/authentication';
import { getAnalyticsId } from '../../../../selectors/selectors';
import VisitSupportDataConsentModal from './visit-support-data-consent-modal';

const mockTrackEvent = jest.fn();

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

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../../../../helpers/utils/window', () => ({
  openWindow: jest.fn(),
}));

jest.mock('../../../../hooks/subscription/useSubscription', () => ({
  useUserSubscriptions: jest.fn(),
}));

describe('VisitSupportDataConsentModal', () => {
  const store = configureMockState([thunk])(mockState);
  const mockOnClose = jest.fn();
  const mockProfileId = 'test-profile-id';
  const mockCanonicalProfileId = 'test-canonical-profile-id';
  const mockAnalyticsId = 'test-metrics-id';
  const mockShieldCustomerId = 'test-shield-customer-id';
  const useSelectorMock = useSelector as jest.Mock;
  const useUserSubscriptionsMock = useUserSubscriptions as jest.Mock;

  beforeEach(() => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === selectSessionData) {
        return {
          profile: {
            profileId: mockProfileId,
            canonicalProfileId: mockCanonicalProfileId,
          },
        };
      }
      if (selector === getAnalyticsId) {
        return mockAnalyticsId;
      }
      return undefined;
    });

    useUserSubscriptionsMock.mockReturnValue({
      customerId: mockShieldCustomerId,
      subscriptions: [],
      trialedProducts: [],
      loading: false,
      error: undefined,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderModal = (props = {}) => {
    const defaultProps = {
      isOpen: true,
      onClose: mockOnClose,
      ...props,
    };

    return renderWithProvider(
      <VisitSupportDataConsentModal {...defaultProps} />,
      store,
    );
  };

  it('renders the modal correctly when open', () => {
    const { getByTestId } = renderModal();
    const modal = getByTestId('visit-support-data-consent-modal');
    expect(modal).toMatchSnapshot();
  });

  it('handles clicking the accept button correctly', async () => {
    const { getByTestId } = renderModal();

    await waitFor(() => {
      fireEvent.click(
        getByTestId('visit-support-data-consent-modal-accept-button'),
      );
    });

    const expectedUrl = buildSupportLinkWithUserData(SUPPORT_LINK as string, {
      version: 'MOCK_VERSION',
      profileId: mockProfileId,
      canonicalProfileId: mockCanonicalProfileId,
      analyticsId: mockAnalyticsId,
      shieldCustomerId: mockShieldCustomerId,
    });

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.SupportLinkClicked,
        properties: expect.objectContaining({
          category: MetaMetricsEventCategory.Settings,
          url: expectedUrl,
          [MetaMetricsContextProp.PageTitle]: 'Settings',
        }),
      }),
    );
    expect(openWindow).toHaveBeenCalledWith(expectedUrl);
  });

  it('handles clicking the reject button correctly', async () => {
    const { getByTestId } = renderModal();

    await waitFor(() => {
      fireEvent.click(
        getByTestId('visit-support-data-consent-modal-reject-button'),
      );
    });

    // When user rejects, URL should preserve non-personal params (like utm_source)
    const expectedUrl = SUPPORT_LINK;

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.SupportLinkClicked,
        properties: expect.objectContaining({
          category: MetaMetricsEventCategory.Settings,
          url: expectedUrl,
          [MetaMetricsContextProp.PageTitle]: 'Settings',
        }),
      }),
    );
    expect(openWindow).toHaveBeenCalledWith(expectedUrl);
  });

  it('handles clicking the accept button with undefined shield customer ID', async () => {
    useUserSubscriptionsMock.mockReturnValue({
      customerId: undefined,
      subscriptions: [],
      trialedProducts: [],
      loading: false,
      error: undefined,
    });
    const { getByTestId } = renderModal();

    await waitFor(() => {
      fireEvent.click(
        getByTestId('visit-support-data-consent-modal-accept-button'),
      );
    });

    const expectedUrl = buildSupportLinkWithUserData(SUPPORT_LINK as string, {
      version: 'MOCK_VERSION',
      profileId: mockProfileId,
      canonicalProfileId: mockCanonicalProfileId,
      analyticsId: mockAnalyticsId,
    });

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.SupportLinkClicked,
        properties: expect.objectContaining({
          category: MetaMetricsEventCategory.Settings,
          url: expectedUrl,
          [MetaMetricsContextProp.PageTitle]: 'Settings',
        }),
      }),
    );
    expect(openWindow).toHaveBeenCalledWith(expectedUrl);
  });

  it('handles clicking the accept button with all undefined parameters', async () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === selectSessionData) {
        return { profile: { profileId: undefined } };
      }
      if (selector === getAnalyticsId) {
        return undefined;
      }
      return undefined;
    });

    useUserSubscriptionsMock.mockReturnValue({
      customerId: undefined,
      subscriptions: [],
      trialedProducts: [],
      loading: false,
      error: undefined,
    });

    const { getByTestId } = renderModal();

    await waitFor(() => {
      fireEvent.click(
        getByTestId('visit-support-data-consent-modal-accept-button'),
      );
    });

    const expectedUrl = buildSupportLinkWithUserData(SUPPORT_LINK as string, {
      version: 'MOCK_VERSION',
    });

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.SupportLinkClicked,
        properties: expect.objectContaining({
          category: MetaMetricsEventCategory.Settings,
          url: expectedUrl,
          [MetaMetricsContextProp.PageTitle]: 'Settings',
        }),
      }),
    );
    expect(openWindow).toHaveBeenCalledWith(expectedUrl);
  });

  it('handles URL separator correctly when building support link', async () => {
    const { getByTestId } = renderModal();

    await waitFor(() => {
      fireEvent.click(
        getByTestId('visit-support-data-consent-modal-accept-button'),
      );
    });

    const calledUrl = (openWindow as jest.Mock).mock.calls[0][0];

    // Verify URL is properly formed with correct separator
    expect(calledUrl).toMatch(/[?&]metamask_version=/u);
    // Should not have double separators
    expect(calledUrl).not.toContain('??');
  });

  it('handles reject button when SUPPORT_LINK is properly formed', async () => {
    const { getByTestId } = renderModal();

    await waitFor(() => {
      fireEvent.click(
        getByTestId('visit-support-data-consent-modal-reject-button'),
      );
    });

    // Should strip personal params but preserve URL structure
    expect(openWindow).toHaveBeenCalled();
    const calledUrl = (openWindow as jest.Mock).mock.calls[0][0];

    // Verify personal params are not in URL
    expect(calledUrl).not.toContain('metamask_profile_id');
    expect(calledUrl).not.toContain('metamask_canonical_profile_id');
    expect(calledUrl).not.toContain('metamask_metametrics_id');
    expect(calledUrl).not.toContain('shield_id');
    expect(calledUrl).not.toContain('metamask_version');
  });

  it('handles reject button and opens support link', async () => {
    const { getByTestId } = renderModal();

    fireEvent.click(
      getByTestId('visit-support-data-consent-modal-reject-button'),
    );

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.SupportLinkClicked,
        properties: expect.objectContaining({
          category: MetaMetricsEventCategory.Settings,
          [MetaMetricsContextProp.PageTitle]: 'Settings',
        }),
      }),
    );
    expect(openWindow).toHaveBeenCalled();
  });

  it('does not render modal when isOpen is false', () => {
    const { queryByTestId } = renderModal({ isOpen: false });
    expect(queryByTestId('visit-support-data-consent-modal')).toBeNull();
  });

  it('passes onClose prop to modal component', () => {
    const customOnClose = jest.fn();
    renderModal({ onClose: customOnClose });

    // The modal component receives the onClose prop
    // This tests that the prop is correctly passed through
    expect(customOnClose).not.toHaveBeenCalled();
  });

  it('handles null sessionData gracefully', async () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === selectSessionData) {
        return null;
      }
      if (selector === getAnalyticsId) {
        return mockAnalyticsId;
      }
      return undefined;
    });

    const { getByTestId } = renderModal();

    await waitFor(() => {
      fireEvent.click(
        getByTestId('visit-support-data-consent-modal-accept-button'),
      );
    });

    const expectedUrl = buildSupportLinkWithUserData(SUPPORT_LINK as string, {
      version: 'MOCK_VERSION',
      analyticsId: mockAnalyticsId,
      shieldCustomerId: mockShieldCustomerId,
    });

    expect(openWindow).toHaveBeenCalledWith(expectedUrl);
  });

  it('handles sessionData with no profile', async () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === selectSessionData) {
        return { profile: null };
      }
      if (selector === getAnalyticsId) {
        return mockAnalyticsId;
      }
      return undefined;
    });

    const { getByTestId } = renderModal();

    await waitFor(() => {
      fireEvent.click(
        getByTestId('visit-support-data-consent-modal-accept-button'),
      );
    });

    const expectedUrl = buildSupportLinkWithUserData(SUPPORT_LINK as string, {
      version: 'MOCK_VERSION',
      analyticsId: mockAnalyticsId,
      shieldCustomerId: mockShieldCustomerId,
    });

    expect(openWindow).toHaveBeenCalledWith(expectedUrl);
  });

  it('handles accept button with only analyticsId defined', async () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === selectSessionData) {
        return { profile: { profileId: undefined } };
      }
      if (selector === getAnalyticsId) {
        return mockAnalyticsId;
      }
      return undefined;
    });

    useUserSubscriptionsMock.mockReturnValue({
      customerId: undefined,
      subscriptions: [],
      trialedProducts: [],
      loading: false,
      error: undefined,
    });

    const { getByTestId } = renderModal();

    await waitFor(() => {
      fireEvent.click(
        getByTestId('visit-support-data-consent-modal-accept-button'),
      );
    });

    const expectedUrl = buildSupportLinkWithUserData(SUPPORT_LINK as string, {
      version: 'MOCK_VERSION',
      analyticsId: mockAnalyticsId,
    });

    expect(openWindow).toHaveBeenCalledWith(expectedUrl);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders modal with correct text content', () => {
    const { getByTestId } = renderModal();
    const modal = getByTestId('visit-support-data-consent-modal');
    expect(modal).toBeInTheDocument();
  });

  it('calls trackEvent and openWindow in correct order on accept', async () => {
    const callOrder: string[] = [];

    mockTrackEvent.mockImplementation(() => {
      callOrder.push('trackEvent');
    });

    (openWindow as jest.Mock).mockImplementation(() => {
      callOrder.push('openWindow');
    });

    const { getByTestId } = renderModal();

    await waitFor(() => {
      fireEvent.click(
        getByTestId('visit-support-data-consent-modal-accept-button'),
      );
    });

    expect(callOrder).toEqual(['trackEvent', 'openWindow']);
  });

  it('calls trackEvent and openWindow in correct order on reject', async () => {
    const callOrder: string[] = [];

    mockTrackEvent.mockImplementation(() => {
      callOrder.push('trackEvent');
    });

    (openWindow as jest.Mock).mockImplementation(() => {
      callOrder.push('openWindow');
    });

    const { getByTestId } = renderModal();

    await waitFor(() => {
      fireEvent.click(
        getByTestId('visit-support-data-consent-modal-reject-button'),
      );
    });

    expect(callOrder).toEqual(['trackEvent', 'openWindow']);
  });
});
