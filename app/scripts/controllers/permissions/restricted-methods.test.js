import { strict as assert } from 'assert';
import pify from 'pify';

import getRestrictedMethods from './restrictedMethods';

describe('restricted methods', function () {
  describe('eth_accounts', function () {
    it('should handle getKeyringAccounts error', async function () {
      const restrictedMethods = getRestrictedMethods({
        getKeyringAccounts: async () => {
          throw new Error('foo');
        },
      });
      const ethAccountsMethod = pify(restrictedMethods.eth_accounts.method);

      const res = {};
      const fooError = new Error('foo');
      await assert.rejects(
        ethAccountsMethod(null, res, null),
        fooError,
        'Should reject with expected error',
      );

      assert.deepEqual(
        res,
        { error: fooError },
        'response should have expected error and no result',
      );
    });

    it('should handle missing identity for first account when sorting', async function () {
      const restrictedMethods = getRestrictedMethods({
        getIdentities: () => {
          return { '0x7e57e2': {} };
        },
        getKeyringAccounts: async () => ['0x7e57e2', '0x7e57e3'],
      });
      const ethAccountsMethod = pify(restrictedMethods.eth_accounts.method);

      const res = {};
      await assert.rejects(ethAccountsMethod(null, res, null));
      assert.ok(res.error instanceof Error, 'result should have error');
      assert.deepEqual(
        Object.keys(res),
        ['error'],
        'result should only contain error',
      );
    });

    it('should handle missing identity for second account when sorting', async function () {
      const restrictedMethods = getRestrictedMethods({
        getIdentities: () => {
          return { '0x7e57e3': {} };
        },
        getKeyringAccounts: async () => ['0x7e57e2', '0x7e57e3'],
      });
      const ethAccountsMethod = pify(restrictedMethods.eth_accounts.method);

      const res = {};
      await assert.rejects(ethAccountsMethod(null, res, null));
      assert.ok(res.error instanceof Error, 'result should have error');
      assert.deepEqual(
        Object.keys(res),
        ['error'],
        'result should only contain error',
      );
    });

    it('should return accounts in keyring order when none are selected', async function () {
      const keyringAccounts = ['0x7e57e2', '0x7e57e3', '0x7e57e4', '0x7e57e5'];
      const restrictedMethods = getRestrictedMethods({
        getIdentities: () => {
          return keyringAccounts.reduce((identities, address) => {
            identities[address] = {};
            return identities;
          }, {});
        },
        getKeyringAccounts: async () => [...keyringAccounts],
      });
      const ethAccountsMethod = pify(restrictedMethods.eth_accounts.method);

      const res = {};
      await ethAccountsMethod(null, res, null);
      assert.deepEqual(
        res,
        { result: keyringAccounts },
        'should return accounts in correct order',
      );
    });

    it('should return accounts in keyring order when all have same last selected time', async function () {
      const keyringAccounts = ['0x7e57e2', '0x7e57e3', '0x7e57e4', '0x7e57e5'];
      const restrictedMethods = getRestrictedMethods({
        getIdentities: () => {
          return keyringAccounts.reduce((identities, address) => {
            identities[address] = { lastSelected: 1000 };
            return identities;
          }, {});
        },
        getKeyringAccounts: async () => [...keyringAccounts],
      });
      const ethAccountsMethod = pify(restrictedMethods.eth_accounts.method);

      const res = {};
      await ethAccountsMethod(null, res, null);
      assert.deepEqual(
        res,
        { result: keyringAccounts },
        'should return accounts in correct order',
      );
    });

    it('should return accounts sorted by last selected (descending)', async function () {
      const keyringAccounts = ['0x7e57e2', '0x7e57e3', '0x7e57e4', '0x7e57e5'];
      const expectedResult = keyringAccounts.slice().reverse();
      const restrictedMethods = getRestrictedMethods({
        getIdentities: () => {
          return keyringAccounts.reduce((identities, address, index) => {
            identities[address] = { lastSelected: index * 1000 };
            return identities;
          }, {});
        },
        getKeyringAccounts: async () => [...keyringAccounts],
      });
      const ethAccountsMethod = pify(restrictedMethods.eth_accounts.method);

      const res = {};
      await ethAccountsMethod(null, res, null);
      assert.deepEqual(
        res,
        { result: expectedResult },
        'should return accounts in correct order',
      );
    });

    it('should return accounts sorted by last selected (descending) with unselected accounts last, in keyring order', async function () {
      const keyringAccounts = [
        '0x7e57e2',
        '0x7e57e3',
        '0x7e57e4',
        '0x7e57e5',
        '0x7e57e6',
      ];
      const expectedResult = [
        '0x7e57e4',
        '0x7e57e2',
        '0x7e57e3',
        '0x7e57e5',
        '0x7e57e6',
      ];
      const restrictedMethods = getRestrictedMethods({
        getIdentities: () => {
          return {
            '0x7e57e2': { lastSelected: 1000 },
            '0x7e57e3': {},
            '0x7e57e4': { lastSelected: 2000 },
            '0x7e57e5': {},
            '0x7e57e6': {},
          };
        },
        getKeyringAccounts: async () => [...keyringAccounts],
      });
      const ethAccountsMethod = pify(restrictedMethods.eth_accounts.method);

      const res = {};
      await ethAccountsMethod(null, res, null);
      assert.deepEqual(
        res,
        { result: expectedResult },
        'should return accounts in correct order',
      );
    });
  });
});
