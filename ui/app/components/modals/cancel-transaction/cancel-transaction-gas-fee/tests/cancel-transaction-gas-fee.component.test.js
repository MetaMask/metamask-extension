import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import CancelTransactionGasFee from '../cancel-transaction-gas-fee.component'
import CurrencyDisplay from '../../../../currency-display'

describe('CancelTransactionGasFee Component', () => {
  it('should render', () => {
    const wrapper = shallow(
      <CancelTransactionGasFee
        value="0x3b9aca00"
      />
    )

    assert.ok(wrapper)
    assert.equal(wrapper.find(CurrencyDisplay).length, 2)
    const ethDisplay = wrapper.find(CurrencyDisplay).at(0)
    const fiatDisplay = wrapper.find(CurrencyDisplay).at(1)

    assert.equal(ethDisplay.props().value, '0x3b9aca00')
    assert.equal(ethDisplay.props().currency, 'ETH')
    assert.equal(ethDisplay.props().className, 'cancel-transaction-gas-fee__eth')

    assert.equal(fiatDisplay.props().value, '0x3b9aca00')
    assert.equal(fiatDisplay.props().className, 'cancel-transaction-gas-fee__fiat')
  })
})
