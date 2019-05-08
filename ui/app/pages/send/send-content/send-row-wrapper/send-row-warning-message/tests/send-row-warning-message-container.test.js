import assert from 'assert'
import proxyquire from 'proxyquire'

let mapStateToProps

proxyquire('../send-row-warning-message.container.js', {
  'react-redux': {
    connect: (ms) => {
      mapStateToProps = ms
      return () => ({})
    },
  },
  '../../../send.selectors': { getSendWarnings: (s) => `mockWarnings:${s}` },
})

describe('send-row-warning-message container', () => {

  describe('mapStateToProps()', () => {

    it('should map the correct properties to props', () => {
      assert.deepEqual(mapStateToProps('mockState', { warningType: 'someType' }), {
        warnings: 'mockWarnings:mockState',
        warningType: 'someType' })
    })

  })

})
