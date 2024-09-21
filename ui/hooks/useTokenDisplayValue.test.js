import { renderHook } from '@testing-library/react-hooks';
import sinon from 'sinon';
import * as txUtil from '../../shared/modules/transaction.utils';
import * as metamaskControllerUtils from '../../shared/lib/metamask-controller-utils';
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
  {
    token: {
      symbol: 'MTK',
      decimals: 0,
    },
    tokenData: {
      args: 'decoded-params11',
    },
    tokenValue: '25',
    displayValue: '25',
  },
];

describe('useTokenDisplayValue', () => {
  tests.forEach(({ displayValue, token, tokenData, tokenValue }, idx) => {
    describe(`when input is decimals: ${token.decimals} and value: ${tokenValue}`, () => {
      it(`should return ${displayValue} as displayValue`, () => {
        const getTokenValueStub = sinon.stub(
          metamaskControllerUtils,
          'getTokenValueParam',
        );
        const parseStandardTokenTransactionDataStub = sinon.stub(
          txUtil,
          'parseStandardTokenTransactionData',
        );

        parseStandardTokenTransactionDataStub.callsFake(() => tokenData);
        getTokenValueStub.callsFake(() => tokenValue);

        const { result } = renderHook(() =>
          useTokenDisplayValue(`${idx}-fakestring`, token),
        );
        sinon.restore();
        expect(result.current).toStrictEqual(displayValue);
      });
    });
  });
});
