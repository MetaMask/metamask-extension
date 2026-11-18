import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import mockState from '../../../../../../test/data/mock-state.json';
import { ThemeType } from '../../../../../../shared/constants/preferences';
import { DeFiEmptyStateMessage } from './defi-empty-state';

const mockTrackEvent = jest.fn();

jest.mock('../../../../../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: mockTrackEvent,
    createEventBuilder: jest.fn(() => ({
      addCategory: jest.fn().mockReturnThis(),
      addProperties: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({}),
    })),
  }),
}));

describe('DeFiEmptyStateMessage', () => {
  const mockStore = configureMockStore([thunk]);
  let store: ReturnType<typeof mockStore>;

  const renderComponent = (stateOverride = {}) => {
    store = mockStore({ ...mockState, ...stateOverride });
    return renderWithProvider(<DeFiEmptyStateMessage />, store);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the default empty state with correct test id', () => {
    renderComponent();
    expect(screen.getByTestId('defi-tab-empty-state')).toBeInTheDocument();
  });

  it('renders explore DeFi button', () => {
    renderComponent();
    expect(
      screen.getByRole('button', { name: messages.exploreDefi.message }),
    ).toBeInTheDocument();
  });

  it('opens portfolio when explore DeFi button is clicked', () => {
    const openTabSpy = jest.spyOn(global.platform, 'openTab');
    renderComponent();

    fireEvent.click(
      screen.getByRole('button', { name: messages.exploreDefi.message }),
    );

    expect(openTabSpy).toHaveBeenCalled();
    expect(mockTrackEvent).toHaveBeenCalled();
  });

  it('renders light theme icon by default', () => {
    renderComponent();

    const image = screen.getByAltText('DeFi');
    expect(image).toHaveAttribute('src', '/images/empty-state-defi-light.png');
  });

  it('renders dark theme icon when theme is dark', () => {
    renderComponent({
      metamask: {
        ...mockState.metamask,
        theme: ThemeType.dark,
      },
    });

    const image = screen.getByAltText('DeFi');
    expect(image).toHaveAttribute('src', '/images/empty-state-defi-dark.png');
  });

  describe('when a non-EVM network is selected', () => {
    const nonEvmNetworkState = {
      metamask: {
        ...mockState.metamask,
        isEvmSelected: false,
      },
    };

    it('renders the unsupported empty state', () => {
      renderComponent(nonEvmNetworkState);

      expect(
        screen.getByTestId('defi-tab-unsupported-empty-state'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('defi-tab-empty-state'),
      ).not.toBeInTheDocument();
    });

    it('does not render explore DeFi button', () => {
      renderComponent(nonEvmNetworkState);

      expect(
        screen.queryByRole('button', { name: messages.exploreDefi.message }),
      ).not.toBeInTheDocument();
    });
  });
});
