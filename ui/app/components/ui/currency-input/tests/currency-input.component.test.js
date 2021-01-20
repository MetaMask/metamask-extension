import React from 'react'
import PropTypes from 'prop-types'
import assert from 'assert'
import { shallow, mount } from 'enzyme'
import sinon from 'sinon'
import { Provider } from 'react-redux'
import configureMockStore from 'redux-mock-store'
import CurrencyInput from '../currency-input.component'
import UnitInput from '../../unit-input'
import CurrencyDisplay from '../../currency-display'

describe('CurrencyInput Component', function() {
  describe('rendering', function() {
    it('should render properly without a suffix', function() {
      const wrapper = shallow(<CurrencyInput />)

      assert.ok(wrapper)
      assert.equal(wrapper.find(UnitInput).length, 1)
    })

    it('should render properly with a suffix', function() {
      const mockStore = {
        metamask: {
          nativeCurrency: 'CFX',
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      }
      const store = configureMockStore()(mockStore)

      const wrapper = mount(
        <Provider store={store}>
          <CurrencyInput
            nativeSuffix="CFX"
            fiatSuffix="USD"
            nativeCurrency="CFX"
          />
        </Provider>
      )

      assert.ok(wrapper)
      assert.equal(wrapper.find('.unit-input__suffix').length, 1)
      assert.equal(wrapper.find('.unit-input__suffix').text(), 'CFX')
      assert.equal(wrapper.find(CurrencyDisplay).length, 1)
    })

    it('should render properly with an CFX value', function() {
      const mockStore = {
        metamask: {
          nativeCurrency: 'CFX',
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      }
      const store = configureMockStore()(mockStore)

      const wrapper = mount(
        <Provider store={store}>
          <CurrencyInput
            value="de0b6b3a7640000"
            fiatSuffix="USD"
            nativeSuffix="CFX"
            nativeCurrency="CFX"
            currentCurrency="usd"
            conversionRate={231.06}
          />
        </Provider>
      )

      assert.ok(wrapper)
      const currencyInputInstance = wrapper
        .find(CurrencyInput)
        .at(0)
        .instance()
      assert.equal(currencyInputInstance.state.decimalValue, 1)
      assert.equal(currencyInputInstance.state.hexValue, 'de0b6b3a7640000')
      assert.equal(wrapper.find('.unit-input__suffix').length, 1)
      assert.equal(wrapper.find('.unit-input__suffix').text(), 'CFX')
      assert.equal(wrapper.find('.unit-input__input').props().value, '1')
      assert.equal(
        wrapper.find('.currency-display-component').text(),
        '$231.06USD'
      )
    })

    it('should render properly with a fiat value', function() {
      const mockStore = {
        metamask: {
          nativeCurrency: 'CFX',
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      }
      const store = configureMockStore()(mockStore)

      const wrapper = mount(
        <Provider store={store}>
          <CurrencyInput
            value="f602f2234d0ea"
            fiatSuffix="USD"
            nativeSuffix="CFX"
            useFiat
            nativeCurrency="CFX"
            currentCurrency="usd"
            conversionRate={231.06}
          />
        </Provider>
      )

      assert.ok(wrapper)
      const currencyInputInstance = wrapper
        .find(CurrencyInput)
        .at(0)
        .instance()
      assert.equal(currencyInputInstance.state.decimalValue, 1)
      assert.equal(currencyInputInstance.state.hexValue, 'f602f2234d0ea')
      assert.equal(wrapper.find('.unit-input__suffix').length, 1)
      // assert.equal(wrapper.find('.unit-input__suffix').text(), 'USD')
      // assert.equal(wrapper.find('.unit-input__input').props().value, '1')
      // assert.equal(
      //   wrapper.find('.currency-display-component').text(),
      //   '0.004328CFX'
      // )
    })

    it('should render properly with a native value when hideFiat is true', function() {
      const mockStore = {
        metamask: {
          nativeCurrency: 'CFX',
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      }
      const store = configureMockStore()(mockStore)

      const wrapper = mount(
        <Provider store={store}>
          <CurrencyInput
            value="f602f2234d0ea"
            fiatSuffix="USD"
            nativeSuffix="CFX"
            useFiat
            hideFiat
            nativeCurrency="CFX"
            currentCurrency="usd"
            conversionRate={231.06}
          />
        </Provider>,
        {
          context: { t: str => str + '_t' },
          childContextTypes: { t: PropTypes.func },
        }
      )

      assert.ok(wrapper)
      const currencyInputInstance = wrapper
        .find(CurrencyInput)
        .at(0)
        .instance()
      assert.equal(currencyInputInstance.state.decimalValue, 0.004328)
      assert.equal(currencyInputInstance.state.hexValue, 'f602f2234d0ea')
      assert.equal(wrapper.find('.unit-input__suffix').length, 1)
      assert.equal(wrapper.find('.unit-input__suffix').text(), 'CFX')
      assert.equal(wrapper.find('.unit-input__input').props().value, '0.004328')
      assert.equal(
        wrapper.find('.currency-input__conversion-component').text(),
        'noConversionRateAvailable_t'
      )
    })
  })

  describe('handling actions', function() {
    const handleChangeSpy = sinon.spy()
    const handleBlurSpy = sinon.spy()

    afterEach(function() {
      handleChangeSpy.resetHistory()
      handleBlurSpy.resetHistory()
    })

    it('should call onChange on input changes with the hex value for CFX', function() {
      const mockStore = {
        metamask: {
          nativeCurrency: 'CFX',
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      }
      const store = configureMockStore()(mockStore)
      const wrapper = mount(
        <Provider store={store}>
          <CurrencyInput
            onChange={handleChangeSpy}
            suffix="CFX"
            nativeCurrency="CFX"
            currentCurrency="usd"
            conversionRate={231.06}
          />
        </Provider>
      )

      assert.ok(wrapper)
      assert.equal(handleChangeSpy.callCount, 0)

      const currencyInputInstance = wrapper
        .find(CurrencyInput)
        .at(0)
        .instance()
      assert.equal(currencyInputInstance.state.decimalValue, 0)
      assert.equal(currencyInputInstance.state.hexValue, undefined)
      assert.equal(wrapper.find('.currency-display-component').text(), '0USD')
      const input = wrapper.find('input')
      assert.equal(input.props().value, 0)

      input.simulate('change', { target: { value: 1 } })
      assert.equal(handleChangeSpy.callCount, 1)
      assert.ok(handleChangeSpy.calledWith('de0b6b3a7640000'))
      assert.equal(
        wrapper.find('.currency-display-component').text(),
        '$231.06USD'
      )
      assert.equal(currencyInputInstance.state.decimalValue, 1)
      assert.equal(currencyInputInstance.state.hexValue, 'de0b6b3a7640000')
    })

    it('should call onChange on input changes with the hex value for fiat', function() {
      const mockStore = {
        metamask: {
          nativeCurrency: 'CFX',
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      }
      const store = configureMockStore()(mockStore)
      const wrapper = mount(
        <Provider store={store}>
          <CurrencyInput
            onChange={handleChangeSpy}
            suffix="USD"
            nativeCurrency="CFX"
            currentCurrency="usd"
            conversionRate={231.06}
            useFiat
          />
        </Provider>
      )

      assert.ok(wrapper)
      assert.equal(handleChangeSpy.callCount, 0)

      const currencyInputInstance = wrapper
        .find(CurrencyInput)
        .at(0)
        .instance()
      assert.equal(currencyInputInstance.state.decimalValue, 0)
      assert.equal(currencyInputInstance.state.hexValue, undefined)
      // assert.equal(wrapper.find('.currency-display-component').text(), '0CFX')
      const input = wrapper.find('input')
      assert.equal(input.props().value, 0)

      input.simulate('change', { target: { value: 1 } })
      assert.equal(handleChangeSpy.callCount, 1)
      assert.ok(handleChangeSpy.calledWith('f602f2234d0ea'))
      // assert.equal(
      //   wrapper.find('.currency-display-component').text(),
      //   '0.004328CFX'
      // )
      assert.equal(currencyInputInstance.state.decimalValue, 1)
      assert.equal(currencyInputInstance.state.hexValue, 'f602f2234d0ea')
    })

    it('should change the state and pass in a new decimalValue when props.value changes', function() {
      const mockStore = {
        metamask: {
          nativeCurrency: 'CFX',
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      }
      const store = configureMockStore()(mockStore)
      const wrapper = shallow(
        <Provider store={store}>
          <CurrencyInput
            onChange={handleChangeSpy}
            suffix="USD"
            nativeCurrency="CFX"
            currentCurrency="usd"
            conversionRate={231.06}
            useFiat
          />
        </Provider>
      )

      assert.ok(wrapper)
      const currencyInputInstance = wrapper.find(CurrencyInput).dive()
      assert.equal(currencyInputInstance.state('decimalValue'), 0)
      assert.equal(currencyInputInstance.state('hexValue'), undefined)
      assert.equal(currencyInputInstance.find(UnitInput).props().value, 0)

      currencyInputInstance.setProps({ value: '1ec05e43e72400' })
      currencyInputInstance.update()
      assert.equal(currencyInputInstance.state('decimalValue'), 2)
      assert.equal(currencyInputInstance.state('hexValue'), '1ec05e43e72400')
      assert.equal(currencyInputInstance.find(UnitInput).props().value, 2)
    })

    it('should swap selected currency when swap icon is clicked', function() {
      const mockStore = {
        metamask: {
          nativeCurrency: 'CFX',
          currentCurrency: 'usd',
          conversionRate: 231.06,
        },
      }
      const store = configureMockStore()(mockStore)
      const wrapper = mount(
        <Provider store={store}>
          <CurrencyInput
            onChange={handleChangeSpy}
            nativeSuffix="CFX"
            fiatSuffix="USD"
            nativeCurrency="CFX"
            currentCurrency="usd"
            conversionRate={231.06}
          />
        </Provider>
      )

      assert.ok(wrapper)
      assert.equal(handleChangeSpy.callCount, 0)

      const currencyInputInstance = wrapper
        .find(CurrencyInput)
        .at(0)
        .instance()
      assert.equal(currencyInputInstance.state.decimalValue, 0)
      assert.equal(currencyInputInstance.state.hexValue, undefined)
      // assert.equal(
      //   wrapper.find('.currency-display-component').text(),
      //   '$0.00USD'
      // )
      const input = wrapper.find('input')
      assert.equal(input.props().value, 0)

      input.simulate('change', { target: { value: 1 } })
      assert.equal(handleChangeSpy.callCount, 1)
      assert.ok(handleChangeSpy.calledWith('de0b6b3a7640000'))
      // assert.equal(
      //   wrapper.find('.currency-display-component').text(),
      //   '$231.06USD'
      // )
      assert.equal(currencyInputInstance.state.decimalValue, 1)
      assert.equal(currencyInputInstance.state.hexValue, 'de0b6b3a7640000')

      const swap = wrapper.find('.currency-input__swap-component')
      swap.simulate('click')
      // assert.equal(
      //   wrapper.find('.currency-display-component').text(),
      //   '0.004328CFX'
      // )
    })
  })
})
