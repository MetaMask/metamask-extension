import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import {
  NETWORK_TYPES,
  CHAIN_IDS,
  CURRENCY_SYMBOLS,
} from '../../../../shared/constants/network';
import TokenInput from '.';

describe('TokenInput Component', () => {
  const props = {
    dataTestId: 'token-input',
    onChange: jest.fn(),
    token: {
      address: '0x108cf70c7d384c552f42c07c41c0e1e46d77ea0d',
      symbol: 'TEST',
      decimals: 0,
    },
  };

  afterEach(() => {
    props.onChange.mockReset();
  });

  describe('Name of the group', () => {
    it('should render properly', () => {
      const mockStore = configureMockStore()(mockState);

      const { container } = renderWithProvider(
        <TokenInput {...props} />,
        mockStore,
      );

      expect(container).toMatchSnapshot();
    });
  });

  describe('Conversion Display', () => {
    it('should render conversionRate', () => {
      const showFiatState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          preferences: {
            ...mockState.metamask.preferences,
            showFiatInTestnets: true,
          },
        },
      };
      const mockStore = configureMockStore()(showFiatState);

      const { queryByTitle } = renderWithProvider(
        <TokenInput {...props} />,
        mockStore,
      );

      expect(queryByTitle('0 ETH')).toBeInTheDocument();
    });

    it('should render conversionRate on polygon', () => {
      const showFiatState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          currencyRates: {
            [CURRENCY_SYMBOLS.MATIC]: {
              conversionRate: 1,
            },
          },
          preferences: {
            ...mockState.metamask.preferences,
            showFiatInTestnets: true,
          },
          providerConfig: {
            chainId: CHAIN_IDS.POLYGON,
            type: NETWORK_TYPES.MAINNET,
            ticker: CURRENCY_SYMBOLS.MATIC,
          },
        },
      };
      const mockStore = configureMockStore()(showFiatState);

      const { queryByTitle } = renderWithProvider(
        <TokenInput {...props} />,
        mockStore,
      );

      expect(queryByTitle('0 MATIC')).toBeInTheDocument();
    });

    it('should render showFiat', () => {
      const showFiatState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          preferences: {
            ...mockState.metamask.preferences,
            showFiatInTestnets: true,
          },
        },
      };

      const showFiatProps = {
        ...props,
        showFiat: true,
      };

      const mockStore = configureMockStore()(showFiatState);

      const { queryByTitle } = renderWithProvider(
        <TokenInput {...showFiatProps} />,
        mockStore,
      );

      expect(queryByTitle('$0.00 USD')).toBeInTheDocument();
    });
  });

  describe('handle', () => {
    it('should handle', () => {
      const mockStore = configureMockStore()(mockState);

      const { queryByTestId } = renderWithProvider(
        <TokenInput {...props} />,
        mockStore,
      );

      const tokenInput = queryByTestId('token-input');

      fireEvent.change(tokenInput, { target: { value: '2' } });

      expect(props.onChange).toHaveBeenCalledWith('2');
    });

    it('should blur', () => {
      const mockStore = configureMockStore()(mockState);

      const { queryByTestId } = renderWithProvider(
        <TokenInput {...props} />,
        mockStore,
      );

      const tokenInput = queryByTestId('token-input');

      fireEvent.blur(tokenInput, { target: { value: '2' } });

      expect(props.onChange).toHaveBeenCalledWith('2');
    });
  });
});
