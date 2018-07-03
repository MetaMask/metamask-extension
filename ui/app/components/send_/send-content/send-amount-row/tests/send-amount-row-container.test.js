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

proxyquire('../send-amount-row.container.js', {
  'react-redux': {
    connect: (ms, md) => {
      mapStateToProps = ms
      mapDispatchToProps = md
      return () => ({})
    },
  },
  '../../send.selectors': {
    getAmountConversionRate: (s) => `mockAmountConversionRate:${s}`,
    getConversionRate: (s) => `mockConversionRate:${s}`,
    getCurrentCurrency: (s) => `mockConvertedCurrency:${s}`,
    getGasTotal: (s) => `mockGasTotal:${s}`,
    getPrimaryCurrency: (s) => `mockPrimaryCurrency:${s}`,
    getSelectedToken: (s) => `mockSelectedToken:${s}`,
    getSendAmount: (s) => `mockAmount:${s}`,
    getSendFromBalance: (s) => `mockBalance:${s}`,
    getTokenBalance: (s) => `mockTokenBalance:${s}`,
  },
  './send-amount-row.selectors': { sendAmountIsInError: (s) => `mockInError:${s}` },
  '../../send.utils': { getAmountErrorObject: (mockDataObject) => ({ ...mockDataObject, mockChange: true }) },
  '../../../../actions': actionSpies,
  '../../../../ducks/send.duck': duckActionSpies,
})

describe('send-amount-row container', () => {

  describe('mapStateToProps()', () => {

    it('should map the correct properties to props', () => {
      assert.deepEqual(mapStateToProps('mockState'), {
        amount: 'mockAmount:mockState',
        amountConversionRate: 'mockAmountConversionRate:mockState',
        balance: 'mockBalance:mockState',
        conversionRate: 'mockConversionRate:mockState',
        convertedCurrency: 'mockConvertedCurrency:mockState',
        gasTotal: 'mockGasTotal:mockState',
        inError: 'mockInError:mockState',
        primaryCurrency: 'mockPrimaryCurrency:mockState',
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

    describe('setMaxModeTo()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.setMaxModeTo('mockBool')
        assert(dispatchSpy.calledOnce)
        assert(actionSpies.setMaxModeTo.calledOnce)
        assert.equal(
          actionSpies.setMaxModeTo.getCall(0).args[0],
          'mockBool'
        )
      })
    })

    describe('updateSendAmount()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.updateSendAmount('mockAmount')
        assert(dispatchSpy.calledOnce)
        assert(actionSpies.updateSendAmount.calledOnce)
        assert.equal(
          actionSpies.updateSendAmount.getCall(0).args[0],
          'mockAmount'
        )
      })
    })

    describe('updateSendAmountError()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.updateSendAmountError({ some: 'data' })
        assert(dispatchSpy.calledOnce)
        assert(duckActionSpies.updateSendErrors.calledOnce)
        assert.deepEqual(
          duckActionSpies.updateSendErrors.getCall(0).args[0],
          { some: 'data', mockChange: true }
        )
      })
    })

  })

})
