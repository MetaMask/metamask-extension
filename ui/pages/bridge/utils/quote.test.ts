import { BigNumber } from 'bignumber.js';
import { zeroAddress } from 'ethereumjs-util';
import {
  calcAdjustedReturn,
  calcSentAmount,
  calcSwapRate,
  calcToAmount,
  calcEstimatedAndMaxTotalGasFee,
  calcRelayerFee,
  formatEtaInMinutes,
} from './quote';

const ERC20_TOKEN = {
  decimals: 6,
  address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'.toLowerCase(),
};
const NATIVE_TOKEN = { decimals: 18, address: zeroAddress() };

describe('Bridge quote utils', () => {
  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    [
      'native',
      NATIVE_TOKEN,
      '1009000000000000000',
      2521.73,
      { amount: '1.009', valueInCurrency: '2544.42557' },
    ],
    [
      'erc20',
      ERC20_TOKEN,
      '2543140000',
      0.999781,
      { amount: '2543.14', valueInCurrency: '2542.58305234' },
    ],
    [
      'erc20 with null exchange rates',
      ERC20_TOKEN,
      '2543140000',
      null,
      { amount: '2543.14', valueInCurrency: undefined },
    ],
  ])(
    'calcToAmount: toToken is %s',
    (
      _: string,
      destAsset: { decimals: number; address: string },
      destTokenAmount: string,
      toTokenExchangeRate: number,
      { amount, valueInCurrency }: { amount: string; valueInCurrency: string },
    ) => {
      const result = calcToAmount(
        {
          destAsset,
          destTokenAmount,
        } as never,
        toTokenExchangeRate,
      );
      expect(result.amount?.toString()).toStrictEqual(amount);
      expect(result.valueInCurrency?.toString()).toStrictEqual(valueInCurrency);
    },
  );

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    [
      'native',
      NATIVE_TOKEN,
      '1009000000000000000',
      2515.02,
      {
        amount: '1.143217728',
        valueInCurrency: '2875.21545027456',
      },
    ],
    [
      'erc20',
      ERC20_TOKEN,
      '100000000',
      0.999781,
      { amount: '100.512', valueInCurrency: '100.489987872' },
    ],
    [
      'erc20 with null exchange rates',
      ERC20_TOKEN,
      '2543140000',
      null,
      { amount: '2543.652', valueInCurrency: undefined },
    ],
  ])(
    'calcSentAmount: fromToken is %s',
    (
      _: string,
      srcAsset: { decimals: number; address: string },
      srcTokenAmount: string,
      fromTokenExchangeRate: number,
      { amount, valueInCurrency }: { amount: string; valueInCurrency: string },
    ) => {
      const result = calcSentAmount(
        {
          srcAsset,
          srcTokenAmount,
          feeData: {
            metabridge: {
              amount: Math.pow(8 * 10, srcAsset.decimals / 2),
            },
          },
        } as never,
        fromTokenExchangeRate,
      );
      expect(result.amount?.toString()).toStrictEqual(amount);
      expect(result.valueInCurrency?.toString()).toStrictEqual(valueInCurrency);
    },
  );

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    [
      'native',
      NATIVE_TOKEN,
      '1000000000000000000',
      '0x0de0b6b3a7640000',
      { amount: '2.2351800712e-7', valueInCurrency: '0.0005626887014840304' },
      undefined,
    ],
    [
      'erc20',
      ERC20_TOKEN,
      '100000000',
      '0x00',
      { amount: '2.2351800712e-7', valueInCurrency: '0.0005626887014840304' },
      undefined,
    ],
    [
      'erc20 with approval',
      ERC20_TOKEN,
      '100000000',
      '0x00',
      { amount: '4.4703601424e-7', valueInCurrency: '0.0011253774029680608' },
      1092677,
    ],
    [
      'erc20 with relayer fee',
      ERC20_TOKEN,
      '100000000',
      '0x0de0b6b3a7640000',
      {
        amount: '1.00000022351800712',
        valueInCurrency: '2517.4205626887014840304',
      },
      undefined,
    ],
    [
      'native with relayer fee',
      NATIVE_TOKEN,
      '1000000000000000000',
      '0x0de1b6b3a7640000',
      {
        amount: '0.000281698494717776',
        valueInCurrency: '0.70915342457242365792',
      },
      undefined,
    ],
  ])(
    'calcTotalGasFee and calcRelayerFee: fromToken is %s',
    (
      _: string,
      srcAsset: { decimals: number; address: string },
      srcTokenAmount: string,
      value: string,
      { amount, valueInCurrency }: { amount: string; valueInCurrency: string },
      approvalGasLimit?: number,
    ) => {
      const feeData = { metabridge: { amount: 0 } };
      const quote = {
        trade: { value, gasLimit: 1092677 },
        approval: approvalGasLimit ? { gasLimit: approvalGasLimit } : undefined,
        quote: { srcAsset, srcTokenAmount, feeData },
      } as never;
      const gasFee = calcEstimatedAndMaxTotalGasFee(
        quote,
        '0.00010456',
        '0.0001',
        2517.42,
      );
      const relayerFee = calcRelayerFee(quote, 2517.42);
      const result = {
        amount: gasFee.amount.plus(relayerFee.amount),
        valueInCurrency:
          gasFee.valueInCurrency?.plus(relayerFee.valueInCurrency || '0') ??
          null,
      };
      expect(result.amount?.toString()).toStrictEqual(amount);
      expect(result.valueInCurrency?.toString()).toStrictEqual(valueInCurrency);
    },
  );

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    [
      'native',
      NATIVE_TOKEN,
      '1000000000000000000',
      '0x0de0b6b3a7640000',
      {
        amount: '0.000002832228395508',
        valueInCurrency: '0.00712990840741974936',
      },
      undefined,
    ],
    [
      'erc20',
      ERC20_TOKEN,
      '100000000',
      '0x00',
      {
        amount: '0.000002832228395508',
        valueInCurrency: '0.00712990840741974936',
      },
      undefined,
    ],
    [
      'erc20 with approval',
      ERC20_TOKEN,
      '100000000',
      '0x00',
      {
        amount: '0.000003055746402628',
        valueInCurrency: '0.00769259710890377976',
      },
      1092677,
    ],
    [
      'erc20 with relayer fee',
      ERC20_TOKEN,
      '100000000',
      '0x0de0b6b3a7640000',
      {
        amount: '1.000002832228395508',
        valueInCurrency: '2517.42712990840741974936',
      },
      undefined,
    ],
    [
      'native with relayer fee',
      NATIVE_TOKEN,
      '1000000000000000000',
      '0x0de1b6b3a7640000',
      {
        amount: '0.000284307205106164',
        valueInCurrency: '0.71572064427835937688',
      },
      undefined,
    ],
  ])(
    'calcTotalGasFee and calcRelayerFee: fromToken is %s with l1GasFee',
    (
      _: string,
      srcAsset: { decimals: number; address: string },
      srcTokenAmount: string,
      value: string,
      { amount, valueInCurrency }: { amount: string; valueInCurrency: string },
      approvalGasLimit?: number,
    ) => {
      const feeData = { metabridge: { amount: 0 } };
      const quote = {
        trade: { value, gasLimit: 1092677 },
        approval: approvalGasLimit ? { gasLimit: approvalGasLimit } : undefined,
        quote: { srcAsset, srcTokenAmount, feeData },
        l1GasFeesInHexWei: '0x25F63418AA4',
      } as never;
      const gasFee = calcEstimatedAndMaxTotalGasFee(
        quote,
        '0.00010456',
        '0.0001',
        2517.42,
      );
      const relayerFee = calcRelayerFee(quote, 2517.42);
      const result = {
        amount: gasFee.amount.plus(relayerFee.amount),
        valueInCurrency:
          gasFee.valueInCurrency?.plus(relayerFee.valueInCurrency || '0') ??
          null,
      };
      expect(result.amount?.toString()).toStrictEqual(amount);
      expect(result.valueInCurrency?.toString()).toStrictEqual(valueInCurrency);
    },
  );

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    [
      'available',
      new BigNumber('100'),
      new BigNumber('5'),
      new BigNumber('95'),
    ],
    ['unavailable', null, null, null],
  ])(
    'calcAdjustedReturn: valueInCurrency amounts are %s',
    (
      _: string,
      destTokenAmountInCurrency: BigNumber,
      totalNetworkFeeInCurrency: BigNumber,
      valueInCurrency: string,
    ) => {
      const result = calcAdjustedReturn(
        destTokenAmountInCurrency,
        totalNetworkFeeInCurrency,
      );
      expect(result.valueInCurrency).toStrictEqual(valueInCurrency);
    },
  );

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    ['< 1', new BigNumber('100'), new BigNumber('5'), new BigNumber('0.05')],
    ['>= 1', new BigNumber('1'), new BigNumber('2000'), new BigNumber('2000')],
    ['0', new BigNumber('1'), new BigNumber('0'), new BigNumber('0')],
  ])(
    'calcSwapRate: %s rate',
    (
      _: string,
      sentAmount: BigNumber,
      destTokenAmount: BigNumber,
      rate: string,
    ) => {
      const result = calcSwapRate(sentAmount, destTokenAmount);
      expect(result).toStrictEqual(rate);
    },
  );

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    ['exact', 120, '2'],
    ['rounded down', 2000, '33'],
  ])(
    'formatEtaInMinutes: %s conversion',
    (_: string, estimatedProcessingTimeInSeconds: number, minutes: string) => {
      const result = formatEtaInMinutes(estimatedProcessingTimeInSeconds);
      expect(result).toStrictEqual(minutes);
    },
  );
});
