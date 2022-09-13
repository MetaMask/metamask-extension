import { endowmentPermissionBuilders } from '@metamask/snap-controllers';
import { restrictedMethodPermissionBuilders } from '@metamask/rpc-methods';
import {
  EndowmentPermissions,
  ExcludedSnapPermissions,
  RestrictedMethods,
} from './permissions';

describe('EndowmentPermissions', () => {
  it('has the expected permission keys', () => {
    expect(Object.keys(EndowmentPermissions).sort()).toStrictEqual(
      Object.keys(endowmentPermissionBuilders).sort(),
    );
  });
});

describe('RestrictedMethods', () => {
  it('has the expected permission keys', () => {
    expect(Object.keys(RestrictedMethods).sort()).toStrictEqual(
      [
        'eth_accounts',
        ...Object.keys(restrictedMethodPermissionBuilders).filter(
          (targetKey) => !ExcludedSnapPermissions.has(targetKey),
        ),
      ].sort(),
    );
  });
});
