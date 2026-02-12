import {
  FOUR_BYTE_RESPONSE,
  FOUR_BYTE_RESPONSE_NESTED,
  TRANSACTION_DATA_FOUR_BYTE,
  TRANSACTION_DATA_SOURCIFY_NESTED,
} from '../../../../../test/data/confirmations/transaction-decode';
import { decodeTransactionDataWithFourByte } from './four-byte';

describe('Four Byte', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockImplementation(fetchMock);
  });

  describe('decodeTransactionDataWithFourByte', () => {
    it('returns expected data', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => FOUR_BYTE_RESPONSE,
      });

      const result = await decodeTransactionDataWithFourByte(
        TRANSACTION_DATA_FOUR_BYTE,
      );

      expect(result).toMatchInlineSnapshot(`
        {
          "name": "someOtherFunction",
          "params": [
            {
              "children": undefined,
              "name": undefined,
              "type": "address",
              "value": "0xec8507EcF7e946992294F06423A79835a3226846",
            },
            {
              "children": undefined,
              "name": undefined,
              "type": "uint256",
              "value": {
                "hex": "0x64",
                "type": "BigNumber",
              },
            },
          ],
        }
      `);
    });

    it('returns expected data with tuples and arrays', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => FOUR_BYTE_RESPONSE_NESTED,
      });

      const result = await decodeTransactionDataWithFourByte(
        TRANSACTION_DATA_SOURCIFY_NESTED,
      );

      expect(result).toMatchInlineSnapshot(`
        {
          "name": "permit",
          "params": [
            {
              "children": undefined,
              "name": undefined,
              "type": "address",
              "value": "0xBe3be93fFAD7d417C08124B43286f4476C006AFe",
            },
            {
              "children": [
                {
                  "children": [
                    {
                      "children": [
                        {
                          "children": undefined,
                          "name": undefined,
                          "type": "address",
                          "value": "0x0305f515fa978cf87226cf8A9776D25bcfb2Cc0B",
                        },
                        {
                          "children": undefined,
                          "name": undefined,
                          "type": "uint160",
                          "value": {
                            "hex": "0xffffffffffffffffffffffffffffffffffffffff",
                            "type": "BigNumber",
                          },
                        },
                        {
                          "children": undefined,
                          "name": undefined,
                          "type": "uint48",
                          "value": 1749259022275,
                        },
                        {
                          "children": undefined,
                          "name": undefined,
                          "type": "uint48",
                          "value": 0,
                        },
                      ],
                      "name": "Item 1",
                      "type": "tuple",
                      "value": [
                        "0x0305f515fa978cf87226cf8A9776D25bcfb2Cc0B",
                        {
                          "hex": "0xffffffffffffffffffffffffffffffffffffffff",
                          "type": "BigNumber",
                        },
                        1749259022275,
                        0,
                      ],
                    },
                    {
                      "children": [
                        {
                          "children": undefined,
                          "name": undefined,
                          "type": "address",
                          "value": "0x4385328cc4D643Ca98DfEA734360C0F596C83449",
                        },
                        {
                          "children": undefined,
                          "name": undefined,
                          "type": "uint160",
                          "value": {
                            "hex": "0xffffffffffffffffffffffffffffffffffffffff",
                            "type": "BigNumber",
                          },
                        },
                        {
                          "children": undefined,
                          "name": undefined,
                          "type": "uint48",
                          "value": 1749259022275,
                        },
                        {
                          "children": undefined,
                          "name": undefined,
                          "type": "uint48",
                          "value": 0,
                        },
                      ],
                      "name": "Item 2",
                      "type": "tuple",
                      "value": [
                        "0x4385328cc4D643Ca98DfEA734360C0F596C83449",
                        {
                          "hex": "0xffffffffffffffffffffffffffffffffffffffff",
                          "type": "BigNumber",
                        },
                        1749259022275,
                        0,
                      ],
                    },
                    {
                      "children": [
                        {
                          "children": undefined,
                          "name": undefined,
                          "type": "address",
                          "value": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
                        },
                        {
                          "children": undefined,
                          "name": undefined,
                          "type": "uint160",
                          "value": {
                            "hex": "0xffffffffffffffffffffffffffffffffffffffff",
                            "type": "BigNumber",
                          },
                        },
                        {
                          "children": undefined,
                          "name": undefined,
                          "type": "uint48",
                          "value": 1749259022275,
                        },
                        {
                          "children": undefined,
                          "name": undefined,
                          "type": "uint48",
                          "value": 0,
                        },
                      ],
                      "name": "Item 3",
                      "type": "tuple",
                      "value": [
                        "0xdAC17F958D2ee523a2206206994597C13D831ec7",
                        {
                          "hex": "0xffffffffffffffffffffffffffffffffffffffff",
                          "type": "BigNumber",
                        },
                        1749259022275,
                        0,
                      ],
                    },
                  ],
                  "name": undefined,
                  "type": "tuple[]",
                  "value": [
                    [
                      "0x0305f515fa978cf87226cf8A9776D25bcfb2Cc0B",
                      {
                        "hex": "0xffffffffffffffffffffffffffffffffffffffff",
                        "type": "BigNumber",
                      },
                      1749259022275,
                      0,
                    ],
                    [
                      "0x4385328cc4D643Ca98DfEA734360C0F596C83449",
                      {
                        "hex": "0xffffffffffffffffffffffffffffffffffffffff",
                        "type": "BigNumber",
                      },
                      1749259022275,
                      0,
                    ],
                    [
                      "0xdAC17F958D2ee523a2206206994597C13D831ec7",
                      {
                        "hex": "0xffffffffffffffffffffffffffffffffffffffff",
                        "type": "BigNumber",
                      },
                      1749259022275,
                      0,
                    ],
                  ],
                },
                {
                  "children": undefined,
                  "name": undefined,
                  "type": "address",
                  "value": "0xCC97F2E548ab94F40e5ADf473F596CEd83B6ee0a",
                },
                {
                  "children": undefined,
                  "name": undefined,
                  "type": "uint256",
                  "value": {
                    "hex": "0x019747f66fc3",
                    "type": "BigNumber",
                  },
                },
              ],
              "name": undefined,
              "type": "tuple",
              "value": [
                [
                  [
                    "0x0305f515fa978cf87226cf8A9776D25bcfb2Cc0B",
                    {
                      "hex": "0xffffffffffffffffffffffffffffffffffffffff",
                      "type": "BigNumber",
                    },
                    1749259022275,
                    0,
                  ],
                  [
                    "0x4385328cc4D643Ca98DfEA734360C0F596C83449",
                    {
                      "hex": "0xffffffffffffffffffffffffffffffffffffffff",
                      "type": "BigNumber",
                    },
                    1749259022275,
                    0,
                  ],
                  [
                    "0xdAC17F958D2ee523a2206206994597C13D831ec7",
                    {
                      "hex": "0xffffffffffffffffffffffffffffffffffffffff",
                      "type": "BigNumber",
                    },
                    1749259022275,
                    0,
                  ],
                ],
                "0xCC97F2E548ab94F40e5ADf473F596CEd83B6ee0a",
                {
                  "hex": "0x019747f66fc3",
                  "type": "BigNumber",
                },
              ],
            },
            {
              "children": undefined,
              "name": undefined,
              "type": "bytes",
              "value": "0x56e1fabfaf96d309b0039896d1f68b51e27f0e25b4481db8cad059b7e8db95d918bdc43ab1d03a0b6a84c7ea2219bf01133ceab4e7ca4e38055e4ed8af78a63b1b",
            },
          ],
        }
      `);
    });
  });
});
