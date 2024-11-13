import { BigNumber } from 'bignumber.js';
import { zeroAddress } from 'ethereumjs-util';
import {
  calcAdjustedReturn,
  calcSentAmount,
  calcSwapRate,
  calcToAmount,
  calcTotalNetworkFee,
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
      { raw: '1.009', fiat: '2544.42557' },
    ],
    [
      'erc20',
      ERC20_TOKEN,
      '2543140000',
      0.999781,
      { raw: '2543.14', fiat: '2542.58305234' },
    ],
    [
      'erc20 with null exchange rates',
      ERC20_TOKEN,
      '2543140000',
      null,
      { raw: '2543.14', fiat: undefined },
    ],
  ])(
    'calcToAmount: toToken is %s',
    (
      _: string,
      destAsset: { decimals: number; address: string },
      destTokenAmount: string,
      toTokenExchangeRate: number,
      { raw, fiat }: { raw: string; fiat: string },
    ) => {
      const result = calcToAmount(
        {
          destAsset,
          destTokenAmount,
        } as never,
        toTokenExchangeRate,
      );
      expect(result.raw?.toString()).toStrictEqual(raw);
      expect(result.fiat?.toString()).toStrictEqual(fiat);
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
        raw: '1.143217728',
        fiat: '2875.21545027456',
      },
    ],
    [
      'erc20',
      ERC20_TOKEN,
      '100000000',
      0.999781,
      { raw: '100.512', fiat: '100.489987872' },
    ],
    [
      'erc20 with null exchange rates',
      ERC20_TOKEN,
      '2543140000',
      null,
      { raw: '2543.652', fiat: undefined },
    ],
  ])(
    'calcSentAmount: fromToken is %s',
    (
      _: string,
      srcAsset: { decimals: number; address: string },
      srcTokenAmount: string,
      fromTokenExchangeRate: number,
      { raw, fiat }: { raw: string; fiat: string },
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
      expect(result.raw?.toString()).toStrictEqual(raw);
      expect(result.fiat?.toString()).toStrictEqual(fiat);
    },
  );

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    [
      'native',
      NATIVE_TOKEN,
      '1000000000000000000',
      '0x0de0b6b3a7640000',
      { raw: '2.2351800712e-7', fiat: '0.0005626887014840304' },
      undefined,
    ],
    [
      'erc20',
      ERC20_TOKEN,
      '100000000',
      '0x00',
      { raw: '2.2351800712e-7', fiat: '0.0005626887014840304' },
      undefined,
    ],
    [
      'erc20 with approval',
      ERC20_TOKEN,
      '100000000',
      '0x00',
      { raw: '4.4703601424e-7', fiat: '0.0011253774029680608' },
      1092677,
    ],
    [
      'erc20 with relayer fee',
      ERC20_TOKEN,
      '100000000',
      '0x0de0b6b3a7640000',
      { raw: '1.00000022351800712', fiat: '2517.4205626887014840304' },
      undefined,
    ],
    [
      'native with relayer fee',
      NATIVE_TOKEN,
      '1000000000000000000',
      '0x0de1b6b3a7640000',
      { raw: '0.000281698494717776', fiat: '0.70915342457242365792' },
      undefined,
    ],
  ])(
    'calcTotalNetworkFee: fromToken is %s',
    (
      _: string,
      srcAsset: { decimals: number; address: string },
      srcTokenAmount: string,
      value: string,
      { raw, fiat }: { raw: string; fiat: string },
      approvalGasLimit?: number,
    ) => {
      const feeData = { metabridge: { amount: 0 } };
      const result = calcTotalNetworkFee(
        {
          trade: { value, gasLimit: 1092677 },
          approval: approvalGasLimit
            ? { gasLimit: approvalGasLimit }
            : undefined,
          quote: { srcAsset, srcTokenAmount, feeData },
        } as never,
        '0.00010456',
        '0.0001',
        2517.42,
      );
      expect(result.raw?.toString()).toStrictEqual(raw);
      expect(result.fiat?.toString()).toStrictEqual(fiat);
    },
  );

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    [
      'native',
      NATIVE_TOKEN,
      '1000000000000000000',
      '0x0de0b6b3a7640000',
      { raw: '0.000002832228395508', fiat: '0.00712990840741974936' },
      undefined,
    ],
    [
      'erc20',
      ERC20_TOKEN,
      '100000000',
      '0x00',
      { raw: '0.000002832228395508', fiat: '0.00712990840741974936' },
      undefined,
    ],
    [
      'erc20 with approval',
      ERC20_TOKEN,
      '100000000',
      '0x00',
      { raw: '0.000003055746402628', fiat: '0.00769259710890377976' },
      1092677,
    ],
    [
      'erc20 with relayer fee',
      ERC20_TOKEN,
      '100000000',
      '0x0de0b6b3a7640000',
      { raw: '1.000002832228395508', fiat: '2517.42712990840741974936' },
      undefined,
    ],
    [
      'native with relayer fee',
      NATIVE_TOKEN,
      '1000000000000000000',
      '0x0de1b6b3a7640000',
      { raw: '0.000284307205106164', fiat: '0.71572064427835937688' },
      undefined,
    ],
  ])(
    'calcTotalNetworkFee: fromToken is %s with l1GasFee',
    (
      _: string,
      srcAsset: { decimals: number; address: string },
      srcTokenAmount: string,
      value: string,
      { raw, fiat }: { raw: string; fiat: string },
      approvalGasLimit?: number,
    ) => {
      const feeData = { metabridge: { amount: 0 } };
      const result = calcTotalNetworkFee(
        {
          trade: { value, gasLimit: 1092677 },
          approval: approvalGasLimit
            ? { gasLimit: approvalGasLimit }
            : undefined,
          quote: { srcAsset, srcTokenAmount, feeData },
          l1GasFeesInHexWei: '0x25F63418AA4',
        } as never,
        '0.00010456',
        '0.0001',
        2517.42,
      );
      expect(result.raw?.toString()).toStrictEqual(raw);
      expect(result.fiat?.toString()).toStrictEqual(fiat);
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
    'calcAdjustedReturn: fiat amounts are %s',
    (
      _: string,
      destTokenAmountInFiat: BigNumber,
      totalNetworkFeeInFiat: BigNumber,
      fiat: string,
    ) => {
      const result = calcAdjustedReturn(
        destTokenAmountInFiat,
        totalNetworkFeeInFiat,
      );
      expect(result.fiat).toStrictEqual(fiat);
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
