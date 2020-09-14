import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
import { screen, fireEvent } from '@testing-library/react'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import render from '../../../../../../../test/lib/render-helpers'
import * as actions from '../../../../../store/actions'
import MetaMetricsOptIn from '..'

describe('MetaMetrics Opt In', function () {
  const mockState = {
    metamask: {},
    appState: {
      modal: {
        modalState: {},
      },
    },
  }

  const props = {
    setParticipateInMetaMetrics: sinon.stub().resolves(),
    hideModal: sinon.spy(),
    participateInMetaMetrics: null,
  }

  afterEach(function () {
    sinon.restore()
  })

  it('passes false to setParticipateInMetaMetrics when No Thanks is clicked', function () {
    const store = configureMockStore([thunk])(mockState)
    const metricsSpy = sinon.stub(actions, 'setParticipateInMetaMetrics').returns(() => Promise.resolve())

    render(<MetaMetricsOptIn {...props} />, store)

    const noThanksButton = screen.getByText(/noThanks/u)
    fireEvent.click(noThanksButton)

    assert(metricsSpy.calledOnce)
    assert(metricsSpy.calledWith(false))
  })

  it('passes true to setParticipateInMetaMetrics when Agree is clicked', function () {
    const store = configureMockStore([thunk])(mockState)
    const metricsSpy = sinon.stub(actions, 'setParticipateInMetaMetrics').returns(() => Promise.resolve())

    render(<MetaMetricsOptIn {...props} />, store)
    const noThanksButton = screen.getByText(/affirmAgree/u)
    fireEvent.click(noThanksButton)

    assert(metricsSpy.calledOnce)
    assert(metricsSpy.calledWith(true))
  })

})
