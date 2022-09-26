import { strict as assert } from 'assert';
import { checkSnapsBlockList } from './snaps-utilities';

describe('Snaps Controller utilities', function () {
  describe('checkSnapsBlockList', function () {
    it('returns one of the given snaps as blocked by its version', async function () {
      const mockBlocklist = [
        {
          id: 'npm:@consensys/starknet-snap',
          versionRange: '<0.1.11',
        },
      ];
      const mockSnapsToBeChecked = {
        'npm:exampleA': {
          version: '1.0.0',
          shasum: 'F5IapP6v1Bp7bl16NkCszfOhtVSZAm362X5zl7wgMhI=',
        },
        'npm:exampleB': {
          version: '1.0.0',
          shasum: 'eCYGZiYvZ3/uxkKI3npfl79kTQXS/5iD9ojsBS4A3rI=',
        },
        'npm:@consensys/starknet-snap': {
          version: '0.1.10',
          shasum: 'A83r5/ZIcKuKwuAnQHHByVFCuofj7jGK5hOStmHY6A0=',
        },
      };

      const blockedSnaps = await checkSnapsBlockList(
        mockSnapsToBeChecked,
        mockBlocklist,
      );
      assert.deepEqual(blockedSnaps, {
        'npm:exampleA': { blocked: false },
        'npm:exampleB': { blocked: false },
        'npm:@consensys/starknet-snap': {
          blocked: true,
          reason: undefined,
          infoUrl: undefined,
        },
      });
    });

    it('returns given snap as blocked by its shasum', async function () {
      const mockBlocklist = [
        {
          shasum: 'A83r5/ZIcKuKwuAnQHHByVFCuofj7jGK5hOStmHY6A0=',
        },
      ];
      const mockSnapsToBeChecked = {
        'npm:@consensys/starknet-snap': {
          version: '0.3.15', // try to fake version with the same source sha
          shasum: 'A83r5/ZIcKuKwuAnQHHByVFCuofj7jGK5hOStmHY6A0=',
        },
      };

      const blockedSnaps = await checkSnapsBlockList(
        mockSnapsToBeChecked,
        mockBlocklist,
      );
      assert.deepEqual(blockedSnaps, {
        'npm:@consensys/starknet-snap': {
          blocked: true,
          reason: undefined,
          infoUrl: undefined,
        },
      });
    });

    it('returns false for blocked for the same blocklisted snap but different version', async function () {
      const mockBlocklist = [
        {
          id: 'npm:@consensys/starknet-snap',
          versionRange: '<0.1.11',
        },
      ];
      const mockSnapsToBeChecked = {
        'npm:@consensys/starknet-snap': {
          version: '0.2.1',
          shasum: 'Z4jo37WG1E2rxqF05WaXOSUDxR5upUmOdaTvmgVY/L0=',
        },
      };

      const blockedSnaps = await checkSnapsBlockList(
        mockSnapsToBeChecked,
        mockBlocklist,
      );
      assert.deepEqual(blockedSnaps, {
        'npm:@consensys/starknet-snap': {
          blocked: false,
        },
      });
    });

    it('returns false for blocked for multiple snaps that are not on the blocklist', async function () {
      const mockBlocklist = [
        {
          id: 'npm:@consensys/starknet-snap',
          versionRange: '<0.1.11',
        },
      ];
      const mockSnapsToBeChecked = {
        'npm:exampleA': {
          version: '1.0.0',
          shasum: 'F5IapP6v1Bp7bl16NkCszfOhtVSZAm362X5zl7wgMhI=',
        },
        'npm:exampleB': {
          version: '2.1.3',
          shasum: 'eCYGZiYvZ3/uxkKI3npfl79kTQXS/5iD9ojsBS4A3rI=',
        },
        'npm:exampleC': {
          version: '3.7.9',
          shasum: '2QqUxo5joo4kKKr7yiCjdYsZOZcIFBnIBEdwU9Yx7+M=',
        },
      };

      const blockedSnaps = await checkSnapsBlockList(
        mockSnapsToBeChecked,
        mockBlocklist,
      );
      assert.deepEqual(blockedSnaps, {
        'npm:exampleA': { blocked: false },
        'npm:exampleB': { blocked: false },
        'npm:exampleC': { blocked: false },
      });
    });
  });
});
