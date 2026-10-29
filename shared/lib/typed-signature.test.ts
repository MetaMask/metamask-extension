import { MessageTypes } from '@metamask/eth-sig-util';
import { sanitizeMessageRecursively } from './typed-signature';

describe('typed-signature utils', () => {
  describe('sanitizeMessageRecursively', () => {
    const MESSAGE_TYPES: MessageTypes = {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Root: [
        { name: 'root', type: 'bytes32' },
        { name: 'nested', type: 'NestedType' },
      ],
      NestedType: [{ name: 'field', type: 'string' }],
    };

    const PRIMARY_TYPE = 'Root';

    const NESTED_OBJECT_MOCK = {
      a: {
        a: {
          a: {
            a: {
              a: {
                a: {
                  a: {
                    a: {
                      a: {
                        a: {
                          a: {
                            a: {},
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const MESSAGE_WITH_EXTRA_FIELD = {
      root: '0xbb50db86866daf83b8142fb53a50e4173c67f57330f24654ab7b110c484c8918',
      extraField: 'should be removed',
      nestedObjectMock: NESTED_OBJECT_MOCK,
    };

    const NESTED_MESSAGE_WITH_EXTRA_FIELD = {
      root: '0xbb50db86866daf83b8142fb53a50e4173c67f57330f24654ab7b110c484c8918',
      nested: {
        field: 'value',
        extraField: 'should be removed',
      },
      nestedObjectMock: NESTED_OBJECT_MOCK,
    };

    it('removes extra fields from the message object', () => {
      const sanitizedMessage = sanitizeMessageRecursively(
        MESSAGE_WITH_EXTRA_FIELD,
        MESSAGE_TYPES,
        PRIMARY_TYPE,
      );

      expect(sanitizedMessage).toStrictEqual({
        root: '0xbb50db86866daf83b8142fb53a50e4173c67f57330f24654ab7b110c484c8918',
      });
      expect(sanitizedMessage).not.toHaveProperty('extraField');
    });

    it('returns the original message if the primary type is not defined in types', () => {
      const message = {
        root: '0xbb50db86866daf83b8142fb53a50e4173c67f57330f24654ab7b110c484c8918',
      };
      const TYPES_WITHOUT_ROOT: MessageTypes = {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
      };

      const sanitizedMessage = sanitizeMessageRecursively(
        message,
        TYPES_WITHOUT_ROOT,
        PRIMARY_TYPE,
      );

      expect(sanitizedMessage).toStrictEqual(message);
    });

    it('removes extra fields from nested objects', () => {
      const sanitizedMessage = sanitizeMessageRecursively(
        NESTED_MESSAGE_WITH_EXTRA_FIELD,
        MESSAGE_TYPES,
        PRIMARY_TYPE,
      );

      expect(sanitizedMessage).toStrictEqual({
        root: '0xbb50db86866daf83b8142fb53a50e4173c67f57330f24654ab7b110c484c8918',
        nested: {
          field: 'value',
        },
      });
      expect(sanitizedMessage.nested).not.toHaveProperty('extraField');
    });
  });
});
