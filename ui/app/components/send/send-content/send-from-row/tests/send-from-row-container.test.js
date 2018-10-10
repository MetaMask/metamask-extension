import assert from 'assert'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

let mapStateToProps
let mapDispatchToProps

const actionSpies = {
  updateSendFrom: sinon.spy(),
  setSendTokenBalance: sinon.spy(),
}
const duckActionSpies = {
  closeFromDropdown: sinon.spy(),
  openFromDropdown: sinon.spy(),
}

proxyquire('../send-from-row.container.js', {
  'react-redux': {
    connect: (ms, md) => {
      mapStateToProps = ms
      mapDispatchToProps = md
      return () => ({})
    },
  },
  '../../send.selectors.js': {
    accountsWithSendEtherInfoSelector: (s) => `mockFromAccounts:${s}`,
    getConversionRate: (s) => `mockConversionRate:${s}`,
    getSelectedTokenContract: (s) => `mockTokenContract:${s}`,
    getSendFromObject: (s) => `mockFrom:${s}`,
  },
  './send-from-row.selectors.js': { getFromDropdownOpen: (s) => `mockFromDropdownOpen:${s}` },
  '../../send.utils.js': { calcTokenBalance: ({ usersToken, selectedToken }) => usersToken + selectedToken },
  '../../../../actions': actionSpies,
  '../../../../ducks/send.duck': duckActionSpies,
})

describe('send-from-row container', () => {

  describe('mapStateToProps()', () => {

    it('should map the correct properties to props', () => {
      assert.deepEqual(mapStateToProps('mockState'), {
        conversionRate: 'mockConversionRate:mockState',
        from: 'mockFrom:mockState',
        fromAccounts: 'mockFromAccounts:mockState',
        fromDropdownOpen: 'mockFromDropdownOpen:mockState',
        tokenContract: 'mockTokenContract:mockState',
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

    describe('closeFromDropdown()', () => {
      it('should dispatch a closeFromDropdown action', () => {
        mapDispatchToPropsObject.closeFromDropdown()
        assert(dispatchSpy.calledOnce)
        assert(duckActionSpies.closeFromDropdown.calledOnce)
        assert.equal(
          duckActionSpies.closeFromDropdown.getCall(0).args[0],
          undefined
        )
      })
    })

    describe('openFromDropdown()', () => {
      it('should dispatch a openFromDropdown action', () => {
        mapDispatchToPropsObject.openFromDropdown()
        assert(dispatchSpy.calledOnce)
        assert(duckActionSpies.openFromDropdown.calledOnce)
        assert.equal(
          duckActionSpies.openFromDropdown.getCall(0).args[0],
          undefined
        )
      })
    })

    describe('updateSendFrom()', () => {
      it('should dispatch an updateSendFrom action', () => {
        mapDispatchToPropsObject.updateSendFrom('mockFrom')
        assert(dispatchSpy.calledOnce)
        assert.equal(
          actionSpies.updateSendFrom.getCall(0).args[0],
          'mockFrom'
        )
      })
    })

    describe('setSendTokenBalance()', () => {
      it('should dispatch an setSendTokenBalance action', () => {
        mapDispatchToPropsObject.setSendTokenBalance('mockUsersToken', 'mockSelectedToken')
        assert(dispatchSpy.calledOnce)
        assert.equal(
          actionSpies.setSendTokenBalance.getCall(0).args[0],
          'mockUsersTokenmockSelectedToken'
        )
      })
    })

  })

})
