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

describe('custom-gas selectors', function () {

  describe('getCustomGasPrice()', function () {
    it('should return gas.customData.price', function () {
      const mockState = { gas: { customData: { price: 'mockPrice' } } }
      assert.equal(getCustomGasPrice(mockState), 'mockPrice')
    })
  })

  describe('getCustomGasLimit()', function () {
    it('should return gas.customData.limit', function () {
      const mockState = { gas: { customData: { limit: 'mockLimit' } } }
      assert.equal(getCustomGasLimit(mockState), 'mockLimit')
    })
  })

  describe('getCustomGasTotal()', function () {
    it('should return gas.customData.total', function () {
      const mockState = { gas: { customData: { total: 'mockTotal' } } }
      assert.equal(getCustomGasTotal(mockState), 'mockTotal')
    })
  })

  describe('getCustomGasErrors()', function () {
    it('should return gas.errors', function () {
      const mockState = { gas: { errors: 'mockErrors' } }
      assert.equal(getCustomGasErrors(mockState), 'mockErrors')
    })
  })

  describe('getPriceAndTimeEstimates', function () {
    it('should return price and time estimates', function () {
      const mockState = { gas: { priceAndTimeEstimates: 'mockPriceAndTimeEstimates' } }
      assert.equal(getPriceAndTimeEstimates(mockState), 'mockPriceAndTimeEstimates')
    })
  })

  describe('getEstimatedGasPrices', function () {
    it('should return price and time estimates', function () {
      const mockState = {
        gas: {
          priceAndTimeEstimates: [
            { gasprice: 12, somethingElse: 20 },
            { gasprice: 22, expectedTime: 30 },
            { gasprice: 32, somethingElse: 40 },
          ],
        },
      }
      assert.deepEqual(getEstimatedGasPrices(mockState), [12, 22, 32])
    })
  })

  describe('getEstimatedGasTimes', function () {
    it('should return price and time estimates', function () {
      const mockState = {
        gas: {
          priceAndTimeEstimates: [
            { somethingElse: 12, expectedTime: 20 },
            { gasPrice: 22, expectedTime: 30 },
            { somethingElse: 32, expectedTime: 40 },
          ],
        },
      }
      assert.deepEqual(getEstimatedGasTimes(mockState), [20, 30, 40])
    })
  })

  describe('getRenderableBasicEstimateData()', function () {
    const tests = [
      {
        expectedResult: [
          {
            gasEstimateType: 'SLOW',
            feeInSecondaryCurrency: '$0.01',
            feeInPrimaryCurrency: '0.0000525 ETH',
            timeEstimate: '~6 min 36 sec',
            priceInHexWei: '0x9502f900',
          },
          {
            gasEstimateType: 'AVERAGE',
            feeInPrimaryCurrency: '0.000084 ETH',
            feeInSecondaryCurrency: '$0.02',
            priceInHexWei: '0xee6b2800',
            timeEstimate: '~5 min 18 sec',
          },
          {
            gasEstimateType: 'FAST',
            feeInSecondaryCurrency: '$0.03',
            feeInPrimaryCurrency: '0.000105 ETH',
            timeEstimate: '~3 min 18 sec',
            priceInHexWei: '0x12a05f200',
          },
        ],
        mockState: {
          metamask: {
            conversionRate: 255.71,
            currentCurrency: 'usd',
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
              safeLow: 2.5,
              safeLowWait: 6.6,
              average: 4,
              avgWait: 5.3,
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
            gasEstimateType: 'SLOW',
            feeInSecondaryCurrency: '$0.27',
            feeInPrimaryCurrency: '0.000105 ETH',
            timeEstimate: '~13 min 12 sec',
            priceInHexWei: '0x12a05f200',
          },
          {
            feeInPrimaryCurrency: '0.000147 ETH',
            feeInSecondaryCurrency: '$0.38',
            gasEstimateType: 'AVERAGE',
            priceInHexWei: '0x1a13b8600',
            timeEstimate: '~10 min 6 sec',
          },
          {
            gasEstimateType: 'FAST',
            feeInSecondaryCurrency: '$0.54',
            feeInPrimaryCurrency: '0.00021 ETH',
            timeEstimate: '~6 min 36 sec',
            priceInHexWei: '0x2540be400',
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
              safeLow: 5,
              safeLowWait: 13.2,
              average: 7,
              avgWait: 10.1,
              fast: 10,
              fastWait: 6.6,
              fastest: 20,
              fastestWait: 1.0,
            },
          },
        },
      },
      {
        expectedResult: [
          {
            gasEstimateType: 'SLOW',
            feeInSecondaryCurrency: '',
            feeInPrimaryCurrency: '0.000105 ETH',
            timeEstimate: '~13 min 12 sec',
            priceInHexWei: '0x12a05f200',
          },
          {
            gasEstimateType: 'AVERAGE',
            feeInPrimaryCurrency: '0.000147 ETH',
            feeInSecondaryCurrency: '',
            timeEstimate: '~10 min 6 sec',
            priceInHexWei: '0x1a13b8600',
          },
          {
            gasEstimateType: 'FAST',
            feeInSecondaryCurrency: '',
            feeInPrimaryCurrency: '0.00021 ETH',
            timeEstimate: '~6 min 36 sec',
            priceInHexWei: '0x2540be400',
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
              safeLow: 5,
              safeLowWait: 13.2,
              average: 7,
              avgWait: 10.1,
              fast: 10,
              fastWait: 6.6,
              fastest: 20,
              fastestWait: 1.0,
            },
          },
        },
      },
      {
        expectedResult: [
          {
            gasEstimateType: 'SLOW',
            feeInSecondaryCurrency: '$0.27',
            feeInPrimaryCurrency: '0.000105 ETH',
            timeEstimate: '~13 min 12 sec',
            priceInHexWei: '0x12a05f200',
          },
          {
            gasEstimateType: 'AVERAGE',
            feeInPrimaryCurrency: '0.000147 ETH',
            feeInSecondaryCurrency: '$0.38',
            priceInHexWei: '0x1a13b8600',
            timeEstimate: '~10 min 6 sec',
          },
          {
            gasEstimateType: 'FAST',
            feeInSecondaryCurrency: '$0.54',
            feeInPrimaryCurrency: '0.00021 ETH',
            timeEstimate: '~6 min 36 sec',
            priceInHexWei: '0x2540be400',
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
              safeLow: 5,
              safeLowWait: 13.2,
              average: 7,
              avgWait: 10.1,
              fast: 10,
              fastWait: 6.6,
              fastest: 20,
              fastestWait: 1.0,
            },
          },
        },
      },
      {
        expectedResult: [
          {
            gasEstimateType: 'SLOW',
            feeInSecondaryCurrency: '$0.27',
            feeInPrimaryCurrency: '0.000105 ETH',
            timeEstimate: '~13 min 12 sec',
            priceInHexWei: '0x12a05f200',
          },
          {
            gasEstimateType: 'AVERAGE',
            feeInPrimaryCurrency: '0.000147 ETH',
            feeInSecondaryCurrency: '$0.38',
            priceInHexWei: '0x1a13b8600',
            timeEstimate: '~10 min 6 sec',
          },
          {
            gasEstimateType: 'FAST',
            feeInSecondaryCurrency: '$0.54',
            feeInPrimaryCurrency: '0.00021 ETH',
            timeEstimate: '~6 min 36 sec',
            priceInHexWei: '0x2540be400',
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
              safeLow: 5,
              safeLowWait: 13.2,
              average: 7,
              avgWait: 10.1,
              fast: 10,
              fastWait: 6.6,
              fastest: 20,
              fastestWait: 1.0,
            },
          },
        },
      },
    ]
    it('should return renderable data about basic estimates', function () {
      tests.forEach((test) => {
        assert.deepEqual(
          getRenderableBasicEstimateData(test.mockState, '0x5208'),
          test.expectedResult,
        )
      })
    })

  })

  describe('getRenderableEstimateDataForSmallButtonsFromGWEI()', function () {
    const tests = [
      {
        expectedResult: [
          {
            feeInSecondaryCurrency: '$0.13',
            feeInPrimaryCurrency: '0.00052 ETH',
            gasEstimateType: 'SLOW',
            priceInHexWei: '0x5d21dba00',
          },
          {
            feeInSecondaryCurrency: '$0.16',
            feeInPrimaryCurrency: '0.00063 ETH',
            gasEstimateType: 'AVERAGE',
            priceInHexWei: '0x6fc23ac00',
          },
          {
            feeInSecondaryCurrency: '$0.27',
            feeInPrimaryCurrency: '0.00105 ETH',
            gasEstimateType: 'FAST',
            priceInHexWei: '0xba43b7400',
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
              average: 30,
              avgWait: 5.5,
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
            gasEstimateType: 'SLOW',
            priceInHexWei: '0xba43b7400',
          },
          {
            feeInSecondaryCurrency: '$4.03',
            feeInPrimaryCurrency: '0.00157 ETH',
            gasEstimateType: 'AVERAGE',
            priceInHexWei: '0x1176592e00',
          },
          {
            feeInSecondaryCurrency: '$5.37',
            feeInPrimaryCurrency: '0.0021 ETH',
            gasEstimateType: 'FAST',
            priceInHexWei: '0x174876e800',
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
              average: 75,
              avgWait: 9.6,
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
            gasEstimateType: 'SLOW',
            priceInHexWei: '0xba43b7400',
          },
          {
            feeInSecondaryCurrency: '',
            feeInPrimaryCurrency: '0.00157 ETH',
            gasEstimateType: 'AVERAGE',
            priceInHexWei: '0x1176592e00',
          },
          {
            feeInSecondaryCurrency: '',
            feeInPrimaryCurrency: '0.0021 ETH',
            gasEstimateType: 'FAST',
            priceInHexWei: '0x174876e800',
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
              average: 75,
              avgWait: 9.6,
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
            gasEstimateType: 'SLOW',
            priceInHexWei: '0xba43b7400',
          },
          {
            feeInSecondaryCurrency: '$4.03',
            feeInPrimaryCurrency: '0.00157 ETH',
            gasEstimateType: 'AVERAGE',
            priceInHexWei: '0x1176592e00',
          },
          {
            feeInSecondaryCurrency: '$5.37',
            feeInPrimaryCurrency: '0.0021 ETH',
            gasEstimateType: 'FAST',
            priceInHexWei: '0x174876e800',
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
              average: 75,
              avgWait: 9.6,
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
            gasEstimateType: 'SLOW',
            priceInHexWei: '0xba43b7400',
          },
          {
            feeInSecondaryCurrency: '$4.03',
            feeInPrimaryCurrency: '0.00157 ETH',
            gasEstimateType: 'AVERAGE',
            priceInHexWei: '0x1176592e00',
          },
          {
            feeInSecondaryCurrency: '$5.37',
            feeInPrimaryCurrency: '0.0021 ETH',
            gasEstimateType: 'FAST',
            priceInHexWei: '0x174876e800',
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
              average: 75,
              avgWait: 9.6,
              fast: 100,
              fastWait: 6.6,
              fastest: 200,
              fastestWait: 1.0,
            },
          },
        },
      },
    ]
    it('should return renderable data about basic estimates appropriate for buttons with less info', function () {
      tests.forEach((test) => {
        assert.deepEqual(
          getRenderableEstimateDataForSmallButtonsFromGWEI(test.mockState),
          test.expectedResult,
        )
      })
    })

  })

})
