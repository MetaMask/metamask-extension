import * as utils from './common.util';

describe('Common utils', () => {
  describe('camelCaseToCapitalize', () => {
    it('should return a capitalized string from a camel-cased string', () => {
      const tests = [
        {
          input: undefined,
          expected: '',
        },
        {
          input: '',
          expected: '',
        },
        {
          input: 'thisIsATest',
          expected: 'This Is A Test',
        },
      ];

      tests.forEach(({ input, expected }) => {
        expect(utils.camelCaseToCapitalize(input)).toStrictEqual(expected);
      });
    });
  });
});
