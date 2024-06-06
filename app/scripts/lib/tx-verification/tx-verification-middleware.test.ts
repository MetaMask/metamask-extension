import { NetworkController } from '@metamask/network-controller';
import { JsonRpcParams, jsonrpc2 } from '@metamask/utils';
import { FIRST_PARTY_CONTRACT_NAMES } from '../../../../shared/constants/first-party-contracts';
import {
  BridgeTxParams,
  createTxVerificationMiddleware,
} from './tx-verification-middleware';

const getMockNetworkController = (chainId: `0x${string}` = '0x1') =>
  ({ state: { providerConfig: { chainId } } } as unknown as NetworkController);

const jsonRpcTemplate = { jsonrpc: jsonrpc2, id: 1 };

const getMiddlewareParams = (method: string, params: JsonRpcParams = []) => {
  const req = { ...jsonRpcTemplate, method, params };
  const res = { ...jsonRpcTemplate, result: null };
  const next = jest.fn();
  const end = jest.fn();
  return { req, res, next, end };
};

const getBridgeTxParams = (
  txParams: Partial<BridgeTxParams> = {},
): [BridgeTxParams] => {
  return [
    {
      data: '0x1',
      from: '0x1',
      to: '0x1',
      value: '0x1',
      ...txParams,
    },
  ];
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

  it('passes through valid bridge transaction', () => {
    const middleware = createTxVerificationMiddleware(
      getMockNetworkController(),
    );

    const { req, res, next, end } = getMiddlewareParams(
      'eth_sendTransaction',
      getBridgeTxParams({ ...getFixtures().valid }),
    );
    middleware(req, res, next, end);

    expect(next).toHaveBeenCalledTimes(1);
    expect(end).not.toHaveBeenCalled();
  });

  it('passes through valid bridge transaction, falling back to NetworkController chain id', () => {
    const middleware = createTxVerificationMiddleware(
      getMockNetworkController(),
    );

    const { req, res, next, end } = getMiddlewareParams(
      'eth_sendTransaction',
      getBridgeTxParams({ ...getFixtures().valid }),
    );
    middleware(req, res, next, end);

    expect(next).toHaveBeenCalledTimes(1);
    expect(end).not.toHaveBeenCalled();
  });

  it('rejects modified bridge transactions', () => {
    const middleware = createTxVerificationMiddleware(
      getMockNetworkController(),
    );

    const { req, res, next, end } = getMiddlewareParams(
      'eth_sendTransaction',
      getBridgeTxParams({ ...getFixtures().invalid }),
    );
    middleware(req, res, next, end);

    expect(next).not.toHaveBeenCalled();
    expect(end).toHaveBeenCalledTimes(1);
  });
});

/**
 * Returns bridge transaction validation fixtures.
 *
 * @returns The fixtures.
 */
function getFixtures() {
  return {
    valid: {
      data: '0x3ce33bff0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000470de4df82000000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000f736f636b6574416461707465725632000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002800000000000000000000000003a23f943181408eac424116af7b7790c94cb97a50000000000000000000000003a23f943181408eac424116af7b7790c94cb97a5000000000000000000000000000000000000000000000000000000000000a4b10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000466ebb82ac1000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000009f295cd5f000000000000000000000000000e6b738da243e8fa2a0ed5915645789add5de515200000000000000000000000000000000000000000000000000000000000001280000019fd025dec0000000000000000000000000e672b534ccf9876a7554a1dd1685a2a5c2cc8e8c000000000000000000000000b8901acb165ed027e32754e0ffe830802919727f000000000000000000000000710bda329b2a6224e4b44833de30f38e7f81d564000000000000000000000000000000000000000000000000000000000000a4b100000000000000000000000000000000000000000000000000466ebb82ac1000000000000000000000000000000000000000000000000000004614942c423e000000000000000000000000000000000000000000000000000000886c98b760000000000000000000000000000000000000000000000000000000019012a41ba800000000000000000000000000000000000000000000000000000000000000c40000000000000000000000000000000000000000000000005dedaf7e04c3f5c842c30ed9a4a19baceb915cdd3e865f0dad99ffca277743a20bac00e0f366e7265f1fcad502791ff49e9c5c98e1841a090df23ce5555051da1c',
      from: '0xe672b534ccf9876a7554a1dd1685a2a5c2cc8e8c',
      to: FIRST_PARTY_CONTRACT_NAMES['MetaMask Bridge']['0x1'],
      value: '0x470de4df820000',
    },
    invalid: {
      data: '0x3ce33bff0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000470de4df82000000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000d6c6966694164617074657256320000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000e397c4883ec89ed4fc9d258f00c689708b2799c9000000000000000000000000e397c4883ec89ed4fc9d258f00c689708b2799c9000000000000000000000000000000000000000000000000000000000000a4b10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000466ebb82ac1000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000009f295cd5f000000000000000000000000000c8c0e780960f954c3426a32b6ab453248d632b59000000000000000000000000000000000000000000000000000000000000006c5a39b10a5d458d62482fa1e7e672b534ccf9876a7554a1dd1685a2a5c2cc8e8c0000a4b10002a9de92aa00576661f103ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffd00dfeeddeadbeef8932eb23bad9bddb5cf81426f78279a53c6c3b710000000000000000000000000000000000000000',
      from: '0xe672b534ccf9876a7554a1dd1685a2a5c2cc8e8c',
      to: FIRST_PARTY_CONTRACT_NAMES['MetaMask Bridge']['0x1'],
      value: '0x470de4df820000',
    },
  } as const;
}
