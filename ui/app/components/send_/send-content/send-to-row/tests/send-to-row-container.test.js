import assert from 'assert'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

let mapStateToProps
let mapDispatchToProps

const actionSpies = {
  updateSendTo: sinon.spy(),
}
const duckActionSpies = {
  closeToDropdown: sinon.spy(),
  openToDropdown: sinon.spy(),
  updateSendErrors: sinon.spy(),
}

proxyquire('../send-to-row.container.js', {
  'react-redux': {
    connect: (ms, md) => {
      mapStateToProps = ms
      mapDispatchToProps = md
      return () => ({})
    },
  },
  '../../send.selectors.js': {
    getCurrentNetwork: (s) => `mockNetwork:${s}`,
    getSendTo: (s) => `mockTo:${s}`,
    getSendToAccounts: (s) => `mockToAccounts:${s}`,
  },
  './send-to-row.selectors.js': {
    getToDropdownOpen: (s) => `mockToDropdownOpen:${s}`,
    sendToIsInError: (s) => `mockInError:${s}`,
  },
  '../../../../actions': actionSpies,
  '../../../../ducks/send.duck': duckActionSpies,
})

describe('send-to-row container', () => {

  describe('mapStateToProps()', () => {

    it('should map the correct properties to props', () => {
      assert.deepEqual(mapStateToProps('mockState'), {
        inError: 'mockInError:mockState',
        network: 'mockNetwork:mockState',
        to: 'mockTo:mockState',
        toAccounts: 'mockToAccounts:mockState',
        toDropdownOpen: 'mockToDropdownOpen:mockState',
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

    describe('closeToDropdown()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.closeToDropdown()
        assert(dispatchSpy.calledOnce)
        assert(duckActionSpies.closeToDropdown.calledOnce)
        assert.equal(
          duckActionSpies.closeToDropdown.getCall(0).args[0],
          undefined
        )
      })
    })

    describe('openToDropdown()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.openToDropdown()
        assert(dispatchSpy.calledOnce)
        assert(duckActionSpies.openToDropdown.calledOnce)
        assert.equal(
          duckActionSpies.openToDropdown.getCall(0).args[0],
          undefined
        )
      })
    })

    describe('updateSendTo()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.updateSendTo('mockTo', 'mockNickname')
        assert(dispatchSpy.calledOnce)
        assert(actionSpies.updateSendTo.calledOnce)
        assert.deepEqual(
          actionSpies.updateSendTo.getCall(0).args,
          ['mockTo', 'mockNickname']
        )
      })
    })

    describe('updateSendToError()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.updateSendToError('mockToErrorObject')
        assert(dispatchSpy.calledOnce)
        assert(duckActionSpies.updateSendErrors.calledOnce)
        assert.equal(
          duckActionSpies.updateSendErrors.getCall(0).args[0],
          'mockToErrorObject'
        )
      })
    })

  })

})
