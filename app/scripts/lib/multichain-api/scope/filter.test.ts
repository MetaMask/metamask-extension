import * as Assert from './assert';
import { filterScopesSupported } from './filter';

jest.mock('./assert', () => ({
  assertScopeSupported: jest.fn(),
}));
const MockAssert = jest.mocked(Assert);

describe('filter', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('filterScopesSupported', () => {
    const isChainIdSupported = jest.fn();

    it('checks if each scope is supported', () => {
      filterScopesSupported(
        {
          'eip155:1': {
            methods: ['a'],
            notifications: [],
          },
          'eip155:5': {
            methods: ['b'],
            notifications: [],
          },
        },
        { isChainIdSupported },
      );

      expect(MockAssert.assertScopeSupported).toHaveBeenCalledWith(
        'eip155:1',
        {
          methods: ['a'],
          notifications: [],
        },
        { isChainIdSupported },
      );
      expect(MockAssert.assertScopeSupported).toHaveBeenCalledWith(
        'eip155:5',
        {
          methods: ['b'],
          notifications: [],
        },
        { isChainIdSupported },
      );
    });

    it('includes only supported scopes', () => {
      MockAssert.assertScopeSupported.mockImplementation((scopeString) => {
        if (scopeString === 'eip155:1') {
          throw new Error('scope not supported');
        }
      });

      expect(
        filterScopesSupported(
          {
            'eip155:1': {
              methods: ['a'],
              notifications: [],
            },
            'eip155:5': {
              methods: ['b'],
              notifications: [],
            },
          },
          { isChainIdSupported },
        ),
      ).toStrictEqual({
        'eip155:5': {
          methods: ['b'],
          notifications: [],
        },
      });
    });
  });
});
