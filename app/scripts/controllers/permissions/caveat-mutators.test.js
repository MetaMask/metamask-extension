import { CaveatMutatorOperation } from '@metamask/permission-controller';
import { CaveatTypes } from '../../../../shared/constants/permissions';
import { CaveatMutatorFactories } from './caveat-mutators';

describe('caveat mutators', () => {
  describe('restrictReturnedAccounts', () => {
    const { removeAccount } =
      CaveatMutatorFactories[CaveatTypes.restrictReturnedAccounts];

    describe('removeAccount', () => {
      it('returns the no-op operation if the target account is not permitted', () => {
        expect(removeAccount('0x2', ['0x1'])).toStrictEqual({
          operation: CaveatMutatorOperation.noop,
        });
      });

      it('returns the update operation and a new value if the target account is permitted', () => {
        expect(removeAccount('0x2', ['0x1', '0x2'])).toStrictEqual({
          operation: CaveatMutatorOperation.updateValue,
          value: ['0x1'],
        });
      });

      it('returns the revoke permission operation the target account is the only permitted account', () => {
        expect(removeAccount('0x1', ['0x1'])).toStrictEqual({
          operation: CaveatMutatorOperation.revokePermission,
        });
      });

      it('returns the revoke permission operation even if the target account is a checksummed address', () => {
        expect(
          removeAccount('0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAee5', [
            '0x95222290dd7278aa3ddd389cc1e1d165cc4baee5',
          ]),
        ).toStrictEqual({
          operation: CaveatMutatorOperation.revokePermission,
        });
      });
    });
  });
});
