import React from 'react'
import assert from 'assert'
import { mount } from 'enzyme'
import TransactionStatus from '../transaction-status.component'
import Tooltip from '../../../ui/tooltip-v2'

describe('TransactionStatus Component', () => {
  it('should render APPROVED properly', () => {
    const wrapper = mount(
      <TransactionStatus
        statusKey="approved"
        title="test-title"
      />,
      { context: { t: str => str.toUpperCase() } }
    )

    assert.ok(wrapper)
    assert.equal(wrapper.text(), 'APPROVED')
    assert.equal(wrapper.find(Tooltip).props().title, 'test-title')
  })

  it('should render SUBMITTED properly', () => {
    const wrapper = mount(
      <TransactionStatus
        statusKey="submitted"
      />,
      { context: { t: str => str.toUpperCase() } }
    )

    assert.ok(wrapper)
    assert.equal(wrapper.text(), 'PENDING')
  })
})
