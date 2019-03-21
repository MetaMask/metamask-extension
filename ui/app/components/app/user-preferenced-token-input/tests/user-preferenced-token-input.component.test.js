import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import UserPreferencedTokenInput from '../user-preferenced-token-input.component'
import TokenInput from '../../../ui/token-input'

describe('UserPreferencedCurrencyInput Component', () => {
  describe('rendering', () => {
    it('should render properly', () => {
      const wrapper = shallow(
        <UserPreferencedTokenInput />
      )

      assert.ok(wrapper)
      assert.equal(wrapper.find(TokenInput).length, 1)
    })

    it('should render showFiat for TokenInput based on preferences.useNativeCurrencyAsPrimaryCurrency', () => {
      const wrapper = shallow(
        <UserPreferencedTokenInput
          useNativeCurrencyAsPrimaryCurrency
        />
      )

      assert.ok(wrapper)
      assert.equal(wrapper.find(TokenInput).length, 1)
      assert.equal(wrapper.find(TokenInput).props().showFiat, false)
      wrapper.setProps({ useNativeCurrencyAsPrimaryCurrency: false })
      assert.equal(wrapper.find(TokenInput).props().showFiat, true)
    })
  })
})
