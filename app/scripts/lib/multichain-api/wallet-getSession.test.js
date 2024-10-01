import { EthereumRpcError } from 'eth-rpc-errors';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from './caip25permissions';
import { walletGetSessionHandler } from './wallet-getSession';

const baseRequest = {
  origin: 'http://test.com',
  params: {},
};

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
  const getCaveat = jest.fn().mockReturnValue({
    value: {
      requiredScopes: {
        'eip155:1': {
          methods: ['eth_call'],
          notifications: [],
        },
        'eip155:5': {
          methods: ['eth_chainId'],
          notifications: [],
        },
      },
      optionalScopes: {
        'eip155:1': {
          methods: ['net_version'],
          notifications: ['chainChanged'],
        },
        wallet: {
          methods: ['wallet_watchAsset'],
          notifications: [],
        },
      },
    },
  });
  const response = {};
  const handler = (request) =>
    walletGetSessionHandler(request, response, next, end, {
      getCaveat,
    });

  return {
    next,
    response,
    end,
    getCaveat,
    handler,
  };
};

describe('wallet_getSession', () => {
  it('gets the authorized scopes from the CAIP-25 endowment permission', async () => {
    const { handler, getCaveat } = createMockedHandler();

    await handler(baseRequest);
    expect(getCaveat).toHaveBeenCalledWith(
      'http://test.com',
      Caip25EndowmentPermissionName,
      Caip25CaveatType,
    );
  });

  it('throws an error if the CAIP-25 endowment permission does not exist', async () => {
    const { handler, getCaveat, end } = createMockedHandler();
    getCaveat.mockReturnValue(null);

    await handler(baseRequest);
    expect(end).toHaveBeenCalledWith(
      new EthereumRpcError(5501, 'No active sessions'),
    );
  });

  it('returns the merged scopes', async () => {
    const { handler, response } = createMockedHandler();

    await handler(baseRequest);
    expect(response.result).toStrictEqual({
      sessionScopes: {
        'eip155:1': {
          methods: ['eth_call', 'net_version'],
          notifications: ['chainChanged'],
        },
        'eip155:5': {
          methods: ['eth_chainId'],
          notifications: [],
        },
        wallet: {
          methods: ['wallet_watchAsset'],
          notifications: [],
        },
      },
    });
  });
});
