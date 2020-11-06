import assert from 'assert'
import proxyquire from 'proxyquire'

let mapStateToProps

proxyquire('../send-row-error-message.container.js', {
  'react-redux': {
    connect: (ms) => {
      mapStateToProps = ms
      return () => ({})
    },
  },
  '../../../../../selectors': { getSendErrors: (s) => `mockErrors:${s}` },
})

describe('send-row-error-message container', function () {
  describe('mapStateToProps()', function () {
    it('should map the correct properties to props', function () {
      assert.deepEqual(
        mapStateToProps('mockState', { errorType: 'someType' }),
        {
          errors: 'mockErrors:mockState',
          errorType: 'someType',
        },
      )
    })
  })
})
