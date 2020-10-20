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
  '../../../../selectors': {
    getBasicGasEstimateLoadingStatus: (s) => `mockBasicGasEstimateLoadingStatus:${Object.keys(s).length}`,
    getRenderableBasicEstimateData: (s) => `mockRenderableBasicEstimateData:${Object.keys(s).length}`,
    getDefaultActiveButtonIndex: (a, b) => a + b,
    getCurrentEthBalance: (state) => state.metamask.balance || '0x0',
    getSendToken: () => null,
    getTokenBalance: (state) => state.metamask.send.tokenBalance || '0x0',
  },
  '../../../../store/actions': actionSpies,
  '../../../../ducks/gas/gas.duck': gasActionSpies,
  '../../../../ducks/confirm-transaction/confirm-transaction.duck': confirmTransactionActionSpies,
  '../../../../ducks/send/send.duck': sendActionSpies,
})

describe('gas-modal-page-container container', function () {

  describe('mapStateToProps()', function () {
    it('should map the correct properties to props', function () {
      const baseMockState = {
        appState: {
          modal: {
            modalState: {
              props: {
                hideBasic: true,
                txData: {
                  id: 34,
                },
                extraInfoRow: { label: 'mockLabel', value: 'mockValue' },
                minimumGasLimit: 21000,
              },
            },
          },
        },
        metamask: {
          send: {
            gasLimit: '16',
            gasPrice: '32',
            amount: '64',
            maxModeOn: false,
          },
          currentCurrency: 'abc',
          conversionRate: 50,
          preferences: {
            showFiatInTestnets: false,
          },
          provider: {
            type: 'mainnet',
          },
          currentNetworkTxList: [{
            id: 34,
            txParams: {
              gas: '0x1600000',
              gasPrice: '0x3200000',
              value: '0x640000000000000',
            },
          }],
        },
        gas: {
          basicEstimates: {
            blockTime: 12,
            safeLow: 2,
          },
          customData: {
            limit: 'aaaaaaaa',
            price: 'ffffffff',
          },
          gasEstimatesLoading: false,
          priceAndTimeEstimates: [
            { gasprice: 3, expectedTime: 31 },
            { gasprice: 4, expectedTime: 62 },
            { gasprice: 5, expectedTime: 93 },
            { gasprice: 6, expectedTime: 124 },
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
      const baseExpectedResult = {
        balance: '0x0',
        isConfirm: true,
        customGasPrice: 4.294967295,
        customGasLimit: 2863311530,
        currentTimeEstimate: '~1 min 11 sec',
        newTotalFiat: '637.41',
        blockTime: 12,
        conversionRate: 50,
        customGasLimitMessage: '',
        customTotalSupplement: '',
        customModalGasLimitInHex: 'aaaaaaaa',
        customModalGasPriceInHex: 'ffffffff',
        customGasTotal: 'aaaaaaa955555556',
        customPriceIsSafe: true,
        gasChartProps: {
          'currentPrice': 4.294967295,
          estimatedTimes: [31, 62, 93, 124],
          estimatedTimesMax: 31,
          gasPrices: [3, 4, 5, 6],
          gasPricesMax: 6,
        },
        gasPriceButtonGroupProps: {
          buttonDataLoading: 'mockBasicGasEstimateLoadingStatus:4',
          defaultActiveButtonIndex: 'mockRenderableBasicEstimateData:4ffffffff',
          gasButtonInfo: 'mockRenderableBasicEstimateData:4',
        },
        gasEstimatesLoading: false,
        hideBasic: true,
        infoRowProps: {
          extraInfoRow: { label: 'mockLabel', value: 'mockValue' },
          originalTotalFiat: '637.41',
          originalTotalEth: '12.748189 ETH',
          newTotalFiat: '637.41',
          newTotalEth: '12.748189 ETH',
          sendAmount: '0.45036 ETH',
          transactionFee: '12.297829 ETH',
        },
        insufficientBalance: true,
        isSpeedUp: false,
        isRetry: false,
        isSwap: false,
        txId: 34,
        isEthereumNetwork: true,
        isMainnet: true,
        maxModeOn: false,
        sendToken: null,
        tokenBalance: '0x0',
        transaction: {
          id: 34,
        },
        value: '0x640000000000000',
        minimumGasLimit: 21000,
      }
      const baseMockOwnProps = { transaction: { id: 34 } }
      const tests = [
        { mockState: baseMockState, expectedResult: baseExpectedResult, mockOwnProps: baseMockOwnProps },
        {
          mockState: { ...baseMockState, metamask: { ...baseMockState.metamask, balance: '0xfffffffffffffffffffff' } },
          expectedResult: { ...baseExpectedResult, balance: '0xfffffffffffffffffffff', insufficientBalance: false },
          mockOwnProps: baseMockOwnProps,
        },
        {
          mockState: baseMockState,
          mockOwnProps: { ...baseMockOwnProps, transaction: { id: 34, status: 'submitted' } },
          expectedResult: { ...baseExpectedResult, isSpeedUp: true, transaction: { id: 34 } },
        },
        {
          mockState: {
            ...baseMockState,
            metamask: {
              ...baseMockState.metamask,
              preferences: {
                ...baseMockState.metamask.preferences,
                showFiatInTestnets: false,
              },
              provider: {
                ...baseMockState.metamask.provider,
                type: 'rinkeby',
              },
            },
          },
          mockOwnProps: baseMockOwnProps,
          expectedResult: {
            ...baseExpectedResult,
            infoRowProps: {
              ...baseExpectedResult.infoRowProps,
              newTotalFiat: '',
            },
            isMainnet: false,
          },
        },
        {
          mockState: {
            ...baseMockState,
            metamask: {
              ...baseMockState.metamask,
              preferences: {
                ...baseMockState.metamask.preferences,
                showFiatInTestnets: true,
              },
              provider: {
                ...baseMockState.metamask.provider,
                type: 'rinkeby',
              },
            },
          },
          mockOwnProps: baseMockOwnProps,
          expectedResult: {
            ...baseExpectedResult,
            isMainnet: false,
          },
        },
        {
          mockState: {
            ...baseMockState,
            metamask: {
              ...baseMockState.metamask,
              preferences: {
                ...baseMockState.metamask.preferences,
                showFiatInTestnets: true,
              },
              provider: {
                ...baseMockState.metamask.provider,
                type: 'mainnet',
              },
            },
          },
          mockOwnProps: baseMockOwnProps,
          expectedResult: baseExpectedResult,
        },
      ]

      let result
      tests.forEach(({ mockState, mockOwnProps, expectedResult }) => {
        result = mapStateToProps(mockState, mockOwnProps)
        assert.deepEqual(result, expectedResult)
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

    afterEach(function () {
      actionSpies.hideModal.resetHistory()
      gasActionSpies.setCustomGasPrice.resetHistory()
      gasActionSpies.setCustomGasLimit.resetHistory()
    })

    describe('hideGasButtonGroup()', function () {
      it('should dispatch a hideGasButtonGroup action', function () {
        mapDispatchToPropsObject.hideGasButtonGroup()
        assert(dispatchSpy.calledOnce)
        assert(sendActionSpies.hideGasButtonGroup.calledOnce)
      })
    })

    describe('cancelAndClose()', function () {
      it('should dispatch a hideModal action', function () {
        mapDispatchToPropsObject.cancelAndClose()
        assert(dispatchSpy.calledTwice)
        assert(actionSpies.hideModal.calledOnce)
        assert(gasActionSpies.resetCustomData.calledOnce)
      })
    })

    describe('updateCustomGasPrice()', function () {
      it('should dispatch a setCustomGasPrice action with the arg passed to updateCustomGasPrice hex prefixed', function () {
        mapDispatchToPropsObject.updateCustomGasPrice('ffff')
        assert(dispatchSpy.calledOnce)
        assert(gasActionSpies.setCustomGasPrice.calledOnce)
        assert.equal(gasActionSpies.setCustomGasPrice.getCall(0).args[0], '0xffff')
      })

      it('should dispatch a setCustomGasPrice action', function () {
        mapDispatchToPropsObject.updateCustomGasPrice('0xffff')
        assert(dispatchSpy.calledOnce)
        assert(gasActionSpies.setCustomGasPrice.calledOnce)
        assert.equal(gasActionSpies.setCustomGasPrice.getCall(0).args[0], '0xffff')
      })
    })

    describe('updateCustomGasLimit()', function () {
      it('should dispatch a setCustomGasLimit action', function () {
        mapDispatchToPropsObject.updateCustomGasLimit('0x10')
        assert(dispatchSpy.calledOnce)
        assert(gasActionSpies.setCustomGasLimit.calledOnce)
        assert.equal(gasActionSpies.setCustomGasLimit.getCall(0).args[0], '0x10')
      })
    })

    describe('setGasData()', function () {
      it('should dispatch a setGasPrice and setGasLimit action with the correct props', function () {
        mapDispatchToPropsObject.setGasData('ffff', 'aaaa')
        assert(dispatchSpy.calledTwice)
        assert(actionSpies.setGasPrice.calledOnce)
        assert(actionSpies.setGasLimit.calledOnce)
        assert.equal(actionSpies.setGasLimit.getCall(0).args[0], 'ffff')
        assert.equal(actionSpies.setGasPrice.getCall(0).args[0], 'aaaa')
      })
    })

    describe('updateConfirmTxGasAndCalculate()', function () {
      it('should dispatch a updateGasAndCalculate action with the correct props', function () {
        mapDispatchToPropsObject.updateConfirmTxGasAndCalculate('ffff', 'aaaa')
        assert.equal(dispatchSpy.callCount, 3)
        assert(actionSpies.setGasPrice.calledOnce)
        assert(actionSpies.setGasLimit.calledOnce)
        assert.equal(actionSpies.setGasLimit.getCall(0).args[0], 'ffff')
        assert.equal(actionSpies.setGasPrice.getCall(0).args[0], 'aaaa')
      })
    })

  })

  describe('mergeProps', function () {
    let stateProps
    let dispatchProps
    let ownProps

    beforeEach(function () {
      stateProps = {
        gasPriceButtonGroupProps: {
          someGasPriceButtonGroupProp: 'foo',
          anotherGasPriceButtonGroupProp: 'bar',
        },
        isConfirm: true,
        someOtherStateProp: 'baz',
        transaction: {},
      }
      dispatchProps = {
        updateCustomGasPrice: sinon.spy(),
        hideGasButtonGroup: sinon.spy(),
        setGasData: sinon.spy(),
        updateConfirmTxGasAndCalculate: sinon.spy(),
        someOtherDispatchProp: sinon.spy(),
        createSpeedUpTransaction: sinon.spy(),
        hideSidebar: sinon.spy(),
        hideModal: sinon.spy(),
        cancelAndClose: sinon.spy(),
      }
      ownProps = { someOwnProp: 123 }
    })

    afterEach(function () {
      dispatchProps.updateCustomGasPrice.resetHistory()
      dispatchProps.hideGasButtonGroup.resetHistory()
      dispatchProps.setGasData.resetHistory()
      dispatchProps.updateConfirmTxGasAndCalculate.resetHistory()
      dispatchProps.someOtherDispatchProp.resetHistory()
      dispatchProps.createSpeedUpTransaction.resetHistory()
      dispatchProps.hideSidebar.resetHistory()
      dispatchProps.hideModal.resetHistory()
    })
    it('should return the expected props when isConfirm is true', function () {
      const result = mergeProps(stateProps, dispatchProps, ownProps)

      assert.equal(result.isConfirm, true)
      assert.equal(result.someOtherStateProp, 'baz')
      assert.equal(result.gasPriceButtonGroupProps.someGasPriceButtonGroupProp, 'foo')
      assert.equal(result.gasPriceButtonGroupProps.anotherGasPriceButtonGroupProp, 'bar')
      assert.equal(result.someOwnProp, 123)

      assert.equal(dispatchProps.updateConfirmTxGasAndCalculate.callCount, 0)
      assert.equal(dispatchProps.setGasData.callCount, 0)
      assert.equal(dispatchProps.hideGasButtonGroup.callCount, 0)
      assert.equal(dispatchProps.hideModal.callCount, 0)

      result.onSubmit()

      assert.equal(dispatchProps.updateConfirmTxGasAndCalculate.callCount, 1)
      assert.equal(dispatchProps.setGasData.callCount, 0)
      assert.equal(dispatchProps.hideGasButtonGroup.callCount, 0)
      assert.equal(dispatchProps.hideModal.callCount, 1)

      assert.equal(dispatchProps.updateCustomGasPrice.callCount, 0)
      result.gasPriceButtonGroupProps.handleGasPriceSelection()
      assert.equal(dispatchProps.updateCustomGasPrice.callCount, 1)

      assert.equal(dispatchProps.someOtherDispatchProp.callCount, 0)
      result.someOtherDispatchProp()
      assert.equal(dispatchProps.someOtherDispatchProp.callCount, 1)
    })

    it('should return the expected props when isConfirm is false', function () {
      const result = mergeProps({ ...stateProps, isConfirm: false }, dispatchProps, ownProps)

      assert.equal(result.isConfirm, false)
      assert.equal(result.someOtherStateProp, 'baz')
      assert.equal(result.gasPriceButtonGroupProps.someGasPriceButtonGroupProp, 'foo')
      assert.equal(result.gasPriceButtonGroupProps.anotherGasPriceButtonGroupProp, 'bar')
      assert.equal(result.someOwnProp, 123)

      assert.equal(dispatchProps.updateConfirmTxGasAndCalculate.callCount, 0)
      assert.equal(dispatchProps.setGasData.callCount, 0)
      assert.equal(dispatchProps.hideGasButtonGroup.callCount, 0)
      assert.equal(dispatchProps.cancelAndClose.callCount, 0)

      result.onSubmit('mockNewLimit', 'mockNewPrice')

      assert.equal(dispatchProps.updateConfirmTxGasAndCalculate.callCount, 0)
      assert.equal(dispatchProps.setGasData.callCount, 1)
      assert.deepEqual(dispatchProps.setGasData.getCall(0).args, ['mockNewLimit', 'mockNewPrice'])
      assert.equal(dispatchProps.hideGasButtonGroup.callCount, 1)
      assert.equal(dispatchProps.cancelAndClose.callCount, 1)

      assert.equal(dispatchProps.updateCustomGasPrice.callCount, 0)
      result.gasPriceButtonGroupProps.handleGasPriceSelection()
      assert.equal(dispatchProps.updateCustomGasPrice.callCount, 1)

      assert.equal(dispatchProps.someOtherDispatchProp.callCount, 0)
      result.someOtherDispatchProp()
      assert.equal(dispatchProps.someOtherDispatchProp.callCount, 1)
    })

    it('should dispatch the expected actions from obSubmit when isConfirm is false and isSpeedUp is true', function () {
      const result = mergeProps({ ...stateProps, isSpeedUp: true, isConfirm: false }, dispatchProps, ownProps)

      result.onSubmit()

      assert.equal(dispatchProps.updateConfirmTxGasAndCalculate.callCount, 0)
      assert.equal(dispatchProps.setGasData.callCount, 0)
      assert.equal(dispatchProps.hideGasButtonGroup.callCount, 0)
      assert.equal(dispatchProps.cancelAndClose.callCount, 1)

      assert.equal(dispatchProps.createSpeedUpTransaction.callCount, 1)
      assert.equal(dispatchProps.hideSidebar.callCount, 1)
    })
  })

})
