import {
  buildSnapEndowmentSpecifications,
  buildSnapRestrictedMethodSpecifications,
} from '@metamask/snaps-rpc-methods';
import { RestrictedMethods } from '../permissions';
import {
  EndowmentPermissions,
  ExcludedSnapEndowments,
  ExcludedSnapPermissions,
} from './permissions';

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

    const specifications = buildSnapRestrictedMethodSpecifications(
      Object.keys(ExcludedSnapPermissions),
      hooks,
    );

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
      Object.keys(
        buildSnapEndowmentSpecifications(Object.keys(ExcludedSnapEndowments)),
      ).sort(),
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
