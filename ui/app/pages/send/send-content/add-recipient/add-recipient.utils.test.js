import {
  REQUIRED_ERROR,
  INVALID_RECIPIENT_ADDRESS_ERROR,
  KNOWN_RECIPIENT_ADDRESS_ERROR,
  CONFUSING_ENS_ERROR,
  CONTRACT_ADDRESS_ERROR,
} from '../../send.constants';
import { getToErrorObject, getToWarningObject } from './add-recipient';

jest.mock('../../../../../app/helpers/utils/util', () => ({
  isDefaultMetaMaskChain: jest.fn().mockReturnValue(true),
  isEthNetwork: jest.fn().mockReturnValue(true),
  checkExistingAddresses: jest.fn().mockReturnValue(true),
  isValidAddress: jest.fn((to) => Boolean(to.match(/^[0xabcdef123456798]+$/u))),
  isValidDomainName: jest.requireActual('../../../../../app/helpers/utils/util')
    .isValidDomainName,
  isOriginContractAddress: jest.requireActual(
    '../../../../../app/helpers/utils/util',
  ).isOriginContractAddress,
}));

describe('add-recipient utils', () => {
  describe('getToErrorObject()', () => {
    it('should return a required error if "to" is falsy', () => {
      expect(getToErrorObject(null)).toStrictEqual({
        to: REQUIRED_ERROR,
      });
    });

    it('should return an invalid recipient error if "to" is truthy but invalid', () => {
      expect(getToErrorObject('mockInvalidTo')).toStrictEqual({
        to: INVALID_RECIPIENT_ADDRESS_ERROR,
      });
    });

    it('should return null if "to" is truthy and valid', () => {
      expect(getToErrorObject('0xabc123')).toStrictEqual({
        to: null,
      });
    });

    it('should return a contract address error if the recipient is the same as the tokens contract address', () => {
      expect(getToErrorObject('0xabc123', '0xabc123')).toStrictEqual({
        to: CONTRACT_ADDRESS_ERROR,
      });
    });

    it('should return null if the recipient address is not the token contract address', () => {
      expect(getToErrorObject('0xabc123', '0xabc456')).toStrictEqual({
        to: null,
      });
    });
  });

  describe('getToWarningObject()', () => {
    it('should return a known address recipient error if "to" is a token address', () => {
      expect(
        getToWarningObject('0xabc123', [{ address: '0xabc123' }], {
          address: '0xabc123',
        }),
      ).toStrictEqual({
        to: KNOWN_RECIPIENT_ADDRESS_ERROR,
      });
    });

    it('should null if "to" is a token address but sendToken is falsy', () => {
      expect(
        getToWarningObject('0xabc123', [{ address: '0xabc123' }]),
      ).toStrictEqual({
        to: null,
      });
    });

    it('should return a known address recipient error if "to" is part of contract metadata', () => {
      expect(
        getToWarningObject(
          '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
          [{ address: '0xabc123' }],
          { address: '0xabc123' },
        ),
      ).toStrictEqual({
        to: KNOWN_RECIPIENT_ADDRESS_ERROR,
      });
    });
    it('should null if "to" is part of contract metadata but sendToken is falsy', () => {
      expect(
        getToWarningObject(
          '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
          [{ address: '0xabc123' }],
          { address: '0xabc123' },
        ),
      ).toStrictEqual({
        to: KNOWN_RECIPIENT_ADDRESS_ERROR,
      });
    });

    it('should warn if name is a valid domain and confusable', () => {
      expect(getToWarningObject('demo.eth')).toStrictEqual({
        to: CONFUSING_ENS_ERROR,
      });
    });

    it('should not warn if name is a valid domain and not confusable', () => {
      expect(getToWarningObject('vitalik.eth')).toStrictEqual({
        to: null,
      });
    });
  });
});
