import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import UserPreferencedCurrencyInput from '../user-preferenced-currency-input.component'
import CurrencyInput from '../../currency-input'

describe('UserPreferencedCurrencyInput Component', () => {
  describe('rendering', () => {
    it('should render properly', () => {
      const wrapper = shallow(
        <UserPreferencedCurrencyInput />
      )

      assert.ok(wrapper)
      assert.equal(wrapper.find(CurrencyInput).length, 1)
    })

    it('should render useFiat for CurrencyInput based on preferences.useETHAsPrimaryCurrency', () => {
      const wrapper = shallow(
        <UserPreferencedCurrencyInput
          useETHAsPrimaryCurrency
        />
      )

      assert.ok(wrapper)
      assert.equal(wrapper.find(CurrencyInput).length, 1)
      assert.equal(wrapper.find(CurrencyInput).props().useFiat, false)
      wrapper.setProps({ useETHAsPrimaryCurrency: false })
      assert.equal(wrapper.find(CurrencyInput).props().useFiat, true)
    })
  })
})
