import React from 'react';
import PropTypes from 'prop-types';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import UnitInput from '../../ui/unit-input';
import CurrencyDisplay from '../../ui/currency-display';
import CurrencyInput from './currency-input';

describe('CurrencyInput Component', () => {
  describe('rendering', () => {
    it('should render properly without a suffix', () => {
      const mockStore = {
        metamask: {
          nativeCurrency: 'ETH',
          currentCurrency: 'usd',
          conversionRate: 231.06,
          provider: {
            chainId: '0x4',
          },
          preferences: {
            showFiatInTestnets: true,
          },
        },
      };
      const store = configureMockStore()(mockStore);
      const wrapper = mount(
        <Provider store={store}>
          <CurrencyInput />
        </Provider>,
      );

      expect(wrapper).toHaveLength(1);
      expect(wrapper.find(UnitInput)).toHaveLength(1);
    });

    it('should render properly with a suffix', () => {
      const mockStore = {
        metamask: {
          nativeCurrency: 'ETH',
          currentCurrency: 'usd',
          conversionRate: 231.06,
          provider: {
            chainId: '0x4',
          },
          preferences: {
            showFiatInTestnets: true,
          },
        },
      };
      const store = configureMockStore()(mockStore);

      const wrapper = mount(
        <Provider store={store}>
          <CurrencyInput />
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
          provider: {
            chainId: '0x4',
          },
          preferences: {
            showFiatInTestnets: true,
          },
        },
      };
      const store = configureMockStore()(mockStore);

      const wrapper = mount(
        <Provider store={store}>
          <CurrencyInput hexValue="de0b6b3a7640000" />
        </Provider>,
      );

      expect(wrapper).toHaveLength(1);
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
          provider: {
            chainId: '0x4',
          },
          preferences: {
            showFiatInTestnets: true,
          },
        },
      };
      const store = configureMockStore()(mockStore);
      const handleChangeSpy = sinon.spy();

      const wrapper = mount(
        <Provider store={store}>
          <CurrencyInput
            onChange={handleChangeSpy}
            hexValue="f602f2234d0ea"
            featureSecondary
          />
        </Provider>,
      );

      expect(wrapper).toHaveLength(1);
      expect(wrapper.find('.unit-input__suffix')).toHaveLength(1);
      expect(wrapper.find('.unit-input__suffix').text()).toStrictEqual('USD');
      expect(wrapper.find('.unit-input__input').props().value).toStrictEqual(1);
      expect(wrapper.find('.currency-display-component').text()).toStrictEqual(
        '0.00432788ETH',
      );
    });

    it('should render properly with a native value when hideSecondary is true', () => {
      const mockStore = {
        metamask: {
          nativeCurrency: 'ETH',
          currentCurrency: 'usd',
          conversionRate: 231.06,
          provider: {
            chainId: '0x4',
          },
          preferences: {
            showFiatInTestnets: false,
          },
        },
        hideSecondary: true,
      };
      const store = configureMockStore()(mockStore);
      const handleChangeSpy = sinon.spy();

      const wrapper = mount(
        <Provider store={store}>
          <CurrencyInput
            onChange={handleChangeSpy}
            hexValue="f602f2234d0ea"
            featureSecondary
          />
        </Provider>,
        {
          context: { t: (str) => `${str}_t` },
          childContextTypes: { t: PropTypes.func },
        },
      );

      expect(wrapper).toHaveLength(1);
      expect(wrapper.find('.unit-input__suffix')).toHaveLength(1);
      expect(wrapper.find('.unit-input__suffix').text()).toStrictEqual('ETH');
      expect(wrapper.find('.unit-input__input').props().value).toStrictEqual(
        0.00432788,
      );
      expect(
        wrapper.find('.currency-input__conversion-component').text(),
      ).toStrictEqual('[noConversionRateAvailable]');
    });
  });

  describe('handling actions', () => {
    const handleChangeSpy = sinon.spy();
    const handleBlurSpy = sinon.spy();
    const handleChangeToggle = sinon.spy();

    afterEach(() => {
      handleChangeSpy.resetHistory();
      handleBlurSpy.resetHistory();
      handleChangeToggle.resetHistory();
    });

    it('should call onChange on input changes with the hex value for ETH', () => {
      const mockStore = {
        metamask: {
          nativeCurrency: 'ETH',
          currentCurrency: 'usd',
          conversionRate: 231.06,
          provider: {
            chainId: '0x4',
          },
          preferences: {
            showFiatInTestnets: true,
          },
        },
      };
      const store = configureMockStore()(mockStore);
      const wrapper = mount(
        <Provider store={store}>
          <CurrencyInput onChange={handleChangeSpy} hexValue="f602f2234d0ea" />
        </Provider>,
      );

      expect(wrapper).toHaveLength(1);
      expect(handleChangeSpy.callCount).toStrictEqual(0);
      expect(handleBlurSpy.callCount).toStrictEqual(0);

      const input = wrapper.find('input');
      expect(input.props().value).toStrictEqual(0.00432788);

      input.simulate('change', { target: { value: 1 } });
      expect(handleChangeSpy.callCount).toStrictEqual(1);
      expect(handleChangeSpy.calledWith('de0b6b3a7640000')).toStrictEqual(true);
      expect(wrapper.find('.currency-display-component').text()).toStrictEqual(
        '$231.06USD',
      );
    });

    it('should call onChange on input changes with the hex value for fiat', () => {
      const mockStore = {
        metamask: {
          nativeCurrency: 'ETH',
          currentCurrency: 'usd',
          conversionRate: 231.06,
          provider: {
            chainId: '0x4',
          },
          preferences: {
            showFiatInTestnets: true,
          },
        },
      };
      const store = configureMockStore()(mockStore);
      const wrapper = mount(
        <Provider store={store}>
          <CurrencyInput onChange={handleChangeSpy} featureSecondary />
        </Provider>,
      );

      expect(wrapper).toHaveLength(1);
      expect(handleChangeSpy.callCount).toStrictEqual(1);
      expect(handleBlurSpy.callCount).toStrictEqual(0);

      expect(wrapper.find('.currency-display-component').text()).toStrictEqual(
        '0ETH',
      );
      const input = wrapper.find('input');
      expect(input.props().value).toStrictEqual(0);

      input.simulate('change', { target: { value: 1 } });
      expect(handleChangeSpy.callCount).toStrictEqual(2);
      expect(handleChangeSpy.calledWith('f602f2234d0ea')).toStrictEqual(true);
      expect(wrapper.find('.currency-display-component').text()).toStrictEqual(
        '0.00432788ETH',
      );
    });

    it('should change the state and pass in a new decimalValue when props.value changes', () => {
      const mockStore = {
        metamask: {
          nativeCurrency: 'ETH',
          currentCurrency: 'usd',
          conversionRate: 231.06,
          provider: {
            chainId: '0x4',
          },
          preferences: {
            showFiatInTestnets: true,
          },
        },
      };
      const store = configureMockStore()(mockStore);
      const wrapper = mount(
        <Provider store={store}>
          <CurrencyInput onChange={handleChangeSpy} featureSecondary />
        </Provider>,
      );

      expect(wrapper).toHaveLength(1);
      const input = wrapper.find('input');
      expect(input.props().value).toStrictEqual(0);

      wrapper.setProps({ hexValue: '1ec05e43e72400' });
      input.update();
      expect(input.props().value).toStrictEqual(0);
    });

    it('should swap selected currency when swap icon is clicked', () => {
      const mockStore = {
        metamask: {
          nativeCurrency: 'ETH',
          currentCurrency: 'usd',
          conversionRate: 231.06,
          provider: {
            chainId: '0x4',
          },
          preferences: {
            showFiatInTestnets: true,
          },
        },
      };
      const store = configureMockStore()(mockStore);
      const wrapper = mount(
        <Provider store={store}>
          <CurrencyInput
            onChange={handleChangeSpy}
            onPreferenceToggle={handleChangeToggle}
            featureSecondary
          />
        </Provider>,
      );

      expect(wrapper).toHaveLength(1);
      expect(handleChangeSpy.callCount).toStrictEqual(1);
      expect(handleBlurSpy.callCount).toStrictEqual(0);

      expect(wrapper.find('.currency-display-component').text()).toStrictEqual(
        '0ETH',
      );
      const input = wrapper.find('input');
      expect(input.props().value).toStrictEqual(0);

      input.simulate('change', { target: { value: 1 } });
      expect(handleChangeSpy.callCount).toStrictEqual(2);
      expect(handleChangeSpy.calledWith('de0b6b3a7640000')).toStrictEqual(
        false,
      );
      expect(wrapper.find('.currency-display-component').text()).toStrictEqual(
        '0.00432788ETH',
      );

      const swap = wrapper.find('.currency-input__swap-component');
      swap.simulate('click');
      expect(wrapper.find('.currency-display-component').text()).toStrictEqual(
        '0.00432788ETH',
      );
    });
  });
});
