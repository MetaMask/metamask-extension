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

describe('send-from-row container', () => {
  describe('mapStateToProps()', () => {
    it('should map the correct properties to props', () => {
      assert.deepEqual(mapStateToProps('mockState'), {
        from: 'mockFrom:mockState',
      })
    })
  })
})
