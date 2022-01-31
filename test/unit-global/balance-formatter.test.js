import { strict as assert } from 'assert';
import currencyFormatter from 'currency-formatter';
import availableCurrencies from '../../ui/helpers/constants/available-conversions.json';

describe('currencyFormatting', function () {
  it('be able to format any infura currency', function (done) {
    const number = 10000;

    availableCurrencies.forEach((conversion) => {
      const code = conversion.code.toUpperCase();
      const result = currencyFormatter.format(number, { code });

      switch (code) {
        case 'USD':
          assert.equal(result, '$10,000.00');
          break;
        case 'JPY':
          assert.equal(result, '¥10,000');
          break;
        default:
          assert.ok(result, `Currency ${code} formatted as ${result}`);
      }
    });

    done();
  });
});
