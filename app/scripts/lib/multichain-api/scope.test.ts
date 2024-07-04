import { ScopeObject, flattenScope, isSupportedNotification, isSupportedScopeString, isValidScope } from './scope';

const validScopeObject: ScopeObject = {
  methods: [],
  notifications: [],
};


// TODO: name this better when we rename the scope.ts file lol
describe('Scope utils', () => {
  describe('isValidScope', () => {
    const validScopeString = 'eip155:1';

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

  it('isSupportedNotification', () => {
    expect(isSupportedNotification('accountsChanged')).toStrictEqual(true)
    expect(isSupportedNotification('chainChanged')).toStrictEqual(true)
    expect(isSupportedNotification('anything else')).toStrictEqual(false)
    expect(isSupportedNotification('')).toStrictEqual(false)
  })

  describe('isSupportedScopeString', () => {
    it('returns true for the wallet namespace', () => {
      expect(isSupportedScopeString('wallet')).toStrictEqual(true)
    })

    it('returns false for the wallet namespace when a reference is included', () => {
      expect(isSupportedScopeString('wallet:someref')).toStrictEqual(false)
    })

    it('returns true for the ethereum namespace', () => {
      expect(isSupportedScopeString('eip155')).toStrictEqual(true)
    })

    it('returns true for the ethereum namespace when a network client exists for the reference', () => {
      const findNetworkClientIdByChainIdMock = jest.fn().mockReturnValue('networkClientId')
      expect(isSupportedScopeString('eip155:1', findNetworkClientIdByChainIdMock)).toStrictEqual(true)
    })

    it('returns false for the ethereum namespace when a network client does not exist for the reference', () => {
      const findNetworkClientIdByChainIdMock = jest.fn().mockImplementation(() => {
        throw new Error('failed to find network client for chainId');
      });
      expect(isSupportedScopeString('eip155:1', findNetworkClientIdByChainIdMock)).toStrictEqual(false)
    })

    it('returns false for the ethereum namespace when a reference is defined but findNetworkClientIdByChainId param is not provided', () => {
      expect(isSupportedScopeString('eip155:1')).toStrictEqual(false)
    })
  })

  describe('flattenScope', () => {
    it('returns the scope as is when the scopeString is chain scoped', () => {
      expect(flattenScope('eip155:1', validScopeObject)).toStrictEqual({
        'eip155:1': validScopeObject
      })
    })

    describe('scopeString is namespace scoped', () => {
      it('returns one scope per `scopes` element with `scopes` excluded from the scopeObject', () => {
        expect(flattenScope('eip155', {
          ...validScopeObject,
          scopes: ['eip155:1', 'eip155:5', 'eip155:64'],
        })).toStrictEqual({
          'eip155:1': validScopeObject,
          'eip155:5': validScopeObject,
          'eip155:64': validScopeObject
        })
      })
    })
  })
});
