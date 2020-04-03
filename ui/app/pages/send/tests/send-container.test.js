import assert from 'assert'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

let mapDispatchToProps

const actionSpies = {
  updateSendTokenBalance: sinon.spy(),
  updateGasAndCollateralData: sinon.spy(),
  setStorageLimit: sinon.spy(),
  setGasTotal: sinon.spy(),
  setStorageTotal: sinon.spy(),
  setGasAndCollateralTotal: sinon.spy(),
}
const duckActionSpies = {
  updateSendErrors: sinon.spy(),
  resetSendState: sinon.spy(),
}

proxyquire('../send.container.js', {
  'react-redux': {
    connect: (_, md) => {
      mapDispatchToProps = md
      return () => ({})
    },
  },
  'react-router-dom': { withRouter: () => {} },
  recompose: { compose: (_, arg2) => () => arg2() },
  '../../store/actions': actionSpies,
  '../../ducks/send/send.duck': duckActionSpies,
  './send.utils.js': {
    calcGasTotal: (gasLimit, gasPrice) => gasLimit + gasPrice,
    calcStorageTotal: (storageLimit) => storageLimit + '*gdripperb',
    calcGasAndCollateralTotal: (
      gasLimit,
      gasPrice,
      storageLimit,
      gasTotal,
      storageTotal
    ) => {
      if (gasTotal !== undefined && storageTotal !== undefined) {
        return `${gasTotal}+${storageTotal}`
      }
      return `${gasLimit}*${gasPrice}+${storageLimit}`
    },
  },
})

describe('send container', function () {
  describe('mapDispatchToProps()', function () {
    let dispatchSpy
    let mapDispatchToPropsObject

    beforeEach(function () {
      dispatchSpy = sinon.spy()
      mapDispatchToPropsObject = mapDispatchToProps(dispatchSpy)
    })

    describe('updateAndSetGasAndStorageLimit()', function () {
      const mockProps = {
        blockGasLimit: 'mockBlockGasLimit',
        editingTransactionId: '0x2',
        storageLimit: '0x2',
        gasLimit: '0x3',
        gasPrice: '0x4',
        recentBlocks: ['mockBlock'],
        selectedAddress: '0x4',
        selectedToken: { address: '0x1' },
        to: 'mockTo',
        value: 'mockValue',
        data: undefined,
      }

      it('should dispatch a setGasTotal action when editingTransactionId is truthy', function () {
        mapDispatchToPropsObject.updateAndSetGasAndStorageLimit(mockProps)
        assert(dispatchSpy.calledTwice)
        assert.equal(actionSpies.setGasTotal.getCall(0).args[0], '0x30x4')
        assert.equal(
          actionSpies.setStorageTotal.getCall(0).args[0],
          '0x2*gdripperb'
        )
      })

      it('should dispatch an updateGasAndCollateralData action when editingTransactionId is falsy', function () {
        const {
          gasPrice,
          selectedAddress,
          selectedToken,
          recentBlocks,
          blockGasLimit,
          to,
          value,
          data,
        } = mockProps
        mapDispatchToPropsObject.updateAndSetGasAndStorageLimit(
          Object.assign({}, mockProps, { editingTransactionId: false })
        )
        assert(dispatchSpy.calledOnce)
        assert.deepEqual(
          actionSpies.updateGasAndCollateralData.getCall(0).args[0],
          {
            gasPrice,
            selectedAddress,
            selectedToken,
            recentBlocks,
            blockGasLimit,
            to,
            value,
            data,
          }
        )
      })
    })

    describe('updateSendTokenBalance()', function () {
      const mockProps = {
        address: '0x10',
        tokenContract: '0x00a',
        selectedToken: { address: '0x1' },
      }

      it('should dispatch an action', function () {
        mapDispatchToPropsObject.updateSendTokenBalance(
          Object.assign({}, mockProps)
        )
        assert(dispatchSpy.calledOnce)
        assert.deepEqual(
          actionSpies.updateSendTokenBalance.getCall(0).args[0],
          mockProps
        )
      })
    })

    describe('updateSendErrors()', function () {
      it('should dispatch an action', function () {
        mapDispatchToPropsObject.updateSendErrors('mockError')
        assert(dispatchSpy.calledOnce)
        assert.equal(
          duckActionSpies.updateSendErrors.getCall(0).args[0],
          'mockError'
        )
      })
    })

    describe('resetSendState()', function () {
      it('should dispatch an action', function () {
        mapDispatchToPropsObject.resetSendState()
        assert(dispatchSpy.calledOnce)
        assert.equal(duckActionSpies.resetSendState.getCall(0).args.length, 0)
      })
    })
  })
})
