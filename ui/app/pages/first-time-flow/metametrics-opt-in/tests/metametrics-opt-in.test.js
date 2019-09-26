import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import configureMockStore from 'redux-mock-store'
import { mountWithRouter } from '../../../../../../test/lib/render-helpers'
import MetaMetricsOptIn from '../index'

describe('MetaMetricsOptIn', () => {
  let wrapper

  const props = {
    history: {
      push: sinon.spy(),
    },
    setParticipateInMetaMetrics: sinon.stub().resolves(),
    participateInMetaMetrics: false,
  }

  const mockStore = {
    metamask: {},
  }

  const store = configureMockStore()(mockStore)

  beforeEach(() => {
    wrapper = mountWithRouter(
      <MetaMetricsOptIn.WrappedComponent {...props} />, store
    )
  })

  afterEach(() => {
    props.setParticipateInMetaMetrics.resetHistory()
  })

  it('opt out of metametrics', () => {
    const noThanksButton = wrapper.find('.btn-default.btn--large.page-container__footer-button')
    noThanksButton.simulate('click')

    assert(props.setParticipateInMetaMetrics.calledOnce)
    assert.equal(props.setParticipateInMetaMetrics.getCall(0).args[0], false)
  })

})
