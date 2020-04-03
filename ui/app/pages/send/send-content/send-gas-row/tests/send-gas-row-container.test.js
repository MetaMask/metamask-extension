import assert from 'assert'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

let mapDispatchToProps
let mergeProps

const actionSpies = {
  showModal: sinon.spy(),
  setGasPrice: sinon.spy(),
  setGasTotal: sinon.spy(),
  setGasLimit: sinon.spy(),
  setStorageTotal: sinon.spy(),
  setGasAndCollateralTotal: sinon.spy(),
  setStorageLimit: sinon.spy(),
  resetAllCustomData: sinon.spy(),
}

const sendDuckSpies = {
  showGasButtonGroup: sinon.spy(),
}

const gasDuckSpies = {
  setCustomGasPrice: sinon.spy(),
  setCustomGasLimit: sinon.spy(),
}

const storageLimitDuckSpies = {
  setCustomStorageLimit: sinon.spy(),
}

proxyquire('../send-gas-row.container.js', {
  'react-redux': {
    connect: (_, md, mp) => {
      mapDispatchToProps = md
      mergeProps = mp
      return () => ({})
    },
  },
  '../send-amount-row/amount-max-button/amount-max-button.selectors': {
    getMaxModeOn: (s) => `mockMaxModeOn:${s}`,
  },
  '../../send.utils.js': {
    isBalanceSufficient: ({
      amount,
      gasAndCollateralTotal,
      balance,
      conversionRate,
    }) => `${amount}:${gasAndCollateralTotal}:${balance}:${conversionRate}`,
    calcGasTotal: (gasLimit, gasPrice) => gasLimit + gasPrice,
    calcStorageTotal: (storageLimit) => storageLimit + '*gdripperb',
    calcGasAndCollateralTotal: (
      gasLimit,
      gasPrice,
      storageLimit,
      gasTotal,
      storageTotal
    ) => {
      if (gasTotal !== undefined && storageTotal !== undefined) {
        return `${gasTotal}+${storageTotal}`
      }
      return `${gasLimit}*${gasPrice}+${storageLimit}`
    },
  },
  '../../../../store/actions': actionSpies,
  '../../../../ducks/send/send.duck': sendDuckSpies,
  '../../../../ducks/gas/gas.duck': gasDuckSpies,
  '../../../../ducks/storageLimit/storageLimit.duck': storageLimitDuckSpies,
})

describe('send-gas-row container', function () {
  describe('mapDispatchToProps()', function () {
    let dispatchSpy
    let mapDispatchToPropsObject

    beforeEach(function () {
      dispatchSpy = sinon.spy()
      mapDispatchToPropsObject = mapDispatchToProps(dispatchSpy)
      actionSpies.setGasTotal.resetHistory()
      actionSpies.setStorageTotal.resetHistory()
      actionSpies.setGasAndCollateralTotal.resetHistory()
      actionSpies.showModal.resetHistory()
    })

    describe('showCustomizeGasModal()', function () {
      it('should dispatch an action', function () {
        mapDispatchToPropsObject.showCustomizeGasModal()
        assert(dispatchSpy.calledOnce)
        assert.deepEqual(actionSpies.showModal.getCall(0).args[0], {
          name: 'CUSTOMIZE_GAS',
          hideBasic: true,
        })
      })
    })

    describe('showCustomizeStorageModal()', function () {
      it('should dispatch an action', function () {
        mapDispatchToPropsObject.showCustomizeStorageModal()
        assert(dispatchSpy.calledOnce)
        assert.deepEqual(actionSpies.showModal.getCall(0).args[0], {
          name: 'CUSTOMIZE_STORAGE',
          hideBasic: true,
        })
      })
    })

    describe('setGasPrice()', function () {
      it('should dispatch an action', function () {
        mapDispatchToPropsObject.setGasPrice('mockNewPrice', 'mockLimit')
        assert(dispatchSpy.calledThrice)
        assert(actionSpies.setGasPrice.calledOnce)
        assert.equal(actionSpies.setGasPrice.getCall(0).args[0], 'mockNewPrice')
        assert.equal(
          gasDuckSpies.setCustomGasPrice.getCall(0).args[0],
          'mockNewPrice'
        )
        assert(actionSpies.setGasTotal.calledOnce)
        // assert(actionSpies.setGasAndCollateralTotal.calledOnce)
        assert.equal(
          actionSpies.setGasTotal.getCall(0).args[0],
          'mockLimitmockNewPrice'
        )
        // assert.equal(
        //   actionSpies.setGasAndCollateralTotal.getCall(0).args[0],
        //   'mockLimitmockNewPrice0'
        // )
      })
    })

    describe('setGasLimit()', function () {
      it('should dispatch an action', function () {
        mapDispatchToPropsObject.setGasLimit('mockNewLimit', 'mockPrice')
        assert(dispatchSpy.calledThrice)
        assert(actionSpies.setGasLimit.calledOnce)
        assert.equal(actionSpies.setGasLimit.getCall(0).args[0], 'mockNewLimit')
        assert.equal(
          gasDuckSpies.setCustomGasLimit.getCall(0).args[0],
          'mockNewLimit'
        )
        assert(actionSpies.setGasTotal.calledOnce)
        // assert(actionSpies.setGasAndCollateralTotal.calledOnce)
        assert.equal(
          actionSpies.setGasTotal.getCall(0).args[0],
          'mockNewLimitmockPrice'
        )
        // assert.equal(
        //   actionSpies.setGasAndCollateralTotal.getCall(0).args[0],
        //   'mockNewLimitmockPrice0'
        // )
      })
    })

    describe('setStorageLimit()', function () {
      it('should dispatch an action', function () {
        mapDispatchToPropsObject.setStorageLimit('mockNewStorageLimit')
        assert(dispatchSpy.calledThrice)
        assert(actionSpies.setStorageLimit.calledOnce)
        assert.equal(
          actionSpies.setStorageLimit.getCall(0).args[0],
          'mockNewStorageLimit'
        )
        assert.equal(
          actionSpies.setStorageTotal.getCall(0).args[0],
          'mockNewStorageLimit*gdripperb'
        )
        // assert.equal(
        //   actionSpies.setGasAndCollateralTotal.getCall(0).args[0],
        //   '0mockNewStorageLimit*gdripperb'
        // )
      })
    })

    describe('showGasButtonGroup()', function () {
      it('should dispatch an action', function () {
        mapDispatchToPropsObject.showGasButtonGroup()
        assert(dispatchSpy.calledOnce)
        assert(sendDuckSpies.showGasButtonGroup.calledOnce)
      })
    })

    describe('resetCustomData()', function () {
      it('should dispatch an action', function () {
        mapDispatchToPropsObject.resetCustomData()
        assert(dispatchSpy.calledOnce)
        assert(actionSpies.resetAllCustomData.calledOnce)
      })
    })
  })

  describe('mergeProps', function () {
    it('should return the expected props when isConfirm is true', function () {
      const stateProps = {
        gasPriceButtonGroupProps: {
          someGasPriceButtonGroupProp: 'foo',
          anotherGasPriceButtonGroupProp: 'bar',
        },
        someOtherStateProp: 'baz',
      }
      const dispatchProps = {
        setGasPrice: sinon.spy(),
        someOtherDispatchProp: sinon.spy(),
      }
      const ownProps = { someOwnProp: 123 }
      const result = mergeProps(stateProps, dispatchProps, ownProps)

      assert.equal(result.someOtherStateProp, 'baz')
      assert.equal(
        result.gasPriceButtonGroupProps.someGasPriceButtonGroupProp,
        'foo'
      )
      assert.equal(
        result.gasPriceButtonGroupProps.anotherGasPriceButtonGroupProp,
        'bar'
      )
      assert.equal(result.someOwnProp, 123)

      assert.equal(dispatchProps.setGasPrice.callCount, 0)
      result.gasPriceButtonGroupProps.handleGasPriceSelection()
      assert.equal(dispatchProps.setGasPrice.callCount, 1)

      assert.equal(dispatchProps.someOtherDispatchProp.callCount, 0)
      result.someOtherDispatchProp()
      assert.equal(dispatchProps.someOtherDispatchProp.callCount, 1)
    })
  })
})
