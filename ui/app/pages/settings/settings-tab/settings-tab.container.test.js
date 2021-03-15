import assert from 'assert';
import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import SettingsTab from './settings-tab.container';

describe('Settings Tab', function () {
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
  beforeEach(function () {
    wrapper = mount(<SettingsTab.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
      },
    });
  });

  it('selects currency', async function () {
    const selectCurrency = wrapper.find('#select-currency');

    selectCurrency.props().onChange('eur');
    assert(props.setCurrentCurrency.calledOnce);
  });

  it('selects locale', async function () {
    const selectLocale = wrapper.find('#select-locale');

    await selectLocale.props().onChange('ja');
    assert(props.updateCurrentLocale.calledOnce);
  });

  it('sets fiat primary currency', function () {
    const selectFiat = wrapper.find('#fiat-primary-currency');

    selectFiat.simulate('change');
    assert(props.setUseNativeCurrencyAsPrimaryCurrencyPreference.calledOnce);
  });

  it('toggles blockies', function () {
    const toggleBlockies = wrapper.find('#blockie-optin input');

    toggleBlockies.simulate('click');
    assert(props.setUseBlockie.calledOnce);
  });

  it('toggles hiding zero balance', function () {
    const toggleBlockies = wrapper.find('#toggle-zero-balance input');

    toggleBlockies.simulate('click');
    assert(props.setHideZeroBalanceTokens.calledOnce);
  });
});
