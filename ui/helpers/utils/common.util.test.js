import * as utils from './common.util';

describe('Common utils', () => {
  describe('camelCaseToCapitalize', () => {
    it('should return a capitalized string from a camel-cased string', () => {
      const tests = [
        {
          test: undefined,
          expected: '',
        },
        {
          test: '',
          expected: '',
        },
        {
          test: 'thisIsATest',
          expected: 'This Is A Test',
        },
      ];

      tests.forEach(({ test, expected }) => {
        expect(utils.camelCaseToCapitalize(test)).toStrictEqual(expected);
      });
    });
  });
});
