import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
import configureMockStore from 'redux-mock-store'
import { mountWithRouter } from '../../../../../../test/lib/render-helpers'
import MetaMetricsOptIn from '..'

describe('MetaMetricsOptIn', function () {
  it('opt out of MetaMetrics', function () {
    const props = {
      history: {
        push: sinon.spy(),
      },
      setParticipateInMetaMetrics: sinon.stub().resolves(),
      participateInMetaMetrics: false,
    }
    const store = configureMockStore()({
      metamask: {},
    })
    const wrapper = mountWithRouter(
      <MetaMetricsOptIn.WrappedComponent {...props} />,
      store,
    )
    const noThanksButton = wrapper.find(
      '.btn-default.page-container__footer-button',
    )
    noThanksButton.simulate('click')

    assert.ok(props.setParticipateInMetaMetrics.calledOnceWithExactly(false))
    props.setParticipateInMetaMetrics.resetHistory()
  })
})
