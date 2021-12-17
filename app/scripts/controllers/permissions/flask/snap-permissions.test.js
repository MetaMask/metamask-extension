import {
  EndowmentPermissions,
  RestrictedMethods,
} from '../../../../../shared/constants/permissions';
import {
  buildSnapEndowmentSpecifications,
  buildSnapRestrictedMethodSpecifications,
} from './snap-permissions';

describe('buildSnapRestrictedMethodSpecifications', () => {
  it('creates valid permission specification objects', () => {
    const hooks = {
      addSnap: () => undefined,
      clearSnapState: () => undefined,
      getMnemonic: () => undefined,
      getSnap: () => undefined,
      getSnapRpcHandler: () => undefined,
      getSnapState: () => undefined,
      showConfirmation: () => undefined,
      updateSnapState: () => undefined,
    };

    const specifications = buildSnapRestrictedMethodSpecifications(hooks);

    const allRestrictedMethods = Object.keys(RestrictedMethods);
    Object.keys(specifications).forEach((permissionKey) =>
      expect(allRestrictedMethods).toContain(permissionKey),
    );

    Object.values(specifications).forEach((specification) => {
      expect(specification).toMatchObject({
        targetKey: expect.stringMatching(/^(snap_|wallet_)/u),
        methodImplementation: expect.any(Function),
        allowedCaveats: null,
      });
    });
  });
});

describe('buildSnapEndowmentSpecifications', () => {
  it('creates valid permission specification objects', () => {
    expect(
      Object.keys(buildSnapEndowmentSpecifications()).sort(),
    ).toStrictEqual(Object.keys(EndowmentPermissions).sort());
  });
});
