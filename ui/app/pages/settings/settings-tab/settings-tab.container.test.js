import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import SettingsTab from './settings-tab.container';

describe('Settings Tab', () => {
  let wrapper;

  const props = {
    setCurrentCurrency: sinon.spy(),
    displayWarning: sinon.spy(),
    setUseBlockie: sinon.spy(),
    updateCurrentLocale: sinon.spy(),
    setUseNativeCurrencyAsPrimaryCurrencyPreference: sinon.spy(),
    setHideZeroBalanceTokens: sinon.spy(),
    warning: '',
    currentLocale: 'en',
    useBlockie: false,
    currentCurrency: 'usd',
    conversionDate: 1,
    nativeCurrency: 'eth',
    useNativeCurrencyAsPrimaryCurrency: true,
  };
  beforeEach(() => {
    wrapper = mount(<SettingsTab.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
      },
    });
  });

  it('selects currency', async () => {
    const selectCurrency = wrapper.find('#select-currency');

    selectCurrency.props().onChange('eur');
    expect(props.setCurrentCurrency.calledOnce).toStrictEqual(true);
  });

  it('selects locale', async () => {
    const selectLocale = wrapper.find('#select-locale');

    await selectLocale.props().onChange('ja');
    expect(props.updateCurrentLocale.calledOnce).toStrictEqual(true);
  });

  it('sets fiat primary currency', () => {
    const selectFiat = wrapper.find('#fiat-primary-currency');

    selectFiat.simulate('change');
    expect(
      props.setUseNativeCurrencyAsPrimaryCurrencyPreference.calledOnce,
    ).toStrictEqual(true);
  });

  it('toggles blockies', () => {
    const toggleBlockies = wrapper.find('#blockie-optin input');

    toggleBlockies.simulate('click');
    expect(props.setUseBlockie.calledOnce).toStrictEqual(true);
  });

  it('toggles hiding zero balance', () => {
    const toggleBlockies = wrapper.find('#toggle-zero-balance input');

    toggleBlockies.simulate('click');
    expect(props.setHideZeroBalanceTokens.calledOnce).toStrictEqual(true);
  });
});
