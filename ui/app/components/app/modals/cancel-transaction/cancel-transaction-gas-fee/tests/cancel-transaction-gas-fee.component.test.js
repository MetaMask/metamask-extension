import assert from 'assert'
import React from 'react'
import { shallow } from 'enzyme'
import CancelTransactionGasFee from '../cancel-transaction-gas-fee.component'
import UserPreferencedCurrencyDisplay from '../../../../user-preferenced-currency-display'

describe('CancelTransactionGasFee Component', function () {
  it('should render', function () {
    const wrapper = shallow(<CancelTransactionGasFee value="0x3b9aca00" />)

    assert.ok(wrapper)
    assert.equal(wrapper.find(UserPreferencedCurrencyDisplay).length, 2)
    const ethDisplay = wrapper.find(UserPreferencedCurrencyDisplay).at(0)
    const fiatDisplay = wrapper.find(UserPreferencedCurrencyDisplay).at(1)

    assert.equal(ethDisplay.props().value, '0x3b9aca00')
    assert.equal(
      ethDisplay.props().className,
      'cancel-transaction-gas-fee__eth',
    )

    assert.equal(fiatDisplay.props().value, '0x3b9aca00')
    assert.equal(
      fiatDisplay.props().className,
      'cancel-transaction-gas-fee__fiat',
    )
  })
})
