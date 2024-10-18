import { SnapCaveatType } from '@metamask/snaps-rpc-methods';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/multichain';
import {
  getCaveatSpecifications,
  getPermissionSpecifications,
  unrestrictedMethods,
} from './specifications';

// Note: This causes Date.now() to return the number 1.
jest.useFakeTimers('modern').setSystemTime(1);

describe('PermissionController specifications', () => {
  describe('caveat specifications', () => {
    it('getCaveatSpecifications returns the expected specifications object', () => {
      const caveatSpecifications = getCaveatSpecifications({});
      expect(Object.keys(caveatSpecifications)).toHaveLength(12);
      expect(caveatSpecifications[Caip25CaveatType].type).toStrictEqual(
        Caip25CaveatType,
      );

      expect(caveatSpecifications.permittedDerivationPaths.type).toStrictEqual(
        SnapCaveatType.PermittedDerivationPaths,
      );
      expect(caveatSpecifications.permittedCoinTypes.type).toStrictEqual(
        SnapCaveatType.PermittedCoinTypes,
      );
      expect(caveatSpecifications.chainIds.type).toStrictEqual(
        SnapCaveatType.ChainIds,
      );
      expect(caveatSpecifications.snapCronjob.type).toStrictEqual(
        SnapCaveatType.SnapCronjob,
      );
      expect(caveatSpecifications.transactionOrigin.type).toStrictEqual(
        SnapCaveatType.TransactionOrigin,
      );
      expect(caveatSpecifications.signatureOrigin.type).toStrictEqual(
        SnapCaveatType.SignatureOrigin,
      );
      expect(caveatSpecifications.rpcOrigin.type).toStrictEqual(
        SnapCaveatType.RpcOrigin,
      );
      expect(caveatSpecifications.snapIds.type).toStrictEqual(
        SnapCaveatType.SnapIds,
      );
      expect(caveatSpecifications.keyringOrigin.type).toStrictEqual(
        SnapCaveatType.KeyringOrigin,
      );
      expect(caveatSpecifications.maxRequestTime.type).toStrictEqual(
        SnapCaveatType.MaxRequestTime,
      );
      expect(caveatSpecifications.lookupMatchers.type).toStrictEqual(
        SnapCaveatType.LookupMatchers,
      );
    });
  });

  describe('permission specifications', () => {
    it('getPermissionSpecifications returns the expected specifications object', () => {
      const permissionSpecifications = getPermissionSpecifications({});
      expect(Object.keys(permissionSpecifications)).toHaveLength(1);
      expect(
        permissionSpecifications[Caip25EndowmentPermissionName].targetName,
      ).toStrictEqual('endowment:caip25');
    });
  });

  describe('unrestricted methods', () => {
    it('defines the unrestricted methods', () => {
      expect(Array.isArray(unrestrictedMethods)).toBe(true);
      expect(Object.isFrozen(unrestrictedMethods)).toBe(true);
    });
  });
});
