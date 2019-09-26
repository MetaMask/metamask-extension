import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { mountWithRouter } from '../../../../../../test/lib/render-helpers'
import TransactionList from '../index'

describe('Transaction List', () => {
  let wrapper

  const props = {
    updateNetworkNonce: sinon.spy(),
  }

  beforeEach(() => {
    wrapper = mountWithRouter(
      <TransactionList.WrappedComponent {...props} />
    )
  })

  it('', () => {
    assert.equal(wrapper.length, 1)
  })
})

