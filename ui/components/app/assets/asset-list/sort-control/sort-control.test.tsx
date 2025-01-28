import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { setTokenSortConfig } from '../../../../../store/actions';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import { getPreferences } from '../../../../../selectors';
import { getCurrentCurrency } from '../../../../../ducks/metamask/metamask';
import SortControl from './sort-control';

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
  const mockTrackEvent = jest.fn();

  const renderComponent = () => {
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === getPreferences) {
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

    return renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <SortControl handleClose={mockHandleClose} />
      </MetaMetricsContext.Provider>,
    );
  };

  beforeEach(() => {
    mockDispatch.mockClear();
    mockTrackEvent.mockClear();
    (setTokenSortConfig as jest.Mock).mockClear();
  });

  it('renders correctly', () => {
    renderComponent();

    expect(screen.getByTestId('sortByAlphabetically')).toBeInTheDocument();
    expect(screen.getByTestId('sortByDecliningBalance')).toBeInTheDocument();
  });

  it('dispatches setTokenSortConfig with expected config, and tracks event when Alphabetically is clicked', () => {
    renderComponent();

    const alphabeticallyButton = screen.getByTestId(
      'sortByAlphabetically__button',
    );
    fireEvent.click(alphabeticallyButton);

    expect(mockDispatch).toHaveBeenCalled();
    expect(setTokenSortConfig).toHaveBeenCalledWith({
      key: 'symbol',
      sortCallback: 'alphaNumeric',
      order: 'asc',
    });

    expect(mockTrackEvent).toHaveBeenCalledWith({
      category: 'Settings',
      event: 'Token Sort Preference',
      properties: {
        token_sort_preference: 'symbol',
      },
    });
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

    expect(mockTrackEvent).toHaveBeenCalledWith({
      category: 'Settings',
      event: 'Token Sort Preference',
      properties: {
        token_sort_preference: 'tokenFiatAmount',
      },
    });
  });
});
