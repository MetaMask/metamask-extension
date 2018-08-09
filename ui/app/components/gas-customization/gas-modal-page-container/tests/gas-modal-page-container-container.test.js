import assert from 'assert'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

let mapStateToProps
let mapDispatchToProps

const actionSpies = {
  hideModal: sinon.spy(),
}

const customGasActionSpies = {
  setCustomGasPrice: sinon.spy(),
  setCustomGasLimit: sinon.spy(),
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
    getCustomGasPrice: (s) => `mockGasPrice:${s}`,
    getCustomGasLimit: (s) => `mockGasLimit:${s}`,
  },
  '../../../actions': actionSpies,
  '../../../ducks/custom-gas': customGasActionSpies,
})

describe('gas-modal-page-container container', () => {

  describe('mapStateToProps()', () => {

    it('should map the correct properties to props', () => {
      assert.equal(mapStateToProps('mockState').customGasPrice, 'mockGasPrice:mockState')
      assert.equal(mapStateToProps('mockState').customGasLimit, 'mockGasLimit:mockState')
    })

  })

  describe('mapDispatchToProps()', () => {
    let dispatchSpy
    let mapDispatchToPropsObject

    beforeEach(() => {
      dispatchSpy = sinon.spy()
      mapDispatchToPropsObject = mapDispatchToProps(dispatchSpy)
    })

    describe('hideModal()', () => {
      it('should dispatch a hideModal action', () => {
        mapDispatchToPropsObject.hideModal()
        assert(dispatchSpy.calledOnce)
        assert(actionSpies.hideModal.calledOnce)
      })
    })

    describe('updateCustomGasPrice()', () => {
      it('should dispatch a setCustomGasPrice action', () => {
        mapDispatchToPropsObject.updateCustomGasPrice()
        assert(dispatchSpy.calledOnce)
        assert(customGasActionSpies.setCustomGasPrice.calledOnce)
      })
    })

    describe('updateCustomGasLimit()', () => {
      it('should dispatch a setCustomGasLimit action', () => {
        mapDispatchToPropsObject.updateCustomGasLimit()
        assert(dispatchSpy.calledOnce)
        assert(customGasActionSpies.setCustomGasLimit.calledOnce)
      })
    })

  })

})
