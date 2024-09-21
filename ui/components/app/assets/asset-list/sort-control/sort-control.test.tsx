import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SortControl from './sort-control';
import { setTokenSortConfig } from '../../../../../store/actions';
import { TokenWithBalance } from '../asset-list';
import { useDispatch, useSelector } from 'react-redux';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
// import { useDispatch, useSelector } from 'react-redux';

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

const useSelectorMock = useSelector;
const useDispatchMock = useDispatch;

describe('SortControl', () => {
  const mockTrackEvent = jest.fn();
  const tokenList: TokenWithBalance[] = [
    {
      address: '0x1',
      symbol: 'ETH',
      image: 'eth-image-url',
      tokenFiatAmount: '100',
      isNative: true,
    },
    {
      address: '0x2',
      symbol: 'DAI',
      image: 'dai-image-url',
      tokenFiatAmount: '50',
      isNative: false,
    },
  ];

  const renderComponent = (sorted = false) => {
    const setTokenList = jest.fn();
    const setSorted = jest.fn();

    (useSelectorMock as jest.Mock).mockImplementation(() => {
      return {
        key: 'tokenFiatAmount',
        sortCallback: 'stringNumeric',
        order: 'dsc',
      };
    });

    return renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <SortControl
          tokenList={tokenList}
          setTokenList={setTokenList}
          setSorted={setSorted}
          sorted={sorted}
        />
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

    expect(screen.getByText('Alphabetically (A-Z)')).toBeInTheDocument();
    expect(
      screen.getByText('Declining balance ($ high-low)'),
    ).toBeInTheDocument();
  });

  it('dispatches setTokenSortConfig with expected config, and tracks event when Alphabetically is clicked', () => {
    renderComponent();

    const alphabeticallyButton = screen.getByText('Alphabetically (A-Z)');
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

    const decliningBalanceButton = screen.getByText(
      'Declining balance ($ high-low)',
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
