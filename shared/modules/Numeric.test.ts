import { BigNumber } from 'bignumber.js';
import { BN } from 'bn.js';
import { EtherDenomination } from '../constants/common';
import { Numeric } from './Numeric';

const ONE_ETH = new Numeric(1, 10, EtherDenomination.ETH);
const ONE_GWEI = new Numeric(1, 10, EtherDenomination.GWEI);
const ONE_WEI = new Numeric(1, 10, EtherDenomination.WEI);

describe('Numeric', () => {
  describe('Basic Numeric Construction', () => {
    describe('From hexadeciaml strings', () => {
      it('Should create a new Numeric from a hexadecimal string', () => {
        const numeric = new Numeric('0xa', 16);
        expect(numeric.value).toEqual(new BigNumber(10, 10));
      });

      it('Should create a new Numeric from a hexadecimal string with a decimal', () => {
        const numeric = new Numeric('0xa.7', 16);
        expect(numeric.value).toEqual(new BigNumber(10.4375, 10));
      });

      it('Should create a new Numeric from a hexadecimal string with negation', () => {
        const numeric = new Numeric('-0xa', 16);
        expect(numeric.value).toEqual(new BigNumber(-10, 10));
      });

      it('Should create a new Numeric from a hexadecimal string with negation and decimal', () => {
        const numeric = new Numeric('-0xa.7', 16);
        expect(numeric.value).toEqual(new BigNumber(-10.4375, 10));
      });
    });

    describe('From decimal strings', () => {
      it('Should create a new Numeric from a decimal string', () => {
        const numeric = new Numeric('10', 10);
        expect(numeric.value).toEqual(new BigNumber(10, 10));
      });

      it('Should create a new Numeric from a decimal string with a decimal', () => {
        const numeric = new Numeric('10.4375', 10);
        expect(numeric.value).toEqual(new BigNumber(10.4375, 10));
      });

      it('Should create a new Numeric from a decimal string with negation', () => {
        const numeric = new Numeric('-10', 10);
        expect(numeric.value).toEqual(new BigNumber(-10, 10));
      });

      it('Should create a new Numeric from a decimal string with negation and decimal', () => {
        const numeric = new Numeric('-10.4375', 10);
        expect(numeric.value).toEqual(new BigNumber(-10.4375, 10));
      });
    });

    describe('From decimal numbers', () => {
      it('Should create a new Numeric from a hexadecimal number', () => {
        const numeric = new Numeric(10, 10);
        expect(numeric.value).toEqual(new BigNumber(10, 10));
      });

      it('Should create a new Numeric from a hexadecimal string with a decimal', () => {
        const numeric = new Numeric(10.4375, 10);
        expect(numeric.value).toEqual(new BigNumber(10.4375, 10));
      });

      it('Should create a new Numeric from a hexadecimal string with negation', () => {
        const numeric = new Numeric(-10, 10);
        expect(numeric.value).toEqual(new BigNumber(-10, 10));
      });

      it('Should create a new Numeric from a hexadecimal string with negation and decimal', () => {
        const numeric = new Numeric(-10.4375, 16);
        expect(numeric.value).toEqual(new BigNumber(-10.4375, 10));
      });
    });

    describe('From BigNumbers or BN', () => {
      it('Should create a new Numeric from a BigNumber', () => {
        const numeric = new Numeric(new BigNumber(100, 10));
        expect(numeric.value).toEqual(new BigNumber(100, 10));
      });

      it('Should create a new Numeric from a BN', () => {
        const numeric = new Numeric(new BN(100, 10), 10);
        expect(numeric.value).toEqual(new BigNumber(100, 10));
      });
    });
  });

  describe('Error checking', () => {
    it('Should throw an error for a non numeric string', () => {
      expect(() => new Numeric('Hello there', 10)).toThrow(
        'String provided to stringToBigNumber is not a hexadecimal or decimal string: Hello there, 10',
      );
    });

    it('Should throw an error for a numeric string without a base', () => {
      expect(() => new Numeric('10')).toThrow(
        'You must specify the base of the provided number if the value is not already a BigNumber',
      );
    });

    it('Should throw an error for a non numeric type', () => {
      expect(() => new Numeric(true as unknown as number, 10)).toThrow(
        'Value: true is not a string, number, BigNumber or BN. Type is: boolean.',
      );
    });
  });

  describe('Erroneous behaviors that we are temporarily continuing', () => {
    it('Handles values that are undefined, setting the value to 0', () => {
      expect(new Numeric(undefined as unknown as number).toString()).toEqual(
        '0',
      );
    });

    it('Handles values that are NaN, setting the value to 0', () => {
      expect(new Numeric(NaN).toString()).toEqual('0');
    });
  });

  describe('Ether denomination conversion', () => {
    it('should convert 1 ETH to 1000000000 GWEI', () => {
      expect(ONE_ETH.toDenomination(EtherDenomination.GWEI).toString()).toEqual(
        '1000000000',
      );
    });

    it('should convert 1 ETH to 1000000000000000000 WEI', () => {
      expect(ONE_ETH.toDenomination(EtherDenomination.WEI).toString()).toEqual(
        '1000000000000000000',
      );
    });

    it('should convert 1 GWEI to 0.000000001 ETH', () => {
      expect(ONE_GWEI.toDenomination(EtherDenomination.ETH).toString()).toEqual(
        '0.000000001',
      );
    });

    it('should convert 1 GWEI to 1000000000 WEI', () => {
      expect(ONE_GWEI.toDenomination(EtherDenomination.WEI).toString()).toEqual(
        '1000000000',
      );
    });

    it('should convert 1 WEI to 0 ETH due to rounding', () => {
      expect(ONE_WEI.toDenomination(EtherDenomination.ETH).toString()).toEqual(
        '0',
      );
    });

    it('should convert 1 WEI to 0.000000001 GWEI', () => {
      expect(ONE_WEI.toDenomination(EtherDenomination.GWEI).toString()).toEqual(
        '0.000000001',
      );
    });
  });

  describe('Math operations', () => {
    describe('Multiplication', () => {
      it('Should compute correct results for simple multiplication', () => {
        expect(new Numeric(5, 10).times(5, 10).toNumber()).toEqual(25);

        expect(
          new Numeric(5, 10).times(new Numeric(10, 10)).toNumber(),
        ).toEqual(50);

        expect(
          new Numeric(25, 10).times(new Numeric(10, 10)).toNumber(),
        ).toEqual(250);
      });

      it('Should compute correct results for multiplication of big numbers', () => {
        expect(
          new Numeric('175671432', 10).times('686216', 10).toString(),
        ).toEqual('120548547381312');

        expect(
          new Numeric('1756714320', 10)
            .times(new Numeric('686216', 10))
            .toString(),
        ).toEqual('1205485473813120');

        expect(
          new Numeric('41756714320', 10)
            .times(new Numeric('6862160', 10))
            .toString(),
        ).toEqual('286541254738131200');
      });

      it('Should compute correct results for multiplication of negative big numbers', () => {
        expect(
          new Numeric('175671432', 10).times('-686216', 10).toString(),
        ).toEqual('-120548547381312');

        expect(
          new Numeric('1756714320', 10)
            .times(new Numeric('-686216', 10))
            .toString(),
        ).toEqual('-1205485473813120');

        expect(
          new Numeric('-41756714320', 10)
            .times(new Numeric('-6862160', 10))
            .toString(),
        ).toEqual('286541254738131200');
      });
    });

    describe('Division', () => {
      it('Should compute correct results for simple division', () => {
        expect(new Numeric(25, 10).divide(5, 10).toNumber()).toEqual(5);

        expect(
          new Numeric(50, 10).divide(new Numeric(10, 10)).toNumber(),
        ).toEqual(5);

        expect(
          new Numeric(250, 10).divide(new Numeric(10, 10)).toNumber(),
        ).toEqual(25);
      });

      it('Should compute correct results for division of big numbers', () => {
        expect(
          new Numeric('175671432', 10).divide('686216', 10).toString(),
        ).toEqual('256.00019818832554181191');

        expect(
          new Numeric('1756714320', 10)
            .divide(new Numeric('686216', 10))
            .toString(),
        ).toEqual('2560.00198188325541811908');

        expect(
          new Numeric('41756714320', 10)
            .divide(new Numeric('6862160', 10))
            .toString(),
        ).toEqual('6085.06859647691106007438');
      });

      it('Should compute correct results for division of negative big numbers', () => {
        expect(
          new Numeric('175671432', 10).divide('-686216', 10).toString(),
        ).toEqual('-256.00019818832554181191');

        expect(
          new Numeric('1756714320', 10)
            .divide(new Numeric('-686216', 10))
            .toString(),
        ).toEqual('-2560.00198188325541811908');

        expect(
          new Numeric('-41756714320', 10)
            .divide(new Numeric('-6862160', 10))
            .toString(),
        ).toEqual('6085.06859647691106007438');
      });
    });

    describe('Addition', () => {
      it('Should compute correct results for simple addition', () => {
        expect(new Numeric(25, 10).add(5, 10).toNumber()).toEqual(30);

        expect(new Numeric(50, 10).add(new Numeric(10, 10)).toNumber()).toEqual(
          60,
        );

        expect(
          new Numeric(250, 10).add(new Numeric(100, 10)).toNumber(),
        ).toEqual(350);
      });

      it('Should compute correct results for addition of big numbers', () => {
        expect(
          new Numeric('175671432', 10).add('686216', 10).toString(),
        ).toEqual('176357648');

        expect(
          new Numeric('1756714320', 10)
            .add(new Numeric('686216', 10))
            .toString(),
        ).toEqual('1757400536');

        expect(
          new Numeric('41756714320', 10)
            .add(new Numeric('6862160', 10))
            .toString(),
        ).toEqual('41763576480');
      });

      it('Should compute correct results for addition of negative big numbers', () => {
        expect(
          new Numeric('175671432', 10).add('-686216', 10).toString(),
        ).toEqual('174985216');

        expect(
          new Numeric('1756714320', 10)
            .add(new Numeric('-686216', 10))
            .toString(),
        ).toEqual('1756028104');

        expect(
          new Numeric('-41756714320', 10)
            .add(new Numeric('-6862160', 10))
            .toString(),
        ).toEqual('-41763576480');
      });
    });

    describe('Subtraction', () => {
      it('Should compute correct results for simple subtraction', () => {
        expect(new Numeric(25, 10).minus(5, 10).toNumber()).toEqual(20);

        expect(
          new Numeric(50, 10).minus(new Numeric(10, 10)).toNumber(),
        ).toEqual(40);

        expect(
          new Numeric(250, 10).minus(new Numeric(100, 10)).toNumber(),
        ).toEqual(150);
      });

      it('Should compute correct results for subtraction of big numbers', () => {
        expect(
          new Numeric('175671432', 10).minus('686216', 10).toString(),
        ).toEqual('174985216');

        expect(
          new Numeric('1756714320', 10)
            .minus(new Numeric('686216', 10))
            .toString(),
        ).toEqual('1756028104');

        expect(
          new Numeric('41756714320', 10)
            .minus(new Numeric('6862160', 10))
            .toString(),
        ).toEqual('41749852160');
      });

      it('Should compute correct results for subtraction of negative big numbers', () => {
        expect(
          new Numeric('175671432', 10).minus('-686216', 10).toString(),
        ).toEqual('176357648');

        expect(
          new Numeric('1756714320', 10)
            .minus(new Numeric('-686216', 10))
            .toString(),
        ).toEqual('1757400536');

        expect(
          new Numeric('-41756714320', 10)
            .minus(new Numeric('-6862160', 10))
            .toString(),
        ).toEqual('-41749852160');
      });
    });

    describe('applyConversionRate', () => {
      it('Should multiply the value by the conversionRate supplied', () => {
        expect(
          new Numeric(10, 10).applyConversionRate(468.5).toString(),
        ).toEqual('4685');
      });

      it('Should multiply the value by the conversionRate supplied when conversionRate is a BigNumber', () => {
        expect(
          new Numeric(10, 10)
            .applyConversionRate(new BigNumber(468.5, 10))
            .toString(),
        ).toEqual('4685');
      });

      it('Should multiply the value by the inverse of conversionRate supplied when second parameter is true', () => {
        expect(
          new Numeric(10, 10).applyConversionRate(468.5, true).toString(),
        ).toEqual('0.0213447171824973319');
      });

      it('Should multiply the value by the inverse of the BigNumber conversionRate supplied when second parameter is true', () => {
        expect(
          new Numeric(10, 10)
            .applyConversionRate(new BigNumber(468.5, 10), true)
            .toString(),
        ).toEqual('0.0213447171824973319');
      });
    });
  });

  describe('Base conversion', () => {
    it('should convert a hexadecimal string to a decimal string', () => {
      expect(new Numeric('0x5208', 16).toBase(10).toString()).toEqual('21000');
    });

    it('should convert a decimal string to a hexadecimal string', () => {
      expect(new Numeric('21000', 10).toBase(16).toString()).toEqual('5208');
    });

    it('should convert a decimal string to a 0x prefixed hexadecimal string', () => {
      expect(new Numeric('21000', 10).toPrefixedHexString()).toEqual('0x5208');
    });

    it('should convert a decimal number to a hexadecimal string', () => {
      expect(new Numeric(21000, 10).toBase(16).toString()).toEqual('5208');
    });

    it('should convert a decimal number to a 0x prefixed hexadecimal string', () => {
      expect(new Numeric(21000, 10).toPrefixedHexString()).toEqual('0x5208');
    });
  });

  describe('Comparisons', () => {
    it('Should correctly identify that 0xa is greater than 0x9', () => {
      expect(new Numeric('0xa', 16).greaterThan('0x9', 16)).toEqual(true);
    });
    it('Should correctly identify that 0x9 is less than 0xa', () => {
      expect(new Numeric('0x9', 16).lessThan('0xa', 16)).toEqual(true);
    });
    it('Should correctly identify that 0xa is greater than or equal to 0xa', () => {
      expect(new Numeric('0xa', 16).greaterThanOrEqualTo('0xa', 16)).toEqual(
        true,
      );
    });
    it('Should correctly identify that 0xa is less than or equal to 0xa', () => {
      expect(new Numeric('0xa', 16).lessThanOrEqualTo('0xa', 16)).toEqual(true);
    });

    it('Should correctly identify that 0xa is greater than 9', () => {
      expect(new Numeric('0xa', 16).greaterThan(9, 10)).toEqual(true);
    });
    it('Should correctly identify that 0x9 is less than 10', () => {
      expect(new Numeric('0x9', 16).lessThan(10, 10)).toEqual(true);
    });
    it('Should correctly identify that 10 is greater than or equal to 0xa', () => {
      expect(new Numeric(10, 10).greaterThanOrEqualTo('0xa', 16)).toEqual(true);
    });
    it('Should correctly identify that 10 is less than or equal to 0xa', () => {
      expect(new Numeric(10, 10).lessThanOrEqualTo('0xa', 16)).toEqual(true);
    });
  });

  describe('Positive and Negative determination', () => {
    it('Should correctly identify a negative number with isNegative', () => {
      expect(new Numeric(-10, 10).isNegative()).toEqual(true);
      expect(new Numeric('-10', 10).isNegative()).toEqual(true);
      expect(new Numeric('-0xa', 16).isNegative()).toEqual(true);
    });
    it('Should return false for isNegative when number is positive', () => {
      expect(new Numeric(10, 10).isNegative()).toEqual(false);
      expect(new Numeric('10', 10).isNegative()).toEqual(false);
      expect(new Numeric('0xa', 16).isNegative()).toEqual(false);
    });
    it('Should correctly identify a positive number with isPositive', () => {
      expect(new Numeric(10, 10).isPositive()).toEqual(true);
      expect(new Numeric('10', 10).isPositive()).toEqual(true);
      expect(new Numeric('0xa', 16).isPositive()).toEqual(true);
    });
    it('Should return false for isPositive when number is negative', () => {
      expect(new Numeric(-10, 10).isPositive()).toEqual(false);
      expect(new Numeric('-10', 10).isPositive()).toEqual(false);
      expect(new Numeric('-0xa', 16).isPositive()).toEqual(false);
    });
  });

  describe('Terminating functions, return values', () => {
    describe('toString', () => {
      it('Should return a string representation of provided hex', () => {
        expect(new Numeric('0xa', 16).toString()).toEqual('a');
      });

      it('Should return a string representation of provided decimal string', () => {
        expect(new Numeric('10', 10).toString()).toEqual('10');
      });

      it('Should return a string representation of provided number', () => {
        expect(new Numeric(10, 10).toString()).toEqual('10');
      });

      it('Should return a string representation of provided float', () => {
        expect(new Numeric(10.5, 10).toString()).toEqual('10.5');
      });

      it('Should return a string representation of provided BigNumber', () => {
        expect(new Numeric(new BigNumber(10, 10)).toString()).toEqual('10');
      });

      it('Should return a string representation of provided BN', () => {
        expect(new Numeric(new BN(10, 10)).toString()).toEqual('10');
      });
    });

    describe('toNumber', () => {
      it('Should return a number representing provided hex', () => {
        expect(new Numeric('0xa', 16).toNumber()).toEqual(10);
      });

      it('Should return a number representation of provided decimal string', () => {
        expect(new Numeric('10', 10).toNumber()).toEqual(10);
      });

      it('Should return a number representation of provided number', () => {
        expect(new Numeric(10, 10).toNumber()).toEqual(10);
      });

      it('Should return a number representation of provided float', () => {
        expect(new Numeric(10.5, 10).toNumber()).toEqual(10.5);
      });

      it('Should return a number representation of provided BigNumber', () => {
        expect(new Numeric(new BigNumber(10, 10)).toNumber()).toEqual(10);
      });

      it('Should return a number representation of provided BN', () => {
        expect(new Numeric(new BN(10, 10)).toNumber()).toEqual(10);
      });
    });

    describe('toFixed', () => {
      it('Should return a string representing provided hex to 2 decimal places', () => {
        expect(new Numeric('0xa.7', 16).toFixed(2)).toEqual('10.44');
      });

      it('Should return a string representation of provided decimal string to 2 decimal places', () => {
        expect(new Numeric('10.4375', 10).toFixed(2)).toEqual('10.44');
      });

      it('Should return a string representation of provided float to 2 decimal places', () => {
        expect(new Numeric(10.4375, 10).toFixed(2)).toEqual('10.44');
      });

      it('Should return a number representation of provided BigNumber to 2 decimal places', () => {
        expect(new Numeric(new BigNumber(10.4375, 10)).toFixed(2)).toEqual(
          '10.44',
        );
      });
    });
  });
});
