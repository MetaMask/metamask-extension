import { registerActions as registerVaultActions } from './vault-management';
import { registerActions as registerAccountActions } from './account-management';
import { registerActions as registerPermissionActions } from './permission-management';
import { registerActions as registerTransactionActions } from './transaction-lifecycle';
import { registerActions as registerTokenActions } from './token-resolution';
import { registerActions as registerSnapActions } from './snap-management';
import { registerWalletServices } from './register';

jest.mock('./vault-management', () => ({ registerActions: jest.fn() }));
jest.mock('./account-management', () => ({ registerActions: jest.fn() }));
jest.mock('./permission-management', () => ({ registerActions: jest.fn() }));
jest.mock('./transaction-lifecycle', () => ({ registerActions: jest.fn() }));
jest.mock('./token-resolution', () => ({ registerActions: jest.fn() }));
jest.mock('./snap-management', () => ({ registerActions: jest.fn() }));

// Mock @metamask/messenger to avoid real Messenger constructor side effects.
// The child messenger is only used for its `registerActionHandler` method;
// its actual namespace-validation logic is not relevant here.
jest.mock('@metamask/messenger', () => ({
  Messenger: jest.fn().mockImplementation(() => ({
    registerActionHandler: jest.fn(),
  })),
}));

describe('registerWalletServices', () => {
  const MOCK_CALL = jest.fn();
  const MOCK_MESSENGER = { call: MOCK_CALL } as never;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls registerActions for all six wallet-services modules', () => {
    registerWalletServices(MOCK_MESSENGER);
    for (const fn of [
      registerVaultActions,
      registerAccountActions,
      registerPermissionActions,
      registerTransactionActions,
      registerTokenActions,
      registerSnapActions,
    ]) {
      expect(fn).toHaveBeenCalledTimes(1);
    }
  });

  it('passes a messenger whose call delegates to the root messenger', () => {
    registerWalletServices(MOCK_MESSENGER);
    for (const fn of [
      registerVaultActions,
      registerAccountActions,
      registerPermissionActions,
      registerTransactionActions,
      registerTokenActions,
      registerSnapActions,
    ]) {
      const [messengerArg] = (fn as jest.Mock).mock.calls[0];
      // Each module gets a hybrid messenger — call routes through the root.
      messengerArg.call('SomeController:someAction', 'arg1');
      expect(MOCK_CALL).toHaveBeenCalledWith(
        'SomeController:someAction',
        'arg1',
      );
      MOCK_CALL.mockClear();
    }
  });
});
