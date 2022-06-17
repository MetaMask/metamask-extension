import React from 'react';
import PropTypes from 'prop-types';
import { shallow, mount } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import UnitInput from '../unit-input';
import CurrencyDisplay from '../currency-display';
import TokenInput from './token-input.component';

describe('TokenInput Component', () => {
  const t = (key) => `translate ${key}`;

  describe('rendering', () => {
    it('should render properly', () => {
      const mockStore = {
        metamask: {
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      };
      const store = configureMockStore()(mockStore);

      const wrapper = mount(
        <Provider store={store}>
          <TokenInput
            token={{
              address: '0x1',
              decimals: 4,
              symbol: 'ABC',
            }}
            tokens={[
              {
                address: '0x1',
                decimals: 4,
                symbol: 'ABC',
                image: null,
                isERC721: false,
              },
            ]}
          />
        </Provider>,
        {
          context: { t },
          childContextTypes: {
            t: PropTypes.func,
          },
        },
      );

      expect(wrapper).toHaveLength(1);
      expect(wrapper.find('.unit-input__suffix')).toHaveLength(1);
      expect(wrapper.find('.unit-input__suffix').text()).toStrictEqual('ABC');
      expect(
        wrapper.find('.currency-input__conversion-component'),
      ).toHaveLength(1);
      expect(
        wrapper.find('.currency-input__conversion-component').text(),
      ).toStrictEqual('translate noConversionRateAvailable');
    });

    it('should render properly with tokenExchangeRates', () => {
      const mockStore = {
        metamask: {
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      };
      const store = configureMockStore()(mockStore);

      const wrapper = mount(
        <Provider store={store}>
          <TokenInput
            token={{
              address: '0x1',
              decimals: 4,
              symbol: 'ABC',
            }}
            tokens={[
              {
                address: '0x1',
                decimals: 4,
                symbol: 'ABC',
                image: null,
                isERC721: false,
              },
            ]}
            tokenExchangeRates={{ '0x1': 2 }}
          />
        </Provider>,
        {
          context: { t },
          childContextTypes: {
            t: PropTypes.func,
          },
        },
      );

      expect(wrapper).toHaveLength(1);
      expect(wrapper.find('.unit-input__suffix')).toHaveLength(1);
      expect(wrapper.find('.unit-input__suffix').text()).toStrictEqual('ABC');
      expect(wrapper.find(CurrencyDisplay)).toHaveLength(1);
    });

    it('should render properly with a token value for ETH', () => {
      const mockStore = {
        metamask: {
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      };
      const store = configureMockStore()(mockStore);

      const wrapper = mount(
        <Provider store={store}>
          <TokenInput
            value="2710"
            token={{
              address: '0x1',
              decimals: 4,
              symbol: 'ABC',
            }}
            tokens={[
              {
                address: '0x1',
                decimals: 4,
                symbol: 'ABC',
                image: null,
                isERC721: false,
              },
            ]}
            tokenExchangeRates={{ '0x1': 2 }}
          />
        </Provider>,
      );

      expect(wrapper).toHaveLength(1);
      const tokenInputInstance = wrapper.find(TokenInput).at(0).instance();
      expect(tokenInputInstance.state.decimalValue).toStrictEqual('1');
      expect(tokenInputInstance.state.hexValue).toStrictEqual('2710');
      expect(wrapper.find('.unit-input__suffix')).toHaveLength(1);
      expect(wrapper.find('.unit-input__suffix').text()).toStrictEqual('ABC');
      expect(wrapper.find('.unit-input__input').props().value).toStrictEqual(
        '1',
      );
      expect(wrapper.find('.currency-display-component').text()).toStrictEqual(
        '2ETH',
      );
    });

    it('should render properly with a token value for fiat', () => {
      const mockStore = {
        metamask: {
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      };
      const store = configureMockStore()(mockStore);

      const wrapper = mount(
        <Provider store={store}>
          <TokenInput
            value="2710"
            token={{
              address: '0x1',
              decimals: 4,
              symbol: 'ABC',
            }}
            tokens={[
              {
                address: '0x1',
                decimals: 4,
                symbol: 'ABC',
                image: null,
                isERC721: false,
              },
            ]}
            tokenExchangeRates={{ '0x1': 2 }}
            showFiat
            currentCurrency="usd"
          />
        </Provider>,
      );

      expect(wrapper).toHaveLength(1);
      const tokenInputInstance = wrapper.find(TokenInput).at(0).instance();
      expect(tokenInputInstance.state.decimalValue).toStrictEqual('1');
      expect(tokenInputInstance.state.hexValue).toStrictEqual('2710');
      expect(wrapper.find('.unit-input__suffix')).toHaveLength(1);
      expect(wrapper.find('.unit-input__suffix').text()).toStrictEqual('ABC');
      expect(wrapper.find('.unit-input__input').props().value).toStrictEqual(
        '1',
      );
      expect(wrapper.find('.currency-display-component').text()).toStrictEqual(
        '$462.12USD',
      );
    });

    it('should render properly with a token value for fiat, but hideConversion is true', () => {
      const mockStore = {
        metamask: {
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      };
      const store = configureMockStore()(mockStore);

      const wrapper = mount(
        <Provider store={store}>
          <TokenInput
            value="2710"
            token={{
              address: '0x1',
              decimals: 4,
              symbol: 'ABC',
            }}
            tokens={[
              {
                address: '0x1',
                decimals: 4,
                symbol: 'ABC',
                image: null,
                isERC721: false,
              },
            ]}
            tokenExchangeRates={{ '0x1': 2 }}
            showFiat
            hideConversion
          />
        </Provider>,
        {
          context: { t },
          childContextTypes: {
            t: PropTypes.func,
          },
        },
      );

      expect(wrapper).toHaveLength(1);
      const tokenInputInstance = wrapper.find(TokenInput).at(0).instance();
      expect(tokenInputInstance.state.decimalValue).toStrictEqual('1');
      expect(tokenInputInstance.state.hexValue).toStrictEqual('2710');
      expect(wrapper.find('.unit-input__suffix')).toHaveLength(1);
      expect(wrapper.find('.unit-input__suffix').text()).toStrictEqual('ABC');
      expect(wrapper.find('.unit-input__input').props().value).toStrictEqual(
        '1',
      );
      expect(
        wrapper.find('.currency-input__conversion-component').text(),
      ).toStrictEqual('translate noConversionRateAvailable');
    });
  });

  describe('handling actions', () => {
    const handleChangeSpy = jest.fn();

    afterEach(() => {
      handleChangeSpy.mockClear();
    });

    it('should call onChange on input changes with the hex value for ETH', () => {
      const mockStore = {
        metamask: {
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      };
      const store = configureMockStore()(mockStore);
      const wrapper = mount(
        <Provider store={store}>
          <TokenInput
            onChange={handleChangeSpy}
            token={{
              address: '0x1',
              decimals: 4,
              symbol: 'ABC',
            }}
            tokens={[
              {
                address: '0x1',
                decimals: 4,
                symbol: 'ABC',
                image: null,
                isERC721: false,
              },
            ]}
            tokenExchangeRates={{ '0x1': 2 }}
          />
        </Provider>,
      );

      expect(wrapper).toHaveLength(1);
      expect(handleChangeSpy.mock.calls).toHaveLength(0);

      const tokenInputInstance = wrapper.find(TokenInput).at(0).instance();
      expect(tokenInputInstance.state.decimalValue).toStrictEqual(0);
      expect(tokenInputInstance.state.hexValue).toBeUndefined();
      expect(wrapper.find('.currency-display-component').text()).toStrictEqual(
        '0ETH',
      );
      const input = wrapper.find('input');
      expect(input.props().value).toStrictEqual(0);

      input.simulate('change', { target: { value: '1' } });
      expect(handleChangeSpy.mock.calls).toHaveLength(1);
      expect(handleChangeSpy.mock.calls[0][0]).toStrictEqual('2710');
      expect(wrapper.find('.currency-display-component').text()).toStrictEqual(
        '2ETH',
      );
      expect(tokenInputInstance.state.decimalValue).toStrictEqual('1');
      expect(tokenInputInstance.state.hexValue).toStrictEqual('2710');
    });

    it('should call onChange on input changes with the hex value for fiat', () => {
      const mockStore = {
        metamask: {
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      };
      const store = configureMockStore()(mockStore);
      const wrapper = mount(
        <Provider store={store}>
          <TokenInput
            onChange={handleChangeSpy}
            token={{
              address: '0x1',
              decimals: 4,
              symbol: 'ABC',
            }}
            tokens={[
              {
                address: '0x1',
                decimals: 4,
                symbol: 'ABC',
                image: null,
                isERC721: false,
              },
            ]}
            tokenExchangeRates={{ '0x1': 2 }}
            showFiat
            currentCurrency="usd"
          />
        </Provider>,
      );

      expect(wrapper).toHaveLength(1);
      expect(handleChangeSpy.mock.calls).toHaveLength(0);

      const tokenInputInstance = wrapper.find(TokenInput).at(0).instance();
      expect(tokenInputInstance.state.decimalValue).toStrictEqual(0);
      expect(tokenInputInstance.state.hexValue).toBeUndefined();
      expect(wrapper.find('.currency-display-component').text()).toStrictEqual(
        '$0.00USD',
      );
      const input = wrapper.find('input');
      expect(input.props().value).toStrictEqual(0);

      input.simulate('change', { target: { value: '1' } });
      expect(handleChangeSpy.mock.calls).toHaveLength(1);
      expect(handleChangeSpy.mock.calls[0][0]).toStrictEqual('2710');
      expect(wrapper.find('.currency-display-component').text()).toStrictEqual(
        '$462.12USD',
      );
      expect(tokenInputInstance.state.decimalValue).toStrictEqual('1');
      expect(tokenInputInstance.state.hexValue).toStrictEqual('2710');
    });

    it('should change the state and pass in a new decimalValue when props.value changes', () => {
      const mockStore = {
        metamask: {
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      };
      const store = configureMockStore()(mockStore);
      const wrapper = shallow(
        <Provider store={store}>
          <TokenInput
            onChange={handleChangeSpy}
            token={{
              address: '0x1',
              decimals: 4,
              symbol: 'ABC',
            }}
            tokens={[
              {
                address: '0x1',
                decimals: 4,
                symbol: 'ABC',
                image: null,
                isERC721: false,
              },
            ]}
            tokenExchangeRates={{ '0x1': 2 }}
            showFiat
          />
        </Provider>,
      );

      expect(wrapper).toHaveLength(1);
      const tokenInputInstance = wrapper.find(TokenInput).dive();
      expect(tokenInputInstance.state('decimalValue')).toStrictEqual(0);
      expect(tokenInputInstance.state('hexValue')).toBeUndefined();
      expect(tokenInputInstance.find(UnitInput).props().value).toStrictEqual(0);

      tokenInputInstance.setProps({ value: '2710' });
      tokenInputInstance.update();
      expect(tokenInputInstance.state('decimalValue')).toStrictEqual('1');
      expect(tokenInputInstance.state('hexValue')).toStrictEqual('2710');
      expect(tokenInputInstance.find(UnitInput).props().value).toStrictEqual(
        '1',
      );
    });
  });

  describe('Token Input Decimals Check', () => {
    const handleChangeSpy = jest.fn();

    afterEach(() => {
      handleChangeSpy.mockClear();
    });

    it('should render incorrect hex onChange when input decimals is more than token decimals', () => {
      const mockStore = {
        metamask: {
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      };
      const store = configureMockStore()(mockStore);
      const wrapper = mount(
        <Provider store={store}>
          <TokenInput
            onChange={handleChangeSpy}
            token={{
              address: '0x1',
              decimals: 4,
              symbol: 'ABC',
            }}
            tokens={[
              {
                address: '0x1',
                decimals: 4,
                symbol: 'ABC',
                image: null,
                isERC721: false,
              },
            ]}
            tokenExchangeRates={{ '0x1': 2 }}
            showFiat
            currentCurrency="usd"
          />
        </Provider>,
      );

      expect(wrapper).toHaveLength(1);
      expect(handleChangeSpy.mock.calls).toHaveLength(0);

      const input = wrapper.find('input');
      expect(input.props().value).toStrictEqual(0);

      input.simulate('change', { target: { value: '1.11111' } });
      expect(handleChangeSpy.mock.calls).toHaveLength(1);

      expect(handleChangeSpy.mock.calls[0][0]).toStrictEqual(
        '2b67.1999999999999999999a',
      );
    });

    it('should render correct hex onChange when input decimals is more than token decimals by omitting excess fractional part on blur', () => {
      const mockStore = {
        metamask: {
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      };
      const store = configureMockStore()(mockStore);

      const wrapper = mount(
        <Provider store={store}>
          <TokenInput
            onChange={handleChangeSpy}
            token={{
              address: '0x1',
              decimals: 4,
              symbol: 'ABC',
            }}
            tokens={[
              {
                address: '0x1',
                decimals: 4,
                symbol: 'ABC',
                image: null,
                isERC721: false,
              },
            ]}
            tokenExchangeRates={{ '0x1': 2 }}
            showFiat
            currentCurrency="usd"
          />
        </Provider>,
      );
      expect(wrapper).toHaveLength(1);

      const input = wrapper.find('input');

      input.simulate('blur', { target: { value: '1.11111' } });

      expect(handleChangeSpy.mock.calls).toHaveLength(1);
      expect(handleChangeSpy.mock.calls[0][0]).toStrictEqual('2b67');
    });
  });
});
