/* eslint-disable @typescript-eslint/naming-convention -- MetaMetrics event properties use snake_case */
import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import { PerpsGeoBlockModal } from './perps-geo-block-modal';

const mockAnalyticsTrackEvent = jest.fn();
jest.mock('../../../../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: mockAnalyticsTrackEvent,
    createEventBuilder: (name: string) => {
      const event: { name: string; properties: Record<string, unknown> } = {
        name,
        properties: {},
      };
      const builder = {
        addCategory: () => builder,
        addProperties: (properties: Record<string, unknown>) => {
          Object.assign(event.properties, properties);
          return builder;
        },
        build: () => event,
      };
      return builder;
    },
  }),
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('PerpsGeoBlockModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title and description when open', () => {
    renderWithProvider(<PerpsGeoBlockModal {...defaultProps} />, mockStore);

    expect(
      screen.getByText(messages.perpsGeoBlockedTitle.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.perpsGeoBlockedDescription.message),
    ).toBeInTheDocument();
  });

  it('renders a "Got it" dismiss button', () => {
    renderWithProvider(<PerpsGeoBlockModal {...defaultProps} />, mockStore);

    expect(
      screen.getByTestId('perps-geo-block-modal-dismiss'),
    ).toBeInTheDocument();
  });

  it('calls onClose when dismiss button is clicked', () => {
    renderWithProvider(<PerpsGeoBlockModal {...defaultProps} />, mockStore);

    fireEvent.click(screen.getByTestId('perps-geo-block-modal-dismiss'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('emits a geo_block_notif screen view once while open', () => {
    const { rerender } = renderWithProvider(
      <PerpsGeoBlockModal {...defaultProps} />,
      mockStore,
    );
    rerender(<PerpsGeoBlockModal {...defaultProps} />);

    const screenViews = mockAnalyticsTrackEvent.mock.calls.filter(
      ([arg]) => arg?.name === MetaMetricsEventName.PerpsScreenViewed,
    );
    expect(screenViews).toHaveLength(1);
    expect(screenViews[0][0].properties).toEqual(
      expect.objectContaining({ screen_type: 'geo_block_notif' }),
    );
  });

  it('does not emit while closed, and re-arms for the next open', () => {
    const { rerender } = renderWithProvider(
      <PerpsGeoBlockModal isOpen={false} onClose={defaultProps.onClose} />,
      mockStore,
    );
    expect(mockAnalyticsTrackEvent).not.toHaveBeenCalled();

    rerender(<PerpsGeoBlockModal isOpen onClose={defaultProps.onClose} />);
    rerender(
      <PerpsGeoBlockModal isOpen={false} onClose={defaultProps.onClose} />,
    );
    rerender(<PerpsGeoBlockModal isOpen onClose={defaultProps.onClose} />);

    // Each open is a distinct restriction notice the user saw.
    expect(
      mockAnalyticsTrackEvent.mock.calls.filter(
        ([arg]) => arg?.name === MetaMetricsEventName.PerpsScreenViewed,
      ),
    ).toHaveLength(2);
  });
});
