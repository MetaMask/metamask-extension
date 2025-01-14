import { sanitizeMessage, stripOneLayerofNesting } from './typed-signature';
import { MessageTypes } from '@metamask/eth-sig-util';

describe('typed-signature utils', () => {
  describe('sanitizeMessage', () => {
    let message: Record<string, unknown>;
    let primaryType: string;
    let types: MessageTypes;

    beforeEach(() => {
      message = {
        contents: 'Hello, Bob!',
        from: {
          name: 'Cow',
          wallets: [
            '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
            '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
          ],
        },
        to: [
          {
            name: 'Bob',
            wallets: [
              '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
              '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
              '0xB0B0b0b0b0b0B000000000000000000000000000',
            ],
          },
        ],
        nestArray: [
          [12, 34, 56],
          [56, 78, 89],
        ],
      };
      primaryType = 'Mail';
      types = {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person[]' },
          { name: 'contents', type: 'string' },
          { name: 'nestArray', type: 'uint256[2][2]' },
          { name: 'nestedPeople', type: 'Person[][]' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallets', type: 'address[]' },
        ],
      };
    });

    it('is not vulnerable to ReDoS when stripping nesting', () => {
      const startTime = Date.now();
      stripOneLayerofNesting(`${'['.repeat(90000)}|[]`);
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(3000);
    });

    it('throws an error if types is undefined', () => {
      expect(() =>
        sanitizeMessage(message, primaryType, undefined as unknown as MessageTypes),
      ).toThrow('Invalid types definition');
    });

    it('throws an error if base type is not defined', () => {
      expect(() => sanitizeMessage(message, undefined as unknown as string, types)).toThrow(
        'Invalid primary type definition',
      );
    });

    it('returns parsed message if types is defined', () => {
      const result = sanitizeMessage(message, primaryType, types);
      expect(result).toStrictEqual({
        type: 'Mail',
        value: {
          contents: {
            type: 'string',
            value: 'Hello, Bob!',
          },
          from: {
            type: 'Person',
            value: {
              name: {
                type: 'string',
                value: 'Cow',
              },
              wallets: {
                type: 'address[]',
                value: [
                  {
                    type: 'address',
                    value: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
                  },
                  {
                    type: 'address',
                    value: '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
                  },
                ],
              },
            },
          },
          nestArray: {
            type: 'uint256[2][2]',
            value: [
              {
                type: 'uint256[2]',
                value: [
                  {
                    type: 'uint256',
                    value: 12,
                  },
                  {
                    type: 'uint256',
                    value: 34,
                  },
                  {
                    type: 'uint256',
                    value: 56,
                  },
                ],
              },
              {
                type: 'uint256[2]',
                value: [
                  {
                    type: 'uint256',
                    value: 56,
                  },
                  {
                    type: 'uint256',
                    value: 78,
                  },
                  {
                    type: 'uint256',
                    value: 89,
                  },
                ],
              },
            ],
          },
          to: {
            type: 'Person[]',
            value: [
              {
                type: 'Person',
                value: {
                  name: {
                    type: 'string',
                    value: 'Bob',
                  },
                  wallets: {
                    type: 'address[]',
                    value: [
                      {
                        type: 'address',
                        value: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                      },
                      {
                        type: 'address',
                        value: '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
                      },
                      {
                        type: 'address',
                        value: '0xB0B0b0b0b0b0B000000000000000000000000000',
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      });
    });

    it('returns parsed nested array if defined', () => {
      const result = sanitizeMessage(
        {
          nestArray: [
            [12, 34, 56],
            [56, 78, 89],
          ],
        },
        primaryType,
        types,
      );
      expect(result).toStrictEqual({
        type: 'Mail',
        value: {
          nestArray: {
            type: 'uint256[2][2]',
            value: [
              {
                type: 'uint256[2]',
                value: [
                  {
                    type: 'uint256',
                    value: 12,
                  },
                  {
                    type: 'uint256',
                    value: 34,
                  },
                  {
                    type: 'uint256',
                    value: 56,
                  },
                ],
              },
              {
                type: 'uint256[2]',
                value: [
                  {
                    type: 'uint256',
                    value: 56,
                  },
                  {
                    type: 'uint256',
                    value: 78,
                  },
                  {
                    type: 'uint256',
                    value: 89,
                  },
                ],
              },
            ],
          },
        },
      });
    });

    it('returns parsed nested array with struct if defined', () => {
      const msg = {
        nestedPeople: [
          [
            {
              name: 'Bob',
              wallets: [
                '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
                '0xB0B0b0b0b0b0B000000000000000000000000000',
              ],
            },
          ],
          [
            {
              name: 'Ben',
              wallets: [
                '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
                '0xB0B0b0b0b0b0B000000000000000000000000000',
              ],
            },
            {
              name: 'Brandon',
              wallets: [
                '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
                '0xB0B0b0b0b0b0B000000000000000000000000000',
              ],
            },
          ],
        ],
      };
      const result = sanitizeMessage(msg, primaryType, types);
      expect(result).toStrictEqual({
        type: 'Mail',
        value: {
          nestedPeople: {
            type: 'Person[][]',
            value: [
              {
                type: 'Person[]',
                value: [
                  {
                    type: 'Person',
                    value: {
                      name: {
                        type: 'string',
                        value: 'Bob',
                      },
                      wallets: {
                        type: 'address[]',
                        value: [
                          {
                            type: 'address',
                            value: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                          },
                          {
                            type: 'address',
                            value: '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
                          },
                          {
                            type: 'address',
                            value: '0xB0B0b0b0b0b0B000000000000000000000000000',
                          },
                        ],
                      },
                    },
                  },
                ],
              },
              {
                type: 'Person[]',
                value: [
                  {
                    type: 'Person',
                    value: {
                      name: {
                        type: 'string',
                        value: 'Ben',
                      },
                      wallets: {
                        type: 'address[]',
                        value: [
                          {
                            type: 'address',
                            value: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                          },
                          {
                            type: 'address',
                            value: '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
                          },
                          {
                            type: 'address',
                            value: '0xB0B0b0b0b0b0B000000000000000000000000000',
                          },
                        ],
                      },
                    },
                  },
                  {
                    type: 'Person',
                    value: {
                      name: {
                        type: 'string',
                        value: 'Brandon',
                      },
                      wallets: {
                        type: 'address[]',
                        value: [
                          {
                            type: 'address',
                            value: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                          },
                          {
                            type: 'address',
                            value: '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
                          },
                          {
                            type: 'address',
                            value: '0xB0B0b0b0b0b0B000000000000000000000000000',
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
      });
    });

    it('ignores message data with unknown types', () => {
      message.do_not_display = 'one';
      message.do_not_display_2 = {
        do_not_display: 'two',
      };

      const result = sanitizeMessage(message, primaryType, types);
      expect(result).toStrictEqual({
        type: 'Mail',
        value: {
          contents: {
            type: 'string',
            value: 'Hello, Bob!',
          },
          from: {
            type: 'Person',
            value: {
              name: {
                type: 'string',
                value: 'Cow',
              },
              wallets: {
                type: 'address[]',
                value: [
                  {
                    type: 'address',
                    value: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
                  },
                  {
                    type: 'address',
                    value: '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
                  },
                ],
              },
            },
          },
          nestArray: {
            type: 'uint256[2][2]',
            value: [
              {
                type: 'uint256[2]',
                value: [
                  {
                    type: 'uint256',
                    value: 12,
                  },
                  {
                    type: 'uint256',
                    value: 34,
                  },
                  {
                    type: 'uint256',
                    value: 56,
                  },
                ],
              },
              {
                type: 'uint256[2]',
                value: [
                  {
                    type: 'uint256',
                    value: 56,
                  },
                  {
                    type: 'uint256',
                    value: 78,
                  },
                  {
                    type: 'uint256',
                    value: 89,
                  },
                ],
              },
            ],
          },
          to: {
            type: 'Person[]',
            value: [
              {
                type: 'Person',
                value: {
                  name: {
                    type: 'string',
                    value: 'Bob',
                  },
                  wallets: {
                    type: 'address[]',
                    value: [
                      {
                        type: 'address',
                        value: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                      },
                      {
                        type: 'address',
                        value: '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
                      },
                      {
                        type: 'address',
                        value: '0xB0B0b0b0b0b0B000000000000000000000000000',
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      });
    });
  });
});