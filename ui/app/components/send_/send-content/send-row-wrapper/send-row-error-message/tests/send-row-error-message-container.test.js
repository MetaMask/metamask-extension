import assert from 'assert'
import proxyquire from 'proxyquire'

let mapStateToProps

proxyquire('../send-row-error-message.container.js', {
  'react-redux': {
    connect: (ms, md) => {
      mapStateToProps = ms
      return () => ({})
    },
  },
  '../../../send.selectors': { getSendErrors: (s) => `mockErrors:${s}` },
})

describe('send-row-error-message container', () => {

  describe('mapStateToProps()', () => {

    it('should map the correct properties to props', () => {
      assert.deepEqual(mapStateToProps('mockState', { errorType: 'someType' }), {
        errors: 'mockErrors:mockState',
        errorType: 'someType' })
    })

  })

})
