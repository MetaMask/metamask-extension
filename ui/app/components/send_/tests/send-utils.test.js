import assert from 'assert'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

const {
  INSUFFICIENT_FUNDS_ERROR,
  INSUFFICIENT_TOKENS_ERROR,
} = require('../send.constants')

const stubs = {
  addCurrencies: sinon.stub().callsFake((a, b, obj) => a + b),
  conversionUtil: sinon.stub().callsFake((val, obj) => parseInt(val, 16)),
  conversionGTE: sinon.stub().callsFake((obj1, obj2) => obj1.value > obj2.value),
  multiplyCurrencies: sinon.stub().callsFake((a, b) => a * b),
  calcTokenAmount: sinon.stub().callsFake((a, d) => 'calc:' + a + d),
  rawEncode: sinon.stub().returns([16, 1100]),
}

const sendUtils = proxyquire('../send.utils.js', {
  '../../conversion-util': {
    addCurrencies: stubs.addCurrencies,
    conversionUtil: stubs.conversionUtil,
    conversionGTE: stubs.conversionGTE,
    multiplyCurrencies: stubs.multiplyCurrencies,
  },
  '../../token-util': { calcTokenAmount: stubs.calcTokenAmount },
  'ethereumjs-abi': {
    rawEncode: stubs.rawEncode,
  },
})

const {
  calcGasTotal,
  doesAmountErrorRequireUpdate,
  generateTokenTransferData,
  getAmountErrorObject,
  getParamsForGasEstimate,
  calcTokenBalance,
  isBalanceSufficient,
  isTokenBalanceSufficient,
} = sendUtils

describe('send utils', () => {

  describe('calcGasTotal()', () => {
    it('should call multiplyCurrencies with the correct params and return the multiplyCurrencies return', () => {
      const result = calcGasTotal(12, 15)
      assert.equal(result, 180)
      const call_ = stubs.multiplyCurrencies.getCall(0).args
      assert.deepEqual(
        call_,
        [12, 15, {
          toNumericBase: 'hex',
           multiplicandBase: 16,
           multiplierBase: 16,
         } ]
      )
    })
  })

  describe('doesAmountErrorRequireUpdate()', () => {
    const config = {
      'should return true if balances are different': {
        balance: 0,
        prevBalance: 1,
        expectedResult: true,
      },
      'should return true if gasTotals are different': {
        gasTotal: 0,
        prevGasTotal: 1,
        expectedResult: true,
      },
      'should return true if token balances are different': {
        tokenBalance: 0,
        prevTokenBalance: 1,
        selectedToken: 'someToken',
        expectedResult: true,
      },
      'should return false if they are all the same': {
        balance: 1,
        prevBalance: 1,
        gasTotal: 1,
        prevGasTotal: 1,
        tokenBalance: 1,
        prevTokenBalance: 1,
        selectedToken: 'someToken',
        expectedResult: false,
      },
    }
    Object.entries(config).map(([description, obj]) => {
      it(description, () => {
        assert.equal(doesAmountErrorRequireUpdate(obj), obj.expectedResult)
      })
    })

  })

  describe('generateTokenTransferData()', () => {
    it('should return undefined if not passed a selected token', () => {
      assert.equal(generateTokenTransferData('mockAddress', false), undefined)
    })

    it('should return encoded token transfer data', () => {
      assert.equal(generateTokenTransferData('mockAddress', true), '104c')
    })
  })

  describe('getAmountErrorObject()', () => {
    const config = {
      'should return insufficientFunds error if isBalanceSufficient returns false': {
        amount: 15,
        amountConversionRate: 2,
        balance: 1,
        conversionRate: 3,
        gasTotal: 17,
        primaryCurrency: 'ABC',
        expectedResult: { amount: INSUFFICIENT_FUNDS_ERROR },
      },
      'should return insufficientTokens error if token is selected and isTokenBalanceSufficient returns false': {
        amount: '0x10',
        amountConversionRate: 2,
        balance: 100,
        conversionRate: 3,
        decimals: 10,
        gasTotal: 17,
        primaryCurrency: 'ABC',
        selectedToken: 'someToken',
        tokenBalance: 123,
        expectedResult: { amount: INSUFFICIENT_TOKENS_ERROR },
      },
    }
    Object.entries(config).map(([description, obj]) => {
      it(description, () => {
        assert.deepEqual(getAmountErrorObject(obj), obj.expectedResult)
      })
    })
  })

  describe('getParamsForGasEstimate()', () => {
    it('should return from and gas properties if no symbol or data', () => {
      assert.deepEqual(
        getParamsForGasEstimate('mockAddress'),
        {
          from: 'mockAddress',
          gas: '746a528800',
        }
      )
    })

    it('should return value property if symbol provided', () => {
      assert.deepEqual(
        getParamsForGasEstimate('mockAddress', 'ABC'),
        {
          from: 'mockAddress',
          gas: '746a528800',
          value: '0x0',
        }
      )
    })

    it('should return data property if data provided', () => {
      assert.deepEqual(
        getParamsForGasEstimate('mockAddress', 'ABC', 'somedata'),
        {
          from: 'mockAddress',
          gas: '746a528800',
          value: '0x0',
          data: 'somedata',
        }
      )
    })
  })

  describe('calcTokenBalance()', () => {
    it('should return the calculated token blance', () => {
      assert.equal(calcTokenBalance({
        selectedToken: {
          decimals: 11,
        },
        usersToken: {
          balance: 20,
        },
      }), 'calc:2011')
    })
  })

  describe('isBalanceSufficient()', () => {
    it('should correctly call addCurrencies and return the result of calling conversionGTE', () => {
      stubs.conversionGTE.resetHistory()
      const result = isBalanceSufficient({
        amount: 15,
        amountConversionRate: 2,
        balance: 100,
        conversionRate: 3,
        gasTotal: 17,
        primaryCurrency: 'ABC',
      })
      assert.deepEqual(
        stubs.addCurrencies.getCall(0).args,
        [
          15, 17, {
            aBase: 16,
            bBase: 16,
            toNumericBase: 'hex',
          },
        ]
      )
      assert.deepEqual(
        stubs.conversionGTE.getCall(0).args,
        [
          {
            value: 100,
            fromNumericBase: 'hex',
            fromCurrency: 'ABC',
            conversionRate: 3,
          },
          {
            value: 32,
            fromNumericBase: 'hex',
            conversionRate: 2,
            fromCurrency: 'ABC',
          },
        ]
      )

      assert.equal(result, true)
    })
  })

  describe('isTokenBalanceSufficient()', () => {
    it('should correctly call conversionUtil and return the result of calling conversionGTE', () => {
      stubs.conversionGTE.resetHistory()
      const result = isTokenBalanceSufficient({
        amount: '0x10',
        tokenBalance: 123,
        decimals: 10,
      })
      assert.deepEqual(
        stubs.conversionUtil.getCall(0).args,
        [
          '0x10', {
            fromNumericBase: 'hex',
          },
        ]
      )
      assert.deepEqual(
        stubs.conversionGTE.getCall(0).args,
        [
          {
            value: 123,
            fromNumericBase: 'dec',
          },
          {
            value: 'calc:1610',
            fromNumericBase: 'dec',
          },
        ]
      )

      assert.equal(result, false)
    })
  })

})
