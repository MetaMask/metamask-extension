import assert from 'assert'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

let mapStateToProps
let mapDispatchToProps

const actionSpies = {
  hideModal: sinon.spy(),
  setGasLimit: sinon.spy(),
  setGasPrice: sinon.spy(),
}

const gasActionSpies = {
  setCustomGasPrice: sinon.spy(),
  setCustomGasLimit: sinon.spy(),
}

const confirmTransactionActionSpies = {
  updateGasAndCalculate: sinon.spy(),
}

proxyquire('../gas-modal-page-container.container.js', {
  'react-redux': {
    connect: (ms, md) => {
      mapStateToProps = ms
      mapDispatchToProps = md
      return () => ({})
    },
  },
  '../../../selectors/custom-gas': {
    getBasicGasEstimateLoadingStatus: (s) => `mockBasicGasEstimateLoadingStatus:${Object.keys(s).length}`,
    getRenderableBasicEstimateData: (s) => `mockRenderableBasicEstimateData:${Object.keys(s).length}`,
    getDefaultActiveButtonIndex: (a, b, c) => a + b + c,
  },
  '../../../actions': actionSpies,
  '../../../ducks/gas.duck': gasActionSpies,
  '../../../ducks/confirm-transaction.duck': confirmTransactionActionSpies,
})

describe('gas-modal-page-container container', () => {

  describe('mapStateToProps()', () => {

    it('should map the correct properties to props', () => {
      const mockState2 = {
        metamask: {
          send: {
            gasLimit: '16',
            gasPrice: '32',
            amount: '64',
          },
          currentCurrency: 'abc',
          conversionRate: 50,
        },
        gas: {
          customData: {
            limit: 'aaaaaaaa',
            price: 'ffffffff',
          },
        },
        confirmTransaction: {
          txData: {
            txParams: {
              gas: '0x1600000',
              gasPrice: '0x3200000',
              value: '0x640000000000000',
            },
          },
        },
      }
      const result2 = mapStateToProps(mockState2)

      assert.deepEqual(result2, {
        isConfirm: true,
        customGasPriceInHex: 'ffffffff',
        customGasLimitInHex: 'aaaaaaaa',
        customGasPrice: 4.294967295,
        customGasLimit: 2863311530,
        newTotalFiat: '637.41',
        gasPriceButtonGroupProps:
        {
          buttonDataLoading: 'mockBasicGasEstimateLoadingStatus:3',
          defaultActiveButtonIndex: 'mockRenderableBasicEstimateData:3ffffffff0x3200000',
          gasButtonInfo: 'mockRenderableBasicEstimateData:3',
        },
        infoRowProps: {
          originalTotalFiat: '22.58',
          originalTotalEth: '0.451569 ETH',
          newTotalFiat: '637.41',
          newTotalEth: '12.748189 ETH',
        },
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

    afterEach(() => {
      actionSpies.hideModal.resetHistory()
      gasActionSpies.setCustomGasPrice.resetHistory()
      gasActionSpies.setCustomGasLimit.resetHistory()
    })

    describe('hideModal()', () => {
      it('should dispatch a hideModal action', () => {
        mapDispatchToPropsObject.hideModal()
        assert(dispatchSpy.calledOnce)
        assert(actionSpies.hideModal.calledOnce)
      })
    })

    describe('updateCustomGasPrice()', () => {
      it('should dispatch a setCustomGasPrice action with the arg passed to updateCustomGasPrice hex prefixed', () => {
        mapDispatchToPropsObject.updateCustomGasPrice('ffff')
        assert(dispatchSpy.calledOnce)
        assert(gasActionSpies.setCustomGasPrice.calledOnce)
        assert.equal(gasActionSpies.setCustomGasPrice.getCall(0).args[0], '0xffff')
      })
    })

    describe('convertThenUpdateCustomGasPrice()', () => {
      it('should dispatch a setCustomGasPrice action with the arg passed to convertThenUpdateCustomGasPrice converted to WEI', () => {
        mapDispatchToPropsObject.convertThenUpdateCustomGasPrice('0xffff')
        assert(dispatchSpy.calledOnce)
        assert(gasActionSpies.setCustomGasPrice.calledOnce)
        assert.equal(gasActionSpies.setCustomGasPrice.getCall(0).args[0], '0x3b9a8e653600')
      })
    })


    describe('convertThenUpdateCustomGasLimit()', () => {
      it('should dispatch a setCustomGasLimit action with the arg passed to convertThenUpdateCustomGasLimit converted to hex', () => {
        mapDispatchToPropsObject.convertThenUpdateCustomGasLimit(16)
        assert(dispatchSpy.calledOnce)
        assert(gasActionSpies.setCustomGasLimit.calledOnce)
        assert.equal(gasActionSpies.setCustomGasLimit.getCall(0).args[0], '0x10')
      })
    })

    describe('setGasData()', () => {
      it('should dispatch a setGasPrice and setGasLimit action with the correct props', () => {
        mapDispatchToPropsObject.setGasData('ffff', 'aaaa')
        assert(dispatchSpy.calledTwice)
        assert(actionSpies.setGasPrice.calledOnce)
        assert(actionSpies.setGasLimit.calledOnce)
        assert.equal(actionSpies.setGasLimit.getCall(0).args[0], 'ffff')
        assert.equal(actionSpies.setGasPrice.getCall(0).args[0], 'aaaa')
      })
    })

    describe('updateConfirmTxGasAndCalculate()', () => {
      it('should dispatch a updateGasAndCalculate action with the correct props', () => {
        mapDispatchToPropsObject.updateConfirmTxGasAndCalculate('ffff', 'aaaa')
        assert(dispatchSpy.calledOnce)
        assert(confirmTransactionActionSpies.updateGasAndCalculate.calledOnce)
        assert.deepEqual(confirmTransactionActionSpies.updateGasAndCalculate.getCall(0).args[0], { gasLimit: 'ffff', gasPrice: 'aaaa' })
      })
    })

  })

})
