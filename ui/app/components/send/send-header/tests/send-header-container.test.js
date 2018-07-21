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
  '../../../actions': actionSpies,
  './send-header.selectors': {
    getTitleKey: (s) => `mockTitleKey:${s}`,
    getSubtitleParams: (s) => `mockSubtitleParams:${s}`,
  },
})

describe('send-header container', () => {

  describe('mapStateToProps()', () => {

    it('should map the correct properties to props', () => {
      assert.deepEqual(mapStateToProps('mockState'), {
        titleKey: 'mockTitleKey:mockState',
        subtitleParams: 'mockSubtitleParams:mockState',
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

  })

})
