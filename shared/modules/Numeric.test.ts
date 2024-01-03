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
      it('should create a new Numeric from a hexadecimal string', () => {
        const numeric = new Numeric('0xa', 16);
        expect(numeric.value).toStrictEqual(new BigNumber(10, 10));
      });

      it('should create a new Numeric from a hexadecimal string with a decimal', () => {
        const numeric = new Numeric('0xa.7', 16);
        expect(numeric.value).toStrictEqual(new BigNumber(10.4375, 10));
      });

      it('should create a new Numeric from a hexadecimal string with negation', () => {
        const numeric = new Numeric('-0xa', 16);
        expect(numeric.value).toStrictEqual(new BigNumber(-10, 10));
      });

      it('should create a new Numeric from a hexadecimal string with negation and decimal', () => {
        const numeric = new Numeric('-0xa.7', 16);
        expect(numeric.value).toStrictEqual(new BigNumber(-10.4375, 10));
      });
    });

    describe('From decimal strings', () => {
      it('should create a new Numeric from a decimal string', () => {
        const numeric = new Numeric('10', 10);
        expect(numeric.value).toStrictEqual(new BigNumber(10, 10));
      });

      it('should create a new Numeric from a decimal string with a decimal', () => {
        const numeric = new Numeric('10.4375', 10);
        expect(numeric.value).toStrictEqual(new BigNumber(10.4375, 10));
      });

      it('should create a new Numeric from a decimal string with negation', () => {
        const numeric = new Numeric('-10', 10);
        expect(numeric.value).toStrictEqual(new BigNumber(-10, 10));
      });

      it('should create a new Numeric from a decimal string with negation and decimal', () => {
        const numeric = new Numeric('-10.4375', 10);
        expect(numeric.value).toStrictEqual(new BigNumber(-10.4375, 10));
      });
    });

    describe('From decimal numbers', () => {
      it('should create a new Numeric from a hexadecimal number', () => {
        const numeric = new Numeric(10, 10);
        expect(numeric.value).toStrictEqual(new BigNumber(10, 10));
      });

      it('should create a new Numeric from a hexadecimal string with a decimal', () => {
        const numeric = new Numeric(10.4375, 10);
        expect(numeric.value).toStrictEqual(new BigNumber(10.4375, 10));
      });

      it('should create a new Numeric from a hexadecimal string with negation', () => {
        const numeric = new Numeric(-10, 10);
        expect(numeric.value).toStrictEqual(new BigNumber(-10, 10));
      });

      it('should create a new Numeric from a hexadecimal string with negation and decimal', () => {
        const numeric = new Numeric(-10.4375, 16);
        expect(numeric.value).toStrictEqual(new BigNumber(-10.4375, 10));
      });
    });

    describe('From BigNumbers or BN', () => {
      it('should create a new Numeric from a BigNumber', () => {
        const numeric = new Numeric(new BigNumber(100, 10));
        expect(numeric.value).toStrictEqual(new BigNumber(100, 10));
      });

      it('should create a new Numeric from a BN', () => {
        const numeric = new Numeric(new BN(100, 10), 10);
        expect(numeric.value).toStrictEqual(new BigNumber(100, 10));
      });
    });
  });

  describe('Error checking', () => {
    it('should throw an error for a non numeric string', () => {
      expect(() => new Numeric('Hello there', 10)).toThrow(
        'String provided to stringToBigNumber is not a hexadecimal or decimal string: Hello there, 10',
      );
    });

    it('should throw an error for a numeric string without a base', () => {
      expect(() => new Numeric('10')).toThrow(
        'You must specify the base of the provided number if the value is not already a BigNumber',
      );
    });

    it('should throw an error for a non numeric type', () => {
      expect(() => new Numeric(true as unknown as number, 10)).toThrow(
        'Value: true is not a string, number, BigNumber or BN. Type is: boolean.',
      );
    });
  });

  describe('Erroneous behaviors that we are temporarily continuing', () => {
    it('handles values that are undefined, setting the value to 0', () => {
      expect(
        new Numeric(undefined as unknown as number).toString(),
      ).toStrictEqual('0');
    });

    it('handles values that are NaN, setting the value to 0', () => {
      expect(new Numeric(NaN).toString()).toStrictEqual('0');
    });
  });

  describe('Ether denomination conversion', () => {
    it('should convert 1 ETH to 1000000000 GWEI', () => {
      expect(
        ONE_ETH.toDenomination(EtherDenomination.GWEI).toString(),
      ).toStrictEqual('1000000000');
    });

    it('should convert 1 ETH to 1000000000000000000 WEI', () => {
      expect(
        ONE_ETH.toDenomination(EtherDenomination.WEI).toString(),
      ).toStrictEqual('1000000000000000000');
    });

    it('should convert 1 GWEI to 0.000000001 ETH', () => {
      expect(
        ONE_GWEI.toDenomination(EtherDenomination.ETH).toString(),
      ).toStrictEqual('0.000000001');
    });

    it('should convert 1 GWEI to 1000000000 WEI', () => {
      expect(
        ONE_GWEI.toDenomination(EtherDenomination.WEI).toString(),
      ).toStrictEqual('1000000000');
    });

    it('should convert 1 WEI to 0 ETH due to rounding', () => {
      expect(
        ONE_WEI.toDenomination(EtherDenomination.ETH).toString(),
      ).toStrictEqual('0');
    });

    it('should convert 1 WEI to 0.000000001 GWEI', () => {
      expect(
        ONE_WEI.toDenomination(EtherDenomination.GWEI).toString(),
      ).toStrictEqual('0.000000001');
    });
  });

  describe('Math operations', () => {
    describe('Multiplication', () => {
      it('should compute correct results for simple multiplication', () => {
        expect(new Numeric(5, 10).times(5, 10).toNumber()).toStrictEqual(25);

        expect(
          new Numeric(5, 10).times(new Numeric(10, 10)).toNumber(),
        ).toStrictEqual(50);

        expect(
          new Numeric(25, 10).times(new Numeric(10, 10)).toNumber(),
        ).toStrictEqual(250);
      });

      it('should compute correct results for multiplication of big numbers', () => {
        expect(
          new Numeric('175671432', 10).times('686216', 10).toString(),
        ).toStrictEqual('120548547381312');

        expect(
          new Numeric('1756714320', 10)
            .times(new Numeric('686216', 10))
            .toString(),
        ).toStrictEqual('1205485473813120');

        expect(
          new Numeric('41756714320', 10)
            .times(new Numeric('6862160', 10))
            .toString(),
        ).toStrictEqual('286541254738131200');
      });

      it('should compute correct results for multiplication of negative big numbers', () => {
        expect(
          new Numeric('175671432', 10).times('-686216', 10).toString(),
        ).toStrictEqual('-120548547381312');

        expect(
          new Numeric('1756714320', 10)
            .times(new Numeric('-686216', 10))
            .toString(),
        ).toStrictEqual('-1205485473813120');

        expect(
          new Numeric('-41756714320', 10)
            .times(new Numeric('-6862160', 10))
            .toString(),
        ).toStrictEqual('286541254738131200');
      });
    });

    describe('Division', () => {
      it('should compute correct results for simple division', () => {
        expect(new Numeric(25, 10).divide(5, 10).toNumber()).toStrictEqual(5);

        expect(
          new Numeric(50, 10).divide(new Numeric(10, 10)).toNumber(),
        ).toStrictEqual(5);

        expect(
          new Numeric(250, 10).divide(new Numeric(10, 10)).toNumber(),
        ).toStrictEqual(25);
      });

      it('should compute correct results for division of big numbers', () => {
        expect(
          new Numeric('175671432', 10).divide('686216', 10).toString(),
        ).toStrictEqual('256.000198188325541811907620924023922497');

        expect(
          new Numeric('1756714320', 10)
            .divide(new Numeric('686216', 10))
            .toString(),
        ).toStrictEqual('2560.001981883255418119076209240239224967');

        expect(
          new Numeric('41756714320', 10)
            .divide(new Numeric('6862160', 10))
            .toString(),
        ).toStrictEqual('6085.068596476911060074378912762162351213');
      });

      it('should compute correct results for division of negative big numbers', () => {
        expect(
          new Numeric('175671432', 10).divide('-686216', 10).toString(),
        ).toStrictEqual('-256.000198188325541811907620924023922497');

        expect(
          new Numeric('1756714320', 10)
            .divide(new Numeric('-686216', 10))
            .toString(),
        ).toStrictEqual('-2560.001981883255418119076209240239224967');

        expect(
          new Numeric('-41756714320', 10)
            .divide(new Numeric('-6862160', 10))
            .toString(),
        ).toStrictEqual('6085.068596476911060074378912762162351213');
      });
    });

    describe('Addition', () => {
      it('should compute correct results for simple addition', () => {
        expect(new Numeric(25, 10).add(5, 10).toNumber()).toStrictEqual(30);

        expect(
          new Numeric(50, 10).add(new Numeric(10, 10)).toNumber(),
        ).toStrictEqual(60);

        expect(
          new Numeric(250, 10).add(new Numeric(100, 10)).toNumber(),
        ).toStrictEqual(350);
      });

      it('should compute correct results for addition of big numbers', () => {
        expect(
          new Numeric('175671432', 10).add('686216', 10).toString(),
        ).toStrictEqual('176357648');

        expect(
          new Numeric('1756714320', 10)
            .add(new Numeric('686216', 10))
            .toString(),
        ).toStrictEqual('1757400536');

        expect(
          new Numeric('41756714320', 10)
            .add(new Numeric('6862160', 10))
            .toString(),
        ).toStrictEqual('41763576480');
      });

      it('should compute correct results for addition of negative big numbers', () => {
        expect(
          new Numeric('175671432', 10).add('-686216', 10).toString(),
        ).toStrictEqual('174985216');

        expect(
          new Numeric('1756714320', 10)
            .add(new Numeric('-686216', 10))
            .toString(),
        ).toStrictEqual('1756028104');

        expect(
          new Numeric('-41756714320', 10)
            .add(new Numeric('-6862160', 10))
            .toString(),
        ).toStrictEqual('-41763576480');
      });
    });

    describe('Subtraction', () => {
      it('should compute correct results for simple subtraction', () => {
        expect(new Numeric(25, 10).minus(5, 10).toNumber()).toStrictEqual(20);

        expect(
          new Numeric(50, 10).minus(new Numeric(10, 10)).toNumber(),
        ).toStrictEqual(40);

        expect(
          new Numeric(250, 10).minus(new Numeric(100, 10)).toNumber(),
        ).toStrictEqual(150);
      });

      it('should compute correct results for subtraction of big numbers', () => {
        expect(
          new Numeric('175671432', 10).minus('686216', 10).toString(),
        ).toStrictEqual('174985216');

        expect(
          new Numeric('1756714320', 10)
            .minus(new Numeric('686216', 10))
            .toString(),
        ).toStrictEqual('1756028104');

        expect(
          new Numeric('41756714320', 10)
            .minus(new Numeric('6862160', 10))
            .toString(),
        ).toStrictEqual('41749852160');
      });

      it('should compute correct results for subtraction of negative big numbers', () => {
        expect(
          new Numeric('175671432', 10).minus('-686216', 10).toString(),
        ).toStrictEqual('176357648');

        expect(
          new Numeric('1756714320', 10)
            .minus(new Numeric('-686216', 10))
            .toString(),
        ).toStrictEqual('1757400536');

        expect(
          new Numeric('-41756714320', 10)
            .minus(new Numeric('-6862160', 10))
            .toString(),
        ).toStrictEqual('-41749852160');
      });
    });

    describe('applyConversionRate', () => {
      it('should multiply the value by the conversionRate supplied', () => {
        expect(
          new Numeric(10, 10).applyConversionRate(468.5).toString(),
        ).toStrictEqual('4685');
      });

      it('should multiply the value by the conversionRate supplied when conversionRate is a BigNumber', () => {
        expect(
          new Numeric(10, 10)
            .applyConversionRate(new BigNumber(468.5, 10))
            .toString(),
        ).toStrictEqual('4685');
      });

      it('should multiply the value by the inverse of conversionRate supplied when second parameter is true', () => {
        expect(
          new Numeric(10, 10).applyConversionRate(468.5, true).toString(),
        ).toStrictEqual('0.02134471718249733191035218783351121');
      });

      it('should multiply the value by the inverse of the BigNumber conversionRate supplied when second parameter is true', () => {
        expect(
          new Numeric(10, 10)
            .applyConversionRate(new BigNumber(468.5, 10), true)
            .toString(),
        ).toStrictEqual('0.02134471718249733191035218783351121');
      });
      it('should not return 0 if decimals is greater than 20', () => {
        expect(
          new Numeric(10, 10)
            .applyConversionRate(new BigNumber(1e27, 10), true)
            .toString(),
        ).toStrictEqual('0.00000000000000000000000001');
      });

      it('should  return 0 if decimals is greater than 32', () => {
        expect(
          new Numeric(10, 10)
            .applyConversionRate(new BigNumber(1e40, 10), true)
            .toString(),
        ).toStrictEqual('0');
      });
    });
  });

  describe('Base conversion', () => {
    it('should convert a hexadecimal string to a decimal string', () => {
      expect(new Numeric('0x5208', 16).toBase(10).toString()).toStrictEqual(
        '21000',
      );
    });

    it('should convert a decimal string to a hexadecimal string', () => {
      expect(new Numeric('21000', 10).toBase(16).toString()).toStrictEqual(
        '5208',
      );
    });

    it('should convert a decimal string to a 0x prefixed hexadecimal string', () => {
      expect(new Numeric('21000', 10).toPrefixedHexString()).toStrictEqual(
        '0x5208',
      );
    });

    it('should convert a decimal number to a hexadecimal string', () => {
      expect(new Numeric(21000, 10).toBase(16).toString()).toStrictEqual(
        '5208',
      );
    });

    it('should convert a decimal number to a 0x prefixed hexadecimal string', () => {
      expect(new Numeric(21000, 10).toPrefixedHexString()).toStrictEqual(
        '0x5208',
      );
    });
  });

  describe('Comparisons', () => {
    it('should correctly identify that 0xa is greater than 0x9', () => {
      expect(new Numeric('0xa', 16).greaterThan('0x9', 16)).toStrictEqual(true);
    });
    it('should correctly identify that 0x9 is less than 0xa', () => {
      expect(new Numeric('0x9', 16).lessThan('0xa', 16)).toStrictEqual(true);
    });
    it('should correctly identify that 0xa is greater than or equal to 0xa', () => {
      expect(
        new Numeric('0xa', 16).greaterThanOrEqualTo('0xa', 16),
      ).toStrictEqual(true);
    });
    it('should correctly identify that 0xa is less than or equal to 0xa', () => {
      expect(new Numeric('0xa', 16).lessThanOrEqualTo('0xa', 16)).toStrictEqual(
        true,
      );
    });

    it('should correctly identify that 0xa is greater than 9', () => {
      expect(new Numeric('0xa', 16).greaterThan(9, 10)).toStrictEqual(true);
    });
    it('should correctly identify that 0x9 is less than 10', () => {
      expect(new Numeric('0x9', 16).lessThan(10, 10)).toStrictEqual(true);
    });
    it('should correctly identify that 10 is greater than or equal to 0xa', () => {
      expect(new Numeric(10, 10).greaterThanOrEqualTo('0xa', 16)).toStrictEqual(
        true,
      );
    });
    it('should correctly identify that 10 is less than or equal to 0xa', () => {
      expect(new Numeric(10, 10).lessThanOrEqualTo('0xa', 16)).toStrictEqual(
        true,
      );
    });
  });

  describe('Positive and Negative and Float determination', () => {
    it('should correctly identify a negative number with isNegative', () => {
      expect(new Numeric(-10, 10).isNegative()).toStrictEqual(true);
      expect(new Numeric('-10', 10).isNegative()).toStrictEqual(true);
      expect(new Numeric('-0xa', 16).isNegative()).toStrictEqual(true);
    });
    it('should return false for isNegative when number is positive', () => {
      expect(new Numeric(10, 10).isNegative()).toStrictEqual(false);
      expect(new Numeric('10', 10).isNegative()).toStrictEqual(false);
      expect(new Numeric('0xa', 16).isNegative()).toStrictEqual(false);
    });
    it('should correctly identify a positive number with isPositive', () => {
      expect(new Numeric(10, 10).isPositive()).toStrictEqual(true);
      expect(new Numeric('10', 10).isPositive()).toStrictEqual(true);
      expect(new Numeric('0xa', 16).isPositive()).toStrictEqual(true);
    });
    it('should return false for isPositive when number is negative', () => {
      expect(new Numeric(-10, 10).isPositive()).toStrictEqual(false);
      expect(new Numeric('-10', 10).isPositive()).toStrictEqual(false);
      expect(new Numeric('-0xa', 16).isPositive()).toStrictEqual(false);
    });
    it('should correctly identify a float number with isFloat', () => {
      expect(new Numeric(1.2, 10).isFloat()).toStrictEqual(true);
      expect(new Numeric('1.2', 10).isFloat()).toStrictEqual(true);
      expect(new Numeric('-10', 10).isFloat()).toStrictEqual(false);
      expect(new Numeric('0xa', 16).isFloat()).toStrictEqual(false);
    });
  });

  describe('Terminating functions, return values', () => {
    describe('toString', () => {
      it('should return a string representation of provided hex', () => {
        expect(new Numeric('0xa', 16).toString()).toStrictEqual('a');
      });

      it('should return a string representation of provided decimal string', () => {
        expect(new Numeric('10', 10).toString()).toStrictEqual('10');
      });

      it('should return a string representation of provided number', () => {
        expect(new Numeric(10, 10).toString()).toStrictEqual('10');
      });

      it('should return a string representation of provided float', () => {
        expect(new Numeric(10.5, 10).toString()).toStrictEqual('10.5');
      });

      it('should return a string representation of provided BigNumber', () => {
        expect(new Numeric(new BigNumber(10, 10)).toString()).toStrictEqual(
          '10',
        );
      });

      it('should return a string representation of provided BN', () => {
        expect(new Numeric(new BN(10, 10)).toString()).toStrictEqual('10');
      });
    });

    describe('toNumber', () => {
      it('should return a number representing provided hex', () => {
        expect(new Numeric('0xa', 16).toNumber()).toStrictEqual(10);
      });

      it('should return a number representation of provided decimal string', () => {
        expect(new Numeric('10', 10).toNumber()).toStrictEqual(10);
      });

      it('should return a number representation of provided number', () => {
        expect(new Numeric(10, 10).toNumber()).toStrictEqual(10);
      });

      it('should return a number representation of provided float', () => {
        expect(new Numeric(10.5, 10).toNumber()).toStrictEqual(10.5);
      });

      it('should return a number representation of provided BigNumber', () => {
        expect(new Numeric(new BigNumber(10, 10)).toNumber()).toStrictEqual(10);
      });

      it('should return a number representation of provided BN', () => {
        expect(new Numeric(new BN(10, 10)).toNumber()).toStrictEqual(10);
      });
    });

    describe('toFixed', () => {
      it('should return a string representing provided hex to 2 decimal places', () => {
        expect(new Numeric('0xa.7', 16).toFixed(2)).toStrictEqual('10.44');
      });

      it('should return a string representation of provided decimal string to 2 decimal places', () => {
        expect(new Numeric('10.4375', 10).toFixed(2)).toStrictEqual('10.44');
      });

      it('should return a string representation of provided float to 2 decimal places', () => {
        expect(new Numeric(10.4375, 10).toFixed(2)).toStrictEqual('10.44');
      });

      it('should return a number representation of provided BigNumber to 2 decimal places', () => {
        expect(
          new Numeric(new BigNumber(10.4375, 10)).toFixed(2),
        ).toStrictEqual('10.44');
      });
    });

    describe('round', () => {
      it('should return number rounded', () => {
        expect(new Numeric(10.4375, 10).round()).toStrictEqual(
          new Numeric(10.4375, 10),
        );
        expect(new Numeric(10.4375, 10).round(0)).toStrictEqual(
          new Numeric(10, 10),
        );
        expect(new Numeric(10.4375, 10).round(1)).toStrictEqual(
          new Numeric(10.4, 10),
        );
        expect(new Numeric(10.4375, 10).round(2)).toStrictEqual(
          new Numeric(10.44, 10),
        );
        expect(new Numeric(10.4375, 10).round(3)).toStrictEqual(
          new Numeric(10.437, 10),
        );
        expect(new Numeric(10.4375, 10).round(4)).toStrictEqual(
          new Numeric(10.4375, 10),
        );
        expect(new Numeric(10.4375, 10).round(5)).toStrictEqual(
          new Numeric(10.4375, 10),
        );
      });
    });
  });
});
