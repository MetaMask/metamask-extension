import { restrictKeyringForDeviceRead } from './hardware-device-read-keyring';

describe('restrictKeyringForDeviceRead', () => {
  const buildKeyring = () => ({
    hdPath: `m/44'/60'/0'/0`,
    bridge: { getPublicKey: jest.fn(), getFeatures: jest.fn() },
    getFirstPage: jest.fn().mockResolvedValue(['0xabc']),
    getNextPage: jest.fn(),
    getPreviousPage: jest.fn(),
    isUnlocked: jest.fn().mockReturnValue(true),
    getModel: jest.fn().mockReturnValue('T'),
    // Mutating surface that must NOT leak through the facade:
    createAccounts: jest.fn(),
    deleteAccount: jest.fn(),
    forgetDevice: jest.fn(),
    setHdPath: jest.fn(),
    deserialize: jest.fn(),
    submitRequest: jest.fn(),
  });

  it('exposes the read-side surface, bound to the keyring', async () => {
    const keyring = buildKeyring();
    const facade = restrictKeyringForDeviceRead(keyring);

    await expect(facade.getFirstPage()).resolves.toStrictEqual(['0xabc']);
    expect(facade.isUnlocked()).toBe(true);
    expect(facade.getModel()).toBe('T');
    expect(facade.hdPath).toBe(`m/44'/60'/0'/0`);
    expect(facade.bridge).toBe(keyring.bridge);
  });

  it('does not expose mutating methods', () => {
    const facade = restrictKeyringForDeviceRead(buildKeyring());

    for (const method of [
      'createAccounts',
      'deleteAccount',
      'forgetDevice',
      'setHdPath',
      'deserialize',
      'submitRequest',
    ]) {
      // @ts-expect-error - intentionally probing the restricted surface
      expect(facade[method]).toBeUndefined();
    }
  });

  it('is frozen, so new escape hatches cannot be attached', () => {
    const facade = restrictKeyringForDeviceRead(buildKeyring());

    expect(Object.isFrozen(facade)).toBe(true);
    expect(() => {
      // @ts-expect-error - intentionally probing the restricted surface
      facade.setHdPath = jest.fn();
    }).toThrow(TypeError);
  });

  it('omits read methods the wrapped keyring does not implement', () => {
    const facade = restrictKeyringForDeviceRead({
      hdPath: 'm/0',
      bridge: undefined,
      isUnlocked: jest.fn(),
    });

    expect(facade.isUnlocked).toBeDefined();
    // @ts-expect-error - intentionally probing the restricted surface
    expect(facade.getModel).toBeUndefined();
    // @ts-expect-error - intentionally probing the restricted surface
    expect(facade.getAppNameAndVersion).toBeUndefined();
  });
});
