import { NetworkController } from '@metamask/network-controller';
import {
  JsonRpcParams,
  JsonRpcRequestStruct,
  JsonRpcResponseStruct,
} from '@metamask/utils';
import { FIRST_PARTY_CONTRACT_NAMES } from '../../../../shared/constants/first-party-contracts';
import {
  BridgeTxParams,
  createTxVerificationMiddleware,
} from './tx-verification-middleware';

const getMockNetworkController = (chainId: `0x${string}` = '0x1') => {
  const state = { providerConfig: { chainId } };
  const setChainId = (newchainId: `0x${string}`) => {
    state.providerConfig.chainId = newchainId;
  };

  return { state, setChainId } as unknown as NetworkController & {
    setChainId: typeof setChainId;
  };
};

const getMiddlewareParams = (method: string, params: JsonRpcParams = []) => {
  const req = { ...JsonRpcRequestStruct, method, params };
  const res = { ...JsonRpcResponseStruct };
  const next = jest.fn();
  const end = jest.fn();
  return { req, res, next, end };
};

const getBridgeTxParams = (
  txParams: Partial<BridgeTxParams> = {},
): BridgeTxParams => {
  return {
    chainId: '0x1',
    data: '0x1',
    from: '0x1',
    to: '0x1',
    value: '0x1',
    ...txParams,
  };
};

describe('tx verification middleware', () => {
  it('ignores methods other than eth_sendTransaction', () => {
    const middleware = createTxVerificationMiddleware(
      getMockNetworkController(),
    );
    const { req, res, next, end } = getMiddlewareParams('foo');
    middleware(req, res, next, end);

    expect(next).toHaveBeenCalledTimes(1);
    expect(end).not.toHaveBeenCalled();
  });

  // @ts-expect-error Our test types are broken
  it.each([
    ['null', null],
    ['string', 'foo'],
    ['plain object', {}],
    ['empty array', []],
    ['array with non-object', ['foo']],
    ['non-string "data"', [{ data: 1 }]],
    ['non-string "from"', [{ data: 'data', from: 1 }]],
    ['non-string "to"', [{ data: 'data', from: 'from', to: 1 }]],
    [
      'non-string "value"',
      [{ data: 'data', from: 'from', to: 'to', value: 1 }],
    ],
    [
      'non-string "chainId"',
      [{ data: 'data', from: 'from', to: 'to', value: 'value', chainId: 1 }],
    ],
    [
      'non-"0x"-prefixed "chainId"',
      [{ data: 'data', from: 'from', to: 'to', value: 'value', chainId: '1' }],
    ],
  ])(
    'ignores invalid params: %s',
    (_: string, invalidParams: JsonRpcParams) => {
      const middleware = createTxVerificationMiddleware(
        getMockNetworkController(),
      );

      const { req, res, next, end } = getMiddlewareParams(
        'eth_sendTransaction',
        invalidParams,
      );
      middleware(req, res, next, end);

      expect(next).toHaveBeenCalledTimes(1);
      expect(end).not.toHaveBeenCalled();
    },
  );

  // @ts-expect-error Our test types are broken
  it.each(Object.keys(FIRST_PARTY_CONTRACT_NAMES['MetaMask Bridge']))(
    'ignores transactions that are not addressed to the bridge contract for chain %s',
    (chainId: `0x${string}`) => {
      const middleware = createTxVerificationMiddleware(
        getMockNetworkController(),
      );

      const { req, res, next, end } = getMiddlewareParams(
        'eth_sendTransaction',
        getBridgeTxParams({ chainId, to: '0x1' }),
      );
      middleware(req, res, next, end);

      expect(next).toHaveBeenCalledTimes(1);
      expect(end).not.toHaveBeenCalled();
    },
  );
});
