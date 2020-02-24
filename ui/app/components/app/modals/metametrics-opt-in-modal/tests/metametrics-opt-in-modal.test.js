import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { mount } from 'enzyme'
import MetaMetricsOptIn from '../index'

describe('MetaMetrics Opt In', function () {
  let wrapper

  const props = {
    setParticipateInMetaMetrics: sinon.stub().resolves(),
    hideModal: sinon.spy(),
    participateInMetaMetrics: null,
  }

  beforeEach(function () {
    wrapper = mount(
      <MetaMetricsOptIn.WrappedComponent {...props} />, {
        context: {
          metricsEvent: () => {},
        },
      }
    )
  })

  afterEach(function () {
    props.setParticipateInMetaMetrics.resetHistory()
    props.hideModal.resetHistory()
  })

  it('passes false to setParticipateInMetaMetrics and hides modal', function (done) {
    const noThanks = wrapper.find('.btn-default.page-container__footer-button')
    noThanks.simulate('click')

    setImmediate(() => {
      assert(props.setParticipateInMetaMetrics.calledOnce)
      assert.equal(props.setParticipateInMetaMetrics.getCall(0).args[0], false)
      assert(props.hideModal.calledOnce)
      done()
    })
  })

  it('passes true to setParticipateInMetaMetrics and hides modal', function (done) {
    const iAgree = wrapper.find('.btn-primary.page-container__footer-button')
    iAgree.simulate('click')

    setImmediate(() => {
      assert(props.setParticipateInMetaMetrics.calledOnce)
      assert.equal(props.setParticipateInMetaMetrics.getCall(0).args[0], true)
      assert(props.hideModal.calledOnce)
      done()
    })
  })

})
