import { Messenger } from '@metamask/messenger';
import { getIsAssetsUnifiedStateIncludedInBuild } from '../../../../shared/lib/environment';
import { getRootMessenger } from '../../lib/messenger';
import {
  getAccountTrackerCompatState,
  registerAccountTrackerGetStateCompat,
} from './account-tracker-controller-compat';

jest.mock('../../../../shared/lib/environment', () => ({
  ...jest.requireActual('../../../../shared/lib/environment'),
  getIsAssetsUnifiedStateIncludedInBuild: jest.fn(() => true),
}));

describe('account-tracker-controller-compat', () => {
  beforeEach(() => {
    jest.mocked(getIsAssetsUnifiedStateIncludedInBuild).mockReturnValue(true);
  });

  it('provides AccountTrackerController state backed by AssetsController pay state', () => {
    const messenger = getRootMessenger<never, never>();
    const assetsControllerMessenger = new Messenger({
      namespace: 'AssetsController',
      parent: messenger,
    });
    const accountsByChainId = {
      '0x1': {
        '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1': {
          balance: '0x1',
        },
      },
    };

    // This action is registered by AssetsController in production.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (assetsControllerMessenger as any).registerActionHandler(
      'AssetsController:getStateForTransactionPay',
      () => ({
        accountsByChainId,
      }),
    );

    registerAccountTrackerGetStateCompat(messenger);

    expect(
      // Compat action is registered dynamically on the root messenger.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (messenger as any).call('AccountTrackerController:getState'),
    ).toStrictEqual({
      accountsByChainId,
    });
  });

  it('returns empty accountsByChainId when pay state is unavailable', () => {
    const messenger = getRootMessenger<never, never>();

    expect(
      getAccountTrackerCompatState(
        messenger as unknown as {
          call: (actionType: string, ...args: unknown[]) => unknown;
        },
      ),
    ).toStrictEqual({
      accountsByChainId: {},
    });
  });

  it('provides empty AccountTrackerController state when assets are excluded', () => {
    jest.mocked(getIsAssetsUnifiedStateIncludedInBuild).mockReturnValue(false);
    const messenger = getRootMessenger<never, never>();

    registerAccountTrackerGetStateCompat(messenger);

    expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (messenger as any).call('AccountTrackerController:getState'),
    ).toStrictEqual({
      accountsByChainId: {},
    });
  });

  it('registers AccountTrackerController:getState only once per root messenger', () => {
    const messenger = getRootMessenger<never, never>();

    registerAccountTrackerGetStateCompat(messenger);
    expect(() => registerAccountTrackerGetStateCompat(messenger)).not.toThrow();
  });
});
