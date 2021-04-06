import assert from 'assert';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import {
  REQUIRED_ERROR,
  INVALID_RECIPIENT_ADDRESS_ERROR,
  KNOWN_RECIPIENT_ADDRESS_ERROR,
  CONFUSING_ENS_ERROR,
  CONTRACT_ADDRESS_ERROR,
} from '../../send.constants';

const stubs = {
  isValidAddress: sinon
    .stub()
    .callsFake((to) => Boolean(to.match(/^[0xabcdef123456798]+$/u))),
};

const toRowUtils = proxyquire('./add-recipient.js', {
  '../../../../helpers/utils/util': {
    isValidAddress: stubs.isValidAddress,
  },
});
const { getToErrorObject, getToWarningObject } = toRowUtils;

describe('add-recipient utils', function () {
  describe('getToErrorObject()', function () {
    it('should return a required error if "to" is falsy', function () {
      assert.deepStrictEqual(getToErrorObject(null), {
        to: REQUIRED_ERROR,
      });
    });

    it('should return an invalid recipient error if "to" is truthy but invalid', function () {
      assert.deepStrictEqual(getToErrorObject('mockInvalidTo'), {
        to: INVALID_RECIPIENT_ADDRESS_ERROR,
      });
    });

    it('should return null if "to" is truthy and valid', function () {
      assert.deepStrictEqual(getToErrorObject('0xabc123'), {
        to: null,
      });
    });

    it('should return a contract address error if the recipient is the same as the tokens contract address', function () {
      assert.deepStrictEqual(getToErrorObject('0xabc123', '0xabc123'), {
        to: CONTRACT_ADDRESS_ERROR,
      });
    });

    it('should return null if the recipient address is not the token contract address', function () {
      assert.deepStrictEqual(getToErrorObject('0xabc123', '0xabc456'), {
        to: null,
      });
    });
  });

  describe('getToWarningObject()', function () {
    it('should return a known address recipient error if "to" is a token address', function () {
      assert.deepStrictEqual(
        getToWarningObject('0xabc123', [{ address: '0xabc123' }], {
          address: '0xabc123',
        }),
        {
          to: KNOWN_RECIPIENT_ADDRESS_ERROR,
        },
      );
    });

    it('should null if "to" is a token address but sendToken is falsy', function () {
      assert.deepStrictEqual(
        getToWarningObject('0xabc123', [{ address: '0xabc123' }]),
        {
          to: null,
        },
      );
    });

    it('should return a known address recipient error if "to" is part of contract metadata', function () {
      assert.deepStrictEqual(
        getToWarningObject(
          '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
          [{ address: '0xabc123' }],
          { address: '0xabc123' },
        ),
        {
          to: KNOWN_RECIPIENT_ADDRESS_ERROR,
        },
      );
    });
    it('should null if "to" is part of contract metadata but sendToken is falsy', function () {
      assert.deepStrictEqual(
        getToWarningObject(
          '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
          [{ address: '0xabc123' }],
          { address: '0xabc123' },
        ),
        {
          to: KNOWN_RECIPIENT_ADDRESS_ERROR,
        },
      );
    });

    it('should warn if name is a valid domain and confusable', function () {
      assert.deepEqual(getToWarningObject('vita‍lik.eth'), {
        to: CONFUSING_ENS_ERROR,
      });
    });

    it('should not warn if name is a valid domain and not confusable', function () {
      assert.deepEqual(getToWarningObject('vitalik.eth'), {
        to: null,
      });
    });
  });
});
