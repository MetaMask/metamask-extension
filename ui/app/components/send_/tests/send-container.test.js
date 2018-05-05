import assert from 'assert'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

let mapStateToProps
let mapDispatchToProps

const actionSpies = {
  updateSendTokenBalance: sinon.spy(),
  updateGasTotal: sinon.spy(),
  setGasTotal: sinon.spy(),
}
const duckActionSpies = {
  updateSendErrors: sinon.spy(),
}

proxyquire('../send.container.js', {
  'react-redux': {
    connect: (ms, md) => {
      mapStateToProps = ms
      mapDispatchToProps = md
      return () => ({})
    },
  },
  'react-router-dom': { withRouter: () => {} },
  'recompose': { compose: (arg1, arg2) => () => arg2() },
  './send.selectors': {
    getAmountConversionRate: (s) => `mockAmountConversionRate:${s}`,
    getConversionRate: (s) => `mockConversionRate:${s}`,
    getCurrentNetwork: (s) => `mockNetwork:${s}`,
    getGasLimit: (s) => `mockGasLimit:${s}`,
    getGasPrice: (s) => `mockGasPrice:${s}`,
    getGasTotal: (s) => `mockGasTotal:${s}`,
    getPrimaryCurrency: (s) => `mockPrimaryCurrency:${s}`,
    getSelectedAddress: (s) => `mockSelectedAddress:${s}`,
    getSelectedToken: (s) => `mockSelectedToken:${s}`,
    getSelectedTokenContract: (s) => `mockTokenContract:${s}`,
    getSelectedTokenToFiatRate: (s) => `mockTokenToFiatRate:${s}`,
    getSendAmount: (s) => `mockAmount:${s}`,
    getSendEditingTransactionId: (s) => `mockEditingTransactionId:${s}`,
    getSendFromObject: (s) => `mockFrom:${s}`,
    getTokenBalance: (s) => `mockTokenBalance:${s}`,
  },
  '../../actions': actionSpies,
  '../../ducks/send': duckActionSpies,
  './send.utils.js': {
    calcGasTotal: (gasLimit, gasPrice) => gasLimit + gasPrice,
    generateTokenTransferData: (a, b) => `mockData:${a + b}`,
  },
})

describe('send container', () => {

  describe('mapStateToProps()', () => {

    it('should map the correct properties to props', () => {
      assert.deepEqual(mapStateToProps('mockState'), {
        amount: 'mockAmount:mockState',
        amountConversionRate: 'mockAmountConversionRate:mockState',
        conversionRate: 'mockConversionRate:mockState',
        data: 'mockData:mockSelectedAddress:mockStatemockSelectedToken:mockState',
        editingTransactionId: 'mockEditingTransactionId:mockState',
        from: 'mockFrom:mockState',
        gasLimit: 'mockGasLimit:mockState',
        gasPrice: 'mockGasPrice:mockState',
        gasTotal: 'mockGasTotal:mockState',
        network: 'mockNetwork:mockState',
        primaryCurrency: 'mockPrimaryCurrency:mockState',
        selectedAddress: 'mockSelectedAddress:mockState',
        selectedToken: 'mockSelectedToken:mockState',
        tokenBalance: 'mockTokenBalance:mockState',
        tokenContract: 'mockTokenContract:mockState',
        tokenToFiatRate: 'mockTokenToFiatRate:mockState',
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

    describe('updateAndSetGasTotal()', () => {
      const mockProps = {
        data: '0x1',
        editingTransactionId: '0x2',
        gasLimit: '0x3',
        gasPrice: '0x4',
        selectedAddress: '0x4',
        selectedToken: { address: '0x1' },
      }

      it('should dispatch a setGasTotal action when editingTransactionId is truthy', () => {
        mapDispatchToPropsObject.updateAndSetGasTotal(mockProps)
        assert(dispatchSpy.calledOnce)
        assert.equal(
          actionSpies.setGasTotal.getCall(0).args[0],
          '0x30x4'
        )
      })

      it('should dispatch an updateGasTotal action when editingTransactionId is falsy', () => {
        const { selectedAddress, selectedToken, data } = mockProps
        mapDispatchToPropsObject.updateAndSetGasTotal(
          Object.assign(mockProps, {editingTransactionId: false})
        )
        assert(dispatchSpy.calledOnce)
        assert.deepEqual(
          actionSpies.updateGasTotal.getCall(0).args[0],
          { selectedAddress, selectedToken, data }
        )
      })
    })

    describe('updateSendTokenBalance()', () => {
      const mockProps = {
        address: '0x10',
        tokenContract: '0x00a',
        selectedToken: {address: '0x1'},
      }

      it('should dispatch an action', () => {
        mapDispatchToPropsObject.updateSendTokenBalance(Object.assign({}, mockProps))
        assert(dispatchSpy.calledOnce)
        assert.deepEqual(
          actionSpies.updateSendTokenBalance.getCall(0).args[0],
          mockProps
        )
      })
    })

    describe('updateSendErrors()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.updateSendErrors('mockError')
        assert(dispatchSpy.calledOnce)
        assert.equal(
          duckActionSpies.updateSendErrors.getCall(0).args[0],
          'mockError'
        )
      })
    })

  })

})
