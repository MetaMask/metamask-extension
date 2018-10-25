import assert from 'assert'
import proxyquire from 'proxyquire'

let mapStateToProps

proxyquire('../transaction-activity-log.container.js', {
  'react-redux': {
    connect: ms => {
      mapStateToProps = ms
      return () => ({})
    },
  },
})

describe('TransactionActivityLog container', () => {
  describe('mapStateToProps()', () => {
    it('should return the correct props', () => {
      const mockState = {
        metamask: {
          conversionRate: 280.45,
          nativeCurrency: 'ETH',
        },
      }

      assert.deepEqual(mapStateToProps(mockState), { conversionRate: 280.45, nativeCurrency: 'ETH' })
    })
  })
})
