import assert from 'assert'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

let mapDispatchToProps

const actionSpies = {
  setMaxModeTo: sinon.spy(),
  updateSendAmount: sinon.spy(),
}
const duckActionSpies = {
  updateSendErrors: sinon.spy(),
}

proxyquire('../send-amount-row.container.js', {
  'react-redux': {
    connect: (_, md) => {
      mapDispatchToProps = md
      return () => ({})
    },
  },
  '../../../../selectors': { sendAmountIsInError: (s) => `mockInError:${s}` },
  '../../send.utils': {
    getAmountErrorObject: (mockDataObject) => ({
      ...mockDataObject,
      mockChange: true,
    }),
    getGasFeeErrorObject: (mockDataObject) => ({
      ...mockDataObject,
      mockGasFeeErrorChange: true,
    }),
  },
  '../../../../store/actions': actionSpies,
  '../../../../ducks/send/send.duck': duckActionSpies,
})

describe('send-amount-row container', function () {
  describe('mapDispatchToProps()', function () {
    let dispatchSpy
    let mapDispatchToPropsObject

    beforeEach(function () {
      dispatchSpy = sinon.spy()
      mapDispatchToPropsObject = mapDispatchToProps(dispatchSpy)
      duckActionSpies.updateSendErrors.resetHistory()
    })

    describe('setMaxModeTo()', function () {
      it('should dispatch an action', function () {
        mapDispatchToPropsObject.setMaxModeTo('mockBool')
        assert(dispatchSpy.calledOnce)
        assert(actionSpies.setMaxModeTo.calledOnce)
        assert.equal(actionSpies.setMaxModeTo.getCall(0).args[0], 'mockBool')
      })
    })

    describe('updateSendAmount()', function () {
      it('should dispatch an action', function () {
        mapDispatchToPropsObject.updateSendAmount('mockAmount')
        assert(dispatchSpy.calledOnce)
        assert(actionSpies.updateSendAmount.calledOnce)
        assert.equal(
          actionSpies.updateSendAmount.getCall(0).args[0],
          'mockAmount',
        )
      })
    })

    describe('updateGasFeeError()', function () {
      it('should dispatch an action', function () {
        mapDispatchToPropsObject.updateGasFeeError({ some: 'data' })
        assert(dispatchSpy.calledOnce)
        assert(duckActionSpies.updateSendErrors.calledOnce)
        assert.deepEqual(duckActionSpies.updateSendErrors.getCall(0).args[0], {
          some: 'data',
          mockGasFeeErrorChange: true,
        })
      })
    })

    describe('updateSendAmountError()', function () {
      it('should dispatch an action', function () {
        mapDispatchToPropsObject.updateSendAmountError({ some: 'data' })
        assert(dispatchSpy.calledOnce)
        assert(duckActionSpies.updateSendErrors.calledOnce)
        assert.deepEqual(duckActionSpies.updateSendErrors.getCall(0).args[0], {
          some: 'data',
          mockChange: true,
        })
      })
    })
  })
})
