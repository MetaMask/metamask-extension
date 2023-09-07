import React from 'react';
import { render, screen } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
import TokenList from './token-list';

// Mock the useSelector function
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../../../hooks/useTokenTracker', () => ({
  useTokenTracker: jest.fn(),
}));

jest.mock('../token-cell', () => {
  return {
    __esModule: true,
    default: () => {
      return (
        <div className="mock-token-cell-component">
          <div data-testid="token-cell">ETH</div>
          <div data-testid="token-cell">ABC</div>
        </div>
      );
    },
  };
});

// Mock other necessary functions and dependencies as needed

describe('TokenList Component', () => {
  afterEach(() => {
    useSelector.mockClear();
    useTokenTracker.mockClear();
  });

  // Test Case 1: Test sorting of tokens by balance
  it('should render tokens sorted by balance in descending order', () => {
    // Mock unsorted data
    const unsortedTokensWithBalances = [
      { symbol: 'ABC', balance: '0.567' },
      { symbol: 'ETH', balance: '1.234' },
    ];
    // Mock expected sorted data
    useSelector.mockReturnValueOnce(false); // Mock loading state

    useTokenTracker.mockReturnValue({
      loading: false,
      tokensWithBalances: unsortedTokensWithBalances,
    }); // Mock loading state

    useSelector.mockReturnValueOnce(unsortedTokensWithBalances); // Mock tokens

    render(
      <TokenList
        onTokenClick={() => {
          return null;
        }}
      />,
    );

    // Assert that TokenCells are rendered in the correct order (sorted by balance)
    const tokenElements = screen.getAllByTestId('token-cell');
    expect(tokenElements[0]).toHaveTextContent('ETH');
    expect(tokenElements[1]).toHaveTextContent('ABC');
  });
});
