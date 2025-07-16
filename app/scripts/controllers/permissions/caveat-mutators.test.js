import { CaveatMutatorOperation } from '@metamask/permission-controller';
import { CaveatTypes } from '../../../../shared/constants/permissions';
import { CaveatMutatorFactories } from './caveat-mutators';

const address1 = '0xbf16f7f5db8ae6af2512399bace3101debbde7fc';
const address2 = '0xb6d5abeca51bfc3d53d00afed06b17eeea32ecdf';
const nonEvmAddress = 'bc1qdkwac3em6mvlur4fatn2g4q050f4kkqadrsmnp';

describe('caveat mutators', () => {
  describe('restrictReturnedAccounts', () => {
    const { removeAccount } =
      CaveatMutatorFactories[CaveatTypes.restrictReturnedAccounts];

    describe('removeAccount', () => {
      it('returns the no-op operation if the target account is not permitted', () => {
        expect(removeAccount(address2, [address1])).toStrictEqual({
          operation: CaveatMutatorOperation.Noop,
        });
      });

      it('returns the update operation and a new value if the target account is permitted', () => {
        expect(removeAccount(address2, [address1, address2])).toStrictEqual({
          operation: CaveatMutatorOperation.UpdateValue,
          value: [address1],
        });
      });

      it('returns the revoke permission operation the target account is the only permitted account', () => {
        expect(removeAccount(address1, [address1])).toStrictEqual({
          operation: CaveatMutatorOperation.RevokePermission,
        });
      });

      it('returns the revoke permission operation even if the target account is a checksummed address', () => {
        const address3 = '0x95222290dd7278aa3ddd389cc1e1d165cc4baee5';
        const checksummedAddress3 =
          '0x95222290dd7278AA3DDd389cc1E1d165Cc4BaeE5';
        expect(removeAccount(checksummedAddress3, [address3])).toStrictEqual({
          operation: CaveatMutatorOperation.RevokePermission,
        });
      });

      describe('Multichain behaviour', () => {
        it('returns the no-op operation if the target account is not permitted', () => {
          expect(removeAccount(address2, [nonEvmAddress])).toStrictEqual({
            operation: CaveatMutatorOperation.Noop,
          });
        });

        it('can revoke permission for non-EVM addresses', () => {
          expect(removeAccount(nonEvmAddress, [nonEvmAddress])).toStrictEqual({
            operation: CaveatMutatorOperation.RevokePermission,
          });
        });

        it('returns the update operation and a new value if the target non-EVM account is permitted', () => {
          expect(
            removeAccount(nonEvmAddress, [address1, nonEvmAddress]),
          ).toStrictEqual({
            operation: CaveatMutatorOperation.UpdateValue,
            value: [address1],
          });
        });
      });
    });
  });
});
