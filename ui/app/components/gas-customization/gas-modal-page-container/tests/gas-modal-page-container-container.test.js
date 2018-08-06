import assert from 'assert'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

// let mapStateToProps
let mapDispatchToProps

const actionSpies = {
  hideModal: sinon.spy(),
}

proxyquire('../gas-modal-page-container.container.js', {
  'react-redux': {
    connect: (ms, md) => {
      // mapStateToProps = ms
      mapDispatchToProps = md
      return () => ({})
    },
  },
  '../../../actions': actionSpies,
})

describe('gas-modal-page-container container', () => {

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

  })

})
