import {
  isSupportedMethod,
  isSupportedNotification,
  isSupportedScopeString,
} from './supported';
import {
  KnownNotifications,
  KnownRpcMethods,
  KnownWalletNamespaceRpcMethods,
  KnownWalletRpcMethods,
  ScopeString,
} from './scope';

describe('Scope Support', () => {
  describe('isSupportedNotification', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(Object.entries(KnownNotifications))(
      'returns true for each %s scope method',
      (scopeString: ScopeString, notifications: string[]) => {
        notifications.forEach((notification) => {
          expect(
            isSupportedNotification(scopeString, notification),
          ).toStrictEqual(true);
        });
      },
    );

    it('returns false otherwise', () => {
      expect(isSupportedNotification('eip155', 'anything else')).toStrictEqual(
        false,
      );
      expect(isSupportedNotification('', '')).toStrictEqual(false);
    });
  });

  describe('isSupportedMethod', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(Object.entries(KnownRpcMethods))(
      'returns true for each %s scoped method',
      (scopeString: ScopeString, methods: string[]) => {
        methods.forEach((method) => {
          expect(isSupportedMethod(scopeString, method)).toStrictEqual(true);
        });
      },
    );

    it('returns true for each wallet scoped method', () => {
      KnownWalletRpcMethods.forEach((method) => {
        expect(isSupportedMethod('wallet', method)).toStrictEqual(true);
      });
    });

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(Object.entries(KnownWalletNamespaceRpcMethods))(
      'returns true for each wallet:%s scoped method',
      (scopeString: ScopeString, methods: string[]) => {
        methods.forEach((method) => {
          expect(
            isSupportedMethod(`wallet:${scopeString}`, method),
          ).toStrictEqual(true);
        });
      },
    );

    it('returns false otherwise', () => {
      expect(isSupportedMethod('eip155', 'anything else')).toStrictEqual(false);
      expect(isSupportedMethod('', '')).toStrictEqual(false);
    });
  });

  describe('isSupportedScopeString', () => {
    it('returns true for the wallet namespace', () => {
      expect(isSupportedScopeString('wallet', jest.fn())).toStrictEqual(true);
    });

    it('returns false for the wallet namespace when a reference is included', () => {
      expect(isSupportedScopeString('wallet:someref', jest.fn())).toStrictEqual(
        false,
      );
    });

    it('returns true for the ethereum namespace', () => {
      expect(isSupportedScopeString('eip155', jest.fn())).toStrictEqual(true);
    });

    it('returns true for the ethereum namespace when a network client exists for the reference', () => {
      const isChainIdSupportedMock = jest.fn().mockReturnValue(true);
      expect(
        isSupportedScopeString('eip155:1', isChainIdSupportedMock),
      ).toStrictEqual(true);
    });

    it('returns false for the ethereum namespace when a network client does not exist for the reference', () => {
      const isChainIdSupportedMock = jest.fn().mockReturnValue(false);
      expect(
        isSupportedScopeString('eip155:1', isChainIdSupportedMock),
      ).toStrictEqual(false);
    });
  });
});
