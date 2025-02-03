import {
  restrictedMethodPermissionBuilders,
  endowmentPermissionBuilders,
} from '@metamask/snaps-rpc-methods';
import {
  EndowmentPermissions,
  ExcludedSnapEndowments,
  RestrictedMethods,
} from './permissions';

describe('EndowmentPermissions', () => {
  it('has the expected permission keys', () => {
    expect(Object.keys(EndowmentPermissions).sort()).toStrictEqual(
      Object.keys(endowmentPermissionBuilders)
        .filter(
          (targetName) =>
            !Object.keys(ExcludedSnapEndowments).includes(targetName),
        )
        .sort(),
    );
  });
});

// This test is flawed because it doesn't take fencing into consideration
// TODO: Figure out a better way to test this
describe('RestrictedMethods', () => {
  it('has the expected permission keys', () => {
    expect(Object.keys(RestrictedMethods).sort()).toStrictEqual(
      [
        'eth_accounts',
        ...Object.keys(restrictedMethodPermissionBuilders),
      ].sort(),
    );
  });
});
