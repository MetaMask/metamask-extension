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
  },
  './amount-max-button.selectors.js': { getMaxModeOn: (s) => `mockMaxModeOn:${s}` },
  './amount-max-button.utils.js': { calcMaxAmount: (mockObj) => mockObj.val + 1 },
  '../../../../../actions': actionSpies,
  '../../../../../ducks/send.duck': duckActionSpies,
})

describe('amount-max-button container', () => {

  describe('mapStateToProps()', () => {

    it('should map the correct properties to props', () => {
      assert.deepEqual(mapStateToProps('mockState'), {
        balance: 'mockBalance:mockState',
        gasTotal: 'mockGasTotal:mockState',
        maxModeOn: 'mockMaxModeOn:mockState',
        selectedToken: 'mockSelectedToken:mockState',
        tokenBalance: 'mockTokenBalance:mockState',
      })
    })

  })

  describe('mapDispatchToProps()', () => {
    let dispatchSpy
    let mapDispatchToPropsObject

    beforeEach(() => {
      dispatchSpy = sinon.spy()
      mapDispatchToPropsObject = mapDispatchToProps(dispatchSpy)
    })

    describe('setAmountToMax()', () => {
      it('should dispatch an action', () => {
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

    describe('setMaxModeTo()', () => {
      it('should dispatch an action', () => {
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
