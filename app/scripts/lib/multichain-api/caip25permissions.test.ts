import {
  CaveatMutatorOperation,
  PermissionType,
  SubjectType,
} from '@metamask/permission-controller';

import {
  Caip25CaveatType,
  caip25EndowmentBuilder,
  Caip25EndowmentPermissionName,
  removeScope,
} from './caip25permissions';

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
});
