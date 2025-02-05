import React from 'react';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { useTokenFiatAmount } from '../../../../hooks/useTokenFiatAmount';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import {
  getTokenList,
  getPreferences,
  getCurrencyRates,
} from '../../../../selectors';
import {
  getMultichainCurrentChainId,
  getMultichainIsEvm,
} from '../../../../selectors/multichain';

import { useIsOriginalTokenSymbol } from '../../../../hooks/useIsOriginalTokenSymbol';
import { getIntlLocale } from '../../../../ducks/locale/locale';
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

  (useIsOriginalTokenSymbol as jest.Mock).mockReturnValue(true);

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
    image: '',
    chainId: '0x1',
    tokenFiatAmount: 5,
    onClick: jest.fn(),
  };

  const propsLargeAmount = {
    address: '0xAnotherToken',
    symbol: 'TEST',
    string: '5000000',
    currentCurrency: 'usd',
    image: '',
    chainId: '0x1',
    tokenFiatAmount: 5000000,
    onClick: jest.fn(),
  };
  const useSelectorMock = useSelector;
  (useSelectorMock as jest.Mock).mockImplementation((selector) => {
    if (selector === getPreferences) {
      return { privacyMode: false };
    }
    if (selector === getTokenList) {
      return MOCK_GET_TOKEN_LIST;
    }
    if (selector === getMultichainCurrentChainId) {
      return '0x89';
    }
    if (selector === getMultichainIsEvm) {
      return true;
    }
    if (selector === getIntlLocale) {
      return 'en-US';
    }
    if (selector === getCurrentCurrency) {
      return 'usd';
    }
    if (selector === getCurrencyRates) {
      return { POL: '' };
    }
    return undefined;
  });
  (useTokenFiatAmount as jest.Mock).mockReturnValue('5.00');

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

    const targetElem = queryByTestId('multichain-token-list-button');

    targetElem && fireEvent.click(targetElem);

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
