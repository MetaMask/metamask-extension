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

  describe('getPasswordStrengthCategory', () => {
    it('should return "weak" for short passwords', () => {
      expect(utils.getPasswordStrengthCategory('123')).toBe('weak');
      expect(utils.getPasswordStrengthCategory('1234567')).toBe('weak'); // 7 chars, less than PASSWORD_MIN_LENGTH
    });

    it('should return "weak" for weak passwords', () => {
      expect(utils.getPasswordStrengthCategory('12345678')).toBe('weak'); // 8 chars but weak
      expect(utils.getPasswordStrengthCategory('password')).toBe('weak'); // common word
    });

    it('should return "good" for average passwords', () => {
      expect(utils.getPasswordStrengthCategory('ZsE(!6679')).toBe('good'); // score 3
    });

    it('should return "strong" for strong passwords', () => {
      expect(utils.getPasswordStrengthCategory('E}URkDoV|/*,pxI')).toBe(
        'strong',
      ); // score 4
    });
  });
});
