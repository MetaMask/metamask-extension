import React from 'react';
import { render } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { setTokenSortConfig } from '../../../../../store/actions';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { getTokenSortConfig } from '../../../../../selectors';
import { getCurrentCurrency } from '../../../../../ducks/metamask/metamask';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';

import SortControl, { SelectableListItem } from './sort-control';

jest.mock('../../../../../hooks/useAnalytics', () => {
  const mockTrackEvent = jest.fn();

  return {
    useAnalytics: () => ({
      createEventBuilder: jest.requireActual(
        '../../../../../../shared/lib/analytics/create-event-builder',
      ).createEventBuilder,
      trackEvent: mockTrackEvent,
    }),
    mockTrackEvent,
  };
});

const getMockTrackEvent = () =>
  jest.requireMock('../../../../../hooks/useAnalytics')
    .mockTrackEvent as jest.Mock;

// Mock the sortAssets utility
jest.mock('../../util/sort', () => ({
  sortAssets: jest.fn(() => []), // mock sorting implementation
}));

// Mock the setTokenSortConfig action creator
jest.mock('../../../../../store/actions', () => ({
  setTokenSortConfig: jest.fn(),
}));

// Mock the dispatch function
const mockDispatch = jest.fn();

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useSelector: jest.fn(),
    useDispatch: () => mockDispatch,
  };
});

const mockHandleClose = jest.fn();

describe('SortControl', () => {
  const renderComponent = () => {
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === getTokenSortConfig) {
        return {
          key: 'tokenFiatAmount',
          sortCallback: 'stringNumeric',
          order: 'dsc',
        };
      }
      if (selector === getCurrentCurrency) {
        return 'usd';
      }
      return undefined;
    });

    const store = configureStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        analyticsId: 'test-analytics-id',
        completedMetaMetricsOnboarding: true,
        optedIn: true,
      },
    });

    return renderWithProvider(
      <SortControl handleClose={mockHandleClose} />,
      store,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getMockTrackEvent().mockClear();
    mockDispatch.mockClear();
    (setTokenSortConfig as jest.Mock).mockClear();
  });

  it('renders correctly', () => {
    renderComponent();

    expect(screen.getByTestId('sortByAlphabetically')).toBeInTheDocument();
    expect(screen.getByTestId('sortByDecliningBalance')).toBeInTheDocument();
    expect(screen.getByTestId('sortByDecliningBalance__button')).toHaveClass(
      'selectable-list-item--selected',
    );
  });

  it('dispatches setTokenSortConfig with expected config, and tracks event when Alphabetically is clicked', () => {
    renderComponent();

    const alphabeticallyButton = screen.getByTestId(
      'sortByAlphabetically__button',
    );
    fireEvent.click(alphabeticallyButton);

    expect(mockDispatch).toHaveBeenCalled();
    expect(setTokenSortConfig).toHaveBeenCalledWith({
      key: 'title',
      sortCallback: 'alphaNumeric',
      order: 'asc',
    });

    expect(getMockTrackEvent()).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.TokenSortPreference,
        properties: {
          category: MetaMetricsEventCategory.Settings,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_sort_preference: 'title',
        },
        sensitiveProperties: {},
      }),
    );
  });

  it('dispatches setTokenSortConfig with expected config, and tracks event when Declining balance is clicked', () => {
    renderComponent();

    const decliningBalanceButton = screen.getByTestId(
      'sortByDecliningBalance__button',
    );
    fireEvent.click(decliningBalanceButton);

    expect(mockDispatch).toHaveBeenCalled();
    expect(setTokenSortConfig).toHaveBeenCalledWith({
      key: 'tokenFiatAmount',
      sortCallback: 'stringNumeric',
      order: 'dsc',
    });

    expect(getMockTrackEvent()).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.TokenSortPreference,
        properties: {
          category: MetaMetricsEventCategory.Settings,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_sort_preference: 'tokenFiatAmount',
        },
        sensitiveProperties: {},
      }),
    );
  });
});

describe('SelectableListItem', () => {
  it('rounds the top corners of the first item in the list', () => {
    const { container } = render(
      <div>
        <SelectableListItem testId="first">First</SelectableListItem>
        <SelectableListItem testId="second">Second</SelectableListItem>
      </div>,
    );

    const first = container.querySelector(
      '.selectable-list-item-wrapper:first-child .selectable-list-item',
    );
    const second = container.querySelector(
      '.selectable-list-item-wrapper:last-child .selectable-list-item',
    );

    expect(first).toBeInTheDocument();
    expect(second).toBeInTheDocument();
  });
});
