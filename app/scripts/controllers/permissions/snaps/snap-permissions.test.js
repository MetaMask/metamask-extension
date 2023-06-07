import {
  EndowmentPermissions,
  RestrictedMethods,
  ExcludedSnapEndowments,
} from '../../../../../shared/constants/permissions';
import {
  buildSnapEndowmentSpecifications,
  buildSnapRestrictedMethodSpecifications,
} from './snap-permissions';

// Temporarily replace the snaps packages with the Flask versions.
jest.mock('@metamask/snaps-controllers', () =>
  jest.requireActual('@metamask/snaps-controllers-flask'),
);
jest.mock('@metamask/rpc-methods', () =>
  jest.requireActual('@metamask/rpc-methods-flask'),
);

describe('buildSnapRestrictedMethodSpecifications', () => {
  it('creates valid permission specification objects', () => {
    const hooks = {
      addSnap: () => undefined,
      clearSnapState: () => undefined,
      getMnemonic: () => undefined,
      getSnap: () => undefined,
      getSnapRpcHandler: () => undefined,
      getSnapState: () => undefined,
      updateSnapState: () => undefined,
    };

    const specifications = buildSnapRestrictedMethodSpecifications(hooks);

    const allRestrictedMethods = Object.keys(RestrictedMethods);
    Object.keys(specifications).forEach((permissionKey) =>
      expect(allRestrictedMethods).toContain(permissionKey),
    );

    Object.values(specifications).forEach((specification) => {
      expect(specification).toMatchObject({
        targetName: expect.stringMatching(/^(snap_|wallet_)/u),
        methodImplementation: expect.any(Function),
      });
    });
  });
});

describe('buildSnapEndowmentSpecifications', () => {
  it('creates valid permission specification objects', () => {
    expect(
      Object.keys(buildSnapEndowmentSpecifications()).sort(),
    ).toStrictEqual(
      Object.keys(EndowmentPermissions)
        .filter(
          (targetName) =>
            !Object.keys(ExcludedSnapEndowments).includes(targetName),
        )
        .sort(),
    );
  });
});
