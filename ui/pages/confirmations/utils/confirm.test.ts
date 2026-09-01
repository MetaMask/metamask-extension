import {
  type TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

import {
  orderSignatureMsg,
  permitSignatureMsg,
  permitSignatureMsgWithUnsignedFields,
  unapprovedTypedSignMsgV4,
} from '../../../../test/data/confirmations/typed_sign';
import { SignatureRequestType } from '../types/confirm';
import {
  getConfirmationTransactionType,
  getEip712TokenId,
  getMoneyAccountTransactionType,
  isOrderSignatureRequest,
  isPermitSignatureRequest,
  isProtectedByEnforcedSimulations,
  isSignatureTransactionType,
  parseSanitizeTypedDataMessage,
  isValidASCIIURL,
  toPunycodeURL,
  stripProtocol,
} from './confirm';

const typedDataMsg =
  '{"domain":{"chainId":97,"name":"Ether Mail","verifyingContract":"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC","version":"1"},"message":{"contents":"Hello, Bob!","from":{"name":"Cow","wallets":["0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826","0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF","0x06195827297c7A80a443b6894d3BDB8824b43896"]},"to":[{"name":"Bob","wallets":["0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB","0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57","0xB0B0b0b0b0b0B000000000000000000000000000"]}]},"primaryType":"Mail","types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"Mail":[{"name":"from","type":"Person"},{"name":"to","type":"Person[]"},{"name":"contents","type":"string"}],"Person":[{"name":"name","type":"string"},{"name":"wallets","type":"address[]"}]}}';

describe('confirm util', () => {
  describe('parseSanitizeTypedDataMessage', () => {
    it('parses and sanitizes data passed correctly', () => {
      const result = parseSanitizeTypedDataMessage(typedDataMsg);
      expect(result.sanitizedMessage.type).toBe('Mail');
      expect(result.primaryType).toBe('Mail');
    });
    it('removes message fields that are not declared by the primary type', () => {
      const result = parseSanitizeTypedDataMessage(
        permitSignatureMsgWithUnsignedFields.msgParams?.data as string,
      );

      expect(result.message).toStrictEqual({
        owner: '0x935e73edb9ff52e23bac7f7e043a1ecd06d05477',
        spender: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
        value:
          '115792089237316195423570985008687907853269984665640564039457584007913129639935',
        nonce: '0',
        deadline: '1893456000',
      });
      expect(result.message).not.toHaveProperty('tokenId');
      expect(result.message).not.toHaveProperty('allowed');
    });

    it('removes domain fields that are not declared by EIP712Domain', () => {
      const result = parseSanitizeTypedDataMessage(
        JSON.stringify({
          types: {
            EIP712Domain: [{ name: 'name', type: 'string' }],
            Permit: [{ name: 'value', type: 'uint256' }],
          },
          primaryType: 'Permit',
          domain: {
            name: 'Token',
            verifyingContract:
              '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          },
          message: { value: '1' },
        }),
      );

      expect(result.domain).toStrictEqual({ name: 'Token' });
    });

    it('removes unsigned fields from nested struct arrays', () => {
      const result = parseSanitizeTypedDataMessage(
        JSON.stringify({
          types: {
            PermitBatch: [{ name: 'details', type: 'PermitDetails[]' }],
            PermitDetails: [
              { name: 'token', type: 'address' },
              { name: 'amount', type: 'uint160' },
            ],
          },
          primaryType: 'PermitBatch',
          domain: {},
          message: {
            details: [
              {
                token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                amount: '100',
                unsignedAmount: '0',
              },
            ],
          },
        }),
      );

      expect(result.message).toStrictEqual({
        details: [
          {
            token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            amount: '100',
          },
        ],
      });
    });

    it('throw error for invalid typedDataMessage', () => {
      expect(() => {
        parseSanitizeTypedDataMessage('{}');
      }).toThrow();
    });
  });

  describe('getEip712TokenId', () => {
    const types = {
      Permit: [{ name: 'tokenId', type: 'uint256' }],
    };

    it('returns a normalized schema-declared uint256 token ID', () => {
      expect(getEip712TokenId({ tokenId: '0x2a' }, types, 'Permit')).toBe(
        '42',
      );
    });

    it('ignores an undeclared token ID', () => {
      expect(getEip712TokenId({ tokenId: '42' }, {}, 'Permit')).toBeUndefined();
    });

    it('ignores malformed and out-of-range token IDs', () => {
      expect(
        getEip712TokenId({ tokenId: 'not-a-number' }, types, 'Permit'),
      ).toBeUndefined();
      expect(
        getEip712TokenId(
          {
            tokenId:
              '115792089237316195423570985008687907853269984665640564039457584007913129639936',
          },
          types,
          'Permit',
        ),
      ).toBeUndefined();
    });
  });

  describe('getMoneyAccountTransactionType', () => {
    it('returns moneyAccountDeposit when it is a nested transaction of a batch', () => {
      const transactionMeta = {
        type: TransactionType.batch,
        nestedTransactions: [
          { type: TransactionType.tokenMethodApprove },
          { type: TransactionType.moneyAccountDeposit },
        ],
      } as unknown as TransactionMeta;

      expect(getMoneyAccountTransactionType(transactionMeta)).toBe(
        TransactionType.moneyAccountDeposit,
      );
    });

    it('returns moneyAccountWithdraw when it is the top-level type', () => {
      const transactionMeta = {
        type: TransactionType.moneyAccountWithdraw,
      } as TransactionMeta;

      expect(getMoneyAccountTransactionType(transactionMeta)).toBe(
        TransactionType.moneyAccountWithdraw,
      );
    });

    it('returns undefined for unrelated batch transactions', () => {
      const transactionMeta = {
        type: TransactionType.batch,
        nestedTransactions: [
          { type: TransactionType.tokenMethodApprove },
          { type: TransactionType.tokenMethodTransfer },
        ],
      } as unknown as TransactionMeta;

      expect(getMoneyAccountTransactionType(transactionMeta)).toBeUndefined();
    });

    it('returns undefined when transactionMeta is undefined', () => {
      expect(getMoneyAccountTransactionType(undefined)).toBeUndefined();
    });
  });

  describe('getConfirmationTransactionType', () => {
    it('returns the nested money-account type for batch transactions', () => {
      const transactionMeta = {
        type: TransactionType.batch,
        nestedTransactions: [
          { type: TransactionType.tokenMethodApprove },
          { type: TransactionType.moneyAccountDeposit },
        ],
      } as unknown as TransactionMeta;

      expect(getConfirmationTransactionType(transactionMeta)).toBe(
        TransactionType.moneyAccountDeposit,
      );
    });

    it('returns the nested pay type for batch transactions', () => {
      const transactionMeta = {
        type: TransactionType.batch,
        nestedTransactions: [
          { type: TransactionType.tokenMethodApprove },
          { type: TransactionType.perpsDeposit },
        ],
      } as unknown as TransactionMeta;

      expect(getConfirmationTransactionType(transactionMeta)).toBe(
        TransactionType.perpsDeposit,
      );
    });

    it('returns the top-level type when no pay type is present', () => {
      const transactionMeta = {
        type: TransactionType.simpleSend,
      } as TransactionMeta;

      expect(getConfirmationTransactionType(transactionMeta)).toBe(
        TransactionType.simpleSend,
      );
    });

    it('returns undefined when the transaction is undefined', () => {
      expect(getConfirmationTransactionType(undefined)).toBeUndefined();
    });
  });

  describe('isSignatureTransactionType', () => {
    it('returns true for signature transaction requests', () => {
      const result = isSignatureTransactionType({
        type: TransactionType.personalSign,
      });
      expect(result).toStrictEqual(true);
    });
    it('returns false for request not of type signature', () => {
      const result = isSignatureTransactionType({
        type: TransactionType.contractInteraction,
      });
      expect(result).toStrictEqual(false);
    });
  });

  describe('isPermitSignatureRequest', () => {
    it('returns true for permit signature requests', () => {
      const result = isPermitSignatureRequest(
        permitSignatureMsg as SignatureRequestType,
      );
      expect(result).toStrictEqual(true);
    });
    it('returns false for request not of type permit signature', () => {
      const result = isPermitSignatureRequest(
        unapprovedTypedSignMsgV4 as SignatureRequestType,
      );
      expect(result).toStrictEqual(false);
    });
  });

  describe('isOrderSignatureRequest', () => {
    it('returns true for permit signature requests', () => {
      const result = isOrderSignatureRequest(
        orderSignatureMsg as SignatureRequestType,
      );
      expect(result).toStrictEqual(true);
    });

    it('returns false for request not of type permit signature', () => {
      const result = isOrderSignatureRequest(
        unapprovedTypedSignMsgV4 as SignatureRequestType,
      );
      expect(result).toStrictEqual(false);
    });
  });

  describe('isValidASCIIURL', () => {
    it('returns true for URL containing only ASCII characters in its hostname', () => {
      expect(isValidASCIIURL('https://www.google.com')).toEqual(true);
    });

    it('returns true for URL with both its hostname and path containing ASCII characters', () => {
      expect(
        isValidASCIIURL('https://infura.io/gnosis?x=xn--ifura-dig.io'),
      ).toStrictEqual(true);
    });

    it('returns true for URL with its hostname containing ASCII characters and its path containing non-ASCII characters', () => {
      expect(
        isValidASCIIURL('https://infura.io/gnosis?x=iոfura.io'),
      ).toStrictEqual(true);
      expect(
        isValidASCIIURL('infura.io:7777/gnosis?x=iոfura.io'),
      ).toStrictEqual(true);
    });

    it('returns false for URL with its hostname containing non-ASCII characters', () => {
      expect(isValidASCIIURL('https://iոfura.io/gnosis')).toStrictEqual(false);
      expect(isValidASCIIURL('iոfura.io:7777/gnosis?x=test')).toStrictEqual(
        false,
      );
    });

    it('returns false for empty string', () => {
      expect(isValidASCIIURL('')).toStrictEqual(false);
    });
  });

  describe('toPunycodeURL', () => {
    it('returns punycode version of URL', () => {
      expect(toPunycodeURL('https://iոfura.io/gnosis')).toStrictEqual(
        'https://xn--ifura-dig.io/gnosis',
      );
      expect(toPunycodeURL('https://iոfura.io')).toStrictEqual(
        'https://xn--ifura-dig.io',
      );
      expect(toPunycodeURL('https://iոfura.io/')).toStrictEqual(
        'https://xn--ifura-dig.io/',
      );
      expect(
        toPunycodeURL('https://iոfura.io/gnosis:5050?test=iոfura&foo=bar'),
      ).toStrictEqual(
        'https://xn--ifura-dig.io/gnosis:5050?test=i%D5%B8fura&foo=bar',
      );
      expect(toPunycodeURL('https://www.google.com')).toStrictEqual(
        'https://www.google.com',
      );
    });
  });

  describe('stripUrlProtocol', () => {
    it('removes https protocol from URL', () => {
      expect(stripProtocol('https://example.com')).toStrictEqual('example.com');
    });

    it('removes http protocol from URL', () => {
      expect(stripProtocol('http://localhost:8545')).toStrictEqual(
        'localhost:8545',
      );
    });
  });

  describe('isProtectedByEnforcedSimulations', () => {
    const REDEEM_DELEGATIONS_DATA = '0xcef6d20900000000';

    function makeFailedTx(
      overrides: {
        revertMessage?: string;
        data?: string;
        status?: TransactionStatus;
      } = {},
    ): TransactionMeta {
      const {
        revertMessage = 'NativeBalanceChangeEnforcer:hasnt-decreased-enough',
        data = REDEEM_DELEGATIONS_DATA,
        status = TransactionStatus.failed,
      } = overrides;
      return {
        status,
        revert: revertMessage
          ? { receipt: { message: revertMessage } }
          : undefined,
        txParams: { data },
      } as unknown as TransactionMeta;
    }

    it('returns true when status is failed, receipt revert matches an enforcer prefix and data has the redeemDelegations selector', () => {
      expect(isProtectedByEnforcedSimulations(makeFailedTx())).toBe(true);
    });

    it('returns true regardless of the enforcer name (generic match)', () => {
      expect(
        isProtectedByEnforcedSimulations(
          makeFailedTx({ revertMessage: 'SomeNewEnforcer:reason' }),
        ),
      ).toBe(true);
    });

    it('matches the redeemDelegations selector case-insensitively', () => {
      expect(
        isProtectedByEnforcedSimulations(
          makeFailedTx({ data: '0xCEF6D20900000000' }),
        ),
      ).toBe(true);
    });

    it('returns false when status is not failed', () => {
      expect(
        isProtectedByEnforcedSimulations(
          makeFailedTx({ status: TransactionStatus.confirmed }),
        ),
      ).toBe(false);
    });

    it('returns false when transactionMeta is undefined', () => {
      expect(isProtectedByEnforcedSimulations(undefined)).toBe(false);
    });

    it('returns false when the data does not start with the redeemDelegations selector', () => {
      expect(
        isProtectedByEnforcedSimulations(
          makeFailedTx({ data: '0xa9059cbb00000000' }),
        ),
      ).toBe(false);
    });

    it('returns false when receipt revert reason lacks an enforcer prefix', () => {
      expect(
        isProtectedByEnforcedSimulations(
          makeFailedTx({ revertMessage: 'insufficient funds' }),
        ),
      ).toBe(false);
    });

    it('returns false when revert.receipt is missing', () => {
      expect(
        isProtectedByEnforcedSimulations(makeFailedTx({ revertMessage: '' })),
      ).toBe(false);
    });

    it('does not match a revert reason starting with a lowercase letter', () => {
      expect(
        isProtectedByEnforcedSimulations(
          makeFailedTx({ revertMessage: 'nativeBalanceChangeEnforcer:reason' }),
        ),
      ).toBe(false);
    });
  });
});
