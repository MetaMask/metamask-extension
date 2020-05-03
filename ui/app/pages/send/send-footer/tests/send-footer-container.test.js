import assert from 'assert'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

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
  constructTxParams: sinon.stub().returns({
    value: 'mockAmount',
  }),
  constructUpdatedTx: sinon.stub().returns('mockConstructedUpdatedTxParams'),
}

proxyquire('../send-footer.container.js', {
  'react-redux': {
    connect: (_, md) => {
      mapDispatchToProps = md
      return () => ({})
    },
  },
  '../../../store/actions': actionSpies,
  '../send.selectors': {
    getGasLimit: (s) => `mockGasLimit:${s}`,
    getGasPrice: (s) => `mockGasPrice:${s}`,
    getGasTotal: (s) => `mockGasTotal:${s}`,
    getSelectedToken: (s) => `mockSelectedToken:${s}`,
    getSendAmount: (s) => `mockAmount:${s}`,
    getSendEditingTransactionId: (s) => `mockEditingTransactionId:${s}`,
    getSendFromObject: (s) => `mockFromObject:${s}`,
    getSendTo: (s) => `mockTo:${s}`,
    getSendToNickname: (s) => `mockToNickname:${s}`,
    getSendToAccounts: (s) => `mockToAccounts:${s}`,
    getTokenBalance: (s) => `mockTokenBalance:${s}`,
    getSendHexData: (s) => `mockHexData:${s}`,
    getUnapprovedTxs: (s) => `mockUnapprovedTxs:${s}`,
    getSendErrors: (s) => `mockSendErrors:${s}`,
    isSendFormInError: (s) => `mockInError:${s}`,
  },
  './send-footer.utils': utilsStubs,
  '../../../selectors/': {
    getRenderableEstimateDataForSmallButtonsFromGWEI: (s) => ([{ gasEstimateType: `mockGasEstimateType:${s}` }]),
    getDefaultActiveButtonIndex: () => 0,
  },
})

describe('send-footer container', function () {

  describe('mapDispatchToProps()', function () {
    let dispatchSpy
    let mapDispatchToPropsObject

    beforeEach(function () {
      dispatchSpy = sinon.spy()
      mapDispatchToPropsObject = mapDispatchToProps(dispatchSpy)
    })

    describe('clearSend()', function () {
      it('should dispatch an action', function () {
        mapDispatchToPropsObject.clearSend()
        assert(dispatchSpy.calledOnce)
        assert(actionSpies.clearSend.calledOnce)
      })
    })

    describe('sign()', function () {
      it('should dispatch a signTokenTx action if selectedToken is defined', function () {
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
            data: undefined,
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
          [ '0xabc', 'mockTo', 'mockAmount', { value: 'mockAmount' } ]
        )
      })

      it('should dispatch a sign action if selectedToken is not defined', function () {
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
            data: undefined,
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
          [ { value: 'mockAmount' } ]
        )
      })
    })

    describe('update()', function () {
      it('should dispatch an updateTransaction action', function () {
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
            data: undefined,
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

    describe('addToAddressBookIfNew()', function () {
      it('should dispatch an action', function () {
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
