import { MessageTypes } from '@metamask/eth-sig-util';
import { sanitizeMessageRecursively } from './typed-signature';

describe('typed-signature utils', () => {
  describe('sanitizeMessageRecursively', () => {
    const types: MessageTypes = {
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

    const primaryType = 'Root';

    const nestedObjectMock = {
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

    const messageWithExtraField = {
      root: '0xbb50db86866daf83b8142fb53a50e4173c67f57330f24654ab7b110c484c8918',
      extraField: 'should be removed',
      nestedObjectMock,
    };

    const nestedMessageWithExtraField = {
      root: '0xbb50db86866daf83b8142fb53a50e4173c67f57330f24654ab7b110c484c8918',
      nested: {
        field: 'value',
        extraField: 'should be removed',
      },
      nestedObjectMock,
    };
    it('removes extra fields from the message object', () => {
      const sanitizedMessage = sanitizeMessageRecursively(
        messageWithExtraField,
        types,
        primaryType,
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
      const typesWithoutRoot: MessageTypes = {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
      };

      const sanitizedMessage = sanitizeMessageRecursively(
        message,
        typesWithoutRoot,
        primaryType,
      );

      expect(sanitizedMessage).toStrictEqual(message);
    });

    it('removes extra fields from nested objects', () => {
      const sanitizedMessage = sanitizeMessageRecursively(
        nestedMessageWithExtraField,
        types,
        primaryType,
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
