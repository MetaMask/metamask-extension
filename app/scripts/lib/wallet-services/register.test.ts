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

describe('registerWalletServices', () => {
  const MOCK_MESSENGER = Symbol('messenger') as never;

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

  it('passes the messenger to every module', () => {
    registerWalletServices(MOCK_MESSENGER);
    for (const fn of [
      registerVaultActions,
      registerAccountActions,
      registerPermissionActions,
      registerTransactionActions,
      registerTokenActions,
      registerSnapActions,
    ]) {
      // Each module receives the same messenger (cast to never at the call site)
      expect(fn).toHaveBeenCalledWith(MOCK_MESSENGER);
    }
  });
});
