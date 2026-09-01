import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { ORIGIN_METAMASK } from '../../../../shared/constants/app';
import configureStore from '../../../store/store';
import {
  BalanceEmptyState,
  BalanceEmptyStateProps,
} from './balance-empty-state';

const mockTrackEvent = jest.fn();

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );
  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
  localeMessages: mockState.localeMessages,
});

const renderComponent = (props: Partial<BalanceEmptyStateProps> = {}) => {
  return renderWithProvider(<BalanceEmptyState {...props} />, store);
};

describe('BalanceEmptyState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the component', () => {
    renderComponent();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('tracks Empty Buy Banner Displayed when the component mounts', () => {
    renderComponent();

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: MetaMetricsEventName.EmptyBuyBannerDisplayed,
      properties: {
        category: MetaMetricsEventCategory.Navigation,
        locale: 'en',
        network: 'Goerli',
        referrer: ORIGIN_METAMASK,
        location: 'balance_empty_state',
      },
      sensitiveProperties: {},
    });
  });

  it('should open the funding method modal when button is clicked', () => {
    renderComponent();

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(
      screen.getByTestId('balance-empty-state-funding-modal'),
    ).toBeInTheDocument();
  });
});
