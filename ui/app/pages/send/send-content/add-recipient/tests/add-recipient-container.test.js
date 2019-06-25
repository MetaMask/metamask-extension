import assert from 'assert'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

let mapStateToProps
let mapDispatchToProps

const actionSpies = {
  updateSendTo: sinon.spy(),
}

proxyquire('../add-recipient.container.js', {
  'react-redux': {
    connect: (ms, md) => {
      mapStateToProps = ms
      mapDispatchToProps = md
      return () => ({})
    },
  },
  '../../send.selectors.js': {
    getAddressBook: (s) => `mockAddressBook:${s}`,
    getSendEnsResolution: (s) => `mockSendEnsResolution:${s}`,
    getSendEnsResolutionError: (s) => `mockSendEnsResolutionError:${s}`,
    accountsWithSendEtherInfoSelector: (s) => `mockAccountsWithSendEtherInfoSelector:${s}`,
  },
  '../../../../store/actions': actionSpies,
})

describe('add-recipient container', () => {

  describe('mapStateToProps()', () => {

    it('should map the correct properties to props', () => {
      assert.deepEqual(mapStateToProps('mockState'), {
        addressBook: 'mockAddressBook:mockState',
        ensResolution: 'mockSendEnsResolution:mockState',
        ensResolutionError: 'mockSendEnsResolutionError:mockState',
        ownedAccounts: 'mockAccountsWithSendEtherInfoSelector:mockState',
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
  })

})
