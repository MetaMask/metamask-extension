import { ExternalScopeObject } from '@metamask/multichain/scope/scope';
import * as Validation from './validation';
import { processScopedProperties } from './authorization';

jest.mock('./validation', () => ({
  validateScopedPropertyEip3085: jest.fn(),
  validateScopes: jest.fn(),
}));
const MockValidation = jest.mocked(Validation);

const validScopeObject: ExternalScopeObject = {
  methods: [],
  notifications: [],
};

describe('Scope Authorization', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('processScopedProperties', () => {
    it('excludes scopeStrings that are not defined in either required or optional scopes', () => {
      expect(
        processScopedProperties(
          {
            'eip155:1': validScopeObject,
          },
          {
            'eip155:5': validScopeObject,
          },
          {
            'eip155:10': {},
          },
        ),
      ).toStrictEqual({});
    });

    it('includes scopeStrings that are defined in either required or optional scopes', () => {
      expect(
        processScopedProperties(
          {
            'eip155:1': validScopeObject,
          },
          {
            'eip155:5': validScopeObject,
          },
          {
            'eip155:1': {},
            'eip155:5': {},
          },
        ),
      ).toStrictEqual({
        'eip155:1': {},
        'eip155:5': {},
      });
    });

    it('validates eip3085 properties', () => {
      processScopedProperties(
        {
          'eip155:1': validScopeObject,
        },
        {},
        {
          'eip155:1': {
            eip3085: {
              foo: 'bar',
            },
          },
        },
      );
      expect(MockValidation.validateScopedPropertyEip3085).toHaveBeenCalledWith(
        'eip155:1',
        {
          foo: 'bar',
        },
      );
    });

    it('excludes invalid eip3085 properties', () => {
      MockValidation.validateScopedPropertyEip3085.mockImplementation(() => {
        throw new Error('invalid eip3085 params');
      });
      expect(
        processScopedProperties(
          {
            'eip155:1': validScopeObject,
          },
          {},
          {
            'eip155:1': {
              eip3085: {
                foo: 'bar',
              },
            },
          },
        ),
      ).toStrictEqual({
        'eip155:1': {},
      });
    });

    it('includes valid eip3085 properties', () => {
      expect(
        processScopedProperties(
          {
            'eip155:1': validScopeObject,
          },
          {},
          {
            'eip155:1': {
              eip3085: {
                foo: 'bar',
              },
            },
          },
        ),
      ).toStrictEqual({
        'eip155:1': {
          eip3085: {
            foo: 'bar',
          },
        },
      });
    });
  });
});
