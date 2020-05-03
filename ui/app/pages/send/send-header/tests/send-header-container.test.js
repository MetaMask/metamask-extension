import assert from 'assert'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

let mapStateToProps
let mapDispatchToProps

const actionSpies = {
  clearSend: sinon.spy(),
}

proxyquire('../send-header.container.js', {
  'react-redux': {
    connect: (ms, md) => {
      mapStateToProps = ms
      mapDispatchToProps = md
      return () => ({})
    },
  },
  '../../../store/actions': actionSpies,
  '../send.selectors': {
    getTitleKey: (s) => `mockTitleKey:${s}`,
  },
})

describe('send-header container', function () {
  describe('mapStateToProps()', function () {
    it('should map the correct properties to props', function () {
      assert.deepEqual(mapStateToProps('mockState'), {
        titleKey: 'mockTitleKey:mockState',
      })
    })
  })

  describe('mapDispatchToProps()', function () {
    describe('clearSend()', function () {
      it('should dispatch an action', function () {
        const dispatchSpy = sinon.spy()
        const mapDispatchToPropsObject = mapDispatchToProps(dispatchSpy)

        mapDispatchToPropsObject.clearSend()
        assert(dispatchSpy.calledOnce)
        assert(actionSpies.clearSend.calledOnce)
      })
    })
  })
})
