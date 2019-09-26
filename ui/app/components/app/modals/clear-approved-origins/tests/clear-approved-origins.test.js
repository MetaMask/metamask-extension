import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { mount } from 'enzyme'
import ClearApprovedOriginsComponent from '../index'

describe('Clear Approved Origins Component', () => {
  let wrapper

  const props = {
    hideModal: sinon.spy(),
    clearApprovedOrigins: sinon.spy(),
  }

  beforeEach(() => {
    wrapper = mount(
      <ClearApprovedOriginsComponent.WrappedComponent {...props} />, {
        context: {
          t: str => str,
        },
      }
    )
  })

  afterEach(() => {
    props.hideModal.resetHistory()
  })

  it('hides modal when nevermind button is clicked', () => {
    const nevermind = wrapper.find('.btn-default.modal-container__footer-button')
    nevermind.simulate('click')

    assert(props.hideModal.calledOnce)
  })

  it('clears approved origins and hides modal when ok button is clicked', () => {
    const ok = wrapper.find('.btn-secondary.modal-container__footer-button')
    ok.simulate('click')

    assert(props.clearApprovedOrigins.calledOnce)
    assert(props.hideModal.calledOnce)
  })
})
