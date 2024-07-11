import { parseScopeString } from './scope';

describe('Scope', () => {
  describe('parseScopeString', () => {
    it('returns only the namespace if scopeString is namespace', () => {
      expect(parseScopeString('abc')).toStrictEqual({ namespace: 'abc' });
    });

    it('returns the namespace and reference if scopeString is a CAIP chain ID ', () => {
      expect(parseScopeString('abc:foo')).toStrictEqual({
        namespace: 'abc',
        reference: 'foo',
      });
    });

    it('returns empty object if scopeString is invalid', () => {
      expect(parseScopeString('')).toStrictEqual({});
      expect(parseScopeString('a:')).toStrictEqual({});
      expect(parseScopeString(':b')).toStrictEqual({});
      expect(parseScopeString('a:b:c')).toStrictEqual({});
    });
  });
});
