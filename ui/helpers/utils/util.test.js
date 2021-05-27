import { BN } from 'ethereumjs-util';
import * as util from './util';

describe('util', () => {
  let ethInWei = '1';
  for (let i = 0; i < 18; i++) {
    ethInWei += '0';
  }

  describe('#parseBalance', () => {
    it('should render 0.01 eth correctly', () => {
      const input = '0x2386F26FC10000';
      const output = util.parseBalance(input);
      expect(output).toStrictEqual(['0', '01']);
    });

    it('should render 12.023 eth correctly', () => {
      const input = 'A6DA46CCA6858000';
      const output = util.parseBalance(input);
      expect(output).toStrictEqual(['12', '023']);
    });

    it('should render 0.0000000342422 eth correctly', () => {
      const input = '0x7F8FE81C0';
      const output = util.parseBalance(input);
      expect(output).toStrictEqual(['0', '0000000342422']);
    });

    it('should render 0 eth correctly', () => {
      const input = '0x0';
      const output = util.parseBalance(input);
      expect(output).toStrictEqual(['0', '0']);
    });
  });

  describe('#addressSummary', () => {
    it('should add case-sensitive checksum', () => {
      const address = '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825';
      const result = util.addressSummary(address);
      expect(result).toStrictEqual('0xFDEa65C8...b825');
    });

    it('should accept arguments for firstseg, lastseg, and keepPrefix', () => {
      const address = '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825';
      const result = util.addressSummary(address, 4, 4, false);
      expect(result).toStrictEqual('FDEa...b825');
    });
  });

  describe('isValidDomainName', () => {
    it('should return true when given a valid domain name', () => {
      expect(util.isValidDomainName('foo.bar')).toStrictEqual(true);
    });

    it('should return true when given a valid subdomain', () => {
      expect(util.isValidDomainName('foo.foo.bar')).toStrictEqual(true);
    });

    it('should return true when given a single-character domain', () => {
      expect(util.isValidDomainName('f.bar')).toStrictEqual(true);
    });

    it('should return true when given a unicode TLD', () => {
      expect(util.isValidDomainName('台灣.中国')).toStrictEqual(true);
    });

    it('should return false when given a domain with unacceptable ASCII characters', () => {
      expect(util.isValidDomainName('$.bar')).toStrictEqual(false);
    });

    it('should return false when given a TLD that starts with a dash', () => {
      expect(util.isValidDomainName('foo.-bar')).toStrictEqual(false);
    });

    it('should return false when given a TLD that ends with a dash', () => {
      expect(util.isValidDomainName('foo.bar-')).toStrictEqual(false);
    });

    it('should return false when given a domain name with a chunk that starts with a dash', () => {
      expect(util.isValidDomainName('-foo.bar')).toStrictEqual(false);
    });

    it('should return false when given a domain name with a chunk that ends with a dash', () => {
      expect(util.isValidDomainName('foo-.bar')).toStrictEqual(false);
    });

    it('should return false when given a bare TLD', () => {
      expect(util.isValidDomainName('bar')).toStrictEqual(false);
    });

    it('should return false when given a domain that starts with a period', () => {
      expect(util.isValidDomainName('.bar')).toStrictEqual(false);
    });

    it('should return false when given a subdomain that starts with a period', () => {
      expect(util.isValidDomainName('.foo.bar')).toStrictEqual(false);
    });

    it('should return false when given a domain that ends with a period', () => {
      expect(util.isValidDomainName('bar.')).toStrictEqual(false);
    });

    it('should return false when given a 1-character TLD', () => {
      expect(util.isValidDomainName('foo.b')).toStrictEqual(false);
    });
  });

  describe('isOriginContractAddress', () => {
    it('should return true when the send address is the same as the selected tokens contract address', () => {
      expect(
        util.isOriginContractAddress(
          '0x8d6b81208414189a58339873ab429b6c47ab92d3',
          '0x8d6b81208414189a58339873ab429b6c47ab92d3',
        ),
      ).toStrictEqual(true);
    });

    it('should return true when the send address is the same as the selected tokens contract address, capitalized input', () => {
      expect(
        util.isOriginContractAddress(
          '0x8d6b81208414189a58339873ab429b6c47ab92d3',
          '0X8D6B81208414189A58339873AB429B6C47AB92D3',
        ),
      ).toStrictEqual(true);
    });

    it('should return false when the recipient address differs', () => {
      expect(
        util.isOriginContractAddress(
          '0x8d6b81208414189a58339873ab429b6c47ab92d3',
          '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
        ),
      ).toStrictEqual(false);
    });
  });

  describe('#numericBalance', () => {
    it('should return a BN 0 if given nothing', () => {
      const result = util.numericBalance();
      expect(result.toString(10)).toStrictEqual('0');
    });

    it('should work with hex prefix', () => {
      const result = util.numericBalance('0x012');
      expect(result.toString(10)).toStrictEqual('18');
    });

    it('should work with no hex prefix', () => {
      const result = util.numericBalance('012');
      expect(result.toString(10)).toStrictEqual('18');
    });
  });

  describe('#formatBalance', () => {
    it('should return None when given nothing', () => {
      const result = util.formatBalance();
      expect(result).toStrictEqual('None', 'should return "None"');
    });

    it('should return 1.0000 ETH', () => {
      const input = new BN(ethInWei, 10).toJSON();
      const result = util.formatBalance(input, 4);
      expect(result).toStrictEqual('1.0000 ETH');
    });

    it('should return 0.500 ETH', function () {
      const input = new BN(ethInWei, 10).div(new BN('2', 10)).toJSON();
      const result = util.formatBalance(input, 3);
      expect(result).toStrictEqual('0.500 ETH');
    });

    it('should display specified decimal points', () => {
      const input = '0x128dfa6a90b28000';
      const result = util.formatBalance(input, 2);
      expect(result).toStrictEqual('1.33 ETH');
    });
    it('should default to 3 decimal points', () => {
      const input = '0x128dfa6a90b28000';
      const result = util.formatBalance(input);
      expect(result).toStrictEqual('1.337 ETH');
    });
    it('should show 2 significant digits for tiny balances', () => {
      const input = '0x1230fa6a90b28';
      const result = util.formatBalance(input);
      expect(result).toStrictEqual('0.00032 ETH');
    });
    it('should not parse the balance and return value with 2 decimal points with ETH at the end', () => {
      const value = '1.2456789';
      const needsParse = false;
      const result = util.formatBalance(value, 2, needsParse);
      expect(result).toStrictEqual('1.24 ETH');
    });
  });

  describe('normalizing values', function () {
    describe('#getRandomFileName', () => {
      it('should only return a string containing alphanumeric characters', () => {
        const result = util.getRandomFileName();
        expect(result[0]).toStrictEqual(
          expect.stringMatching(/^[a-zA-Z0-9]*$/gu),
        );
      });

      // 50 samples
      it('should return a string that is between 6 and 12 characters in length', () => {
        for (let i = 0; i < 50; i++) {
          const result = util.getRandomFileName();
          expect(result.length >= 6 && result.length <= 12).toStrictEqual(true);
        }
      });
    });
  });

  describe('checkExistingAddresses', () => {
    const tokenList = [
      { address: 'A' },
      { address: 'n' },
      { address: 'Q' },
      { address: 'z' },
    ];

    it('should return true when a lowercase address matches an uppercase address in the passed list', () => {
      expect(util.checkExistingAddresses('q', tokenList)).toStrictEqual(true);
    });

    it('should return true when an uppercase address matches a lowercase address in the passed list', () => {
      expect(util.checkExistingAddresses('N', tokenList)).toStrictEqual(true);
    });

    it('should return true when a lowercase address matches a lowercase address in the passed list', () => {
      expect(util.checkExistingAddresses('z', tokenList)).toStrictEqual(true);
    });

    it('should return true when an uppercase address matches an uppercase address in the passed list', () => {
      expect(util.checkExistingAddresses('Q', tokenList)).toStrictEqual(true);
    });

    it('should return false when the passed address is not in the passed list', () => {
      expect(util.checkExistingAddresses('b', tokenList)).toStrictEqual(false);
    });
  });

  describe('toPrecisionWithoutTrailingZeros', () => {
    const testData = [
      { args: ['0', 9], result: '0' },
      { args: [0, 9], result: '0' },
      { args: ['0.0', 9], result: '0' },
      { args: ['0.000000000000', 9], result: '0' },
      { args: ['1', 9], result: '1' },
      { args: [1], result: '1' },
      { args: ['1.0', 9], result: '1' },
      { args: ['1.000000000', 9], result: '1' },
      { args: ['000000001', 9], result: '1' },
      { args: ['000000001.0', 9], result: '1' },
      { args: ['100000000', 9], result: '100000000' },
      { args: ['100000000.00001', 9], result: '100000000' },
      { args: ['100.00001', 9], result: '100.00001' },
      { args: ['100.00001000', 9], result: '100.00001' },
      { args: ['100.000010001', 9], result: '100.00001' },
      { args: ['10.010101', 9], result: '10.010101' },
      { args: ['0.1', 5], result: '0.1' },
      { args: ['0.10', 5], result: '0.1' },
      { args: ['0.1010', 5], result: '0.101' },
      { args: ['0.01001', 5], result: '0.01001' },
      { args: ['0.010010', 5], result: '0.01001' },
      { args: ['0.010011', 5], result: '0.010011' },
      { args: ['1.01005', 5], result: '1.0101' },
      { args: ['1.000049', 5], result: '1' },
      { args: ['1.00005', 5], result: '1.0001' },
      { args: ['0.0000123456789', 9], result: '0.0000123456789' },
      { args: ['1.0000123456789', 10], result: '1.000012346' },
      { args: ['10000.0000012345679', 10], result: '10000' },
      { args: ['1000000000000', 10], result: '1e+12' },
      { args: ['1000050000000', 10], result: '1.00005e+12' },
      { args: ['100000000000000000000', 10], result: '1e+20' },
      { args: ['100005000000000000000', 10], result: '1.00005e+20' },
      { args: ['100005000000000000000.0', 10], result: '1.00005e+20' },
    ];

    testData.forEach(({ args, result }) => {
      it(`should return ${result} when passed number ${args[0]} and precision ${args[1]}`, () => {
        expect(util.toPrecisionWithoutTrailingZeros(...args)).toStrictEqual(
          result,
        );
      });
    });
  });

  describe('addHexPrefixToObjectValues()', () => {
    it('should return a new object with the same properties with a 0x prefix', () => {
      expect(
        util.addHexPrefixToObjectValues({
          prop1: '0x123',
          prop2: '456',
          prop3: 'x',
        }),
      ).toStrictEqual({
        prop1: '0x123',
        prop2: '0x456',
        prop3: '0xx',
      });
    });
  });
});
