import { endowmentPermissionBuilders } from '@metamask/snaps-controllers';
import { restrictedMethodPermissionBuilders } from '@metamask/rpc-methods';
import {
  EndowmentPermissions,
  ExcludedSnapEndowments,
  ExcludedSnapPermissions,
  RestrictedMethods,
} from './permissions';

describe('EndowmentPermissions', () => {
  it('has the expected permission keys', () => {
    expect(Object.keys(EndowmentPermissions).sort()).toStrictEqual(
      Object.keys(endowmentPermissionBuilders)
        .filter(
          (targetKey) =>
            !Object.keys(ExcludedSnapEndowments).includes(targetKey),
        )
        .sort(),
    );
  });
});

describe('RestrictedMethods', () => {
  it('has the expected permission keys', () => {
    expect(Object.keys(RestrictedMethods).sort()).toStrictEqual(
      [
        'eth_accounts',
        ...Object.keys(restrictedMethodPermissionBuilders).filter(
          (targetKey) =>
            !Object.keys(ExcludedSnapPermissions).includes(targetKey),
        ),
      ].sort(),
    );
  });
});
