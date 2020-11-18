import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
import { mount } from 'enzyme'
import SecurityTab from '..'

describe('Security Tab', function () {
  let wrapper

  const props = {
    revealSeedConfirmation: sinon.spy(),
    showClearApprovalModal: sinon.spy(),
    setParticipateInMetaMetrics: sinon.spy(),
    displayWarning: sinon.spy(),
    setShowIncomingTransactionsFeatureFlag: sinon.spy(),
    history: {
      push: sinon.spy(),
    },
    privacyMode: true,
    warning: '',
    participateInMetaMetrics: false,
    setUsePhishDetect: sinon.spy(),
    usePhishDetect: true,
  }

  beforeEach(function () {
    wrapper = mount(<SecurityTab.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
        metricsEvent: () => undefined,
      },
    })
  })

  it('navigates to reveal seed words page', function () {
    const seedWords = wrapper.find('.button.btn-danger.btn--large')

    seedWords.simulate('click')
    assert(props.history.push.calledOnce)
    assert.equal(props.history.push.getCall(0).args[0], '/seed')
  })

  it('toggles incoming txs', function () {
    const incomingTxs = wrapper.find({ type: 'checkbox' }).at(0)
    incomingTxs.simulate('click')
    assert(props.setShowIncomingTransactionsFeatureFlag.calledOnce)
  })

  it('toggles phishing detection', function () {
    const phishDetect = wrapper.find({ type: 'checkbox' }).at(1)
    phishDetect.simulate('click')
    assert(props.setUsePhishDetect.calledOnce)
  })

  it('toggles metaMetrics', function () {
    const metaMetrics = wrapper.find({ type: 'checkbox' }).at(2)

    metaMetrics.simulate('click')
    assert(props.setParticipateInMetaMetrics.calledOnce)
  })
})
