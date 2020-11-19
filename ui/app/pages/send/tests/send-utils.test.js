import assert from 'assert'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import {
  BASE_TOKEN_GAS_COST,
  SIMPLE_GAS_COST,
  INSUFFICIENT_FUNDS_ERROR,
  INSUFFICIENT_TOKENS_ERROR,
} from '../send.constants'

const stubs = {
  addCurrencies: sinon.stub().callsFake((a, b) => {
    let [a1, b1] = [a, b]
    if (String(a).match(/^0x.+/u)) {
      a1 = Number(String(a).slice(2))
    }
    if (String(b).match(/^0x.+/u)) {
      b1 = Number(String(b).slice(2))
    }
    return a1 + b1
  }),
  conversionUtil: sinon.stub().callsFake((val) => parseInt(val, 16)),
  conversionGTE: sinon
    .stub()
    .callsFake((obj1, obj2) => obj1.value >= obj2.value),
  multiplyCurrencies: sinon.stub().callsFake((a, b) => `${a}x${b}`),
  calcTokenAmount: sinon.stub().callsFake((a, d) => `calc:${a}${d}`),
  rawEncode: sinon.stub().returns([16, 1100]),
  conversionGreaterThan: sinon
    .stub()
    .callsFake((obj1, obj2) => obj1.value > obj2.value),
  conversionLessThan: sinon
    .stub()
    .callsFake((obj1, obj2) => obj1.value < obj2.value),
}

const sendUtils = proxyquire('../send.utils.js', {
  '../../helpers/utils/conversion-util': {
    addCurrencies: stubs.addCurrencies,
    conversionUtil: stubs.conversionUtil,
    conversionGTE: stubs.conversionGTE,
    multiplyCurrencies: stubs.multiplyCurrencies,
    conversionGreaterThan: stubs.conversionGreaterThan,
    conversionLessThan: stubs.conversionLessThan,
  },
  '../../helpers/utils/token-util': { calcTokenAmount: stubs.calcTokenAmount },
  'ethereumjs-abi': {
    rawEncode: stubs.rawEncode,
  },
})

const {
  calcGasTotal,
  estimateGasForSend,
  doesAmountErrorRequireUpdate,
  generateTokenTransferData,
  getAmountErrorObject,
  getGasFeeErrorObject,
  getToAddressForGasUpdate,
  calcTokenBalance,
  isBalanceSufficient,
  isTokenBalanceSufficient,
  removeLeadingZeroes,
} = sendUtils

describe('send utils', function () {
  describe('calcGasTotal()', function () {
    it('should call multiplyCurrencies with the correct params and return the multiplyCurrencies return', function () {
      const result = calcGasTotal(12, 15)
      assert.equal(result, '12x15')
      const call_ = stubs.multiplyCurrencies.getCall(0).args
      assert.deepEqual(call_, [
        12,
        15,
        {
          toNumericBase: 'hex',
          multiplicandBase: 16,
          multiplierBase: 16,
        },
      ])
    })
  })

  describe('doesAmountErrorRequireUpdate()', function () {
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
        sendToken: { address: '0x0' },
        expectedResult: true,
      },
      'should return false if they are all the same': {
        balance: 1,
        prevBalance: 1,
        gasTotal: 1,
        prevGasTotal: 1,
        tokenBalance: 1,
        prevTokenBalance: 1,
        sendToken: { address: '0x0' },
        expectedResult: false,
      },
    }
    Object.entries(config).forEach(([description, obj]) => {
      it(description, function () {
        assert.equal(doesAmountErrorRequireUpdate(obj), obj.expectedResult)
      })
    })
  })

  describe('generateTokenTransferData()', function () {
    it('should return undefined if not passed a send token', function () {
      assert.equal(
        generateTokenTransferData({
          toAddress: 'mockAddress',
          amount: '0xa',
          sendToken: undefined,
        }),
        undefined,
      )
    })

    it('should call abi.rawEncode with the correct params', function () {
      stubs.rawEncode.resetHistory()
      generateTokenTransferData({
        toAddress: 'mockAddress',
        amount: 'ab',
        sendToken: { address: '0x0' },
      })
      assert.deepEqual(stubs.rawEncode.getCall(0).args, [
        ['address', 'uint256'],
        ['mockAddress', '0xab'],
      ])
    })

    it('should return encoded token transfer data', function () {
      assert.equal(
        generateTokenTransferData({
          toAddress: 'mockAddress',
          amount: '0xa',
          sendToken: { address: '0x0' },
        }),
        '0xa9059cbb104c',
      )
    })
  })

  describe('getAmountErrorObject()', function () {
    const config = {
      'should return insufficientFunds error if isBalanceSufficient returns false': {
        amount: 15,
        balance: 1,
        conversionRate: 3,
        gasTotal: 17,
        primaryCurrency: 'ABC',
        expectedResult: { amount: INSUFFICIENT_FUNDS_ERROR },
      },
      'should not return insufficientFunds error if sendToken is truthy': {
        amount: '0x0',
        balance: 1,
        conversionRate: 3,
        gasTotal: 17,
        primaryCurrency: 'ABC',
        sendToken: { address: '0x0', symbol: 'DEF', decimals: 0 },
        decimals: 0,
        tokenBalance: 'sometokenbalance',
        expectedResult: { amount: null },
      },
      'should return insufficientTokens error if token is selected and isTokenBalanceSufficient returns false': {
        amount: '0x10',
        balance: 100,
        conversionRate: 3,
        decimals: 10,
        gasTotal: 17,
        primaryCurrency: 'ABC',
        sendToken: { address: '0x0' },
        tokenBalance: 123,
        expectedResult: { amount: INSUFFICIENT_TOKENS_ERROR },
      },
    }
    Object.entries(config).forEach(([description, obj]) => {
      it(description, function () {
        assert.deepEqual(getAmountErrorObject(obj), obj.expectedResult)
      })
    })
  })

  describe('getGasFeeErrorObject()', function () {
    const config = {
      'should return insufficientFunds error if isBalanceSufficient returns false': {
        balance: 16,
        conversionRate: 3,
        gasTotal: 17,
        primaryCurrency: 'ABC',
        expectedResult: { gasFee: INSUFFICIENT_FUNDS_ERROR },
      },
      'should return null error if isBalanceSufficient returns true': {
        balance: 16,
        conversionRate: 3,
        gasTotal: 15,
        primaryCurrency: 'ABC',
        expectedResult: { gasFee: null },
      },
    }
    Object.entries(config).forEach(([description, obj]) => {
      it(description, function () {
        assert.deepEqual(getGasFeeErrorObject(obj), obj.expectedResult)
      })
    })
  })

  describe('calcTokenBalance()', function () {
    it('should return the calculated token balance', function () {
      assert.equal(
        calcTokenBalance({
          sendToken: {
            address: '0x0',
            decimals: 11,
          },
          usersToken: {
            balance: 20,
          },
        }),
        'calc:2011',
      )
    })
  })

  describe('isBalanceSufficient()', function () {
    it('should correctly call addCurrencies and return the result of calling conversionGTE', function () {
      stubs.conversionGTE.resetHistory()
      const result = isBalanceSufficient({
        amount: 15,
        balance: 100,
        conversionRate: 3,
        gasTotal: 17,
        primaryCurrency: 'ABC',
      })
      assert.deepEqual(stubs.addCurrencies.getCall(0).args, [
        15,
        17,
        {
          aBase: 16,
          bBase: 16,
          toNumericBase: 'hex',
        },
      ])
      assert.deepEqual(stubs.conversionGTE.getCall(0).args, [
        {
          value: 100,
          fromNumericBase: 'hex',
          fromCurrency: 'ABC',
          conversionRate: 3,
        },
        {
          value: 32,
          fromNumericBase: 'hex',
          conversionRate: 3,
          fromCurrency: 'ABC',
        },
      ])

      assert.equal(result, true)
    })
  })

  describe('isTokenBalanceSufficient()', function () {
    it('should correctly call conversionUtil and return the result of calling conversionGTE', function () {
      stubs.conversionGTE.resetHistory()
      stubs.conversionUtil.resetHistory()
      const result = isTokenBalanceSufficient({
        amount: '0x10',
        tokenBalance: 123,
        decimals: 10,
      })
      assert.deepEqual(stubs.conversionUtil.getCall(0).args, [
        '0x10',
        {
          fromNumericBase: 'hex',
        },
      ])
      assert.deepEqual(stubs.conversionGTE.getCall(0).args, [
        {
          value: 123,
          fromNumericBase: 'hex',
        },
        {
          value: 'calc:1610',
        },
      ])

      assert.equal(result, false)
    })
  })

  describe('estimateGasForSend', function () {
    const baseMockParams = {
      blockGasLimit: '0x64',
      selectedAddress: 'mockAddress',
      to: '0xisContract',
      estimateGasMethod: sinon.stub().callsFake(({ to }) => {
        if (typeof to === 'string' && to.match(/willFailBecauseOf:/u)) {
          throw new Error(to.match(/:(.+)$/u)[1])
        }
        return { toString: (n) => `0xabc${n}` }
      }),
    }
    const baseExpectedCall = {
      from: 'mockAddress',
      gas: '0x64x0.95',
      to: '0xisContract',
      value: '0xff',
    }

    beforeEach(function () {
      global.eth = {
        getCode: sinon
          .stub()
          .callsFake((address) =>
            Promise.resolve(address.match(/isContract/u) ? 'not-0x' : '0x'),
          ),
      }
    })

    afterEach(function () {
      baseMockParams.estimateGasMethod.resetHistory()
      global.eth.getCode.resetHistory()
    })

    it('should call ethQuery.estimateGasForSend with the expected params', async function () {
      const result = await estimateGasForSend(baseMockParams)
      assert.equal(baseMockParams.estimateGasMethod.callCount, 1)
      assert.deepEqual(baseMockParams.estimateGasMethod.getCall(0).args[0], {
        gasPrice: undefined,
        value: undefined,
        ...baseExpectedCall,
      })
      assert.equal(result, '0xabc16')
    })

    it('should call ethQuery.estimateGasForSend with the expected params when initialGasLimitHex is lower than the upperGasLimit', async function () {
      const result = await estimateGasForSend({
        ...baseMockParams,
        blockGasLimit: '0xbcd',
      })
      assert.equal(baseMockParams.estimateGasMethod.callCount, 1)
      assert.deepEqual(baseMockParams.estimateGasMethod.getCall(0).args[0], {
        gasPrice: undefined,
        value: undefined,
        ...baseExpectedCall,
        gas: '0xbcdx0.95',
      })
      assert.equal(result, '0xabc16x1.5')
    })

    it('should call ethQuery.estimateGasForSend with a value of 0x0 and the expected data and to if passed a sendToken', async function () {
      const result = await estimateGasForSend({
        data: 'mockData',
        sendToken: { address: 'mockAddress' },
        ...baseMockParams,
      })
      assert.equal(baseMockParams.estimateGasMethod.callCount, 1)
      assert.deepEqual(baseMockParams.estimateGasMethod.getCall(0).args[0], {
        ...baseExpectedCall,
        gasPrice: undefined,
        value: '0x0',
        data: '0xa9059cbb104c',
        to: 'mockAddress',
      })
      assert.equal(result, '0xabc16')
    })

    it('should call ethQuery.estimateGasForSend without a recipient if the recipient is empty and data passed', async function () {
      const data = 'mockData'
      const to = ''
      const result = await estimateGasForSend({ ...baseMockParams, data, to })
      assert.equal(baseMockParams.estimateGasMethod.callCount, 1)
      assert.deepEqual(baseMockParams.estimateGasMethod.getCall(0).args[0], {
        gasPrice: undefined,
        value: '0xff',
        data,
        from: baseExpectedCall.from,
        gas: baseExpectedCall.gas,
      })
      assert.equal(result, '0xabc16')
    })

    it(`should return ${SIMPLE_GAS_COST} if ethQuery.getCode does not return '0x'`, async function () {
      assert.equal(baseMockParams.estimateGasMethod.callCount, 0)
      const result = await estimateGasForSend({
        ...baseMockParams,
        to: '0x123',
      })
      assert.equal(result, SIMPLE_GAS_COST)
    })

    it(`should return ${SIMPLE_GAS_COST} if not passed a sendToken or truthy to address`, async function () {
      assert.equal(baseMockParams.estimateGasMethod.callCount, 0)
      const result = await estimateGasForSend({ ...baseMockParams, to: null })
      assert.equal(result, SIMPLE_GAS_COST)
    })

    it(`should not return ${SIMPLE_GAS_COST} if passed a sendToken`, async function () {
      assert.equal(baseMockParams.estimateGasMethod.callCount, 0)
      const result = await estimateGasForSend({
        ...baseMockParams,
        to: '0x123',
        sendToken: { address: '0x0' },
      })
      assert.notEqual(result, SIMPLE_GAS_COST)
    })

    it(`should return ${BASE_TOKEN_GAS_COST} if passed a sendToken but no to address`, async function () {
      const result = await estimateGasForSend({
        ...baseMockParams,
        to: null,
        sendToken: { address: '0x0' },
      })
      assert.equal(result, BASE_TOKEN_GAS_COST)
    })

    it(`should return the adjusted blockGasLimit if it fails with a 'Transaction execution error.'`, async function () {
      const result = await estimateGasForSend({
        ...baseMockParams,
        to: 'isContract willFailBecauseOf:Transaction execution error.',
      })
      assert.equal(result, '0x64x0.95')
    })

    it(`should return the adjusted blockGasLimit if it fails with a 'gas required exceeds allowance or always failing transaction.'`, async function () {
      const result = await estimateGasForSend({
        ...baseMockParams,
        to:
          'isContract willFailBecauseOf:gas required exceeds allowance or always failing transaction.',
      })
      assert.equal(result, '0x64x0.95')
    })

    it(`should reject other errors`, async function () {
      try {
        await estimateGasForSend({
          ...baseMockParams,
          to: 'isContract willFailBecauseOf:some other error',
        })
      } catch (err) {
        assert.equal(err.message, 'some other error')
      }
    })
  })

  describe('getToAddressForGasUpdate()', function () {
    it('should return empty string if all params are undefined or null', function () {
      assert.equal(getToAddressForGasUpdate(undefined, null), '')
    })

    it('should return the first string that is not defined or null in lower case', function () {
      assert.equal(getToAddressForGasUpdate('A', null), 'a')
      assert.equal(getToAddressForGasUpdate(undefined, 'B'), 'b')
    })
  })

  describe('removeLeadingZeroes()', function () {
    it('should remove leading zeroes from int when user types', function () {
      assert.equal(removeLeadingZeroes('0'), '0')
      assert.equal(removeLeadingZeroes('1'), '1')
      assert.equal(removeLeadingZeroes('00'), '0')
      assert.equal(removeLeadingZeroes('01'), '1')
    })

    it('should remove leading zeroes from int when user copy/paste', function () {
      assert.equal(removeLeadingZeroes('001'), '1')
    })

    it('should remove leading zeroes from float when user types', function () {
      assert.equal(removeLeadingZeroes('0.'), '0.')
      assert.equal(removeLeadingZeroes('0.0'), '0.0')
      assert.equal(removeLeadingZeroes('0.00'), '0.00')
      assert.equal(removeLeadingZeroes('0.001'), '0.001')
      assert.equal(removeLeadingZeroes('0.10'), '0.10')
    })

    it('should remove leading zeroes from float when user copy/paste', function () {
      assert.equal(removeLeadingZeroes('00.1'), '0.1')
    })
  })
})
