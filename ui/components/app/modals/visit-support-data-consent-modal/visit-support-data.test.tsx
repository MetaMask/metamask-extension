import * as React from 'react';
import { useSelector } from 'react-redux';
import { fireEvent } from '@testing-library/react';
import configureMockState from 'redux-mock-store';
import thunk from 'redux-thunk';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { openWindow } from '../../../../helpers/utils/window';
import { SUPPORT_LINK } from '../../../../../shared/lib/ui-utils';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
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

describe('VisitSupportDataConsentModal', () => {
  const store = configureMockState([thunk])(mockState);
  const mockTrackEvent = jest.fn();
  const mockOnClose = jest.fn();
  const mockProfileId = 'test-profile-id';
  const mockMetaMetricsId = 'test-metrics-id';

  const useSelectorMock = useSelector as jest.Mock;

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
      <MetaMetricsContext.Provider value={mockTrackEvent}>
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

    const expectedUrl = `${SUPPORT_LINK}?metamask_version=MOCK_VERSION&metamask_profile_id=${mockProfileId}&metamask_metametrics_id=${mockMetaMetricsId}`;

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

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.SupportLinkClicked,
        properties: {
          url: SUPPORT_LINK,
        },
      }),
      {
        contextPropsIntoEventProperties: [MetaMetricsContextProp.PageTitle],
      },
    );
    expect(openWindow).toHaveBeenCalledWith(SUPPORT_LINK);
  });

  it('handles clicking the accept button with undefined parameters', () => {
    useSelectorMock.mockImplementation(() => undefined);
    const { getByTestId } = renderModal();

    fireEvent.click(
      getByTestId('visit-support-data-consent-modal-accept-button'),
    );

    const expectedUrl = `${SUPPORT_LINK}?metamask_version=MOCK_VERSION`;

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
});
