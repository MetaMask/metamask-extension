import {
  CaveatMutatorOperation,
  PermissionType,
  SubjectType,
} from '@metamask/permission-controller';

import {
  Caip25CaveatType,
  Caip25CaveatValue,
  caip25EndowmentBuilder,
  Caip25EndowmentPermissionName,
  Caip25CaveatMutatorFactories,
  removeScope,
} from './caip25permissions';

const { removeAccount } = Caip25CaveatMutatorFactories[Caip25CaveatType];

describe('endowment:caip25', () => {
  it('builds the expected permission specification', () => {
    const specification = caip25EndowmentBuilder.specificationBuilder({});
    expect(specification).toStrictEqual({
      permissionType: PermissionType.Endowment,
      targetName: Caip25EndowmentPermissionName,
      endowmentGetter: expect.any(Function),
      allowedCaveats: [Caip25CaveatType],
      subjectTypes: [SubjectType.Website],
      validator: expect.any(Function),
    });

    expect(specification.endowmentGetter()).toBeNull();
  });
  describe('caveat mutator removeScope', () => {
    it('can remove a caveat', () => {
      const ethereumGoerliCaveat = {
        requiredScopes: {
          'eip155:1': {
            methods: ['eth_call'],
            notifications: ['chainChanged'],
          },
        },
        optionalScopes: {
          'eip155:5': {
            methods: ['eth_call'],
            notifications: ['accountsChanged'],
          },
        },
        sessionProperties: {},
      };
      const result = removeScope('eip155:5', ethereumGoerliCaveat);
      expect(result).toStrictEqual({
        operation: CaveatMutatorOperation.updateValue,
        value: {
          requiredScopes: {
            'eip155:1': {
              methods: ['eth_call'],
              notifications: ['chainChanged'],
            },
          },
          optionalScopes: {},
        },
      });
    });
    it('can revoke the entire permission when a requiredScope is removed', () => {
      const ethereumGoerliCaveat = {
        requiredScopes: {
          'eip155:1': {
            methods: ['eth_call'],
            notifications: ['chainChanged'],
          },
        },
        optionalScopes: {
          'eip155:5': {
            methods: ['eth_call'],
            notifications: ['accountsChanged'],
          },
        },
        sessionProperties: {},
      };
      const result = removeScope('eip155:1', ethereumGoerliCaveat);
      expect(result).toStrictEqual({
        operation: CaveatMutatorOperation.revokePermission,
      });
    });
    it('can noop when nothing is removed', () => {
      const ethereumGoerliCaveat = {
        requiredScopes: {
          'eip155:1': {
            methods: ['eth_call'],
            notifications: ['chainChanged'],
          },
        },
        optionalScopes: {
          'eip155:5': {
            methods: ['eth_call'],
            notifications: ['accountsChanged'],
          },
        },
        sessionProperties: {},
      };
      const result = removeScope('eip155:2', ethereumGoerliCaveat);
      expect(result).toStrictEqual({
        operation: CaveatMutatorOperation.noop,
      });
    });
  });
  describe('caveat mutator removeAccount', () => {
    it('can remove an account', () => {
      const ethereumGoerliCaveat: Caip25CaveatValue = {
        requiredScopes: {
          'eip155:1': {
            methods: ['eth_call'],
            notifications: ['chainChanged'],
            accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
          },
        },
        optionalScopes: {},
      };
      const result = removeAccount('0x1', ethereumGoerliCaveat);
      expect(result).toStrictEqual({
        operation: CaveatMutatorOperation.updateValue,
        value: {
          requiredScopes: {
            'eip155:1': {
              methods: ['eth_call'],
              notifications: ['chainChanged'],
              accounts: ['eip155:1:0x2'],
            },
          },
          optionalScopes: {},
        },
      });
    });
    it('can remove an account in multiple scopes in optional and required', () => {
      const ethereumGoerliCaveat: Caip25CaveatValue = {
        requiredScopes: {
          'eip155:1': {
            methods: ['eth_call'],
            notifications: ['chainChanged'],
            accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
          },
          'eip155:2': {
            methods: ['eth_call'],
            notifications: ['chainChanged'],
            accounts: ['eip155:2:0x1', 'eip155:2:0x2'],
          },
        },
        optionalScopes: {
          'eip155:3': {
            methods: ['eth_call'],
            notifications: ['chainChanged'],
            accounts: ['eip155:3:0x1', 'eip155:3:0x2'],
          },
        },
      };
      const result = removeAccount('0x1', ethereumGoerliCaveat);
      expect(result).toStrictEqual({
        operation: CaveatMutatorOperation.updateValue,
        value: {
          requiredScopes: {
            'eip155:1': {
              methods: ['eth_call'],
              notifications: ['chainChanged'],
              accounts: ['eip155:1:0x2'],
            },
            'eip155:2': {
              methods: ['eth_call'],
              notifications: ['chainChanged'],
              accounts: ['eip155:2:0x2'],
            },
          },
          optionalScopes: {
            'eip155:3': {
              methods: ['eth_call'],
              notifications: ['chainChanged'],
              accounts: ['eip155:3:0x2'],
            },
          },
        },
      });
    });
    it('can noop when nothing is removed', () => {
      const ethereumGoerliCaveat: Caip25CaveatValue = {
        requiredScopes: {
          'eip155:1': {
            methods: ['eth_call'],
            notifications: ['chainChanged'],
            accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
          },
        },
        optionalScopes: {
          'eip155:5': {
            methods: ['eth_call'],
            notifications: ['accountsChanged'],
          },
        },
      };
      const result = removeAccount('0x3', ethereumGoerliCaveat);
      expect(result).toStrictEqual({
        operation: CaveatMutatorOperation.noop,
      });
    });
  });
});
