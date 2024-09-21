/* eslint-disable jest/no-conditional-expect, jest/no-if */
import currencyFormatter from 'currency-formatter';
import availableCurrencies from '../../ui/helpers/constants/available-conversions.json';

describe('currencyFormatting', function () {
  it('be able to format any infura currency', function () {
    const number = 10000;

    availableCurrencies.forEach((conversion) => {
      const code = conversion.code.toUpperCase();
      const result = currencyFormatter.format(number, { code });
      switch (code) {
        case 'USD':
          expect(result).toStrictEqual('$10,000.00');
          break;
        case 'JPY':
          expect(result).toStrictEqual('¥10,000');
          break;
        default:
          try {
            expect(result).toBeTruthy();
          } catch (error) {
            throw new Error(`Currency ${code} formatted as ${result}`);
          }
      }
    });
  });
});
