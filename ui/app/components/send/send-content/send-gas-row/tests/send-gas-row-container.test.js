import assert from 'assert'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

let mapStateToProps
let mapDispatchToProps
let mergeProps

const actionSpies = {
  showModal: sinon.spy(),
  setGasPrice: sinon.spy(),
}

const sendDuckSpies = {
  showGasButtonGroup: sinon.spy(),
}

proxyquire('../send-gas-row.container.js', {
  'react-redux': {
    connect: (ms, md, mp) => {
      mapStateToProps = ms
      mapDispatchToProps = md
      mergeProps = mp
      return () => ({})
    },
  },
  '../../send.selectors.js': {
    getConversionRate: (s) => `mockConversionRate:${s}`,
    getCurrentCurrency: (s) => `mockConvertedCurrency:${s}`,
    getGasTotal: (s) => `mockGasTotal:${s}`,
    getGasPrice: (s) => `mockGasPrice:${s}`,
  },
  './send-gas-row.selectors.js': {
    getGasLoadingError: (s) => `mockGasLoadingError:${s}`,
    gasFeeIsInError: (s) => `mockGasFeeError:${s}`,
    getGasButtonGroupShown: (s) => `mockGetGasButtonGroupShown:${s}`,
  },
  '../../../../actions': actionSpies,
  '../../../../selectors/custom-gas': {
    getBasicGasEstimateLoadingStatus: (s) => `mockBasicGasEstimateLoadingStatus:${s}`,
    getRenderableEstimateDataForSmallButtons: (s) => `mockGasButtonInfo:${s}`,
    getDefaultActiveButtonIndex: (gasButtonInfo, gasPrice) => gasButtonInfo.length + gasPrice.length,
  },
  '../../../../ducks/send.duck': sendDuckSpies,
})

describe('send-gas-row container', () => {

  describe('mapStateToProps()', () => {

    it('should map the correct properties to props', () => {
      assert.deepEqual(mapStateToProps('mockState'), {
        conversionRate: 'mockConversionRate:mockState',
        convertedCurrency: 'mockConvertedCurrency:mockState',
        gasTotal: 'mockGasTotal:mockState',
        gasFeeError: 'mockGasFeeError:mockState',
        gasLoadingError: 'mockGasLoadingError:mockState',
        gasPriceButtonGroupProps: {
          buttonDataLoading: `mockBasicGasEstimateLoadingStatus:mockState`,
          defaultActiveButtonIndex: 1,
          newActiveButtonIndex: 49,
          gasButtonInfo: `mockGasButtonInfo:mockState`,
        },
        gasButtonGroupShown: `mockGetGasButtonGroupShown:mockState`,
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

    describe('showCustomizeGasModal()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.showCustomizeGasModal()
        assert(dispatchSpy.calledOnce)
        assert.deepEqual(
          actionSpies.showModal.getCall(0).args[0],
          { name: 'CUSTOMIZE_GAS', hideBasic: true }
        )
      })
    })

    describe('setGasPrice()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.setGasPrice('mockNewPrice')
        assert(dispatchSpy.calledOnce)
        assert(actionSpies.setGasPrice.calledOnce)
        assert.equal(actionSpies.setGasPrice.getCall(0).args[0], 'mockNewPrice')
      })
    })

    describe('showGasButtonGroup()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.showGasButtonGroup()
        assert(dispatchSpy.calledOnce)
        assert(sendDuckSpies.showGasButtonGroup.calledOnce)
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
        someOtherStateProp: 'baz',
      }
      dispatchProps = {
        setGasPrice: sinon.spy(),
        someOtherDispatchProp: sinon.spy(),
      }
      ownProps = { someOwnProp: 123 }
    })

    it('should return the expected props when isConfirm is true', () => {
      const result = mergeProps(stateProps, dispatchProps, ownProps)

      assert.equal(result.someOtherStateProp, 'baz')
      assert.equal(result.gasPriceButtonGroupProps.someGasPriceButtonGroupProp, 'foo')
      assert.equal(result.gasPriceButtonGroupProps.anotherGasPriceButtonGroupProp, 'bar')
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
