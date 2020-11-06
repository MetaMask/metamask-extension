import assert from 'assert'
import React from 'react'
import { mount } from 'enzyme'
import sinon from 'sinon'
import * as i18nHook from '../../../../hooks/useI18nContext'
import TransactionStatus from '../transaction-status.component'
import Tooltip from '../../../ui/tooltip'

describe('TransactionStatus Component', function () {
  before(function () {
    sinon.stub(i18nHook, 'useI18nContext').returns((str) => str.toUpperCase())
  })

  it('should render CONFIRMED properly', function () {
    const wrapper = mount(
      <TransactionStatus status="confirmed" date="June 1" />,
    )

    assert.ok(wrapper)
    assert.equal(wrapper.text(), 'June 1')
  })

  it('should render PENDING properly when status is APPROVED', function () {
    const wrapper = mount(
      <TransactionStatus
        status="approved"
        isEarliestNonce
        error={{ message: 'test-title' }}
      />,
    )

    assert.ok(wrapper)
    assert.equal(wrapper.text(), 'PENDING')
    assert.equal(wrapper.find(Tooltip).props().title, 'test-title')
  })

  it('should render PENDING properly', function () {
    const wrapper = mount(
      <TransactionStatus date="June 1" status="submitted" isEarliestNonce />,
    )

    assert.ok(wrapper)
    assert.equal(wrapper.text(), 'PENDING')
  })

  it('should render QUEUED properly', function () {
    const wrapper = mount(<TransactionStatus status="queued" />)

    assert.ok(wrapper)
    assert.ok(
      wrapper.find('.transaction-status--queued').length,
      'queued className not found',
    )
    assert.equal(wrapper.text(), 'QUEUED')
  })

  it('should render UNAPPROVED properly', function () {
    const wrapper = mount(<TransactionStatus status="unapproved" />)

    assert.ok(wrapper)
    assert.ok(
      wrapper.find('.transaction-status--unapproved').length,
      'unapproved className not found',
    )
    assert.equal(wrapper.text(), 'UNAPPROVED')
  })

  after(function () {
    sinon.restore()
  })
})
