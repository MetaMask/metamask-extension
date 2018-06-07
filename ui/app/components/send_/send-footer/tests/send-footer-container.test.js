import assert from 'assert'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

let mapStateToProps
let mapDispatchToProps

const actionSpies = {
  addToAddressBook: sinon.spy(),
  clearSend: sinon.spy(),
  signTokenTx: sinon.spy(),
  signTx: sinon.spy(),
  updateTransaction: sinon.spy(),
}
const utilsStubs = {
  addressIsNew: sinon.stub().returns(true),
  constructTxParams: sinon.stub().returns('mockConstructedTxParams'),
  constructUpdatedTx: sinon.stub().returns('mockConstructedUpdatedTxParams'),
}

proxyquire('../send-footer.container.js', {
  'react-redux': {
    connect: (ms, md) => {
      mapStateToProps = ms
      mapDispatchToProps = md
      return () => ({})
    },
  },
  '../../../actions': actionSpies,
  '../send.selectors': {
    getGasLimit: (s) => `mockGasLimit:${s}`,
    getGasPrice: (s) => `mockGasPrice:${s}`,
    getGasTotal: (s) => `mockGasTotal:${s}`,
    getSelectedToken: (s) => `mockSelectedToken:${s}`,
    getSendAmount: (s) => `mockAmount:${s}`,
    getSendEditingTransactionId: (s) => `mockEditingTransactionId:${s}`,
    getSendFromObject: (s) => `mockFromObject:${s}`,
    getSendTo: (s) => `mockTo:${s}`,
    getSendToAccounts: (s) => `mockToAccounts:${s}`,
    getTokenBalance: (s) => `mockTokenBalance:${s}`,
    getUnapprovedTxs: (s) => `mockUnapprovedTxs:${s}`,
  },
  './send-footer.selectors': { isSendFormInError: (s) => `mockInError:${s}` },
  './send-footer.utils': utilsStubs,
})

describe('send-footer container', () => {

  describe('mapStateToProps()', () => {

    it('should map the correct properties to props', () => {
      assert.deepEqual(mapStateToProps('mockState'), {
        amount: 'mockAmount:mockState',
        selectedToken: 'mockSelectedToken:mockState',
        editingTransactionId: 'mockEditingTransactionId:mockState',
        from: 'mockFromObject:mockState',
        gasLimit: 'mockGasLimit:mockState',
        gasPrice: 'mockGasPrice:mockState',
        gasTotal: 'mockGasTotal:mockState',
        inError: 'mockInError:mockState',
        to: 'mockTo:mockState',
        toAccounts: 'mockToAccounts:mockState',
        tokenBalance: 'mockTokenBalance:mockState',
        unapprovedTxs: 'mockUnapprovedTxs:mockState',
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

    describe('clearSend()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.clearSend()
        assert(dispatchSpy.calledOnce)
        assert(actionSpies.clearSend.calledOnce)
      })
    })

    describe('sign()', () => {
      it('should dispatch a signTokenTx action if selectedToken is defined', () => {
        mapDispatchToPropsObject.sign({
          selectedToken: {
            address: '0xabc',
          },
          to: 'mockTo',
          amount: 'mockAmount',
          from: 'mockFrom',
          gas: 'mockGas',
          gasPrice: 'mockGasPrice',
        })
        assert(dispatchSpy.calledOnce)
        assert.deepEqual(
          utilsStubs.constructTxParams.getCall(0).args[0],
          {
            selectedToken: {
              address: '0xabc',
            },
            to: 'mockTo',
            amount: 'mockAmount',
            from: 'mockFrom',
            gas: 'mockGas',
            gasPrice: 'mockGasPrice',
          }
        )
        assert.deepEqual(
          actionSpies.signTokenTx.getCall(0).args,
          [ '0xabc', 'mockTo', 'mockAmount', 'mockConstructedTxParams' ]
        )
      })

      it('should dispatch a sign action if selectedToken is not defined', () => {
        utilsStubs.constructTxParams.resetHistory()
        mapDispatchToPropsObject.sign({
          to: 'mockTo',
          amount: 'mockAmount',
          from: 'mockFrom',
          gas: 'mockGas',
          gasPrice: 'mockGasPrice',
        })
        assert(dispatchSpy.calledOnce)
        assert.deepEqual(
          utilsStubs.constructTxParams.getCall(0).args[0],
          {
            selectedToken: undefined,
            to: 'mockTo',
            amount: 'mockAmount',
            from: 'mockFrom',
            gas: 'mockGas',
            gasPrice: 'mockGasPrice',
          }
        )
        assert.deepEqual(
          actionSpies.signTx.getCall(0).args,
          [ 'mockConstructedTxParams' ]
        )
      })
    })

    describe('update()', () => {
      it('should dispatch an updateTransaction action', () => {
        mapDispatchToPropsObject.update({
          to: 'mockTo',
          amount: 'mockAmount',
          from: 'mockFrom',
          gas: 'mockGas',
          gasPrice: 'mockGasPrice',
          editingTransactionId: 'mockEditingTransactionId',
          selectedToken: 'mockSelectedToken',
          unapprovedTxs: 'mockUnapprovedTxs',
        })
        assert(dispatchSpy.calledOnce)
        assert.deepEqual(
          utilsStubs.constructUpdatedTx.getCall(0).args[0],
          {
            to: 'mockTo',
            amount: 'mockAmount',
            from: 'mockFrom',
            gas: 'mockGas',
            gasPrice: 'mockGasPrice',
            editingTransactionId: 'mockEditingTransactionId',
            selectedToken: 'mockSelectedToken',
            unapprovedTxs: 'mockUnapprovedTxs',
          }
        )
        assert.equal(actionSpies.updateTransaction.getCall(0).args[0], 'mockConstructedUpdatedTxParams')
      })
    })

    describe('addToAddressBookIfNew()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.addToAddressBookIfNew('mockNewAddress', 'mockToAccounts', 'mockNickname')
        assert(dispatchSpy.calledOnce)
        assert.equal(utilsStubs.addressIsNew.getCall(0).args[0], 'mockToAccounts')
        assert.deepEqual(
          actionSpies.addToAddressBook.getCall(0).args,
          [ '0xmockNewAddress', 'mockNickname' ]
        )
      })
    })

  })

})
