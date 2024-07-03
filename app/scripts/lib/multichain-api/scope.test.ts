import { isValidScope } from "./scope"

// TODO: name this better when we rename the scope.ts file lol
describe('Scope utils', () => {
  describe('isValidScope', () => {
    it('returns false if the scopeString is neither a CAIP namespace or CAIP chainId', () =>{
      expect(
        isValidScope('not a namespace or a caip chain id', {
          methods: [],
          notifications: []
        })
      ).toStrictEqual(false)
    })

    it('returns false if the scopeString is a CAIP chainId but scopes is nonempty', () =>{
      expect(
        isValidScope('eip155:1', {
          scopes: ['eip155:5'],
          methods: [],
          notifications: []
        })
      ).toStrictEqual(false)
    })

    it('returns false if the scopeString is a CAIP namespace but scopes contains CAIP chainIds for a different namespace', () =>{
      expect(
        isValidScope('eip155:1', {
          scopes: ['eip155:5', 'bip122:000000000019d6689c085ae165831e93'],
          methods: [],
          notifications: []
        })
      ).toStrictEqual(false)
    })

    it('returns false if methods contains value other than non-empty string', () =>{
      expect(
        isValidScope('eip155:1', {
          methods: [''],
          notifications: []
        })
      ).toStrictEqual(false)

      expect(
        isValidScope('eip155:1', {
          methods: [{foo: 'bar'} as any],
          notifications: []
        })
      ).toStrictEqual(false)
    })

    it('returns false if notifications contains value other than non-empty string', () =>{
      expect(
        isValidScope('eip155:1', {
          methods: [],
          notifications: ['']
        })
      ).toStrictEqual(false)

      expect(
        isValidScope('eip155:1', {
          methods: [{foo: 'bar'} as any],
          notifications: [{foo: 'bar'} as any],
        })
      ).toStrictEqual(false)
    })

    it('returns false when unexpected properties are defined', () => {
      expect(
        isValidScope('eip155:1', {
          methods: [],
          notifications: [],
          unexpectedParam: 'foobar'
        } as any)
      ).toStrictEqual(false)
    })

    it('returns true when no unexpected properties are defined', () => {
      expect(
        isValidScope('eip155', {
          methods: [],
          notifications: [],
          accounts: [],
          rpcDocuments: [],
          rpcEndpoints: [],
        })
      ).toStrictEqual(true)
    })
  })
})
