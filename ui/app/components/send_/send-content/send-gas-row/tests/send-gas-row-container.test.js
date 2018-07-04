import assert from 'assert'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

let mapStateToProps
let mapDispatchToProps

const actionSpies = {
  showModal: sinon.spy(),
}

proxyquire('../send-gas-row.container.js', {
  'react-redux': {
    connect: (ms, md) => {
      mapStateToProps = ms
      mapDispatchToProps = md
      return () => ({})
    },
  },
  '../../send.selectors.js': {
    getConversionRate: (s) => `mockConversionRate:${s}`,
    getCurrentCurrency: (s) => `mockConvertedCurrency:${s}`,
    getGasTotal: (s) => `mockGasTotal:${s}`,
  },
  './send-gas-row.selectors.js': { sendGasIsInError: (s) => `mockGasLoadingError:${s}` },
  '../../../../actions': actionSpies,
})

describe('send-gas-row container', () => {

  describe('mapStateToProps()', () => {

    it('should map the correct properties to props', () => {
      assert.deepEqual(mapStateToProps('mockState'), {
        conversionRate: 'mockConversionRate:mockState',
        convertedCurrency: 'mockConvertedCurrency:mockState',
        gasTotal: 'mockGasTotal:mockState',
        gasLoadingError: 'mockGasLoadingError:mockState',
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
          { name: 'CUSTOMIZE_GAS' }
        )
      })
    })

  })

})
