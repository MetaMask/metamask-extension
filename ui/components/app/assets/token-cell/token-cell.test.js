import React from 'react';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { useTokenFiatAmount } from '../../../../hooks/useTokenFiatAmount';

import { useIsOriginalTokenSymbol } from '../../../../hooks/useIsOriginalTokenSymbol';
import TokenCell from '.';

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');

  return {
    ...actual,
    useSelector: jest.fn(),
  };
});

jest.mock('../../../../hooks/useTokenFiatAmount', () => {
  return {
    useTokenFiatAmount: jest.fn(),
  };
});

jest.mock('../../../../hooks/useIsOriginalTokenSymbol', () => {
  return {
    useIsOriginalTokenSymbol: jest.fn(),
  };
});
describe('Token Cell', () => {
  const mockState = {
    metamask: {
      marketData: {
        '0x1': {
          '0xAnotherToken': { price: 0.015 },
        },
      },
      currentCurrency: 'usd',
      currencyRates: {
        ETH: {
          conversionRate: 7.0,
        },
      },
      preferences: {},
    },
  };

  useIsOriginalTokenSymbol.mockReturnValue(true);

  // two tokens with the same symbol but different addresses
  const MOCK_GET_TOKEN_LIST = {
    '0xAddress': {
      name: 'TEST-2',
      erc20: true,
      symbol: 'TEST',
      decimals: 18,
      address: '0xAddress',
      iconUrl: './images/test_1_image.svg',
      aggregators: [],
    },
    '0xAnotherToken': {
      name: 'TEST',
      erc20: true,
      symbol: 'TEST',
      decimals: 18,
      address: '0xANoTherToKen',
      iconUrl: './images/test_image.svg',
      aggregators: [],
    },
  };

  const mockStore = configureMockStore([thunk])(mockState);

  const props = {
    address: '0xAnotherToken',
    symbol: 'TEST',
    string: '5.000',
    currentCurrency: 'usd',
    onClick: jest.fn(),
  };

  const propsLargeAmount = {
    address: '0xAnotherToken',
    symbol: 'TEST',
    string: '5000000',
    currentCurrency: 'usd',
    onClick: jest.fn(),
  };
  useSelector.mockReturnValue(MOCK_GET_TOKEN_LIST);
  useTokenFiatAmount.mockReturnValue('5.00');

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <TokenCell {...props} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('calls onClick when clicked', () => {
    const { queryByTestId } = renderWithProvider(
      <TokenCell {...props} />,
      mockStore,
    );

    fireEvent.click(queryByTestId('multichain-token-list-button'));

    expect(props.onClick).toHaveBeenCalled();
  });

  it('should render the correct token and filter by symbol and address', () => {
    const { getByTestId, getByAltText } = renderWithProvider(
      <TokenCell {...props} />,
      mockStore,
    );

    const image = getByAltText('TEST logo');

    expect(getByTestId('multichain-token-list-item-value')).toBeInTheDocument();
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', './images/test_image.svg');
  });

  it('should render amount with the correct format', () => {
    const { getByTestId } = renderWithProvider(
      <TokenCell {...propsLargeAmount} />,
      mockStore,
    );

    const amountElement = getByTestId('multichain-token-list-item-value');

    expect(amountElement).toBeInTheDocument();
    expect(amountElement.textContent).toBe('5,000,000 TEST');
  });
});
