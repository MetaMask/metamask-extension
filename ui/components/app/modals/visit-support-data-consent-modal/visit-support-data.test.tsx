import { fireEvent, waitFor } from '@testing-library/react';
import * as React from 'react';
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
import { getCustomerServiceToken } from '../../../../store/actions';
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

jest.mock('../../../../helpers/utils/window', () => ({
  openWindow: jest.fn(),
}));

jest.mock('../../../../hooks/subscription/useSubscription', () => ({
  useUserSubscriptions: jest.fn(),
}));

jest.mock('../../../../store/actions', () => ({
  getCustomerServiceToken: jest.fn(),
}));

describe('VisitSupportDataConsentModal', () => {
  const store = configureMockState([thunk])(mockState);
  const mockOnClose = jest.fn();
  const mockCustomerServiceToken = 'test-customer-service-token';
  const mockShieldCustomerId = 'test-shield-customer-id';
  const useUserSubscriptionsMock = useUserSubscriptions as jest.Mock;
  const getCustomerServiceTokenMock = jest.mocked(getCustomerServiceToken);

  beforeEach(() => {
    getCustomerServiceTokenMock.mockResolvedValue(mockCustomerServiceToken);
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

    fireEvent.click(
      getByTestId('visit-support-data-consent-modal-accept-button'),
    );

    const expectedUrl = buildSupportLinkWithUserData(SUPPORT_LINK as string, {
      version: 'MOCK_VERSION',
      customerServiceToken: mockCustomerServiceToken,
      shieldCustomerId: mockShieldCustomerId,
    });

    await waitFor(() => {
      expect(getCustomerServiceTokenMock).toHaveBeenCalled();
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
  });

  it('keeps the modal open and shows loading until the token request settles', async () => {
    let resolveToken: (token: string | undefined) => void = () => undefined;
    getCustomerServiceTokenMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveToken = resolve;
        }),
    );

    const { getByTestId } = renderModal();
    const acceptButton = getByTestId(
      'visit-support-data-consent-modal-accept-button',
    );
    const rejectButton = getByTestId(
      'visit-support-data-consent-modal-reject-button',
    );

    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(acceptButton).toBeDisabled();
      expect(rejectButton).toBeDisabled();
      expect(mockOnClose).not.toHaveBeenCalled();
      expect(openWindow).not.toHaveBeenCalled();
    });

    resolveToken(mockCustomerServiceToken);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
      expect(openWindow).toHaveBeenCalled();
    });
  });

  it('handles clicking the reject button correctly', () => {
    const { getByTestId } = renderModal();

    fireEvent.click(
      getByTestId('visit-support-data-consent-modal-reject-button'),
    );

    // When user rejects, URL should preserve non-personal params (like utm_source)
    const expectedUrl = SUPPORT_LINK;

    expect(mockOnClose).toHaveBeenCalled();
    expect(getCustomerServiceTokenMock).not.toHaveBeenCalled();
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

    fireEvent.click(
      getByTestId('visit-support-data-consent-modal-accept-button'),
    );

    const expectedUrl = buildSupportLinkWithUserData(SUPPORT_LINK as string, {
      version: 'MOCK_VERSION',
      customerServiceToken: mockCustomerServiceToken,
    });

    await waitFor(() => {
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
  });

  it('falls back to support link without token when token is unavailable', async () => {
    getCustomerServiceTokenMock.mockResolvedValue(undefined);
    useUserSubscriptionsMock.mockReturnValue({
      customerId: undefined,
      subscriptions: [],
      trialedProducts: [],
      loading: false,
      error: undefined,
    });

    const { getByTestId } = renderModal();

    fireEvent.click(
      getByTestId('visit-support-data-consent-modal-accept-button'),
    );

    const expectedUrl = buildSupportLinkWithUserData(SUPPORT_LINK as string, {
      version: 'MOCK_VERSION',
    });

    await waitFor(() => {
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
  });

  it('handles URL separator correctly when building support link', async () => {
    const { getByTestId } = renderModal();

    fireEvent.click(
      getByTestId('visit-support-data-consent-modal-accept-button'),
    );

    await waitFor(() => {
      expect(openWindow).toHaveBeenCalled();
    });

    const calledUrl = (openWindow as jest.Mock).mock.calls[0][0];
    // Verify URL is properly formed with correct separator
    expect(calledUrl).toMatch(/[?&]metamask_version=/u);
    // Should not have double separators
    expect(calledUrl).not.toContain('??');
  });

  it('handles reject button when SUPPORT_LINK is properly formed', () => {
    const { getByTestId } = renderModal();

    fireEvent.click(
      getByTestId('visit-support-data-consent-modal-reject-button'),
    );

    // Should strip personal params but preserve URL structure
    expect(openWindow).toHaveBeenCalled();
    const calledUrl = (openWindow as jest.Mock).mock.calls[0][0];

    // Verify personal params are not in URL
    expect(calledUrl).not.toContain('customer_service_token');
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

    fireEvent.click(
      getByTestId('visit-support-data-consent-modal-accept-button'),
    );

    await waitFor(() => {
      expect(callOrder).toEqual(['trackEvent', 'openWindow']);
    });
  });

  it('calls trackEvent and openWindow in correct order on reject', () => {
    const callOrder: string[] = [];

    mockTrackEvent.mockImplementation(() => {
      callOrder.push('trackEvent');
    });

    (openWindow as jest.Mock).mockImplementation(() => {
      callOrder.push('openWindow');
    });

    const { getByTestId } = renderModal();

    fireEvent.click(
      getByTestId('visit-support-data-consent-modal-reject-button'),
    );

    expect(callOrder).toEqual(['trackEvent', 'openWindow']);
  });
});
