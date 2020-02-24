import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { mount } from 'enzyme'
import SecurityTab from '../index'

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
  }

  beforeEach(function () {
    wrapper = mount(
      <SecurityTab.WrappedComponent {...props} />, {
        context: {
          t: (str) => str,
          metricsEvent: () => {},
        },
      }
    )
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

  it('toggles metaMetrics', function () {
    const metaMetrics = wrapper.find({ type: 'checkbox' }).at(1)

    metaMetrics.simulate('click')
    assert(props.setParticipateInMetaMetrics.calledOnce)
  })
})
