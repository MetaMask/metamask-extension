import * as React from 'react';
import { useSelector } from 'react-redux';
import { fireEvent } from '@testing-library/react';
import configureMockState from 'redux-mock-store';
import thunk from 'redux-thunk';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { openWindow } from '../../../../helpers/utils/window';
import { SUPPORT_LINK } from '../../../../../shared/lib/ui-utils';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { selectSessionData } from '../../../../selectors/identity/authentication';
import { getMetaMetricsId } from '../../../../selectors/selectors';
import { getUserSubscriptions } from '../../../../selectors/subscription';
import VisitSupportDataConsentModal from './visit-support-data-consent-modal';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../../../../helpers/utils/window', () => ({
  openWindow: jest.fn(),
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

  beforeEach(() => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === selectSessionData) {
        return { profile: { profileId: mockProfileId } };
      }
      if (selector === getMetaMetricsId) {
        return mockMetaMetricsId;
      }
      if (selector === getUserSubscriptions) {
        return {
          customerId: mockShieldCustomerId,
          subscriptions: [],
          trialedProducts: [],
        };
      }
      return undefined;
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

  it('handles clicking the accept button correctly', () => {
    const { getByTestId } = renderModal();

    fireEvent.click(
      getByTestId('visit-support-data-consent-modal-accept-button'),
    );

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

  it('handles clicking the reject button correctly', () => {
    const { getByTestId } = renderModal();

    fireEvent.click(
      getByTestId('visit-support-data-consent-modal-reject-button'),
    );

    // When user rejects, URL should preserve non-personal params (like utm_source)
    // URL constructor normalizes the URL (adds / before ?)
    const expectedUrl = new URL(SUPPORT_LINK as string).toString();

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

  it('handles clicking the accept button with undefined parameters', () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getUserSubscriptions) {
        return {
          customerId: undefined,
          subscriptions: [],
          trialedProducts: [],
        };
      }
      return undefined;
    });
    const { getByTestId } = renderModal();

    fireEvent.click(
      getByTestId('visit-support-data-consent-modal-accept-button'),
    );

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

  it('handles clicking the accept button with all undefined parameters', () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === selectSessionData) {
        return { profile: { profileId: undefined } };
      }
      if (selector === getMetaMetricsId) {
        return undefined;
      }
      if (selector === getUserSubscriptions) {
        return {
          customerId: undefined,
          subscriptions: [],
          trialedProducts: [],
        };
      }
      return undefined;
    });
    const { getByTestId } = renderModal();

    fireEvent.click(
      getByTestId('visit-support-data-consent-modal-accept-button'),
    );

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

  it('handles URL separator correctly when building support link', () => {
    const { getByTestId } = renderModal();

    fireEvent.click(
      getByTestId('visit-support-data-consent-modal-accept-button'),
    );

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
    expect(calledUrl).not.toContain('metamask_profile_id');
    expect(calledUrl).not.toContain('metamask_metametrics_id');
    expect(calledUrl).not.toContain('shield_id');
    expect(calledUrl).not.toContain('metamask_version');
  });
});
