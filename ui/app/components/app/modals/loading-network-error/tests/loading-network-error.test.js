import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { mountWithRouter } from '../../../../../../../test/lib/render-helpers'
import LoadingNetworkError from '../index'

describe('LoadingNetworkError', function () {
  let wrapper

  const props = {
    hideModal: sinon.spy(),
  }

  beforeEach(function () {
    wrapper = mountWithRouter(
      <LoadingNetworkError.WrappedComponent {...props} />
    )
  })

  afterEach(function () {
    props.hideModal.resetHistory()
  })

  after(function () {
    sinon.restore()
  })

  it('renders', function () {
    assert.equal(wrapper.length, 1)
  })

  it('click try again button and calls hide modal', function () {
    const tryAgainButton = wrapper.find('.button.modal-container__footer-button')
    tryAgainButton.simulate('click')

    assert(props.hideModal.calledOnce)
  })
})
