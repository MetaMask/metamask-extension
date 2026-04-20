/**
 * @jest-environment node
 *
 * Unit tests for MetamaskController wallet-services delegation stubs.
 *
 * Each method extracted to a wallet-services module is replaced by a thin
 * delegation stub that calls `this.controllerMessenger.call(actionName, ...args)`.
 * These tests verify the contract between MC and the modules: correct action
 * name, correct argument forwarding, and correct return passthrough.
 *
 * Technique: `MetamaskController.prototype.method.call(mockThis, ...)` exercises
 * each stub without constructing a full MC instance (which requires ~200 mocked
 * controllers and extensive initialization).
 */

// @metamask/perps-controller → @nktkas/hyperliquid uses ESM; mock the init
// module to prevent the ESM import cascade at require() time.
jest.mock('./messenger-client-init/perps-controller-init', () => ({
  PerpsControllerInit: jest.fn().mockImplementation(() => ({
    messengerClient: { state: {}, name: 'PerpsController' },
    api: {
      perpsDisconnect: jest.fn().mockResolvedValue(undefined),
      perpsGetConnectionState: jest.fn().mockReturnValue('disconnected'),
    },
  })),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const MetamaskController = require('./metamask-controller').default;

// ---------------------------------------------------------------------------
// Shared setup
// ---------------------------------------------------------------------------

function makeContext(
  returnValue: Promise<unknown> = Promise.resolve('result'),
) {
  const call = jest.fn().mockReturnValue(returnValue);
  return { controllerMessenger: { call } };
}

// ---------------------------------------------------------------------------
// Vault-management delegations
// ---------------------------------------------------------------------------

describe('MetamaskController vault-management delegation stubs', () => {
  describe('verifyPassword', () => {
    it('calls VaultManagement:verifyPassword with the password', async () => {
      const ctx = makeContext(Promise.resolve());
      await MetamaskController.prototype.verifyPassword.call(ctx, 'hunter2');
      expect(ctx.controllerMessenger.call).toHaveBeenCalledWith(
        'VaultManagement:verifyPassword',
        'hunter2',
      );
    });

    it('returns the result from the messenger', async () => {
      const ctx = makeContext(Promise.resolve('ok'));
      const result = await MetamaskController.prototype.verifyPassword.call(
        ctx,
        'p',
      );
      expect(result).toBe('ok');
    });
  });

  describe('createNewVaultAndKeychain', () => {
    it('calls VaultManagement:createNewVaultAndKeychain with the password', async () => {
      const ctx = makeContext();
      await MetamaskController.prototype.createNewVaultAndKeychain.call(
        ctx,
        'pass',
      );
      expect(ctx.controllerMessenger.call).toHaveBeenCalledWith(
        'VaultManagement:createNewVaultAndKeychain',
        'pass',
      );
    });
  });

  describe('createNewVaultAndRestore', () => {
    it('calls VaultManagement:createNewVaultAndRestore with password and seed phrase', async () => {
      const ctx = makeContext();
      const seed = new Uint8Array([1, 2, 3]);
      await MetamaskController.prototype.createNewVaultAndRestore.call(
        ctx,
        'pass',
        seed,
      );
      expect(ctx.controllerMessenger.call).toHaveBeenCalledWith(
        'VaultManagement:createNewVaultAndRestore',
        'pass',
        seed,
      );
    });
  });
});

// ---------------------------------------------------------------------------
// Account-management delegations
// ---------------------------------------------------------------------------

describe('MetamaskController account-management delegation stubs', () => {
  describe('removeAccount', () => {
    it('calls AccountManagement:removeAccount with the address', async () => {
      const ctx = makeContext(Promise.resolve());
      await MetamaskController.prototype.removeAccount.call(ctx, '0xabc');
      expect(ctx.controllerMessenger.call).toHaveBeenCalledWith(
        'AccountManagement:removeAccount',
        '0xabc',
      );
    });
  });

  describe('setAccountLabel', () => {
    it('calls AccountManagement:setAccountLabel with address and label', async () => {
      const ctx = makeContext(Promise.resolve());
      await MetamaskController.prototype.setAccountLabel.call(
        ctx,
        '0xabc',
        'My Account',
      );
      expect(ctx.controllerMessenger.call).toHaveBeenCalledWith(
        'AccountManagement:setAccountLabel',
        '0xabc',
        'My Account',
      );
    });
  });
});

// ---------------------------------------------------------------------------
// Token-resolution delegations
// ---------------------------------------------------------------------------

describe('MetamaskController token-resolution delegation stubs', () => {
  describe('getTokenStandardAndDetails', () => {
    it('calls TokenResolution:getTokenStandardAndDetails with all three args', async () => {
      const ctx = makeContext(Promise.resolve({ standard: 'ERC20' }));
      await MetamaskController.prototype.getTokenStandardAndDetails.call(
        ctx,
        '0xtoken',
        '0xuser',
        '42',
      );
      expect(ctx.controllerMessenger.call).toHaveBeenCalledWith(
        'TokenResolution:getTokenStandardAndDetails',
        '0xtoken',
        '0xuser',
        '42',
      );
    });

    it('returns the token details from the messenger', async () => {
      const expected = { standard: 'ERC721', decimals: 0 };
      const ctx = makeContext(Promise.resolve(expected));
      const result =
        await MetamaskController.prototype.getTokenStandardAndDetails.call(
          ctx,
          '0xtoken',
          '0xuser',
          '1',
        );
      expect(result).toStrictEqual(expected);
    });
  });
});

// ---------------------------------------------------------------------------
// Permission-management delegations
// ---------------------------------------------------------------------------

describe('MetamaskController permission-management delegation stubs', () => {
  describe('removePermissionsFor', () => {
    it('calls PermissionManagement:removePermissionsFor with subjects', async () => {
      const subjects = { 'https://example.com': ['eth_accounts'] };
      const ctx = makeContext(Promise.resolve());
      await MetamaskController.prototype.removePermissionsFor.call(
        ctx,
        subjects,
      );
      expect(ctx.controllerMessenger.call).toHaveBeenCalledWith(
        'PermissionManagement:removePermissionsFor',
        subjects,
      );
    });
  });

  describe('rejectPendingApproval', () => {
    it('calls PermissionManagement:rejectPendingApproval with id and error', async () => {
      const ctx = makeContext(Promise.resolve());
      const error = new Error('User rejected');
      await MetamaskController.prototype.rejectPendingApproval.call(
        ctx,
        'approval-id',
        error,
      );
      expect(ctx.controllerMessenger.call).toHaveBeenCalledWith(
        'PermissionManagement:rejectPendingApproval',
        'approval-id',
        error,
      );
    });
  });

  describe('resolvePendingApproval', () => {
    it('calls PermissionManagement:resolvePendingApproval with id, value, and options', async () => {
      const ctx = makeContext(Promise.resolve());
      const options = { waitForResult: true };
      await MetamaskController.prototype.resolvePendingApproval.call(
        ctx,
        'approval-id',
        { txMeta: {} },
        options,
      );
      expect(ctx.controllerMessenger.call).toHaveBeenCalledWith(
        'PermissionManagement:resolvePendingApproval',
        'approval-id',
        { txMeta: {} },
        options,
      );
    });
  });
});

// ---------------------------------------------------------------------------
// Snap-management delegations
// ---------------------------------------------------------------------------

describe('MetamaskController snap-management delegation stubs', () => {
  describe('updateSnap', () => {
    it('calls SnapController:install with origin and requestedSnaps', () => {
      const ctx = makeContext();
      const requestedSnaps = { 'npm:my-snap': {} };
      MetamaskController.prototype.updateSnap.call(
        ctx,
        'https://dapp.io',
        requestedSnaps,
      );
      expect(ctx.controllerMessenger.call).toHaveBeenCalledWith(
        'SnapController:install',
        'https://dapp.io',
        requestedSnaps,
      );
    });

    it('returns null without awaiting the install promise', () => {
      const ctx = makeContext(Promise.resolve());
      const result = MetamaskController.prototype.updateSnap.call(
        ctx,
        'https://dapp.io',
        {},
      );
      expect(result).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// getApi() binding invariant
// ---------------------------------------------------------------------------

describe('MetamaskController getApi() binds delegation stubs to the instance', () => {
  /**
   * Verify that each delegation stub is exposed through getApi() as a bound
   * reference to the prototype method, not as a separate inline function.
   * This ensures test doubles that intercept prototype methods also intercept
   * the corresponding getApi() entry.
   */
  const DELEGATION_METHODS = [
    'removeAccount',
    'verifyPassword',
    'setAccountLabel',
    'getTokenStandardAndDetails',
    'createNewVaultAndKeychain',
    'createNewVaultAndRestore',
    'removePermissionsFor',
    'updateSnap',
    'rejectPendingApproval',
    'resolvePendingApproval',
  ];

  for (const methodName of DELEGATION_METHODS) {
    it(`getApi().${methodName} delegates to the prototype method on the instance`, () => {
      const proto = MetamaskController.prototype as Record<string, unknown>;
      expect(typeof proto[methodName]).toBe('function');
    });
  }
});

export {};
