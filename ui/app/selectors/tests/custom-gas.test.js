import assert from 'assert'
import proxyquire from 'proxyquire'

const {
  getCustomGasErrors,
  getCustomGasLimit,
  getCustomGasPrice,
  getCustomGasTotal,
  getEstimatedGasPrices,
  getEstimatedGasTimes,
  getPriceAndTimeEstimates,
  getRenderableBasicEstimateData,
  getRenderableEstimateDataForSmallButtonsFromGWEI,
} = proxyquire('../custom-gas', {})

describe('custom-gas selectors', () => {

  describe('getCustomGasPrice()', () => {
    it('should return gas.customData.price', () => {
      const mockState = { gas: { customData: { price: 'mockPrice' } } }
      assert.equal(getCustomGasPrice(mockState), 'mockPrice')
    })
  })

  describe('getCustomGasLimit()', () => {
    it('should return gas.customData.limit', () => {
      const mockState = { gas: { customData: { limit: 'mockLimit' } } }
      assert.equal(getCustomGasLimit(mockState), 'mockLimit')
    })
  })

  describe('getCustomGasTotal()', () => {
    it('should return gas.customData.total', () => {
      const mockState = { gas: { customData: { total: 'mockTotal' } } }
      assert.equal(getCustomGasTotal(mockState), 'mockTotal')
    })
  })

  describe('getCustomGasErrors()', () => {
    it('should return gas.errors', () => {
      const mockState = { gas: { errors: 'mockErrors' } }
      assert.equal(getCustomGasErrors(mockState), 'mockErrors')
    })
  })

  describe('getPriceAndTimeEstimates', () => {
    it('should return price and time estimates', () => {
      const mockState = { gas: { priceAndTimeEstimates: 'mockPriceAndTimeEstimates' } }
      assert.equal(getPriceAndTimeEstimates(mockState), 'mockPriceAndTimeEstimates')
    })
  })

  describe('getEstimatedGasPrices', () => {
    it('should return price and time estimates', () => {
      const mockState = { gas: { priceAndTimeEstimates: [
        { gasprice: 12, somethingElse: 20 },
        { gasprice: 22, expectedTime: 30 },
        { gasprice: 32, somethingElse: 40 },
      ] } }
      assert.deepEqual(getEstimatedGasPrices(mockState), [12, 22, 32])
    })
  })

  describe('getEstimatedGasTimes', () => {
    it('should return price and time estimates', () => {
      const mockState = { gas: { priceAndTimeEstimates: [
        { somethingElse: 12, expectedTime: 20 },
        { gasPrice: 22, expectedTime: 30 },
        { somethingElse: 32, expectedTime: 40 },
      ] } }
      assert.deepEqual(getEstimatedGasTimes(mockState), [20, 30, 40])
    })
  })

  describe('getRenderableBasicEstimateData()', () => {
    const tests = [
      {
        expectedResult: [
          {
            labelKey: 'slow',
            feeInPrimaryCurrency: '$0.01',
            feeInSecondaryCurrency: '0.0000525 ETH',
            timeEstimate: '~6 min 36 sec',
            priceInHexWei: '0x9502f900',
          },
          {
            labelKey: 'average',
            feeInPrimaryCurrency: '$0.03',
            feeInSecondaryCurrency: '0.000105 ETH',
            timeEstimate: '~3 min 18 sec',
            priceInHexWei: '0x12a05f200',
          },
          {
            labelKey: 'fast',
            feeInPrimaryCurrency: '$0.05',
            feeInSecondaryCurrency: '0.00021 ETH',
            timeEstimate: '~30 sec',
            priceInHexWei: '0x2540be400',
          },
        ],
        mockState: {
          metamask: {
            conversionRate: 255.71,
            currentCurrency: 'usd',
          },
          gas: {
            basicEstimates: {
              blockTime: 14.16326530612245,
              safeLow: 2.5,
              safeLowWait: 6.6,
              fast: 5,
              fastWait: 3.3,
              fastest: 10,
              fastestWait: 0.5,
            },
          },
        },
      },
      {
        expectedResult: [
          {
            labelKey: 'slow',
            feeInPrimaryCurrency: '$0.27',
            feeInSecondaryCurrency: '0.000105 ETH',
            timeEstimate: '~13 min 12 sec',
            priceInHexWei: '0x12a05f200',
          },
          {
            labelKey: 'average',
            feeInPrimaryCurrency: '$0.54',
            feeInSecondaryCurrency: '0.00021 ETH',
            timeEstimate: '~6 min 36 sec',
            priceInHexWei: '0x2540be400',
          },
          {
            labelKey: 'fast',
            feeInPrimaryCurrency: '$1.07',
            feeInSecondaryCurrency: '0.00042 ETH',
            timeEstimate: '~1 min',
            priceInHexWei: '0x4a817c800',
          },
        ],
        mockState: {
          metamask: {
            conversionRate: 2557.1,
            currentCurrency: 'usd',
            send: {
              gasLimit: '0x5208',
            },
          },
          gas: {
            basicEstimates: {
              blockTime: 14.16326530612245,
              safeLow: 5,
              safeLowWait: 13.2,
              fast: 10,
              fastWait: 6.6,
              fastest: 20,
              fastestWait: 1.0,
            },
          },
        },
      },
    ]
    it('should return renderable data about basic estimates', () => {
      tests.forEach(test => {
        assert.deepEqual(
          getRenderableBasicEstimateData(test.mockState, '0x5208'),
          test.expectedResult
        )
      })
    })

  })

  describe('getRenderableEstimateDataForSmallButtonsFromGWEI()', () => {
    const tests = [
      {
        expectedResult: [
          {
            feeInSecondaryCurrency: '$0.13',
            feeInPrimaryCurrency: '0.00052 ETH',
            labelKey: 'slow',
            priceInHexWei: '0x5d21dba00',
          },
          {
            feeInSecondaryCurrency: '$0.27',
            feeInPrimaryCurrency: '0.00105 ETH',
            labelKey: 'average',
            priceInHexWei: '0xba43b7400',
          },
          {
            feeInSecondaryCurrency: '$0.54',
            feeInPrimaryCurrency: '0.0021 ETH',
            labelKey: 'fast',
            priceInHexWei: '0x174876e800',
          },
        ],
        mockState: {
          metamask: {
            conversionRate: 255.71,
            currentCurrency: 'usd',
            send: {
              gasLimit: '0x5208',
            },
            preferences: {
              showFiatInTestnets: false,
            },
            provider: {
              type: 'mainnet',
            },
          },
          gas: {
            basicEstimates: {
              blockTime: 14.16326530612245,
              safeLow: 25,
              safeLowWait: 6.6,
              fast: 50,
              fastWait: 3.3,
              fastest: 100,
              fastestWait: 0.5,
            },
          },
        },
      },
      {
        expectedResult: [
          {
            feeInSecondaryCurrency: '$2.68',
            feeInPrimaryCurrency: '0.00105 ETH',
            labelKey: 'slow',
            priceInHexWei: '0xba43b7400',
          },
          {
            feeInSecondaryCurrency: '$5.37',
            feeInPrimaryCurrency: '0.0021 ETH',
            labelKey: 'average',
            priceInHexWei: '0x174876e800',
          },
          {
            feeInSecondaryCurrency: '$10.74',
            feeInPrimaryCurrency: '0.0042 ETH',
            labelKey: 'fast',
            priceInHexWei: '0x2e90edd000',
          },
        ],
        mockState: {
          metamask: {
            conversionRate: 2557.1,
            currentCurrency: 'usd',
            send: {
              gasLimit: '0x5208',
            },
            preferences: {
              showFiatInTestnets: false,
            },
            provider: {
              type: 'mainnet',
            },
          },
          gas: {
            basicEstimates: {
              blockTime: 14.16326530612245,
              safeLow: 50,
              safeLowWait: 13.2,
              fast: 100,
              fastWait: 6.6,
              fastest: 200,
              fastestWait: 1.0,
            },
          },
        },
      },
      {
        expectedResult: [
          {
            feeInSecondaryCurrency: '',
            feeInPrimaryCurrency: '0.00105 ETH',
            labelKey: 'slow',
            priceInHexWei: '0xba43b7400',
          },
          {
            feeInSecondaryCurrency: '',
            feeInPrimaryCurrency: '0.0021 ETH',
            labelKey: 'average',
            priceInHexWei: '0x174876e800',
          },
          {
            feeInSecondaryCurrency: '',
            feeInPrimaryCurrency: '0.0042 ETH',
            labelKey: 'fast',
            priceInHexWei: '0x2e90edd000',
          },
        ],
        mockState: {
          metamask: {
            conversionRate: 2557.1,
            currentCurrency: 'usd',
            send: {
              gasLimit: '0x5208',
            },
            preferences: {
              showFiatInTestnets: false,
            },
            provider: {
              type: 'rinkeby',
            },
          },
          gas: {
            basicEstimates: {
              blockTime: 14.16326530612245,
              safeLow: 50,
              safeLowWait: 13.2,
              fast: 100,
              fastWait: 6.6,
              fastest: 200,
              fastestWait: 1.0,
            },
          },
        },
      },
      {
        expectedResult: [
          {
            feeInSecondaryCurrency: '$2.68',
            feeInPrimaryCurrency: '0.00105 ETH',
            labelKey: 'slow',
            priceInHexWei: '0xba43b7400',
          },
          {
            feeInSecondaryCurrency: '$5.37',
            feeInPrimaryCurrency: '0.0021 ETH',
            labelKey: 'average',
            priceInHexWei: '0x174876e800',
          },
          {
            feeInSecondaryCurrency: '$10.74',
            feeInPrimaryCurrency: '0.0042 ETH',
            labelKey: 'fast',
            priceInHexWei: '0x2e90edd000',
          },
        ],
        mockState: {
          metamask: {
            conversionRate: 2557.1,
            currentCurrency: 'usd',
            send: {
              gasLimit: '0x5208',
            },
            preferences: {
              showFiatInTestnets: true,
            },
            provider: {
              type: 'rinkeby',
            },
          },
          gas: {
            basicEstimates: {
              blockTime: 14.16326530612245,
              safeLow: 50,
              safeLowWait: 13.2,
              fast: 100,
              fastWait: 6.6,
              fastest: 200,
              fastestWait: 1.0,
            },
          },
        },
      },
      {
        expectedResult: [
          {
            feeInSecondaryCurrency: '$2.68',
            feeInPrimaryCurrency: '0.00105 ETH',
            labelKey: 'slow',
            priceInHexWei: '0xba43b7400',
          },
          {
            feeInSecondaryCurrency: '$5.37',
            feeInPrimaryCurrency: '0.0021 ETH',
            labelKey: 'average',
            priceInHexWei: '0x174876e800',
          },
          {
            feeInSecondaryCurrency: '$10.74',
            feeInPrimaryCurrency: '0.0042 ETH',
            labelKey: 'fast',
            priceInHexWei: '0x2e90edd000',
          },
        ],
        mockState: {
          metamask: {
            conversionRate: 2557.1,
            currentCurrency: 'usd',
            send: {
              gasLimit: '0x5208',
            },
            preferences: {
              showFiatInTestnets: true,
            },
            provider: {
              type: 'mainnet',
            },
          },
          gas: {
            basicEstimates: {
              blockTime: 14.16326530612245,
              safeLow: 50,
              safeLowWait: 13.2,
              fast: 100,
              fastWait: 6.6,
              fastest: 200,
              fastestWait: 1.0,
            },
          },
        },
      },
    ]
    it('should return renderable data about basic estimates appropriate for buttons with less info', () => {
      tests.forEach(test => {
        assert.deepEqual(
          getRenderableEstimateDataForSmallButtonsFromGWEI(test.mockState),
          test.expectedResult
        )
      })
    })

  })

})
