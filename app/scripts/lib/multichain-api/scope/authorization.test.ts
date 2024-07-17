import * as Validation from './validation';
import * as Transform from './transform';
import { processScopedProperties, processScopes } from './authorization';
import { ScopeObject } from './scope';

jest.mock('./validation', () => ({
  validateScopedPropertyEip3085: jest.fn(),
  validateScopes: jest.fn(),
}));
const MockValidation = jest.mocked(Validation);

jest.mock('./transform', () => ({
  flattenMergeScopes: jest.fn(),
}));
const MockTransform = jest.mocked(Transform);

const validScopeObject: ScopeObject = {
  methods: [],
  notifications: [],
};

describe('Scope Authorization', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('processScopes', () => {
    it('validates the scopes', () => {
      try {
        processScopes(
          {
            'eip155:1': validScopeObject,
          },
          {
            'eip155:5': validScopeObject,
          },
        );
      } catch (err) {
        // noop
      }
      expect(MockValidation.validateScopes).toHaveBeenCalledWith(
        {
          'eip155:1': validScopeObject,
        },
        {
          'eip155:5': validScopeObject,
        },
      );
    });

    it('flatten and merges the validated scopes', () => {
      MockValidation.validateScopes.mockReturnValue({
        validRequiredScopes: {
          'eip155:1': validScopeObject,
        },
        validOptionalScopes: {
          'eip155:5': validScopeObject,
        },
      });

      processScopes({}, {});
      expect(MockTransform.flattenMergeScopes).toHaveBeenCalledWith({
        'eip155:1': validScopeObject,
      });
      expect(MockTransform.flattenMergeScopes).toHaveBeenCalledWith({
        'eip155:5': validScopeObject,
      });
    });

    it('returns the flatten and merged scopes', () => {
      MockValidation.validateScopes.mockReturnValue({
        validRequiredScopes: {
          'eip155:1': validScopeObject,
        },
        validOptionalScopes: {
          'eip155:5': validScopeObject,
        },
      });
      MockTransform.flattenMergeScopes.mockImplementation((value) => ({
        ...value,
        transformed: true,
      }));

      expect(processScopes({}, {})).toStrictEqual({
        flattenedRequiredScopes: {
          'eip155:1': validScopeObject,
          transformed: true,
        },
        flattenedOptionalScopes: {
          'eip155:5': validScopeObject,
          transformed: true,
        },
      });
    });
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
