import { renderHook } from '@testing-library/react-hooks';
import * as reactRedux from 'react-redux';
import sinon from 'sinon';
import { getCurrentCurrency } from '../selectors';
import {
  getConversionRate,
  getNativeCurrency,
} from '../ducks/metamask/metamask';
import { useCurrencyDisplay } from './useCurrencyDisplay';

const tests = [
  {
    input: {
      value: '0x2386f26fc10000',
      numberOfDecimals: 2,
      currency: 'usd',
    },
    result: {
      value: '$2.80',
      suffix: 'USD',
      displayValue: '$2.80 USD',
    },
  },
  {
    input: {
      value: '0x2386f26fc10000',
      currency: 'usd',
    },
    result: {
      value: '$2.80',
      suffix: 'USD',
      displayValue: '$2.80 USD',
    },
  },
  {
    input: {
      value: '0x1193461d01595930',
      currency: 'ETH',
      numberOfDecimals: 3,
    },
    result: {
      value: '1.266',
      suffix: 'ETH',
      displayValue: '1.266 ETH',
    },
  },
  {
    input: {
      value: '0x1193461d01595930',
      currency: 'ETH',
      numberOfDecimals: 3,
      hideLabel: true,
    },
    result: {
      value: '1.266',
      suffix: undefined,
      displayValue: '1.266',
    },
  },
  {
    input: {
      value: '0x3b9aca00',
      currency: 'ETH',
      denomination: 'GWEI',
      hideLabel: true,
    },
    result: {
      value: '1',
      suffix: undefined,
      displayValue: '1',
    },
  },
  {
    input: {
      value: '0x3b9aca00',
      currency: 'ETH',
      denomination: 'WEI',
      hideLabel: true,
    },
    result: {
      value: '1000000000',
      suffix: undefined,
      displayValue: '1000000000',
    },
  },
  {
    input: {
      value: '0x3b9aca00',
      currency: 'ETH',
      numberOfDecimals: 100,
      hideLabel: true,
    },
    result: {
      value: '0.000000001',
      suffix: undefined,
      displayValue: '0.000000001',
    },
  },
];

describe('useCurrencyDisplay', () => {
  tests.forEach(({ input: { value, ...restProps }, result }) => {
    describe(`when input is { value: ${value}, decimals: ${restProps.numberOfDecimals}, denomation: ${restProps.denomination} }`, () => {
      const stub = sinon.stub(reactRedux, 'useSelector');
      stub.callsFake((selector) => {
        if (selector === getCurrentCurrency) {
          return 'usd';
        } else if (selector === getNativeCurrency) {
          return 'ETH';
        } else if (selector === getConversionRate) {
          return 280.45;
        }
        return undefined;
      });
      const hookReturn = renderHook(() => useCurrencyDisplay(value, restProps));
      const [displayValue, parts] = hookReturn.result.current;
      stub.restore();
      it(`should return ${result.displayValue} as displayValue`, () => {
        expect(displayValue).toStrictEqual(result.displayValue);
      });
      it(`should return ${result.value} as value`, () => {
        expect(parts.value).toStrictEqual(result.value);
      });
      it(`should return ${result.suffix} as suffix`, () => {
        expect(parts.suffix).toStrictEqual(result.suffix);
      });
    });
  });
});
