import assert from 'assert'
import React from 'react'
import { shallow } from 'enzyme'
import TransactionBreakdown from '../transaction-breakdown.component'

describe('TransactionBreakdown Component', function () {
  it('should render properly', function () {
    const transaction = {
      history: [],
      id: 1,
      status: 'confirmed',
      txParams: {
        from: '0x1',
        gas: '0x5208',
        gasPrice: '0x3b9aca00',
        nonce: '0xa4',
        to: '0x2',
        value: '0x2386f26fc10000',
      },
    }

    const wrapper = shallow(
      <TransactionBreakdown transaction={transaction} className="test-class" />,
      { context: { t: (str1, str2) => (str2 ? str1 + str2 : str1) } },
    )

    assert.ok(wrapper.hasClass('transaction-breakdown'))
    assert.ok(wrapper.hasClass('test-class'))
  })
})
