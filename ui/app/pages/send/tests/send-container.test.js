import assert from 'assert'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

let mapDispatchToProps

const actionSpies = {
  updateSendTokenBalance: sinon.spy(),
  updateGasData: sinon.spy(),
  setGasTotal: sinon.spy(),
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
  'react-router-dom': { withRouter: () => undefined },
  redux: { compose: (_, arg2) => () => arg2() },
  '../../store/actions': actionSpies,
  '../../ducks/send/send.duck': duckActionSpies,
  './send.utils.js': {
    calcGasTotal: (gasLimit, gasPrice) => gasLimit + gasPrice,
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

    describe('updateAndSetGasLimit()', function () {
      const mockProps = {
        blockGasLimit: 'mockBlockGasLimit',
        editingTransactionId: '0x2',
        gasLimit: '0x3',
        gasPrice: '0x4',
        selectedAddress: '0x4',
        sendToken: { address: '0x1' },
        to: 'mockTo',
        value: 'mockValue',
        data: undefined,
      }

      it('should dispatch a setGasTotal action when editingTransactionId is truthy', function () {
        mapDispatchToPropsObject.updateAndSetGasLimit(mockProps)
        assert(dispatchSpy.calledOnce)
        assert.equal(actionSpies.setGasTotal.getCall(0).args[0], '0x30x4')
      })

      it('should dispatch an updateGasData action when editingTransactionId is falsy', function () {
        const {
          gasPrice,
          selectedAddress,
          sendToken,
          blockGasLimit,
          to,
          value,
          data,
        } = mockProps
        mapDispatchToPropsObject.updateAndSetGasLimit({
          ...mockProps,
          editingTransactionId: false,
        })
        assert(dispatchSpy.calledOnce)
        assert.deepEqual(actionSpies.updateGasData.getCall(0).args[0], {
          gasPrice,
          selectedAddress,
          sendToken,
          blockGasLimit,
          to,
          value,
          data,
        })
      })
    })

    describe('updateSendTokenBalance()', function () {
      const mockProps = {
        address: '0x10',
        tokenContract: '0x00a',
        sendToken: { address: '0x1' },
      }

      it('should dispatch an action', function () {
        mapDispatchToPropsObject.updateSendTokenBalance({ ...mockProps })
        assert(dispatchSpy.calledOnce)
        assert.deepEqual(
          actionSpies.updateSendTokenBalance.getCall(0).args[0],
          mockProps,
        )
      })
    })

    describe('updateSendErrors()', function () {
      it('should dispatch an action', function () {
        mapDispatchToPropsObject.updateSendErrors('mockError')
        assert(dispatchSpy.calledOnce)
        assert.equal(
          duckActionSpies.updateSendErrors.getCall(0).args[0],
          'mockError',
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
