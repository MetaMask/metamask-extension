import React from 'react'
import assert from 'assert'
import { mount } from 'enzyme'
import TransactionStatus from '../transaction-status.component'
import Tooltip from '../../tooltip-v2'

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
    const tooltipProps = wrapper.find(Tooltip).props()
    assert.equal(tooltipProps.children, 'APPROVED')
    assert.equal(tooltipProps.title, 'test-title')
  })

  it('should render SUBMITTED properly', () => {
    const wrapper = mount(
      <TransactionStatus
        statusKey="submitted"
      />,
      { context: { t: str => str.toUpperCase() } }
    )

    assert.ok(wrapper)
    const tooltipProps = wrapper.find(Tooltip).props()
    assert.equal(tooltipProps.children, 'PENDING')
  })
})
