import * as reactRedux from 'react-redux'
import assert from 'assert'
import { renderHook } from '@testing-library/react-hooks'
import sinon from 'sinon'
import transactions from '../../../../test/data/transaction-data.json'
import * as methodDataHook from '../useMethodData'
import * as metricEventHook from '../useMetricEvent'
import { showSidebar } from '../../store/actions'
import { useRetryTransaction } from '../useRetryTransaction'

let useDispatch, useMethodData, useMetricEvent

const dispatch = sinon.spy(() => Promise.resolve({ blockTime: 0 }))
const trackEvent = sinon.spy()

const event = { preventDefault: () => {}, stopPropagation: () => {} }

describe('useCancelTransaction', function () {
  before(function () {
    useDispatch = sinon.stub(reactRedux, 'useDispatch')
    useDispatch.returns(dispatch)
    useMethodData = sinon.stub(methodDataHook, 'useMethodData')
    useMethodData.returns({})
    useMetricEvent = sinon.stub(metricEventHook, 'useMetricEvent')
    useMetricEvent.returns(trackEvent)
  })

  afterEach(function () {
    dispatch.resetHistory()
    trackEvent.resetHistory()
  })

  describe('when transaction has previously been retried', function () {
    const retryDisabledByPreviousRetryTransaction = {
      ...transactions[0],
      transactions: [
        {
          submittedTime: new Date() - 5001,
        },
      ],
      hasRetried: true,
    }
    it('should indicate that retry is disabled', function () {
      const { result } = renderHook(() => useRetryTransaction(retryDisabledByPreviousRetryTransaction, true))
      assert.equal(result.current[0], false)
    })

    it('retryTransaction function should eject before tracking metrics', function () {
      const { result } = renderHook(() => useRetryTransaction(retryDisabledByPreviousRetryTransaction, true))
      const [, retry] = result.current
      retry(event)
      assert.equal(dispatch.notCalled, true)
    })
  })

  describe('when transaction has not yet waited for 5 seconds', function () {
    const retryDisabledByTimeTransaction = {
      ...transactions[0],
      transactions: [
        {
          submittedTime: new Date() - 1 + 50001,
        },
      ],
      hasRetried: false,
    }
    it('should indicate that retry is disabled', function () {
      const { result } = renderHook(() => useRetryTransaction(retryDisabledByTimeTransaction, true))
      assert.equal(result.current[0], false)
    })

    it('retryTransaction function should eject before tracking metrics', function () {
      const { result } = renderHook(() => useRetryTransaction(retryDisabledByTimeTransaction, true))
      const [, retry] = result.current
      retry(event)
      assert.equal(dispatch.notCalled, true)
    })
  })

  describe('when transaction meets retry enabled criteria', function () {
    const retryEnabledTransaction = {
      ...transactions[0],
      transactions: [
        {
          submittedTime: new Date() - 5001,
        },
      ],
      hasRetried: false,
    }
    it('should indicate that retry is disabled', function () {
      const { result } = renderHook(() => useRetryTransaction(retryEnabledTransaction, true))
      assert.equal(result.current[0], true)
    })

    it('retryTransaction function should track metrics', function () {
      const { result } = renderHook(() => useRetryTransaction(retryEnabledTransaction, true))
      const [, retry] = result.current
      retry(event)
      assert.equal(trackEvent.calledOnce, true)
    })

    it('retryTransaction function should show retry sidebar', async function () {
      const { result } = renderHook(() => useRetryTransaction(retryEnabledTransaction, true))
      const [, retry] = result.current
      await retry(event)
      const calls = dispatch.getCalls()
      assert.equal(calls.length, 5)
      assert.equal(
        dispatch.calledWith(
          showSidebar({
            transitionName: 'sidebar-left',
            type: 'customize-gas',
            props: { transaction: retryEnabledTransaction.initialTransaction },
          })
        ),
        true
      )
    })
  })

  after(function () {
    useDispatch.restore()
    useMethodData.restore()
    useMetricEvent.restore()
  })
})
