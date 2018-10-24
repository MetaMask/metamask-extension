import assert from 'assert'
import proxyquire from 'proxyquire'

let mapStateToProps, mergeProps

proxyquire('../token-input.container.js', {
  'react-redux': {
    connect: (ms, md, mp) => {
      mapStateToProps = ms
      mergeProps = mp
      return () => ({})
    },
  },
})

describe('TokenInput container', () => {
  describe('mapStateToProps()', () => {
    it('should return the correct props when send is empty', () => {
      const mockState = {
        metamask: {
          currentCurrency: 'usd',
          tokens: [
            {
              address: '0x1',
              decimals: '4',
              symbol: 'ABC',
            },
          ],
          selectedTokenAddress: '0x1',
          contractExchangeRates: {},
          send: {},
        },
      }

      assert.deepEqual(mapStateToProps(mockState), {
        currentCurrency: 'usd',
        selectedToken: {
          address: '0x1',
          decimals: '4',
          symbol: 'ABC',
        },
        selectedTokenExchangeRate: 0,
      })
    })

    it('should return the correct props when selectedTokenAddress is not found and send is populated', () => {
      const mockState = {
        metamask: {
          currentCurrency: 'usd',
          tokens: [
            {
              address: '0x1',
              decimals: '4',
              symbol: 'ABC',
            },
          ],
          selectedTokenAddress: '0x2',
          contractExchangeRates: {},
          send: {
            token: { address: 'test' },
          },
        },
      }

      assert.deepEqual(mapStateToProps(mockState), {
        currentCurrency: 'usd',
        selectedToken: {
          address: 'test',
        },
        selectedTokenExchangeRate: 0,
      })
    })

    it('should return the correct props when contractExchangeRates is populated', () => {
      const mockState = {
        metamask: {
          currentCurrency: 'usd',
          tokens: [
            {
              address: '0x1',
              decimals: '4',
              symbol: 'ABC',
            },
          ],
          selectedTokenAddress: '0x1',
          contractExchangeRates: {
            '0x1': 5,
          },
          send: {},
        },
      }

      assert.deepEqual(mapStateToProps(mockState), {
        currentCurrency: 'usd',
        selectedToken: {
          address: '0x1',
          decimals: '4',
          symbol: 'ABC',
        },
        selectedTokenExchangeRate: 5,
      })
    })
  })

  describe('mergeProps()', () => {
    it('should return the correct props', () => {
      const mockStateProps = {
        currentCurrency: 'usd',
        selectedToken: {
          address: '0x1',
          decimals: '4',
          symbol: 'ABC',
        },
        selectedTokenExchangeRate: 5,
      }

      assert.deepEqual(mergeProps(mockStateProps, {}, {}), {
        currentCurrency: 'usd',
        selectedToken: {
          address: '0x1',
          decimals: '4',
          symbol: 'ABC',
        },
        selectedTokenExchangeRate: 5,
        suffix: 'ABC',
      })
    })
  })
})
