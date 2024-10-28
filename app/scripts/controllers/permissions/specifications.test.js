import { EthAccountType } from '@metamask/keyring-api';
import { SnapCaveatType } from '@metamask/snaps-rpc-methods';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../shared/constants/permissions';
import { ETH_EOA_METHODS } from '../../../../shared/constants/eth-methods';
import {
  CaveatFactories,
  getCaveatSpecifications,
  getPermissionSpecifications,
  PermissionNames,
  unrestrictedMethods,
} from './specifications';

// Note: This causes Date.now() to return the number 1.
jest.useFakeTimers('modern').setSystemTime(1);

describe('PermissionController specifications', () => {
  describe('caveat specifications', () => {
    it('getCaveatSpecifications returns the expected specifications object', () => {
      const caveatSpecifications = getCaveatSpecifications({});
      expect(Object.keys(caveatSpecifications)).toHaveLength(13);
      expect(
        caveatSpecifications[CaveatTypes.restrictReturnedAccounts].type,
      ).toStrictEqual(CaveatTypes.restrictReturnedAccounts);
      expect(
        caveatSpecifications[CaveatTypes.restrictNetworkSwitching].type,
      ).toStrictEqual(CaveatTypes.restrictNetworkSwitching);

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

    describe('restrictReturnedAccounts', () => {
      describe('decorator', () => {
        it('only returns array members included in the caveat value', async () => {
          const getInternalAccounts = jest.fn();
          const { decorator } = getCaveatSpecifications({
            getInternalAccounts,
          })[CaveatTypes.restrictReturnedAccounts];

          const method = async () => ['0x1', '0x2', '0x3'];
          const caveat = {
            type: CaveatTypes.restrictReturnedAccounts,
            value: ['0x1', '0x3'],
          };
          const decorated = decorator(method, caveat);
          expect(await decorated()).toStrictEqual(['0x1', '0x3']);
        });

        it('returns an empty array if no array members are included in the caveat value', async () => {
          const getInternalAccounts = jest.fn();
          const { decorator } = getCaveatSpecifications({
            getInternalAccounts,
          })[CaveatTypes.restrictReturnedAccounts];

          const method = async () => ['0x1', '0x2', '0x3'];
          const caveat = {
            type: CaveatTypes.restrictReturnedAccounts,
            value: ['0x5'],
          };
          const decorated = decorator(method, caveat);
          expect(await decorated()).toStrictEqual([]);
        });

        it('returns an empty array if the method result is an empty array', async () => {
          const getInternalAccounts = jest.fn();
          const { decorator } = getCaveatSpecifications({
            getInternalAccounts,
          })[CaveatTypes.restrictReturnedAccounts];

          const method = async () => [];
          const caveat = {
            type: CaveatTypes.restrictReturnedAccounts,
            value: ['0x1', '0x2'],
          };
          const decorated = decorator(method, caveat);
          expect(await decorated()).toStrictEqual([]);
        });
      });

      describe('validator', () => {
        it('rejects invalid array values', () => {
          const getInternalAccounts = jest.fn();
          const { validator } = getCaveatSpecifications({
            getInternalAccounts,
          })[CaveatTypes.restrictReturnedAccounts];

          [null, 'foo', {}, []].forEach((invalidValue) => {
            expect(() => validator({ value: invalidValue })).toThrow(
              /Expected non-empty array of Ethereum addresses\.$/u,
            );
          });
        });

        it('rejects falsy or non-string addresses', () => {
          const getInternalAccounts = jest.fn();
          const { validator } = getCaveatSpecifications({
            getInternalAccounts,
          })[CaveatTypes.restrictReturnedAccounts];

          [[{}], [[]], [null], ['']].forEach((invalidValue) => {
            expect(() => validator({ value: invalidValue })).toThrow(
              /Expected an array of Ethereum addresses. Received:/u,
            );
          });
        });

        it('rejects addresses that have no corresponding identity', () => {
          const getInternalAccounts = jest.fn().mockImplementationOnce(() => {
            return [
              {
                address: '0x1',
                id: '21066553-d8c8-4cdc-af33-efc921cd3ca9',
                metadata: {
                  name: 'Test Account 1',
                  lastSelected: 1,
                  keyring: {
                    type: 'HD Key Tree',
                  },
                },
                options: {},
                methods: ETH_EOA_METHODS,
                type: EthAccountType.Eoa,
              },
              {
                address: '0x3',
                id: 'ff8fda69-d416-4d25-80a2-efb77bc7d4ad',
                metadata: {
                  name: 'Test Account 3',
                  lastSelected: 3,
                  keyring: {
                    type: 'HD Key Tree',
                  },
                },
                options: {},
                methods: ETH_EOA_METHODS,
                type: EthAccountType.Eoa,
              },
            ];
          });

          const { validator } = getCaveatSpecifications({
            getInternalAccounts,
          })[CaveatTypes.restrictReturnedAccounts];

          expect(() => validator({ value: ['0x1', '0x2', '0x3'] })).toThrow(
            /Received unrecognized address:/u,
          );
        });
      });

      describe('merger', () => {
        it.each([
          {
            left: [],
            right: [],
            expected: [[], []],
          },
          {
            left: ['0x1'],
            right: [],
            expected: [['0x1'], []],
          },
          {
            left: [],
            right: ['0x1'],
            expected: [['0x1'], ['0x1']],
          },
          {
            left: ['0x1', '0x2'],
            right: ['0x1', '0x2'],
            expected: [['0x1', '0x2'], []],
          },
          {
            left: ['0x1', '0x2'],
            right: ['0x2', '0x3'],
            expected: [['0x1', '0x2', '0x3'], ['0x3']],
          },
          {
            left: ['0x1', '0x2'],
            right: ['0x3', '0x4'],
            expected: [
              ['0x1', '0x2', '0x3', '0x4'],
              ['0x3', '0x4'],
            ],
          },
          {
            left: [{ a: 1 }, { b: 2 }],
            right: [{ a: 1 }],
            expected: [[{ a: 1 }, { b: 2 }, { a: 1 }], [{ a: 1 }]],
          },
        ])('merges arrays as expected', ({ left, right, expected }) => {
          const { merger } = getCaveatSpecifications({})[
            CaveatTypes.restrictReturnedAccounts
          ];

          expect(merger(left, right)).toStrictEqual(expected);
        });
      });
    });
  });

  describe('permission specifications', () => {
    it('getPermissionSpecifications returns the expected specifications object', () => {
      const permissionSpecifications = getPermissionSpecifications({});
      expect(Object.keys(permissionSpecifications)).toHaveLength(2);
      expect(
        permissionSpecifications[RestrictedMethods.eth_accounts].targetName,
      ).toStrictEqual(RestrictedMethods.eth_accounts);
      expect(
        permissionSpecifications[PermissionNames.permittedChains].targetName,
      ).toStrictEqual('endowment:permitted-chains');
    });

    describe('eth_accounts', () => {
      describe('factory', () => {
        it('constructs a valid eth_accounts permission, using permissionOptions', () => {
          const getInternalAccounts = jest.fn();
          const getAllAccounts = jest.fn();
          const { factory } = getPermissionSpecifications({
            getInternalAccounts,
            getAllAccounts,
          })[RestrictedMethods.eth_accounts];

          expect(
            factory({
              invoker: 'foo.bar',
              target: 'eth_accounts',
              caveats: [
                CaveatFactories[CaveatTypes.restrictReturnedAccounts](['0x1']),
              ],
            }),
          ).toStrictEqual({
            caveats: [
              {
                type: CaveatTypes.restrictReturnedAccounts,
                value: ['0x1'],
              },
            ],
            date: 1,
            id: expect.any(String),
            invoker: 'foo.bar',
            parentCapability: 'eth_accounts',
          });
        });

        it('constructs a valid eth_accounts permission, using requestData.approvedAccounts', () => {
          const getInternalAccounts = jest.fn();
          const getAllAccounts = jest.fn();
          const { factory } = getPermissionSpecifications({
            getInternalAccounts,
            getAllAccounts,
          })[RestrictedMethods.eth_accounts];

          expect(
            factory(
              { invoker: 'foo.bar', target: 'eth_accounts' },
              { approvedAccounts: ['0x1'] },
            ),
          ).toStrictEqual({
            caveats: [
              {
                type: CaveatTypes.restrictReturnedAccounts,
                value: ['0x1'],
              },
            ],
            date: 1,
            id: expect.any(String),
            invoker: 'foo.bar',
            parentCapability: 'eth_accounts',
          });
        });

        it('throws if requestData is defined but approvedAccounts is not specified', () => {
          const getInternalAccounts = jest.fn();
          const getAllAccounts = jest.fn();
          const { factory } = getPermissionSpecifications({
            getInternalAccounts,
            getAllAccounts,
          })[RestrictedMethods.eth_accounts];

          expect(() =>
            factory(
              { invoker: 'foo.bar', target: 'eth_accounts' },
              {}, // no approvedAccounts
            ),
          ).toThrow(/No approved accounts specified\.$/u);
        });

        it('prefers requestData.approvedAccounts over a specified caveat', () => {
          const getInternalAccounts = jest.fn();
          const getAllAccounts = jest.fn();
          const { factory } = getPermissionSpecifications({
            getInternalAccounts,
            getAllAccounts,
          })[RestrictedMethods.eth_accounts];

          expect(
            factory(
              {
                caveats: [
                  CaveatFactories[CaveatTypes.restrictReturnedAccounts]([
                    '0x1',
                    '0x2',
                  ]),
                ],
                invoker: 'foo.bar',
                target: 'eth_accounts',
              },
              { approvedAccounts: ['0x1', '0x3'] },
            ),
          ).toStrictEqual({
            caveats: [
              {
                type: CaveatTypes.restrictReturnedAccounts,
                value: ['0x1', '0x3'],
              },
            ],
            date: 1,
            id: expect.any(String),
            invoker: 'foo.bar',
            parentCapability: 'eth_accounts',
          });
        });
      });

      describe('methodImplementation', () => {
        it('returns the keyring accounts in lastSelected order', async () => {
          const getInternalAccounts = jest.fn().mockImplementationOnce(() => {
            return [
              {
                address: '0x7A2Bd22810088523516737b4Dc238A4bC37c23F2',
                id: '21066553-d8c8-4cdc-af33-efc921cd3ca9',
                metadata: {
                  name: 'Test Account',
                  lastSelected: 1,
                  keyring: {
                    type: 'HD Key Tree',
                  },
                },
                options: {},
                methods: ETH_EOA_METHODS,
                type: EthAccountType.Eoa,
              },
              {
                address: '0x7152f909e5EB3EF198f17e5Cb087c5Ced88294e3',
                id: '0bd7348e-bdfe-4f67-875c-de831a583857',
                metadata: {
                  name: 'Test Account',
                  keyring: {
                    type: 'HD Key Tree',
                  },
                },
                options: {},
                methods: ETH_EOA_METHODS,
                type: EthAccountType.Eoa,
              },
              {
                address: '0xDe70d2FF1995DC03EF1a3b584e3ae14da020C616',
                id: 'ff8fda69-d416-4d25-80a2-efb77bc7d4ad',
                metadata: {
                  name: 'Test Account',
                  keyring: {
                    type: 'HD Key Tree',
                  },
                  lastSelected: 3,
                },
                options: {},
                methods: ETH_EOA_METHODS,
                type: EthAccountType.Eoa,
              },
              {
                address: '0x04eBa9B766477d8eCA77F5f0e67AE1863C95a7E3',
                id: '0bd7348e-bdfe-4f67-875c-de831a583857',
                metadata: {
                  name: 'Test Account',
                  lastSelected: 3,
                  keyring: {
                    type: 'HD Key Tree',
                  },
                },
                options: {},
                methods: ETH_EOA_METHODS,
                type: EthAccountType.Eoa,
              },
            ];
          });
          const getAllAccounts = jest
            .fn()
            .mockImplementationOnce(() => [
              '0x7A2Bd22810088523516737b4Dc238A4bC37c23F2',
              '0x7152f909e5EB3EF198f17e5Cb087c5Ced88294e3',
              '0xDe70d2FF1995DC03EF1a3b584e3ae14da020C616',
              '0x04eBa9B766477d8eCA77F5f0e67AE1863C95a7E3',
            ]);

          const { methodImplementation } = getPermissionSpecifications({
            getInternalAccounts,
            getAllAccounts,
          })[RestrictedMethods.eth_accounts];

          expect(await methodImplementation()).toStrictEqual([
            '0xDe70d2FF1995DC03EF1a3b584e3ae14da020C616',
            '0x04eBa9B766477d8eCA77F5f0e67AE1863C95a7E3',
            '0x7A2Bd22810088523516737b4Dc238A4bC37c23F2',
            '0x7152f909e5EB3EF198f17e5Cb087c5Ced88294e3',
          ]);
        });

        it('throws if a keyring account is missing an address (case 1)', async () => {
          const getInternalAccounts = jest.fn().mockImplementationOnce(() => {
            return [
              {
                address: '0x7152f909e5EB3EF198f17e5Cb087c5Ced88294e3',
                id: '0bd7348e-bdfe-4f67-875c-de831a583857',
                metadata: {
                  name: 'Test Account',
                  lastSelected: 2,
                  keyring: {
                    type: 'HD Key Tree',
                  },
                },
                options: {},
                methods: ETH_EOA_METHODS,
                type: EthAccountType.Eoa,
              },
              {
                address: '0xDe70d2FF1995DC03EF1a3b584e3ae14da020C616',
                id: 'ff8fda69-d416-4d25-80a2-efb77bc7d4ad',
                metadata: {
                  name: 'Test Account',
                  lastSelected: 3,
                  keyring: {
                    type: 'HD Key Tree',
                  },
                },
                options: {},
                methods: ETH_EOA_METHODS,
                type: EthAccountType.Eoa,
              },
            ];
          });
          const getAllAccounts = jest
            .fn()
            .mockImplementationOnce(() => [
              '0x7A2Bd22810088523516737b4Dc238A4bC37c23F2',
              '0x7152f909e5EB3EF198f17e5Cb087c5Ced88294e3',
              '0xDe70d2FF1995DC03EF1a3b584e3ae14da020C616',
            ]);

          const { methodImplementation } = getPermissionSpecifications({
            getInternalAccounts,
            getAllAccounts,
            captureKeyringTypesWithMissingIdentities: jest.fn(),
          })[RestrictedMethods.eth_accounts];

          await expect(() => methodImplementation()).rejects.toThrow(
            'Missing identity for address: "0x7A2Bd22810088523516737b4Dc238A4bC37c23F2".',
          );
        });

        it('throws if a keyring account is missing an address (case 2)', async () => {
          const getInternalAccounts = jest.fn().mockImplementationOnce(() => {
            return [
              {
                address: '0x7A2Bd22810088523516737b4Dc238A4bC37c23F2',
                id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                metadata: {
                  name: 'Test Account',
                  lastSelected: 1,
                  keyring: {
                    type: 'HD Key Tree',
                  },
                },
                options: {},
                methods: ETH_EOA_METHODS,
                type: EthAccountType.Eoa,
              },
              {
                address: '0xDe70d2FF1995DC03EF1a3b584e3ae14da020C616',
                id: 'ff8fda69-d416-4d25-80a2-efb77bc7d4ad',
                metadata: {
                  name: 'Test Account',
                  lastSelected: 3,
                  keyring: {
                    type: 'HD Key Tree',
                  },
                },
                options: {},
                methods: ETH_EOA_METHODS,
                type: EthAccountType.Eoa,
              },
            ];
          });
          const getAllAccounts = jest
            .fn()
            .mockImplementationOnce(() => [
              '0x7A2Bd22810088523516737b4Dc238A4bC37c23F2',
              '0x7152f909e5EB3EF198f17e5Cb087c5Ced88294e3',
              '0xDe70d2FF1995DC03EF1a3b584e3ae14da020C616',
            ]);

          const { methodImplementation } = getPermissionSpecifications({
            getInternalAccounts,
            getAllAccounts,
            captureKeyringTypesWithMissingIdentities: jest.fn(),
          })[RestrictedMethods.eth_accounts];

          await expect(() => methodImplementation()).rejects.toThrow(
            'Missing identity for address: "0x7152f909e5EB3EF198f17e5Cb087c5Ced88294e3".',
          );
        });
      });

      describe('validator', () => {
        it('accepts valid permissions', () => {
          const getInternalAccounts = jest.fn();
          const getAllAccounts = jest.fn();
          const { validator } = getPermissionSpecifications({
            getInternalAccounts,
            getAllAccounts,
          })[RestrictedMethods.eth_accounts];

          expect(() =>
            validator({
              caveats: [
                {
                  type: CaveatTypes.restrictReturnedAccounts,
                  value: ['0x1', '0x2'],
                },
              ],
              date: 1,
              id: expect.any(String),
              invoker: 'foo.bar',
              parentCapability: 'eth_accounts',
            }),
          ).not.toThrow();
        });

        it('rejects invalid caveats', () => {
          const getInternalAccounts = jest.fn();
          const getAllAccounts = jest.fn();
          const { validator } = getPermissionSpecifications({
            getInternalAccounts,
            getAllAccounts,
          })[RestrictedMethods.eth_accounts];

          [null, [], [1, 2], [{ type: 'foobar' }]].forEach(
            (invalidCaveatsValue) => {
              expect(() =>
                validator({
                  caveats: invalidCaveatsValue,
                  date: 1,
                  id: expect.any(String),
                  invoker: 'foo.bar',
                  parentCapability: 'eth_accounts',
                }),
              ).toThrow(/Invalid caveats./u);
            },
          );
        });
      });
    });
  });

  describe('unrestricted methods', () => {
    it('defines the unrestricted methods', () => {
      expect(Array.isArray(unrestrictedMethods)).toBe(true);
      expect(Object.isFrozen(unrestrictedMethods)).toBe(true);
    });
  });
});
