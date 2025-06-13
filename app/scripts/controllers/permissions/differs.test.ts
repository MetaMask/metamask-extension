import {
  diffMap,
  getChangedAuthorizations,
  getRemovedAuthorizations,
} from './differs';

describe('PermissionController selectors', () => {
  describe('diffMap', () => {
    it('returns the new value if the previous value is undefined', () => {
      const newAccounts = new Map([['foo.bar', ['0x1']]]);
      expect(diffMap(newAccounts, undefined)).toBe(newAccounts);
    });

    it('returns an empty map if the new and previous values are the same', () => {
      const newAccounts = new Map([['foo.bar', ['0x1']]]);
      expect(diffMap(newAccounts, newAccounts)).toStrictEqual(new Map());
    });

    it('returns a new map of the changed key/value pairs if the new and previous maps differ', () => {
      // We set this on the new and previous value under the key 'foo.bar' to
      // check that identical values are excluded.
      const identicalValue = ['0x1'];

      const previousAccounts = new Map([
        ['bar.baz', ['0x1']], // included: different accounts
        ['fizz.buzz', ['0x1']], // included: removed in new value
      ]);
      previousAccounts.set('foo.bar', identicalValue);

      const newAccounts = new Map([
        ['bar.baz', ['0x1', '0x2']], // included: different accounts
        ['baz.fizz', ['0x3']], // included: brand new
      ]);
      newAccounts.set('foo.bar', identicalValue);

      expect(diffMap(newAccounts, previousAccounts)).toStrictEqual(
        new Map([
          ['bar.baz', ['0x1', '0x2']],
          ['fizz.buzz', []],
          ['baz.fizz', ['0x3']],
        ]),
      );
    });
  });

  describe('getChangedAuthorizations', () => {
    it('returns an empty map if the previous value is undefined', () => {
      expect(getChangedAuthorizations(new Map(), undefined)).toStrictEqual(
        new Map(),
      );
    });

    it('returns an empty map if the new and previous values are the same', () => {
      const newAuthorizations = new Map();
      expect(
        getChangedAuthorizations(newAuthorizations, newAuthorizations),
      ).toStrictEqual(new Map());
    });

    it('returns a new map of the current values of changed scopes but excluding removed scopes in authorizations', () => {
      const previousAuthorizations = new Map([
        [
          'foo.bar',
          {
            requiredScopes: {
              'eip155:1': {
                accounts: ['eip155:1:0xdead' as const],
              },
            },
            optionalScopes: {
              'eip155:5': {
                accounts: [],
              },
              'eip155:10': {
                accounts: [],
              },
            },
            isMultichainOrigin: true,
            sessionProperties: {},
          },
        ],
      ]);

      const newAuthorizations = new Map([
        [
          'foo.bar',
          {
            requiredScopes: {
              'eip155:1': {
                accounts: ['eip155:1:0xbeef' as const],
              },
            },
            optionalScopes: {
              'eip155:5': {
                accounts: ['eip155:5:0x123' as const],
              },
            },
            isMultichainOrigin: true,
            sessionProperties: {},
          },
        ],
      ]);

      expect(
        getChangedAuthorizations(newAuthorizations, previousAuthorizations),
      ).toStrictEqual(
        new Map([
          [
            'foo.bar',
            {
              requiredScopes: {
                'eip155:1': {
                  accounts: ['eip155:1:0xbeef'],
                },
              },
              optionalScopes: {
                'eip155:5': {
                  accounts: ['eip155:5:0x123'],
                },
              },
            },
          ],
        ]),
      );
    });

    it('returns a new map with empty requiredScopes and optionalScopes for revoked authorizations', () => {
      const previousAuthorizations = new Map([
        [
          'foo.bar',
          {
            requiredScopes: {
              'eip155:1': {
                accounts: ['eip155:1:0xdead' as const],
              },
            },
            optionalScopes: {
              'eip155:5': {
                accounts: [],
              },
              'eip155:10': {
                accounts: [],
              },
            },
            isMultichainOrigin: true,
            sessionProperties: {},
          },
        ],
      ]);

      const newAuthorizations = new Map();

      expect(
        getChangedAuthorizations(newAuthorizations, previousAuthorizations),
      ).toStrictEqual(
        new Map([
          [
            'foo.bar',
            {
              requiredScopes: {},
              optionalScopes: {},
            },
          ],
        ]),
      );
    });
  });

  describe('getRemovedAuthorizations', () => {
    it('returns an empty map if the previous value is undefined', () => {
      expect(getRemovedAuthorizations(new Map(), undefined)).toStrictEqual(
        new Map(),
      );
    });

    it('returns an empty map if the new and previous values are the same', () => {
      const newAuthorizations = new Map();
      expect(
        getRemovedAuthorizations(newAuthorizations, newAuthorizations),
      ).toStrictEqual(new Map());
    });

    it('returns a new map of the removed scopes in authorizations', () => {
      const previousAuthorizations = new Map([
        [
          'foo.bar',
          {
            requiredScopes: {
              'eip155:1': {
                accounts: [],
              },
            },
            optionalScopes: {
              'eip155:5': {
                accounts: [],
              },
              'eip155:10': {
                accounts: [],
              },
            },
            isMultichainOrigin: true,
            sessionProperties: {},
          },
        ],
      ]);

      const newAuthorizations = new Map([
        [
          'foo.bar',
          {
            requiredScopes: {
              'eip155:1': {
                accounts: [],
              },
            },
            optionalScopes: {
              'eip155:10': {
                accounts: [],
              },
            },
            isMultichainOrigin: true,
            sessionProperties: {},
          },
        ],
      ]);

      expect(
        getRemovedAuthorizations(newAuthorizations, previousAuthorizations),
      ).toStrictEqual(
        new Map([
          [
            'foo.bar',
            {
              requiredScopes: {},
              optionalScopes: {
                'eip155:5': {
                  accounts: [],
                },
              },
            },
          ],
        ]),
      );
    });

    it('returns a new map of the revoked authorizations', () => {
      const mockAuthorization = {
        requiredScopes: {
          'eip155:1': {
            accounts: [],
          },
        },
        optionalScopes: {},
        isMultichainOrigin: true,
        sessionProperties: {},
      };
      const previousAuthorizations = new Map([
        ['foo.bar', mockAuthorization],
        ['bar.baz', mockAuthorization],
      ]);

      const newAuthorizations = new Map([['foo.bar', mockAuthorization]]);

      expect(
        getRemovedAuthorizations(newAuthorizations, previousAuthorizations),
      ).toStrictEqual(new Map([['bar.baz', mockAuthorization]]));
    });
  });
});
