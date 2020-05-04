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
  '../../../send.selectors.js': {
    getGasTotal: (s) => `mockGasTotal:${s}`,
    getSelectedToken: (s) => `mockSelectedToken:${s}`,
    getSendFromBalance: (s) => `mockBalance:${s}`,
    getTokenBalance: (s) => `mockTokenBalance:${s}`,
    getSendMaxModeState: (s) => `mockMaxModeOn:${s}`,
  },
  './amount-max-button.utils.js': { calcMaxAmount: (mockObj) => mockObj.val + 1 },
  '../../../../../selectors/': { getBasicGasEstimateLoadingStatus: (s) => `mockButtonDataLoading:${s}` },
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
        selectedToken: 'mockSelectedToken:mockState',
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
        assert.deepEqual(
          duckActionSpies.updateSendErrors.getCall(0).args[0],
          { amount: null }
        )
        assert(actionSpies.updateSendAmount.calledOnce)
        assert.equal(
          actionSpies.updateSendAmount.getCall(0).args[0],
          12
        )
      })
    })

    describe('setMaxModeTo()', function () {
      it('should dispatch an action', function () {
        mapDispatchToPropsObject.setMaxModeTo('mockVal')
        assert(dispatchSpy.calledOnce)
        assert.equal(
          actionSpies.setMaxModeTo.getCall(0).args[0],
          'mockVal'
        )
      })
    })

  })

})
