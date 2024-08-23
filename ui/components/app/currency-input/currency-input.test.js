import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { useIsOriginalNativeTokenSymbol } from '../../../hooks/useIsOriginalNativeTokenSymbol';
import CurrencyInput from '.';

jest.mock('../../../hooks/useIsOriginalNativeTokenSymbol', () => {
  return {
    useIsOriginalNativeTokenSymbol: jest.fn(),
  };
});

describe('CurrencyInput Component', () => {
  useIsOriginalNativeTokenSymbol.mockReturnValue(true);

  const mockStore = {
    metamask: {
      ...mockState.metamask,
      currentCurrency: 'usd',
      currencyRates: {
        ETH: {
          conversionRate: 231.06,
        },
      },
      preferences: {
        showFiatInTestnets: true,
      },
      marketData: {
        '0x5': {},
      },
      useCurrencyRateCheck: true,
    },
  };
  describe('rendering', () => {
    it('should render properly without a suffix', () => {
      const store = configureMockStore()(mockStore);

      const { container } = renderWithProvider(<CurrencyInput />, store);

      expect(container).toMatchSnapshot();
    });

    it('should render properly with an ETH value', () => {
      const store = configureMockStore()(mockStore);

      const props = {
        hexValue: 'de0b6b3a7640000',
      };

      const { container } = renderWithProvider(
        <CurrencyInput {...props} />,
        store,
      );

      expect(container).toMatchSnapshot();
    });

    it('should render properly with a fiat value', () => {
      const store = configureMockStore()(mockStore);

      const props = {
        onChange: jest.fn(),
        hexValue: '0xf602f2234d0ea',
        isFiatPreferred: true,
      };

      const { container } = renderWithProvider(
        <CurrencyInput {...props} />,
        store,
      );

      expect(container).toMatchSnapshot();
    });

    it('should render properly with a native value when hideSecondary is true', () => {
      const hideSecondaryState = {
        metamask: {
          ...mockStore.metamask,
          preferences: {
            showFiatInTestnets: false,
          },
          hideSecondary: true,
        },
      };

      const store = configureMockStore()(hideSecondaryState);

      const props = {
        onChange: jest.fn(),
        hexValue: '0xf602f2234d0ea',
        isFiatPreferred: true,
      };

      const { container } = renderWithProvider(
        <CurrencyInput {...props} />,
        store,
      );

      expect(container).toMatchSnapshot();
    });

    it('should render small number properly', () => {
      const store = configureMockStore()(mockStore);

      const props = {
        onChange: jest.fn(),
        hexValue: '174876e800',
        isFiatPreferred: false,
      };

      const { getByTestId } = renderWithProvider(
        <CurrencyInput {...props} />,
        store,
      );

      const { value } = getByTestId('currency-input');

      expect(value).toStrictEqual('0.0000001');
    });

    it('should show skeleton state', () => {
      const store = configureMockStore()(mockStore);

      const props = {
        onChange: jest.fn(),
        hexValue: '174876e800',
        isFiatPreferred: false,
        isSkeleton: true,
      };

      const { container } = renderWithProvider(
        <CurrencyInput {...props} />,
        store,
      );

      expect(container).toMatchSnapshot();
    });

    it('should disable unit input', () => {
      const store = configureMockStore()(mockStore);

      const props = {
        onChange: jest.fn(),
        hexValue: '174876e800',
        isFiatPreferred: false,
        isDisabled: true,
      };

      const { container } = renderWithProvider(
        <CurrencyInput {...props} />,
        store,
      );

      expect(container).toMatchSnapshot();
    });
  });

  describe('handling actions', () => {
    it('should call onChange on input changes with the hex value for ETH', () => {
      const store = configureMockStore()(mockStore);

      const props = {
        onChange: jest.fn(),
        hexValue: '0xf602f2234d0ea',
      };

      const { queryByTestId, queryByTitle, rerender } = renderWithProvider(
        <CurrencyInput {...props} />,
        store,
      );

      const currencyInput = queryByTestId('currency-input');
      fireEvent.change(currencyInput, { target: { value: 1 } });

      expect(props.onChange).toHaveBeenCalledWith('0xde0b6b3a7640000', '1');
      // assume the onChange function updates the hexValue
      rerender(<CurrencyInput {...props} hexValue="0xde0b6b3a7640000" />);

      expect(queryByTitle('$231.06')).toBeInTheDocument();
    });

    it('should call onChange on input changes with the hex value for fiat', () => {
      const store = configureMockStore()(mockStore);

      const props = {
        onChange: jest.fn(),
        hexValue: '0xf602f2234d0ea',
        isFiatPreferred: true,
      };

      const { queryByTestId, queryByTitle } = renderWithProvider(
        <CurrencyInput {...props} />,
        store,
      );

      const currencyInput = queryByTestId('currency-input');

      fireEvent.change(currencyInput, { target: { value: 1 } });

      expect(props.onChange).toHaveBeenCalledWith(
        '0xf604b06968000',
        '0.004328',
      );
      expect(queryByTitle('0.004328 ETH')).toBeInTheDocument();
    });

    it('should swap selected currency when swap icon is clicked', async () => {
      const store = configureMockStore()(mockStore);
      const props = {
        onChange: jest.fn(),
        onPreferenceToggle: jest.fn(),
        hexValue: '0xf602f2234d0ea',
        isFiatPreferred: true,
      };

      const { queryByTestId, queryByTitle, rerender } = renderWithProvider(
        <CurrencyInput {...props} />,
        store,
      );

      const currencyInput = queryByTestId('currency-input');
      fireEvent.change(currencyInput, { target: { value: 1 } });

      expect(queryByTitle('0.004328 ETH')).toBeInTheDocument();

      const currencySwap = queryByTestId('currency-swap');
      fireEvent.click(currencySwap);

      // expect isFiatPreferred to update
      rerender(<CurrencyInput {...props} isFiatPreferred={false} />);

      await waitFor(() => {
        expect(queryByTitle('$1.00')).toBeInTheDocument();
      });
    });

    it('should update on upstream change if isMatchingUpstream', async () => {
      const store = configureMockStore()(mockStore);
      const props = {
        onChange: jest.fn(),
        onPreferenceToggle: jest.fn(),
        hexValue: '0xf602f2234d0ea',
        isFiatPreferred: true,
        // should ignore if fiat is preferred for upstream updates
        isMatchingUpstream: true,
      };

      const { queryByTitle, rerender } = renderWithProvider(
        <CurrencyInput {...props} />,
        store,
      );

      // expect isFiatPreferred to update
      rerender(<CurrencyInput {...props} hexValue="0x2386F26FC10000" />);

      await waitFor(() => {
        expect(queryByTitle('0.01 ETH')).toBeInTheDocument();
      });
    });

    it('should update on upstream change if isDisabled (i.e. no onChange prop)', async () => {
      const store = configureMockStore()(mockStore);
      const props = {
        onPreferenceToggle: jest.fn(),
        hexValue: '0xf602f2234d0ea',
        // should ignore if fiat is preferred for upstream updates
        isFiatPreferred: true,
      };

      const { queryByTitle, rerender } = renderWithProvider(
        <CurrencyInput {...props} />,
        store,
      );

      // expect isFiatPreferred to update
      rerender(<CurrencyInput {...props} hexValue="0x2386F26FC10000" />);

      await waitFor(() => {
        expect(queryByTitle('0.01 ETH')).toBeInTheDocument();
      });
    });

    it('should initially render to initial hex value as if fiat is not preferred', async () => {
      const store = configureMockStore()(mockStore);
      const props = {
        onChange: jest.fn(),
        onPreferenceToggle: jest.fn(),
        hexValue: '0x2386F26FC10000',
        // should ignore if fiat is preferred for upstream updates
        isFiatPreferred: true,
      };

      const { queryByTitle } = renderWithProvider(
        <CurrencyInput {...props} />,
        store,
      );

      await waitFor(() => {
        expect(queryByTitle('0.01 ETH')).toBeInTheDocument();
      });
    });
  });
});
