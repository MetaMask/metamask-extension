import { endowmentBuilders } from '@metamask/snap-controllers';
import { restrictedMethodBuilders } from '@metamask/rpc-methods';
import { EndowmentPermissions, RestrictedMethods } from './permissions';

describe('EndowmentPermissions', () => {
  it('has the expected permission keys', () => {
    expect(Object.keys(EndowmentPermissions).sort()).toStrictEqual(
      Object.keys(endowmentBuilders.builders).sort(),
    );
  });
});

describe('RestrictedMethods', () => {
  it('has the expected permission keys', () => {
    expect(Object.keys(RestrictedMethods).sort()).toStrictEqual(
      ['eth_accounts', ...Object.keys(restrictedMethodBuilders)].sort(),
    );
  });
});
