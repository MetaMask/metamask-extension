import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import TransactionActivityLog from '../transaction-activity-log.component'
import Card from '../../card'

describe('TransactionActivityLog Component', () => {
  it('should render properly', () => {
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
      <TransactionActivityLog
        transaction={transaction}
        className="test-class"
      />,
      { context: { t: (str1, str2) => str2 ? str1 + str2 : str1 } }
    )

    assert.ok(wrapper.hasClass('transaction-activity-log'))
    assert.ok(wrapper.hasClass('test-class'))
    assert.equal(wrapper.find(Card).length, 1)
  })
})
