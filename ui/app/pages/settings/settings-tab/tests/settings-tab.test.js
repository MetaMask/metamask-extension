import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
import { mount } from 'enzyme'
import SettingsTab from '..'

describe('Settings Tab', function () {
  let wrapper

  const props = {
    setCurrentCurrency: sinon.spy(),
    displayWarning: sinon.spy(),
    setUseBlockie: sinon.spy(),
    updateCurrentLocale: sinon.spy(),
    setUseNativeCurrencyAsPrimaryCurrencyPreference: sinon.spy(),
    warning: '',
    currentLocale: 'en',
    useBlockie: false,
    currentCurrency: 'usd',
    conversionDate: 1,
    nativeCurrency: 'eth',
    useNativeCurrencyAsPrimaryCurrency: true,
  }
  beforeEach(function () {
    wrapper = mount(<SettingsTab.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
      },
    })
  })

  it('selects currency', async function () {
    const selectCurrency = wrapper.find({ placeholder: 'selectCurrency' })

    selectCurrency.props().onSelect('eur')
    assert(props.setCurrentCurrency.calledOnce)
  })

  it('selects locale', async function () {
    const selectLocale = wrapper.find({ placeholder: 'selectLocale' })

    await selectLocale.props().onSelect('ja')
    assert(props.updateCurrentLocale.calledOnce)
  })

  it('sets fiat primary currency', function () {
    const selectFiat = wrapper.find('#fiat-primary-currency')

    selectFiat.simulate('change')
    assert(props.setUseNativeCurrencyAsPrimaryCurrencyPreference.calledOnce)
  })

  it('toggles blockies', function () {
    const toggleBlockies = wrapper.find({ type: 'checkbox' })

    toggleBlockies.simulate('click')
    assert(props.setUseBlockie.calledOnce)
  })
})
