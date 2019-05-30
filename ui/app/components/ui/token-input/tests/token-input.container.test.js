import assert from 'assert'
import proxyquire from 'proxyquire'

let mapStateToProps, mergeProps

proxyquire('../token-input.container.js', {
  'react-redux': {
    connect: (ms, _, mp) => {
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
          preferences: {
            showFiatInTestnets: false,
          },
          provider: {
            type: 'mainnet',
          },
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
        hideConversion: false,
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
          preferences: {
            showFiatInTestnets: false,
          },
          provider: {
            type: 'mainnet',
          },
        },
      }

      assert.deepEqual(mapStateToProps(mockState), {
        currentCurrency: 'usd',
        selectedToken: {
          address: 'test',
        },
        selectedTokenExchangeRate: 0,
        hideConversion: false,
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
          preferences: {
            showFiatInTestnets: false,
          },
          provider: {
            type: 'mainnet',
          },
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
        hideConversion: false,
      })
    })

    it('should return the correct props when not in mainnet and showFiatInTestnets is false', () => {
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
          preferences: {
            showFiatInTestnets: false,
          },
          provider: {
            type: 'rinkeby',
          },
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
        hideConversion: true,
      })
    })

    it('should return the correct props when not in mainnet and showFiatInTestnets is true', () => {
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
          preferences: {
            showFiatInTestnets: true,
          },
          provider: {
            type: 'rinkeby',
          },
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
        hideConversion: false,
      })
    })

    it('should return the correct props when in mainnet and showFiatInTestnets is true', () => {
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
          preferences: {
            showFiatInTestnets: true,
          },
          provider: {
            type: 'mainnet',
          },
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
        hideConversion: false,
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
