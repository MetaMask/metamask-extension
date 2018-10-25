import assert from 'assert'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

let mapStateToProps
let mapDispatchToProps
let mergeProps

const actionSpies = {
  hideModal: sinon.spy(),
  setGasLimit: sinon.spy(),
  setGasPrice: sinon.spy(),
}

const gasActionSpies = {
  setCustomGasPrice: sinon.spy(),
  setCustomGasLimit: sinon.spy(),
  resetCustomData: sinon.spy(),
}

const confirmTransactionActionSpies = {
  updateGasAndCalculate: sinon.spy(),
}

const sendActionSpies = {
  hideGasButtonGroup: sinon.spy(),
}

proxyquire('../gas-modal-page-container.container.js', {
  'react-redux': {
    connect: (ms, md, mp) => {
      mapStateToProps = ms
      mapDispatchToProps = md
      mergeProps = mp
      return () => ({})
    },
  },
  '../../../selectors/custom-gas': {
    getBasicGasEstimateLoadingStatus: (s) => `mockBasicGasEstimateLoadingStatus:${Object.keys(s).length}`,
    getRenderableBasicEstimateData: (s) => `mockRenderableBasicEstimateData:${Object.keys(s).length}`,
    getDefaultActiveButtonIndex: (a, b) => a + b,
  },
  '../../../actions': actionSpies,
  '../../../ducks/gas.duck': gasActionSpies,
  '../../../ducks/confirm-transaction.duck': confirmTransactionActionSpies,
  '../../../ducks/send.duck': sendActionSpies,
})

describe('gas-modal-page-container container', () => {

  describe('mapStateToProps()', () => {

    it('should map the correct properties to props', () => {
      const mockState2 = {
        appState: {
          modal: {
            modalState: {
              props: {
                hideBasic: true,
              },
            },
          },
        },
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
          priceAndTimeEstimates: [
            { gasprice: 3, expectedTime: '31' },
            { gasprice: 4, expectedTime: '62' },
            { gasprice: 5, expectedTime: '93' },
            { gasprice: 6, expectedTime: '124' },
          ],
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
        customGasPrice: 4.294967295,
        customGasLimit: 2863311530,
        currentTimeEstimate: '~1 min 11 sec',
        newTotalFiat: '637.41',
        customModalGasLimitInHex: 'aaaaaaaa',
        customModalGasPriceInHex: 'ffffffff',
        gasChartProps: {
          'currentPrice': 4.294967295,
          estimatedTimes: ['31', '62', '93', '124'],
          estimatedTimesMax: '31',
          gasPrices: [3, 4, 5, 6],
          gasPricesMax: 6,
        },
        gasPriceButtonGroupProps: {
          buttonDataLoading: 'mockBasicGasEstimateLoadingStatus:4',
          defaultActiveButtonIndex: 'mockRenderableBasicEstimateData:4ffffffff',
          gasButtonInfo: 'mockRenderableBasicEstimateData:4',
        },
        hideBasic: true,
        infoRowProps: {
          originalTotalFiat: '22.58',
          originalTotalEth: '0.451569 ETH',
          newTotalFiat: '637.41',
          newTotalEth: '12.748189 ETH',
          sendAmount: '0.45036 ETH',
          transactionFee: '12.297829 ETH',
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

    describe('hideGasButtonGroup()', () => {
      it('should dispatch a hideGasButtonGroup action', () => {
        mapDispatchToPropsObject.hideGasButtonGroup()
        assert(dispatchSpy.calledOnce)
        assert(sendActionSpies.hideGasButtonGroup.calledOnce)
      })
    })

    describe('cancelAndClose()', () => {
      it('should dispatch a hideModal action', () => {
        mapDispatchToPropsObject.cancelAndClose()
        assert(dispatchSpy.calledTwice)
        assert(actionSpies.hideModal.calledOnce)
        assert(gasActionSpies.resetCustomData.calledOnce)
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

  describe('mergeProps', () => {
      let stateProps
      let dispatchProps
      let ownProps

      beforeEach(() => {
        stateProps = {
          gasPriceButtonGroupProps: {
            someGasPriceButtonGroupProp: 'foo',
            anotherGasPriceButtonGroupProp: 'bar',
          },
          isConfirm: true,
          someOtherStateProp: 'baz',
        }
        dispatchProps = {
          updateCustomGasPrice: sinon.spy(),
          hideGasButtonGroup: sinon.spy(),
          setGasData: sinon.spy(),
          updateConfirmTxGasAndCalculate: sinon.spy(),
          someOtherDispatchProp: sinon.spy(),
        }
        ownProps = { someOwnProp: 123 }
      })
    it('should return the expected props when isConfirm is true', () => {
      const result = mergeProps(stateProps, dispatchProps, ownProps)

      assert.equal(result.isConfirm, true)
      assert.equal(result.someOtherStateProp, 'baz')
      assert.equal(result.gasPriceButtonGroupProps.someGasPriceButtonGroupProp, 'foo')
      assert.equal(result.gasPriceButtonGroupProps.anotherGasPriceButtonGroupProp, 'bar')
      assert.equal(result.someOwnProp, 123)

      assert.equal(dispatchProps.updateConfirmTxGasAndCalculate.callCount, 0)
      assert.equal(dispatchProps.setGasData.callCount, 0)
      assert.equal(dispatchProps.hideGasButtonGroup.callCount, 0)

      result.onSubmit()

      assert.equal(dispatchProps.updateConfirmTxGasAndCalculate.callCount, 1)
      assert.equal(dispatchProps.setGasData.callCount, 0)
      assert.equal(dispatchProps.hideGasButtonGroup.callCount, 0)

      assert.equal(dispatchProps.updateCustomGasPrice.callCount, 0)
      result.gasPriceButtonGroupProps.handleGasPriceSelection()
      assert.equal(dispatchProps.updateCustomGasPrice.callCount, 1)

      assert.equal(dispatchProps.someOtherDispatchProp.callCount, 0)
      result.someOtherDispatchProp()
      assert.equal(dispatchProps.someOtherDispatchProp.callCount, 1)
    })

    it('should return the expected props when isConfirm is false', () => {
      const result = mergeProps(Object.assign({}, stateProps, { isConfirm: false }), dispatchProps, ownProps)

      assert.equal(result.isConfirm, false)
      assert.equal(result.someOtherStateProp, 'baz')
      assert.equal(result.gasPriceButtonGroupProps.someGasPriceButtonGroupProp, 'foo')
      assert.equal(result.gasPriceButtonGroupProps.anotherGasPriceButtonGroupProp, 'bar')
      assert.equal(result.someOwnProp, 123)

      assert.equal(dispatchProps.updateConfirmTxGasAndCalculate.callCount, 0)
      assert.equal(dispatchProps.setGasData.callCount, 0)
      assert.equal(dispatchProps.hideGasButtonGroup.callCount, 0)

      result.onSubmit('mockNewLimit', 'mockNewPrice')

      assert.equal(dispatchProps.updateConfirmTxGasAndCalculate.callCount, 0)
      assert.equal(dispatchProps.setGasData.callCount, 1)
      assert.deepEqual(dispatchProps.setGasData.getCall(0).args, ['mockNewLimit', 'mockNewPrice'])
      assert.equal(dispatchProps.hideGasButtonGroup.callCount, 1)

      assert.equal(dispatchProps.updateCustomGasPrice.callCount, 0)
      result.gasPriceButtonGroupProps.handleGasPriceSelection()
      assert.equal(dispatchProps.updateCustomGasPrice.callCount, 1)

      assert.equal(dispatchProps.someOtherDispatchProp.callCount, 0)
      result.someOtherDispatchProp()
      assert.equal(dispatchProps.someOtherDispatchProp.callCount, 1)
    })
  })

})
