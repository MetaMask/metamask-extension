import { EthereumRpcError } from 'eth-rpc-errors';
import { assertScopeSupported, assertScopesSupported } from './assert';
import { ScopeObject } from './scope';
import * as Supported from './supported';

jest.mock('./supported', () => ({
  isSupportedScopeString: jest.fn(),
  isSupportedNotification: jest.fn(),
  isSupportedMethod: jest.fn(),
}));
const MockSupported = jest.mocked(Supported);

const validScopeObject: ScopeObject = {
  methods: [],
  notifications: [],
};

describe('Scope Assert', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('assertScopeSupported', () => {
    const isChainIdSupported = jest.fn();

    describe('scopeString', () => {
      it('checks if the scopeString is supported', () => {
        try {
          assertScopeSupported('scopeString', validScopeObject, {
            isChainIdSupported,
          });
        } catch (err) {
          // noop
        }
        expect(MockSupported.isSupportedScopeString).toHaveBeenCalledWith(
          'scopeString',
          isChainIdSupported,
        );
      });

      it('throws an error if the scopeString is not supported', () => {
        MockSupported.isSupportedScopeString.mockReturnValue(false);
        expect(() => {
          assertScopeSupported('scopeString', validScopeObject, {
            isChainIdSupported,
          });
        }).toThrow(
          new EthereumRpcError(5100, 'Requested chains are not supported'),
        );
      });
    });

    describe('scopeObject', () => {
      beforeEach(() => {
        MockSupported.isSupportedScopeString.mockReturnValue(true);
      });

      it('checks if the methods are supported', () => {
        try {
          assertScopeSupported(
            'scopeString',
            {
              ...validScopeObject,
              methods: ['eth_chainId'],
            },
            {
              findNetworkClientIdByChainId,
            },
          );
        } catch (err) {
          // noop
        }

        expect(MockSupported.isSupportedMethod).toHaveBeenCalledWith(
          'eth_chainId',
        );
      });

      it('throws an error if there are unsupported methods', () => {
        MockSupported.isSupportedMethod.mockReturnValue(false);
        expect(() => {
          assertScopeSupported(
            'scopeString',
            {
              ...validScopeObject,
              methods: ['eth_chainId'],
            },
            {
              isChainIdSupported,
            },
          );
        }).toThrow(
          new EthereumRpcError(5101, 'Requested methods are not supported'),
        );
      });

      it('checks if the notifications are supported', () => {
        MockSupported.isSupportedMethod.mockReturnValue(true);
        try {
          assertScopeSupported(
            'scopeString',
            {
              ...validScopeObject,
              notifications: ['chainChanged'],
            },
            {
              isChainIdSupported,
            },
          );
        } catch (err) {
          // noop
        }

        expect(MockSupported.isSupportedNotification).toHaveBeenCalledWith(
          'chainChanged',
        );
      });

      it('throws an error if there are unsupported notifications', () => {
        MockSupported.isSupportedMethod.mockReturnValue(true);
        MockSupported.isSupportedNotification.mockReturnValue(false);
        expect(() => {
          assertScopeSupported(
            'scopeString',
            {
              ...validScopeObject,
              notifications: ['chainChanged'],
            },
            {
              isChainIdSupported,
            },
          );
        }).toThrow(
          new EthereumRpcError(
            5102,
            'Requested notifications are not supported',
          ),
        );
      });

      it('does not throw if the scopeObject is valid', () => {
        MockSupported.isSupportedMethod.mockReturnValue(true);
        MockSupported.isSupportedNotification.mockReturnValue(true);
        expect(
          assertScopeSupported(
            'scopeString',
            {
              ...validScopeObject,
              methods: ['eth_chainId'],
              notifications: ['chainChanged'],
              accounts: ['eip155:1:0xdeadbeef'],
            },
            {
              isChainIdSupported,
            },
          ),
        ).toBeUndefined();
      });
    });
  });

  describe('assertScopesSupported', () => {
    const isChainIdSupported = jest.fn();

    it('does not throw an error if no scopes are defined', () => {
      assertScopesSupported(
        {},
        {
          isChainIdSupported,
        },
      );
    });

    it('throws an error if any scope is invalid', () => {
      MockSupported.isSupportedScopeString.mockReturnValue(false);

      expect(() => {
        assertScopesSupported(
          {
            scopeString: validScopeObject,
          },
          {
            isChainIdSupported,
          },
        );
      }).toThrow(
        new EthereumRpcError(5100, 'Requested chains are not supported'),
      );
    });

    it('does not throw an error if all scopes are valid', () => {
      MockSupported.isSupportedScopeString.mockReturnValue(true);

      expect(
        assertScopesSupported(
          {
            scopeStringA: validScopeObject,
            scopeStringB: validScopeObject,
          },
          {
            isChainIdSupported,
          },
        ),
      ).toBeUndefined();
    });
  });
});
