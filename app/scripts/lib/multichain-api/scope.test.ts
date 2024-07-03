import { ScopeObject, isValidScope } from './scope';

// TODO: name this better when we rename the scope.ts file lol
describe('Scope utils', () => {
  describe('isValidScope', () => {
    const validScopeString = 'eip155:1';
    const validScopeObject: ScopeObject = {
      methods: [],
      notifications: [],
    };

    it.each([
      [
        false,
        'the scopeString is neither a CAIP namespace or CAIP chainId',
        'not a namespace or a caip chain id',
        validScopeObject,
      ],
      [
        true,
        'the scopeString is a valid CAIP namespace and the scopeObject is valid',
        'eip155',
        validScopeObject,
      ],
      [
        true,
        'the scopeString is a valid CAIP chainId and the scopeObject is valid',
        'eip155:1',
        validScopeObject,
      ],
      [
        false,
        'the scopeString is a CAIP chainId but scopes is nonempty',
        'eip155:1',
        {
          ...validScopeObject,
          scopes: ['eip155:5'],
        },
      ],
      [
        false,
        'the scopeString is a CAIP namespace but scopes contains CAIP chainIds for a different namespace',
        'eip155:1',
        {
          ...validScopeObject,
          scopes: ['eip155:5', 'bip122:000000000019d6689c085ae165831e93'],
        },
      ],
      [
        true,
        'the scopeString is a CAIP namespace and scopes contains CAIP chainIds for only the same namespace',
        'eip155',
        {
          ...validScopeObject,
          scopes: ['eip155:5', 'eip155:64'],
        },
      ],
      [
        false,
        'methods contains empty string',
        validScopeString,
        {
          ...validScopeObject,
          methods: [''],
        },
      ],
      [
        false,
        'methods contains non-string',
        validScopeString,
        {
          ...validScopeObject,
          methods: [{ foo: 'bar' }],
        },
      ],
      [
        true,
        'methods contains only strings',
        validScopeString,
        {
          ...validScopeObject,
          methods: ['method1', 'method2'],
        },
      ],
      [
        false,
        'notifications contains empty string',
        validScopeString,
        {
          ...validScopeObject,
          notifications: [''],
        },
      ],
      [
        false,
        'notifications contains non-string',
        validScopeString,
        {
          ...validScopeObject,
          notifications: [{ foo: 'bar' }],
        },
      ],
      [
        false,
        'notifications contains non-string',
        'eip155:1',
        {
          ...validScopeObject,
          notifications: [{ foo: 'bar' }],
        },
      ],
      [
        false,
        'unexpected properties are defined',
        validScopeString,
        {
          ...validScopeObject,
          unexpectedParam: 'foobar',
        },
      ],
      [
        true,
        'only expected properties are defined',
        validScopeString,
        {
          scopes: [],
          methods: [],
          notifications: [],
          accounts: [],
          rpcDocuments: [],
          rpcEndpoints: [],
        },
      ],
    ])(
      'returns %s when %s',
      (
        expected: boolean,
        _scenario: string,
        scopeString: string,
        scopeObject: ScopeObject,
      ) => {
        expect(isValidScope(scopeString, scopeObject)).toStrictEqual(expected);
      },
    );
  });
});
