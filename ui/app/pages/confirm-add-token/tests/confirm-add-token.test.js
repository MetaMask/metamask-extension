import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { mount } from 'enzyme'
import ConfirmAddToken from '../index'

describe('Confirm Add Token', () => {
  let wrapper

  const props = {
    history: {
      push: sinon.spy(),
    },
    clearPendingTokens: sinon.spy(),
    addTokens: sinon.spy(),
    pendingTokens: {},
  }

  beforeEach(() => {
    wrapper = mount(
      <ConfirmAddToken.WrappedComponent {...props} />, {
        context: {
          t: str => str,
        },
      }
    )
  })

  it('renders', () => {
    assert.equal(wrapper.length, 1)
  })
})
