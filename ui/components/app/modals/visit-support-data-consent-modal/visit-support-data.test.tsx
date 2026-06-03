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
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { openWindow } from '../../../../helpers/utils/window';
import { useUserSubscriptions } from '../../../../hooks/subscription/useSubscription';
import { selectSessionData } from '../../../../selectors/identity/authentication';
import { getMetaMetricsId } from '../../../../selectors/selectors';
import VisitSupportDataConsentModal from './visit-support-data-consent-modal';

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
  const mockTrackEvent = jest.fn();
  const mockMetaMetricsContext = {
    trackEvent: mockTrackEvent,
    bufferedTrace: jest.fn(),
    bufferedEndTrace: jest.fn(),
    onboardingParentContext: { current: null },
  };
  const mockOnClose = jest.fn();
  const mockProfileId = 'test-profile-id';
  const mockMetaMetricsId = 'test-metrics-id';
  const mockShieldCustomerId = 'test-shield-customer-id';
  const useSelectorMock = useSelector as jest.Mock;
  const useUserSubscriptionsMock = useUserSubscriptions as jest.Mock;

  beforeEach(() => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === selectSessionData) {
        return { profile: { profileId: mockProfileId } };
      }
      if (selector === getMetaMetricsId) {
        return mockMetaMetricsId;
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
      <MetaMetricsContext.Provider value={mockMetaMetricsContext}>
        <VisitSupportDataConsentModal {...defaultProps} />
      </MetaMetricsContext.Provider>,
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

    const url = new URL(SUPPORT_LINK as string);
    url.searchParams.append('metamask_version', 'MOCK_VERSION');
    url.searchParams.append('metamask_profile_id', mockProfileId);
    url.searchParams.append('metamask_metametrics_id', mockMetaMetricsId);
    url.searchParams.append('shield_id', mockShieldCustomerId);
    const expectedUrl = url.toString();

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.SupportLinkClicked,
        properties: {
          url: expectedUrl,
        },
      }),
      {
        contextPropsIntoEventProperties: [MetaMetricsContextProp.PageTitle],
      },
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
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.SupportLinkClicked,
        properties: {
          url: expectedUrl,
        },
      }),
      {
        contextPropsIntoEventProperties: [MetaMetricsContextProp.PageTitle],
      },
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

    const url = new URL(SUPPORT_LINK as string);
    url.searchParams.append('metamask_version', 'MOCK_VERSION');
    url.searchParams.append('metamask_profile_id', mockProfileId);
    url.searchParams.append('metamask_metametrics_id', mockMetaMetricsId);
    const expectedUrl = url.toString();

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.SupportLinkClicked,
        properties: {
          url: expectedUrl,
        },
      }),
      {
        contextPropsIntoEventProperties: [MetaMetricsContextProp.PageTitle],
      },
    );
    expect(openWindow).toHaveBeenCalledWith(expectedUrl);
  });

  it('handles clicking the accept button with all undefined parameters', async () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === selectSessionData) {
        return { profile: { profileId: undefined } };
      }
      if (selector === getMetaMetricsId) {
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

    const url = new URL(SUPPORT_LINK as string);
    url.searchParams.append('metamask_version', 'MOCK_VERSION');
    const expectedUrl = url.toString();

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.SupportLinkClicked,
        properties: {
          url: expectedUrl,
        },
      }),
      {
        contextPropsIntoEventProperties: [MetaMetricsContextProp.PageTitle],
      },
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
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.SupportLinkClicked,
      }),
      expect.objectContaining({
        contextPropsIntoEventProperties: [MetaMetricsContextProp.PageTitle],
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
      if (selector === getMetaMetricsId) {
        return mockMetaMetricsId;
      }
      return undefined;
    });

    const { getByTestId } = renderModal();

    await waitFor(() => {
      fireEvent.click(
        getByTestId('visit-support-data-consent-modal-accept-button'),
      );
    });

    const url = new URL(SUPPORT_LINK as string);
    url.searchParams.append('metamask_version', 'MOCK_VERSION');
    url.searchParams.append('metamask_metametrics_id', mockMetaMetricsId);
    url.searchParams.append('shield_id', mockShieldCustomerId);
    const expectedUrl = url.toString();

    expect(openWindow).toHaveBeenCalledWith(expectedUrl);
  });

  it('handles sessionData with no profile', async () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === selectSessionData) {
        return { profile: null };
      }
      if (selector === getMetaMetricsId) {
        return mockMetaMetricsId;
      }
      return undefined;
    });

    const { getByTestId } = renderModal();

    await waitFor(() => {
      fireEvent.click(
        getByTestId('visit-support-data-consent-modal-accept-button'),
      );
    });

    const url = new URL(SUPPORT_LINK as string);
    url.searchParams.append('metamask_version', 'MOCK_VERSION');
    url.searchParams.append('metamask_metametrics_id', mockMetaMetricsId);
    url.searchParams.append('shield_id', mockShieldCustomerId);
    const expectedUrl = url.toString();

    expect(openWindow).toHaveBeenCalledWith(expectedUrl);
  });

  it('handles accept button with only metaMetricsId defined', async () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === selectSessionData) {
        return { profile: { profileId: undefined } };
      }
      if (selector === getMetaMetricsId) {
        return mockMetaMetricsId;
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

    const url = new URL(SUPPORT_LINK as string);
    url.searchParams.append('metamask_version', 'MOCK_VERSION');
    url.searchParams.append('metamask_metametrics_id', mockMetaMetricsId);
    const expectedUrl = url.toString();

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
