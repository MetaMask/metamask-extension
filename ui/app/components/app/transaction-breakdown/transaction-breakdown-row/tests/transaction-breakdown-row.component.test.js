import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import TransactionBreakdownRow from '../transaction-breakdown-row.component'
import Button from '../../../../ui/button'

describe('TransactionBreakdownRow Component', () => {
  it('should render text properly', () => {
    const wrapper = shallow(
      <TransactionBreakdownRow
        title="test"
        className="test-class"
      >
        Test
      </TransactionBreakdownRow>,
      { context: { t: (str1, str2) => str2 ? str1 + str2 : str1 } }
    )

    assert.ok(wrapper.hasClass('transaction-breakdown-row'))
    assert.equal(wrapper.find('.transaction-breakdown-row__title').text(), 'test')
    assert.equal(wrapper.find('.transaction-breakdown-row__value').text(), 'Test')
  })

  it('should render components properly', () => {
    const wrapper = shallow(
      <TransactionBreakdownRow
        title="test"
        className="test-class"
      >
        <Button onClick={() => {}} >Button</Button>
      </TransactionBreakdownRow>,
      { context: { t: (str1, str2) => str2 ? str1 + str2 : str1 } }
    )

    assert.ok(wrapper.hasClass('transaction-breakdown-row'))
    assert.equal(wrapper.find('.transaction-breakdown-row__title').text(), 'test')
    assert.ok(wrapper.find('.transaction-breakdown-row__value').find(Button))
  })
})
