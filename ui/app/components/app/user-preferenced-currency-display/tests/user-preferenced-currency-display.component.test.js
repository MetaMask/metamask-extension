import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display.component'
import CurrencyDisplay from '../../../ui/currency-display'

describe('UserPreferencedCurrencyDisplay Component', function () {
  describe('rendering', function () {
    it('should render properly', function () {
      const wrapper = shallow(
        <UserPreferencedCurrencyDisplay />
      )

      assert.ok(wrapper)
      assert.equal(wrapper.find(CurrencyDisplay).length, 1)
    })

    it('should pass all props to the CurrencyDisplay child component', function () {
      const wrapper = shallow(
        <UserPreferencedCurrencyDisplay
          prop1
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
