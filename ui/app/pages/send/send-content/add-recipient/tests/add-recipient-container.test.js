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
  '../../../../selectors': {
    getSendEnsResolution: (s) => `mockSendEnsResolution:${s}`,
    getSendEnsResolutionError: (s) => `mockSendEnsResolutionError:${s}`,
    getAddressBook: (s) => [{ name: `mockAddressBook:${s}` }],
    getAddressBookEntry: (s) => `mockAddressBookEntry:${s}`,
    accountsWithSendEtherInfoSelector: (s) =>
      `mockAccountsWithSendEtherInfoSelector:${s}`,
  },
  '../../../../store/actions': actionSpies,
})

describe('add-recipient container', function () {
  describe('mapStateToProps()', function () {
    it('should map the correct properties to props', function () {
      assert.deepEqual(mapStateToProps('mockState'), {
        addressBook: [{ name: 'mockAddressBook:mockState' }],
        contacts: [{ name: 'mockAddressBook:mockState' }],
        ensResolution: 'mockSendEnsResolution:mockState',
        ensResolutionError: 'mockSendEnsResolutionError:mockState',
        ownedAccounts: 'mockAccountsWithSendEtherInfoSelector:mockState',
        addressBookEntryName: undefined,
        nonContacts: [],
      })
    })
  })

  describe('mapDispatchToProps()', function () {
    describe('updateSendTo()', function () {
      const dispatchSpy = sinon.spy()
      const mapDispatchToPropsObject = mapDispatchToProps(dispatchSpy)

      it('should dispatch an action', function () {
        mapDispatchToPropsObject.updateSendTo('mockTo', 'mockNickname')
        assert(dispatchSpy.calledOnce)
        assert(actionSpies.updateSendTo.calledOnce)
        assert.deepEqual(actionSpies.updateSendTo.getCall(0).args, [
          'mockTo',
          'mockNickname',
        ])
      })
    })
  })
})
