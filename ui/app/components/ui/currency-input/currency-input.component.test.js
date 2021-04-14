import React from 'react';
import PropTypes from 'prop-types';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import UnitInput from '../unit-input';
import CurrencyDisplay from '../currency-display';
import CurrencyInput from './currency-input.component';

describe('CurrencyInput Component', () => {
  describe('rendering', () => {
    it('should render properly without a suffix', () => {
      const wrapper = shallow(<CurrencyInput />);

      expect(wrapper).toHaveLength(1);
      expect(wrapper.find(UnitInput)).toHaveLength(1);
    });

    it('should render properly with a suffix', () => {
      const mockStore = {
        metamask: {
          nativeCurrency: 'ETH',
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      };
      const store = configureMockStore()(mockStore);

      const wrapper = mount(
        <Provider store={store}>
          <CurrencyInput
            nativeSuffix="ETH"
            fiatSuffix="USD"
            nativeCurrency="ETH"
          />
        </Provider>,
      );

      expect(wrapper).toHaveLength(1);
      expect(wrapper.find('.unit-input__suffix')).toHaveLength(1);
      expect(wrapper.find('.unit-input__suffix').text()).toStrictEqual('ETH');
      expect(wrapper.find(CurrencyDisplay)).toHaveLength(1);
    });

    it('should render properly with an ETH value', () => {
      const mockStore = {
        metamask: {
          nativeCurrency: 'ETH',
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      };
      const store = configureMockStore()(mockStore);

      const wrapper = mount(
        <Provider store={store}>
          <CurrencyInput
            value="de0b6b3a7640000"
            fiatSuffix="USD"
            nativeSuffix="ETH"
            nativeCurrency="ETH"
            currentCurrency="usd"
            conversionRate={231.06}
          />
        </Provider>,
      );

      expect(wrapper).toHaveLength(1);
      const currencyInputInstance = wrapper
        .find(CurrencyInput)
        .at(0)
        .instance();
      expect(currencyInputInstance.state.decimalValue).toStrictEqual(1);
      expect(currencyInputInstance.state.hexValue).toStrictEqual(
        'de0b6b3a7640000',
      );
      expect(wrapper.find('.unit-input__suffix')).toHaveLength(1);
      expect(wrapper.find('.unit-input__suffix').text()).toStrictEqual('ETH');
      expect(wrapper.find('.unit-input__input').props().value).toStrictEqual(1);
      expect(wrapper.find('.currency-display-component').text()).toStrictEqual(
        '$231.06USD',
      );
    });

    it('should render properly with a fiat value', () => {
      const mockStore = {
        metamask: {
          nativeCurrency: 'ETH',
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      };
      const store = configureMockStore()(mockStore);

      const wrapper = mount(
        <Provider store={store}>
          <CurrencyInput
            value="f602f2234d0ea"
            fiatSuffix="USD"
            nativeSuffix="ETH"
            useFiat
            nativeCurrency="ETH"
            currentCurrency="usd"
            conversionRate={231.06}
          />
        </Provider>,
      );

      expect(wrapper).toHaveLength(1);
      const currencyInputInstance = wrapper
        .find(CurrencyInput)
        .at(0)
        .instance();
      expect(currencyInputInstance.state.decimalValue).toStrictEqual(1);
      expect(currencyInputInstance.state.hexValue).toStrictEqual(
        'f602f2234d0ea',
      );
      expect(wrapper.find('.unit-input__suffix')).toHaveLength(1);
      expect(wrapper.find('.unit-input__suffix').text()).toStrictEqual('USD');
      expect(wrapper.find('.unit-input__input').props().value).toStrictEqual(1);
      expect(wrapper.find('.currency-display-component').text()).toStrictEqual(
        '0.004328ETH',
      );
    });

    it('should render properly with a native value when hideFiat is true', () => {
      const mockStore = {
        metamask: {
          nativeCurrency: 'ETH',
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      };

      const store = configureMockStore()(mockStore);

      const wrapper = mount(
        <Provider store={store}>
          <CurrencyInput
            value="f602f2234d0ea"
            fiatSuffix="USD"
            nativeSuffix="ETH"
            useFiat
            hideFiat
            nativeCurrency="ETH"
            currentCurrency="usd"
            conversionRate={231.06}
          />
        </Provider>,
        {
          context: { t: (str) => `${str}_t` },
          childContextTypes: { t: PropTypes.func },
        },
      );

      expect(wrapper).toHaveLength(1);
      const currencyInputInstance = wrapper
        .find(CurrencyInput)
        .at(0)
        .instance();
      expect(currencyInputInstance.state.decimalValue).toStrictEqual(0.004328);
      expect(currencyInputInstance.state.hexValue).toStrictEqual(
        'f602f2234d0ea',
      );
      expect(wrapper.find('.unit-input__suffix')).toHaveLength(1);
      expect(wrapper.find('.unit-input__suffix').text()).toStrictEqual('ETH');
      expect(wrapper.find('.unit-input__input').props().value).toStrictEqual(
        0.004328,
      );
      expect(
        wrapper.find('.currency-input__conversion-component').text(),
      ).toStrictEqual('noConversionRateAvailable_t');
    });
  });

  describe('handling actions', () => {
    const handleChangeSpy = sinon.spy();
    const handleBlurSpy = sinon.spy();

    afterEach(() => {
      handleChangeSpy.resetHistory();
      handleBlurSpy.resetHistory();
    });

    it('should call onChange on input changes with the hex value for ETH', () => {
      const mockStore = {
        metamask: {
          nativeCurrency: 'ETH',
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      };
      const store = configureMockStore()(mockStore);
      const wrapper = mount(
        <Provider store={store}>
          <CurrencyInput
            onChange={handleChangeSpy}
            suffix="ETH"
            nativeCurrency="ETH"
            currentCurrency="usd"
            conversionRate={231.06}
          />
        </Provider>,
      );

      expect(wrapper).toHaveLength(1);
      expect(handleChangeSpy.callCount).toStrictEqual(0);
      expect(handleBlurSpy.callCount).toStrictEqual(0);

      const currencyInputInstance = wrapper
        .find(CurrencyInput)
        .at(0)
        .instance();
      expect(currencyInputInstance.state.decimalValue).toStrictEqual(0);
      expect(currencyInputInstance.state.hexValue).toBeUndefined();
      expect(wrapper.find('.currency-display-component').text()).toStrictEqual(
        '$0.00USD',
      );
      const input = wrapper.find('input');
      expect(input.props().value).toStrictEqual(0);

      input.simulate('change', { target: { value: 1 } });
      expect(handleChangeSpy.callCount).toStrictEqual(1);
      expect(handleChangeSpy.calledWith('de0b6b3a7640000')).toStrictEqual(true);
      expect(wrapper.find('.currency-display-component').text()).toStrictEqual(
        '$231.06USD',
      );
      expect(currencyInputInstance.state.decimalValue).toStrictEqual(1);
      expect(currencyInputInstance.state.hexValue).toStrictEqual(
        'de0b6b3a7640000',
      );
    });

    it('should call onChange on input changes with the hex value for fiat', () => {
      const mockStore = {
        metamask: {
          nativeCurrency: 'ETH',
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      };
      const store = configureMockStore()(mockStore);
      const wrapper = mount(
        <Provider store={store}>
          <CurrencyInput
            onChange={handleChangeSpy}
            suffix="USD"
            nativeCurrency="ETH"
            currentCurrency="usd"
            conversionRate={231.06}
            useFiat
          />
        </Provider>,
      );

      expect(wrapper).toHaveLength(1);
      expect(handleChangeSpy.callCount).toStrictEqual(0);
      expect(handleBlurSpy.callCount).toStrictEqual(0);

      const currencyInputInstance = wrapper
        .find(CurrencyInput)
        .at(0)
        .instance();
      expect(currencyInputInstance.state.decimalValue).toStrictEqual(0);
      expect(currencyInputInstance.state.hexValue).toBeUndefined();
      expect(wrapper.find('.currency-display-component').text()).toStrictEqual(
        '0ETH',
      );
      const input = wrapper.find('input');
      expect(input.props().value).toStrictEqual(0);

      input.simulate('change', { target: { value: 1 } });
      expect(handleChangeSpy.callCount).toStrictEqual(1);
      expect(handleChangeSpy.calledWith('f602f2234d0ea')).toStrictEqual(true);
      expect(wrapper.find('.currency-display-component').text()).toStrictEqual(
        '0.004328ETH',
      );
      expect(currencyInputInstance.state.decimalValue).toStrictEqual(1);
      expect(currencyInputInstance.state.hexValue).toStrictEqual(
        'f602f2234d0ea',
      );
    });

    it('should change the state and pass in a new decimalValue when props.value changes', () => {
      const mockStore = {
        metamask: {
          nativeCurrency: 'ETH',
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      };
      const store = configureMockStore()(mockStore);
      const wrapper = shallow(
        <Provider store={store}>
          <CurrencyInput
            onChange={handleChangeSpy}
            suffix="USD"
            nativeCurrency="ETH"
            currentCurrency="usd"
            conversionRate={231.06}
            useFiat
          />
        </Provider>,
      );

      expect(wrapper).toHaveLength(1);
      const currencyInputInstance = wrapper.find(CurrencyInput).dive();
      expect(currencyInputInstance.state('decimalValue')).toStrictEqual(0);
      expect(currencyInputInstance.state('hexValue')).toBeUndefined();
      expect(currencyInputInstance.find(UnitInput).props().value).toStrictEqual(
        0,
      );

      currencyInputInstance.setProps({ value: '1ec05e43e72400' });
      currencyInputInstance.update();
      expect(currencyInputInstance.state('decimalValue')).toStrictEqual(2);
      expect(currencyInputInstance.state('hexValue')).toStrictEqual(
        '1ec05e43e72400',
      );
      expect(currencyInputInstance.find(UnitInput).props().value).toStrictEqual(
        2,
      );
    });

    it('should swap selected currency when swap icon is clicked', () => {
      const mockStore = {
        metamask: {
          nativeCurrency: 'ETH',
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      };
      const store = configureMockStore()(mockStore);
      const wrapper = mount(
        <Provider store={store}>
          <CurrencyInput
            onChange={handleChangeSpy}
            nativeSuffix="ETH"
            fiatSuffix="USD"
            nativeCurrency="ETH"
            currentCurrency="usd"
            conversionRate={231.06}
          />
        </Provider>,
      );

      expect(wrapper).toHaveLength(1);
      expect(handleChangeSpy.callCount).toStrictEqual(0);
      expect(handleBlurSpy.callCount).toStrictEqual(0);

      const currencyInputInstance = wrapper
        .find(CurrencyInput)
        .at(0)
        .instance();
      expect(currencyInputInstance.state.decimalValue).toStrictEqual(0);
      expect(currencyInputInstance.state.hexValue).toBeUndefined();
      expect(wrapper.find('.currency-display-component').text()).toStrictEqual(
        '$0.00USD',
      );
      const input = wrapper.find('input');
      expect(input.props().value).toStrictEqual(0);

      input.simulate('change', { target: { value: 1 } });
      expect(handleChangeSpy.callCount).toStrictEqual(1);
      expect(handleChangeSpy.calledWith('de0b6b3a7640000')).toStrictEqual(true);
      expect(wrapper.find('.currency-display-component').text()).toStrictEqual(
        '$231.06USD',
      );
      expect(currencyInputInstance.state.decimalValue).toStrictEqual(1);
      expect(currencyInputInstance.state.hexValue).toStrictEqual(
        'de0b6b3a7640000',
      );

      const swap = wrapper.find('.currency-input__swap-component');
      swap.simulate('click');
      expect(wrapper.find('.currency-display-component').text()).toStrictEqual(
        '0.004328ETH',
      );
    });
  });
});
