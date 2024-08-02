import { providerErrors } from '@metamask/rpc-errors';
import { CaipPermissionAdapterMiddleware } from './caip-permission-adapter-middleware';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from './caip25permissions';

const baseRequest = {
  origin: 'http://test.com',
  networkClientId: 'mainnet',
  method: 'eth_call',
  params: {
    foo: 'bar',
  },
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
      isMultichainOrigin: true,
    },
  });
  const getNetworkConfigurationByNetworkClientId = jest
    .fn()
    .mockImplementation((networkClientId) => {
      const chainId =
        {
          mainnet: '0x1',
          goerli: '0x5',
        }[networkClientId] || '0x999';
      return {
        chainId,
      };
    });
  const handler = (request) =>
    CaipPermissionAdapterMiddleware(request, {}, next, end, {
      getCaveat,
      getNetworkConfigurationByNetworkClientId,
    });

  return {
    next,
    end,
    getCaveat,
    getNetworkConfigurationByNetworkClientId,
    handler,
  };
};

describe('CaipPermissionAdapterMiddleware', () => {
  describe('BARAD_DUR feature flag is not set', () => {
    beforeAll(() => {
      delete process.env.BARAD_DUR;
    });

    it('allows the request when BARAD_DUR feature flag is not set', async () => {
      const { handler, next } = createMockedHandler();
      await handler(baseRequest);
      expect(next).toHaveBeenCalled();
    });

    it('does not read the permission state', async () => {
      const { handler, getCaveat } = createMockedHandler();
      await handler(baseRequest);
      expect(getCaveat).not.toHaveBeenCalled();
    });
  });

  describe('BARAD_DUR feature flag is set', () => {
    beforeAll(() => {
      process.env.BARAD_DUR = 1;
    });

    it('gets the authorized scopes from the CAIP-25 endowment permission', async () => {
      const { handler, getCaveat } = createMockedHandler();
      await handler(baseRequest);
      expect(getCaveat).toHaveBeenCalledWith(
        'http://test.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
      );
    });

    it('allows the request when there is no CAIP-25 endowment permission', async () => {
      const { handler, getCaveat, next } = createMockedHandler();
      getCaveat.mockReturnValue(null);
      await handler(baseRequest);
      expect(next).toHaveBeenCalled();
    });

    it('allows the request when the CAIP-25 endowment permission was not granted from the multichain flow', async () => {
      const { handler, getCaveat, next } = createMockedHandler();
      getCaveat.mockReturnValue({
        value: {
          isMultichainOrigin: false,
        },
      });
      await handler(baseRequest);
      expect(next).toHaveBeenCalled();
    });

    it('gets the chainId for the request networkClientId', async () => {
      const { handler, getNetworkConfigurationByNetworkClientId } =
        createMockedHandler();
      await handler(baseRequest);
      expect(getNetworkConfigurationByNetworkClientId).toHaveBeenCalledWith(
        'mainnet',
      );
    });

    it('throws an error if the requested scope method is not authorized in either the current scope or the wallet scope', async () => {
      const { handler, end } = createMockedHandler();

      await handler({
        ...baseRequest,
        method: 'unauthorized_method',
      });
      expect(end).toHaveBeenCalledWith(providerErrors.unauthorized());
    });

    it('allows the request if the requested scope method is authorized in the current scope', async () => {
      const { handler, next } = createMockedHandler();

      await handler(baseRequest);
      expect(next).toHaveBeenCalled();
    });

    it('allows the request if the requested scope method is authorized in the wallet scope and the current scope does exist in the authorization', async () => {
      const { handler, next } = createMockedHandler();

      await handler({
        ...baseRequest,
        method: 'wallet_watchAsset',
      });
      expect(next).toHaveBeenCalled();
    });

    it('allows the request if the requested scope method is authorized in the wallet scope and the current scope does not exist in the authorization', async () => {
      const { handler, next } = createMockedHandler();

      await handler({
        ...baseRequest,
        method: 'wallet_watchAsset',
        networkClientId: 'someOtherNetworkClientId',
      });
      expect(next).toHaveBeenCalled();
    });
  });
});
