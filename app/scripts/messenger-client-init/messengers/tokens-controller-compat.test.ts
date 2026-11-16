import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getTokensCompatState,
  registerTokensControllerGetStateCompat,
} from './tokens-controller-compat';

describe('tokens-controller-compat', () => {
  it('provides TokensController state backed by AssetsController pay state', () => {
    const messenger = getRootMessenger<never, never>();
    const assetsControllerMessenger = new Messenger({
      namespace: 'AssetsController',
      parent: messenger,
    });
    const allTokens = {
      '0x1': {
        '': [
          {
            address: '0x0000000000000000000000000000000000000001',
            symbol: 'TST',
            decimals: 18,
          },
        ],
      },
    };

    // This action is registered by AssetsController in production.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (assetsControllerMessenger as any).registerActionHandler(
      'AssetsController:getStateForTransactionPay',
      () => ({ allTokens }),
    );

    registerTokensControllerGetStateCompat(messenger);

    expect(
      // Compat action is registered dynamically on the root messenger.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (messenger as any).call('TokensController:getState'),
    ).toStrictEqual({
      allTokens,
      allIgnoredTokens: {},
      allDetectedTokens: {},
      tokens: [],
      detectedTokens: [],
      ignoredTokens: [],
    });
  });

  it('returns empty token maps when pay state is unavailable', () => {
    const messenger = getRootMessenger<never, never>();

    expect(
      getTokensCompatState(
        messenger as unknown as {
          call: (actionType: string, ...args: unknown[]) => unknown;
        },
      ),
    ).toStrictEqual({
      allTokens: {},
      allIgnoredTokens: {},
      allDetectedTokens: {},
      tokens: [],
      detectedTokens: [],
      ignoredTokens: [],
    });
  });

  it('registers TokensController:getState only once per root messenger', () => {
    const messenger = getRootMessenger<never, never>();

    registerTokensControllerGetStateCompat(messenger);
    expect(() =>
      registerTokensControllerGetStateCompat(messenger),
    ).not.toThrow();
  });
});
