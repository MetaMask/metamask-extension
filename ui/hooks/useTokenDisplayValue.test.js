import { renderHook } from '@testing-library/react-hooks';
import sinon from 'sinon';
import * as tokenUtil from '../helpers/utils/token-util';
import * as txUtil from '../helpers/utils/transactions.util';
import { useTokenDisplayValue } from './useTokenDisplayValue';

const tests = [
  {
    token: {
      symbol: 'DAI',
      decimals: 18,
    },
    tokenData: {
      args: 'decoded-params1',
    },
    tokenValue: '1000000000000000000',
    displayValue: '1',
  },
  {
    token: {
      symbol: 'DAI',
      decimals: 18,
    },
    tokenData: {
      args: 'decoded-params2',
    },
    tokenValue: '10000000000000000000',
    displayValue: '10',
  },
  {
    token: {
      symbol: 'DAI',
      decimals: 18,
    },
    tokenData: {
      args: 'decoded-params3',
    },
    tokenValue: '1500000000000000000',
    displayValue: '1.5',
  },
  {
    token: {
      symbol: 'DAI',
      decimals: 18,
    },
    tokenData: {
      args: 'decoded-params4',
    },
    tokenValue: '1756000000000000000',
    displayValue: '1.756',
  },
  {
    token: {
      symbol: 'DAI',
      decimals: 18,
    },
    tokenData: {
      args: 'decoded-params5',
    },
    tokenValue: '25500000000000000000',
    displayValue: '25.5',
  },
  {
    token: {
      symbol: 'USDC',
      decimals: 6,
    },
    tokenData: {
      args: 'decoded-params6',
    },
    tokenValue: '1000000',
    displayValue: '1',
  },
  {
    token: {
      symbol: 'USDC',
      decimals: 6,
    },
    tokenData: {
      args: 'decoded-params7',
    },
    tokenValue: '10000000',
    displayValue: '10',
  },
  {
    token: {
      symbol: 'USDC',
      decimals: 6,
    },
    tokenData: {
      args: 'decoded-params8',
    },
    tokenValue: '1500000',
    displayValue: '1.5',
  },
  {
    token: {
      symbol: 'USDC',
      decimals: 6,
    },
    tokenData: {
      args: 'decoded-params9',
    },
    tokenValue: '1756000',
    displayValue: '1.756',
  },
  {
    token: {
      symbol: 'USDC',
      decimals: 6,
    },
    tokenData: {
      args: 'decoded-params10',
    },
    tokenValue: '25500000',
    displayValue: '25.5',
  },
];

describe('useTokenDisplayValue', () => {
  tests.forEach((test, idx) => {
    describe(`when input is decimals: ${test.token.decimals} and value: ${test.tokenValue}`, () => {
      it(`should return ${test.displayValue} as displayValue`, () => {
        const getTokenValueStub = sinon.stub(tokenUtil, 'getTokenValueParam');
        const getTokenDataStub = sinon.stub(txUtil, 'getTokenData');

        getTokenDataStub.callsFake(() => test.tokenData);
        getTokenValueStub.callsFake(() => test.tokenValue);

        const { result } = renderHook(() =>
          useTokenDisplayValue(`${idx}-fakestring`, test.token),
        );
        sinon.restore();
        expect(result.current).toStrictEqual(test.displayValue);
      });
    });
  });
});
