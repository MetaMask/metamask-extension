import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from './caip25permissions';
import { providerRequestHandler } from './provider-request';

const createMockedRequest = () => ({
  origin: 'http://test.com',
  params: {
    scope: 'eip155:1',
    request: {
      method: 'eth_call',
      params: {
        foo: 'bar',
      },
    },
  },
});

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
          notifications: [],
        },
        wallet: {
          methods: ['wallet_watchAsset'],
          notifications: [],
        },
        unhandled: {
          methods: ['foobar'],
          notifications: [],
        },
      },
    },
  });
  const findNetworkClientIdByChainId = jest.fn().mockReturnValue('mainnet');
  const getSelectedNetworkClientId = jest
    .fn()
    .mockReturnValue('selectedNetworkClientId');
  const handler = (request) =>
    providerRequestHandler(request, {}, next, end, {
      getCaveat,
      findNetworkClientIdByChainId,
      getSelectedNetworkClientId,
    });

  return {
    next,
    end,
    getCaveat,
    findNetworkClientIdByChainId,
    getSelectedNetworkClientId,
    handler,
  };
};

describe('provider_request', () => {
  it('gets the authorized scopes from the CAIP-25 endowement permission', async () => {
    const request = createMockedRequest();
    const { handler, getCaveat } = createMockedHandler();
    await handler(request);
    expect(getCaveat).toHaveBeenCalledWith(
      'http://test.com',
      Caip25EndowmentPermissionName,
      Caip25CaveatType,
    );
  });

  it('throws an error when there is no CAIP-25 endowement permission', async () => {
    const request = createMockedRequest();
    const { handler, getCaveat, end } = createMockedHandler();
    getCaveat.mockReturnValue(null);
    await handler(request);
    expect(end).toHaveBeenCalledWith(new Error('missing CAIP-25 endowment'));
  });

  it('throws an error if the requested scope is not authorized', async () => {
    const request = createMockedRequest();
    const { handler, end } = createMockedHandler();

    await handler({
      ...request,
      params: {
        ...request.params,
        scope: 'eip155:999',
      },
    });
    expect(end).toHaveBeenCalledWith(new Error('unauthorized (missing scope)'));
  });

  it('throws an error if the requested scope method is not authorized', async () => {
    const request = createMockedRequest();
    const { handler, end } = createMockedHandler();

    await handler({
      ...request,
      params: {
        ...request.params,
        request: {
          ...request.params.request,
          method: 'unauthorized_method',
        },
      },
    });
    expect(end).toHaveBeenCalledWith(
      new Error('unauthorized (method missing in scopeObject)'),
    );
  });

  it('throws an error for authorized but unhandled scopes', async () => {
    const request = createMockedRequest();
    const { handler, end } = createMockedHandler();

    await handler({
      ...request,
      params: {
        ...request.params,
        scope: 'unhandled',
        request: {
          ...request.params.request,
          method: 'foobar',
        },
      },
    });

    expect(end).toHaveBeenCalledWith(new Error('unable to handle namespace'));
  });

  describe('ethereum scope', () => {
    it('gets the networkClientId for the chainId', async () => {
      const request = createMockedRequest();
      const { handler, findNetworkClientIdByChainId } = createMockedHandler();

      await handler(request);
      expect(findNetworkClientIdByChainId).toHaveBeenCalledWith('0x1');
    });

    it('throws an error if a networkClientId does not exist for the chainId', async () => {
      const request = createMockedRequest();
      const { handler, findNetworkClientIdByChainId, end } =
        createMockedHandler();
      findNetworkClientIdByChainId.mockReturnValue(undefined);

      await handler(request);
      expect(end).toHaveBeenCalledWith(
        new Error('failed to get network client for reference'),
      );
    });

    it('sets the networkClientId and unwraps the CAIP-27 request', async () => {
      const request = createMockedRequest();
      const { handler, next } = createMockedHandler();

      await handler(request);
      expect(request).toStrictEqual({
        scope: 'eip155:1',
        origin: 'http://test.com',
        networkClientId: 'mainnet',
        method: 'eth_call',
        params: {
          foo: 'bar',
        },
      });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('wallet scope', () => {
    it('gets the networkClientId for the globally selected network', async () => {
      const request = createMockedRequest();
      const { handler, getSelectedNetworkClientId } = createMockedHandler();

      await handler({
        ...request,
        params: {
          ...request.params,
          scope: 'wallet',
          request: {
            ...request.params.request,
            method: 'wallet_watchAsset',
          },
        },
      });
      expect(getSelectedNetworkClientId).toHaveBeenCalled();
    });

    it('throws an error if a networkClientId cannot be retrieved for the globally selected network', async () => {
      const request = createMockedRequest();
      const { handler, getSelectedNetworkClientId, end } =
        createMockedHandler();
      getSelectedNetworkClientId.mockReturnValue(undefined);

      await handler({
        ...request,
        params: {
          ...request.params,
          scope: 'wallet',
          request: {
            ...request.params.request,
            method: 'wallet_watchAsset',
          },
        },
      });
      expect(end).toHaveBeenCalledWith(
        new Error('failed to get network client for reference'),
      );
    });

    it('sets the networkClientId and unwraps the CAIP-27 request', async () => {
      const request = createMockedRequest();
      const { handler, next } = createMockedHandler();

      const walletRequest = {
        ...request,
        params: {
          ...request.params,
          scope: 'wallet',
          request: {
            ...request.params.request,
            method: 'wallet_watchAsset',
          },
        },
      };
      await handler(walletRequest);
      expect(walletRequest).toStrictEqual({
        scope: 'wallet',
        origin: 'http://test.com',
        networkClientId: 'selectedNetworkClientId',
        method: 'wallet_watchAsset',
        params: {
          foo: 'bar',
        },
      });
      expect(next).toHaveBeenCalled();
    });
  });
});
