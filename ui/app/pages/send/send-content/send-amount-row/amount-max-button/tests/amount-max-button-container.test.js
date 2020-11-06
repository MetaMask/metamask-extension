import assert from 'assert'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

let mapStateToProps
let mapDispatchToProps

const actionSpies = {
  setMaxModeTo: sinon.spy(),
  updateSendAmount: sinon.spy(),
}
const duckActionSpies = {
  updateSendErrors: sinon.spy(),
}

proxyquire('../amount-max-button.container.js', {
  'react-redux': {
    connect: (ms, md) => {
      mapStateToProps = ms
      mapDispatchToProps = md
      return () => ({})
    },
  },
  '../../../../../selectors': {
    getGasTotal: (s) => `mockGasTotal:${s}`,
    getSendToken: (s) => `mockSendToken:${s}`,
    getSendFromBalance: (s) => `mockBalance:${s}`,
    getTokenBalance: (s) => `mockTokenBalance:${s}`,
    getSendMaxModeState: (s) => `mockMaxModeOn:${s}`,
    getBasicGasEstimateLoadingStatus: (s) => `mockButtonDataLoading:${s}`,
  },
  './amount-max-button.utils.js': {
    calcMaxAmount: (mockObj) => mockObj.val + 1,
  },
  '../../../../../store/actions': actionSpies,
  '../../../../../ducks/send/send.duck': duckActionSpies,
})

describe('amount-max-button container', function () {
  describe('mapStateToProps()', function () {
    it('should map the correct properties to props', function () {
      assert.deepEqual(mapStateToProps('mockState'), {
        balance: 'mockBalance:mockState',
        buttonDataLoading: 'mockButtonDataLoading:mockState',
        gasTotal: 'mockGasTotal:mockState',
        maxModeOn: 'mockMaxModeOn:mockState',
        sendToken: 'mockSendToken:mockState',
        tokenBalance: 'mockTokenBalance:mockState',
      })
    })
  })

  describe('mapDispatchToProps()', function () {
    let dispatchSpy
    let mapDispatchToPropsObject

    beforeEach(function () {
      dispatchSpy = sinon.spy()
      mapDispatchToPropsObject = mapDispatchToProps(dispatchSpy)
    })

    describe('setAmountToMax()', function () {
      it('should dispatch an action', function () {
        mapDispatchToPropsObject.setAmountToMax({ val: 11, foo: 'bar' })
        assert(dispatchSpy.calledTwice)
        assert(duckActionSpies.updateSendErrors.calledOnce)
        assert.deepEqual(duckActionSpies.updateSendErrors.getCall(0).args[0], {
          amount: null,
        })
        assert(actionSpies.updateSendAmount.calledOnce)
        assert.equal(actionSpies.updateSendAmount.getCall(0).args[0], 12)
      })
    })

    describe('setMaxModeTo()', function () {
      it('should dispatch an action', function () {
        mapDispatchToPropsObject.setMaxModeTo('mockVal')
        assert(dispatchSpy.calledOnce)
        assert.equal(actionSpies.setMaxModeTo.getCall(0).args[0], 'mockVal')
      })
    })
  })
})
