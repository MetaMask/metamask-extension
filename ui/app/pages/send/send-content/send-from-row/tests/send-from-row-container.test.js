import assert from 'assert'
import proxyquire from 'proxyquire'

let mapStateToProps

proxyquire('../send-from-row.container.js', {
  'react-redux': {
    connect: ms => {
      mapStateToProps = ms
      return () => ({})
    },
  },
  '../../send.selectors.js': {
    getSendFromObject: (s) => `mockFrom:${s}`,
  },
})

describe('send-from-row container', function () {
  describe('mapStateToProps()', function () {
    it('should map the correct properties to props', function () {
      assert.deepEqual(mapStateToProps('mockState'), {
        from: 'mockFrom:mockState',
      })
    })
  })
})
