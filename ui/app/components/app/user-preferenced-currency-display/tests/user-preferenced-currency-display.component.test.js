import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display.component'
import CurrencyDisplay from '../../../ui/currency-display'

describe('UserPreferencedCurrencyDisplay Component', () => {
  describe('rendering', () => {
    it('should render properly', () => {
      const wrapper = shallow(
        <UserPreferencedCurrencyDisplay />
      )

      assert.ok(wrapper)
      assert.equal(wrapper.find(CurrencyDisplay).length, 1)
    })

    it('should pass all props to the CurrencyDisplay child component', () => {
      const wrapper = shallow(
        <UserPreferencedCurrencyDisplay
          prop1={true}
          prop2="test"
          prop3={1}
        />
      )

      assert.ok(wrapper)
      assert.equal(wrapper.find(CurrencyDisplay).length, 1)
      assert.equal(wrapper.find(CurrencyDisplay).props().prop1, true)
      assert.equal(wrapper.find(CurrencyDisplay).props().prop2, 'test')
      assert.equal(wrapper.find(CurrencyDisplay).props().prop3, 1)
    })
  })
})
