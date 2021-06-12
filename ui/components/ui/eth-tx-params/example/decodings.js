export default [
  {
    "tx": {
      "kind": "function",
      "class": {
        "typeClass": "contract",
        "kind": "native",
        "id": "shimmedcompilationNumber(0):4015",
        "typeName": "Wrapper",
        "contractKind": "contract",
        "payable": true
      },
      "abi": {
        "inputs": [
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "nonce",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "expiry",
                "type": "uint256"
              },
              {
                "components": [
                  {
                    "internalType": "bytes4",
                    "name": "kind",
                    "type": "bytes4"
                  },
                  {
                    "internalType": "address",
                    "name": "wallet",
                    "type": "address"
                  },
                  {
                    "internalType": "address",
                    "name": "token",
                    "type": "address"
                  },
                  {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                  },
                  {
                    "internalType": "uint256",
                    "name": "id",
                    "type": "uint256"
                  }
                ],
                "internalType": "struct Types.Party",
                "name": "signer",
                "type": "tuple"
              },
              {
                "components": [
                  {
                    "internalType": "bytes4",
                    "name": "kind",
                    "type": "bytes4"
                  },
                  {
                    "internalType": "address",
                    "name": "wallet",
                    "type": "address"
                  },
                  {
                    "internalType": "address",
                    "name": "token",
                    "type": "address"
                  },
                  {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                  },
                  {
                    "internalType": "uint256",
                    "name": "id",
                    "type": "uint256"
                  }
                ],
                "internalType": "struct Types.Party",
                "name": "sender",
                "type": "tuple"
              },
              {
                "components": [
                  {
                    "internalType": "bytes4",
                    "name": "kind",
                    "type": "bytes4"
                  },
                  {
                    "internalType": "address",
                    "name": "wallet",
                    "type": "address"
                  },
                  {
                    "internalType": "address",
                    "name": "token",
                    "type": "address"
                  },
                  {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                  },
                  {
                    "internalType": "uint256",
                    "name": "id",
                    "type": "uint256"
                  }
                ],
                "internalType": "struct Types.Party",
                "name": "affiliate",
                "type": "tuple"
              },
              {
                "components": [
                  {
                    "internalType": "address",
                    "name": "signatory",
                    "type": "address"
                  },
                  {
                    "internalType": "address",
                    "name": "validator",
                    "type": "address"
                  },
                  {
                    "internalType": "bytes1",
                    "name": "version",
                    "type": "bytes1"
                  },
                  {
                    "internalType": "uint8",
                    "name": "v",
                    "type": "uint8"
                  },
                  {
                    "internalType": "bytes32",
                    "name": "r",
                    "type": "bytes32"
                  },
                  {
                    "internalType": "bytes32",
                    "name": "s",
                    "type": "bytes32"
                  }
                ],
                "internalType": "struct Types.Signature",
                "name": "signature",
                "type": "tuple"
              }
            ],
            "internalType": "struct Types.Order",
            "name": "order",
            "type": "tuple"
          }
        ],
        "name": "swap",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      "arguments": [
        {
          "name": "order",
          "value": {
            "type": {
              "typeClass": "struct",
              "kind": "local",
              "id": "shimmedcompilationNumber(0):18",
              "typeName": "Order",
              "definingContractName": "Types",
              "location": "calldata"
            },
            "kind": "value",
            "value": [
              {
                "name": "nonce",
                "value": {
                  "type": {
                    "typeClass": "uint",
                    "bits": 256,
                    "typeHint": "uint256"
                  },
                  "kind": "value",
                  "value": {
                    "asString": "1613670935156",
                    "rawAsString": "1613670935156"
                  }
                }
              },
              {
                "name": "expiry",
                "value": {
                  "type": {
                    "typeClass": "uint",
                    "bits": 256,
                    "typeHint": "uint256"
                  },
                  "kind": "value",
                  "value": {
                    "asString": "1613682674",
                    "rawAsString": "1613682674"
                  }
                }
              },
              {
                "name": "signer",
                "value": {
                  "type": {
                    "typeClass": "struct",
                    "kind": "local",
                    "id": "shimmedcompilationNumber(0):29",
                    "typeName": "Party",
                    "definingContractName": "Types",
                    "location": "calldata"
                  },
                  "kind": "value",
                  "value": [
                    {
                      "name": "kind",
                      "value": {
                        "type": {
                          "typeClass": "bytes",
                          "kind": "static",
                          "length": 4,
                          "typeHint": "bytes4"
                        },
                        "kind": "value",
                        "value": {
                          "asHex": "0x36372b07",
                          "rawAsHex": "0x36372b0700000000000000000000000000000000000000000000000000000000"
                        }
                      }
                    },
                    {
                      "name": "wallet",
                      "value": {
                        "type": {
                          "typeClass": "address",
                          "kind": "general",
                          "typeHint": "address"
                        },
                        "kind": "value",
                        "value": {
                          "asAddress": "0x00000000000080C886232E9b7EBBFb942B5987AA",
                          "rawAsHex": "0x00000000000000000000000000000000000080c886232e9b7ebbfb942b5987aa"
                        }
                      }
                    },
                    {
                      "name": "token",
                      "value": {
                        "type": {
                          "typeClass": "address",
                          "kind": "general",
                          "typeHint": "address"
                        },
                        "kind": "value",
                        "value": {
                          "asAddress": "0x27054b13b1B798B345b591a4d22e6562d47eA75a",
                          "rawAsHex": "0x00000000000000000000000027054b13b1b798b345b591a4d22e6562d47ea75a"
                        }
                      }
                    },
                    {
                      "name": "amount",
                      "value": {
                        "type": {
                          "typeClass": "uint",
                          "bits": 256,
                          "typeHint": "uint256"
                        },
                        "kind": "value",
                        "value": {
                          "asString": "150000000",
                          "rawAsString": "150000000"
                        }
                      }
                    },
                    {
                      "name": "id",
                      "value": {
                        "type": {
                          "typeClass": "uint",
                          "bits": 256,
                          "typeHint": "uint256"
                        },
                        "kind": "value",
                        "value": {
                          "asString": "0",
                          "rawAsString": "0"
                        }
                      }
                    }
                  ]
                }
              },
              {
                "name": "sender",
                "value": {
                  "type": {
                    "typeClass": "struct",
                    "kind": "local",
                    "id": "shimmedcompilationNumber(0):29",
                    "typeName": "Party",
                    "definingContractName": "Types",
                    "location": "calldata"
                  },
                  "kind": "value",
                  "value": [
                    {
                      "name": "kind",
                      "value": {
                        "type": {
                          "typeClass": "bytes",
                          "kind": "static",
                          "length": 4,
                          "typeHint": "bytes4"
                        },
                        "kind": "value",
                        "value": {
                          "asHex": "0x36372b07",
                          "rawAsHex": "0x36372b0700000000000000000000000000000000000000000000000000000000"
                        }
                      }
                    },
                    {
                      "name": "wallet",
                      "value": {
                        "type": {
                          "typeClass": "address",
                          "kind": "general",
                          "typeHint": "address"
                        },
                        "kind": "value",
                        "value": {
                          "asAddress": "0x4b203f54429F7D3019C0c4998B88f8f3517f8352",
                          "rawAsHex": "0x0000000000000000000000004b203f54429f7d3019c0c4998b88f8f3517f8352"
                        }
                      }
                    },
                    {
                      "name": "token",
                      "value": {
                        "type": {
                          "typeClass": "address",
                          "kind": "general",
                          "typeHint": "address"
                        },
                        "kind": "value",
                        "value": {
                          "asAddress": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
                          "rawAsHex": "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
                        }
                      }
                    },
                    {
                      "name": "amount",
                      "value": {
                        "type": {
                          "typeClass": "uint",
                          "bits": 256,
                          "typeHint": "uint256"
                        },
                        "kind": "value",
                        "value": {
                          "asString": "2993210527506098688",
                          "rawAsString": "2993210527506098688"
                        }
                      }
                    },
                    {
                      "name": "id",
                      "value": {
                        "type": {
                          "typeClass": "uint",
                          "bits": 256,
                          "typeHint": "uint256"
                        },
                        "kind": "value",
                        "value": {
                          "asString": "0",
                          "rawAsString": "0"
                        }
                      }
                    }
                  ]
                }
              },
              {
                "name": "affiliate",
                "value": {
                  "type": {
                    "typeClass": "struct",
                    "kind": "local",
                    "id": "shimmedcompilationNumber(0):29",
                    "typeName": "Party",
                    "definingContractName": "Types",
                    "location": "calldata"
                  },
                  "kind": "value",
                  "value": [
                    {
                      "name": "kind",
                      "value": {
                        "type": {
                          "typeClass": "bytes",
                          "kind": "static",
                          "length": 4,
                          "typeHint": "bytes4"
                        },
                        "kind": "value",
                        "value": {
                          "asHex": "0x36372b07",
                          "rawAsHex": "0x36372b0700000000000000000000000000000000000000000000000000000000"
                        }
                      }
                    },
                    {
                      "name": "wallet",
                      "value": {
                        "type": {
                          "typeClass": "address",
                          "kind": "general",
                          "typeHint": "address"
                        },
                        "kind": "value",
                        "value": {
                          "asAddress": "0x0000000000000000000000000000000000000000",
                          "rawAsHex": "0x0000000000000000000000000000000000000000000000000000000000000000"
                        }
                      }
                    },
                    {
                      "name": "token",
                      "value": {
                        "type": {
                          "typeClass": "address",
                          "kind": "general",
                          "typeHint": "address"
                        },
                        "kind": "value",
                        "value": {
                          "asAddress": "0x0000000000000000000000000000000000000000",
                          "rawAsHex": "0x0000000000000000000000000000000000000000000000000000000000000000"
                        }
                      }
                    },
                    {
                      "name": "amount",
                      "value": {
                        "type": {
                          "typeClass": "uint",
                          "bits": 256,
                          "typeHint": "uint256"
                        },
                        "kind": "value",
                        "value": {
                          "asString": "0",
                          "rawAsString": "0"
                        }
                      }
                    },
                    {
                      "name": "id",
                      "value": {
                        "type": {
                          "typeClass": "uint",
                          "bits": 256,
                          "typeHint": "uint256"
                        },
                        "kind": "value",
                        "value": {
                          "asString": "0",
                          "rawAsString": "0"
                        }
                      }
                    }
                  ]
                }
              },
              {
                "name": "signature",
                "value": {
                  "type": {
                    "typeClass": "struct",
                    "kind": "local",
                    "id": "shimmedcompilationNumber(0):42",
                    "typeName": "Signature",
                    "definingContractName": "Types",
                    "location": "calldata"
                  },
                  "kind": "value",
                  "value": [
                    {
                      "name": "signatory",
                      "value": {
                        "type": {
                          "typeClass": "address",
                          "kind": "general",
                          "typeHint": "address"
                        },
                        "kind": "value",
                        "value": {
                          "asAddress": "0x00000000008Bb52B2F23008Ba58939fF59a8f3F2",
                          "rawAsHex": "0x00000000000000000000000000000000008bb52b2f23008ba58939ff59a8f3f2"
                        }
                      }
                    },
                    {
                      "name": "validator",
                      "value": {
                        "type": {
                          "typeClass": "address",
                          "kind": "general",
                          "typeHint": "address"
                        },
                        "kind": "value",
                        "value": {
                          "asAddress": "0x4572f2554421Bd64Bef1c22c8a81840E8D496BeA",
                          "rawAsHex": "0x0000000000000000000000004572f2554421bd64bef1c22c8a81840e8d496bea"
                        }
                      }
                    },
                    {
                      "name": "version",
                      "value": {
                        "type": {
                          "typeClass": "bytes",
                          "kind": "static",
                          "length": 1,
                          "typeHint": "bytes1"
                        },
                        "kind": "value",
                        "value": {
                          "asHex": "0x01",
                          "rawAsHex": "0x0100000000000000000000000000000000000000000000000000000000000000"
                        }
                      }
                    },
                    {
                      "name": "v",
                      "value": {
                        "type": {
                          "typeClass": "uint",
                          "bits": 8,
                          "typeHint": "uint8"
                        },
                        "kind": "value",
                        "value": {
                          "asString": "27",
                          "rawAsString": "27"
                        }
                      }
                    },
                    {
                      "name": "r",
                      "value": {
                        "type": {
                          "typeClass": "bytes",
                          "kind": "static",
                          "length": 32,
                          "typeHint": "bytes32"
                        },
                        "kind": "value",
                        "value": {
                          "asHex": "0x5fcb0cc856bd0afc89493be7bb0e751a9b876b0faebe3086697b3c6c78e4efd3",
                          "rawAsHex": "0x5fcb0cc856bd0afc89493be7bb0e751a9b876b0faebe3086697b3c6c78e4efd3"
                        }
                      }
                    },
                    {
                      "name": "s",
                      "value": {
                        "type": {
                          "typeClass": "bytes",
                          "kind": "static",
                          "length": 32,
                          "typeHint": "bytes32"
                        },
                        "kind": "value",
                        "value": {
                          "asHex": "0x370a7eef528987c13555fd264d96b45af3277b555f9f4f4f6ebf9eb62d3fec2f",
                          "rawAsHex": "0x370a7eef528987c13555fd264d96b45af3277b555f9f4f4f6ebf9eb62d3fec2f"
                        }
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      ],
      "selector": "0x67641c2f",
      "decodingMode": "full"
    },
    "definitions": {
      "compilationsById": {
        "shimmedcompilationNumber(0)": {
          "sourcesById": {
            "0": {
              "language": "Solidity",
              "lines": [
                "/**",
                " *Submitted for verification at Etherscan.io on 20XX-XX-XX",
                "*/",
                "",
                "pragma solidity 0.5.12;",
                "pragma experimental ABIEncoderV2;",
                "// File: @airswap/types/contracts/Types.sol",
                "/*",
                "  Copyright 2020 Swap Holdings Ltd.",
                "  Licensed under the Apache License, Version 2.0 (the \"License\");",
                "  you may not use this file except in compliance with the License.",
                "  You may obtain a copy of the License at",
                "    http://www.apache.org/licenses/LICENSE-2.0",
                "  Unless required by applicable law or agreed to in writing, software",
                "  distributed under the License is distributed on an \"AS IS\" BASIS,",
                "  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
                "  See the License for the specific language governing permissions and",
                "  limitations under the License.",
                "*/",
                "/**",
                "  * @title Types: Library of Swap Protocol Types and Hashes",
                "  */",
                "library Types {",
                "  bytes constant internal EIP191_HEADER = \"\\x19\\x01\";",
                "  struct Order {",
                "    uint256 nonce;                // Unique per order and should be sequential",
                "    uint256 expiry;               // Expiry in seconds since 1 January 1970",
                "    Party signer;                 // Party to the trade that sets terms",
                "    Party sender;                 // Party to the trade that accepts terms",
                "    Party affiliate;              // Party compensated for facilitating (optional)",
                "    Signature signature;          // Signature of the order",
                "  }",
                "  struct Party {",
                "    bytes4 kind;                  // Interface ID of the token",
                "    address wallet;               // Wallet address of the party",
                "    address token;                // Contract address of the token",
                "    uint256 amount;               // Amount for ERC-20 or ERC-1155",
                "    uint256 id;                   // ID for ERC-721 or ERC-1155",
                "  }",
                "  struct Signature {",
                "    address signatory;            // Address of the wallet used to sign",
                "    address validator;            // Address of the intended swap contract",
                "    bytes1 version;               // EIP-191 signature version",
                "    uint8 v;                      // `v` value of an ECDSA signature",
                "    bytes32 r;                    // `r` value of an ECDSA signature",
                "    bytes32 s;                    // `s` value of an ECDSA signature",
                "  }",
                "  bytes32 constant internal DOMAIN_TYPEHASH = keccak256(abi.encodePacked(",
                "    \"EIP712Domain(\",",
                "    \"string name,\",",
                "    \"string version,\",",
                "    \"address verifyingContract\",",
                "    \")\"",
                "  ));",
                "  bytes32 constant internal ORDER_TYPEHASH = keccak256(abi.encodePacked(",
                "    \"Order(\",",
                "    \"uint256 nonce,\",",
                "    \"uint256 expiry,\",",
                "    \"Party signer,\",",
                "    \"Party sender,\",",
                "    \"Party affiliate\",",
                "    \")\",",
                "    \"Party(\",",
                "    \"bytes4 kind,\",",
                "    \"address wallet,\",",
                "    \"address token,\",",
                "    \"uint256 amount,\",",
                "    \"uint256 id\",",
                "    \")\"",
                "  ));",
                "  bytes32 constant internal PARTY_TYPEHASH = keccak256(abi.encodePacked(",
                "    \"Party(\",",
                "    \"bytes4 kind,\",",
                "    \"address wallet,\",",
                "    \"address token,\",",
                "    \"uint256 amount,\",",
                "    \"uint256 id\",",
                "    \")\"",
                "  ));",
                "  /**",
                "    * @notice Hash an order into bytes32",
                "    * @dev EIP-191 header and domain separator included",
                "    * @param order Order The order to be hashed",
                "    * @param domainSeparator bytes32",
                "    * @return bytes32 A keccak256 abi.encodePacked value",
                "    */",
                "  function hashOrder(",
                "    Order calldata order,",
                "    bytes32 domainSeparator",
                "  ) external pure returns (bytes32) {",
                "    return keccak256(abi.encodePacked(",
                "      EIP191_HEADER,",
                "      domainSeparator,",
                "      keccak256(abi.encode(",
                "        ORDER_TYPEHASH,",
                "        order.nonce,",
                "        order.expiry,",
                "        keccak256(abi.encode(",
                "          PARTY_TYPEHASH,",
                "          order.signer.kind,",
                "          order.signer.wallet,",
                "          order.signer.token,",
                "          order.signer.amount,",
                "          order.signer.id",
                "        )),",
                "        keccak256(abi.encode(",
                "          PARTY_TYPEHASH,",
                "          order.sender.kind,",
                "          order.sender.wallet,",
                "          order.sender.token,",
                "          order.sender.amount,",
                "          order.sender.id",
                "        )),",
                "        keccak256(abi.encode(",
                "          PARTY_TYPEHASH,",
                "          order.affiliate.kind,",
                "          order.affiliate.wallet,",
                "          order.affiliate.token,",
                "          order.affiliate.amount,",
                "          order.affiliate.id",
                "        ))",
                "      ))",
                "    ));",
                "  }",
                "  /**",
                "    * @notice Hash domain parameters into bytes32",
                "    * @dev Used for signature validation (EIP-712)",
                "    * @param name bytes",
                "    * @param version bytes",
                "    * @param verifyingContract address",
                "    * @return bytes32 returns a keccak256 abi.encodePacked value",
                "    */",
                "  function hashDomain(",
                "    bytes calldata name,",
                "    bytes calldata version,",
                "    address verifyingContract",
                "  ) external pure returns (bytes32) {",
                "    return keccak256(abi.encode(",
                "      DOMAIN_TYPEHASH,",
                "      keccak256(name),",
                "      keccak256(version),",
                "      verifyingContract",
                "    ));",
                "  }",
                "}",
                "// File: @airswap/delegate/contracts/interfaces/IDelegate.sol",
                "/*",
                "  Copyright 2020 Swap Holdings Ltd.",
                "  Licensed under the Apache License, Version 2.0 (the \"License\");",
                "  you may not use this file except in compliance with the License.",
                "  You may obtain a copy of the License at",
                "    http://www.apache.org/licenses/LICENSE-2.0",
                "  Unless required by applicable law or agreed to in writing, software",
                "  distributed under the License is distributed on an \"AS IS\" BASIS,",
                "  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
                "  See the License for the specific language governing permissions and",
                "  limitations under the License.",
                "*/",
                "interface IDelegate {",
                "  struct Rule {",
                "    uint256 maxSenderAmount;      // The maximum amount of ERC-20 token the delegate would send",
                "    uint256 priceCoef;            // Number to be multiplied by 10^(-priceExp) - the price coefficient",
                "    uint256 priceExp;             // Indicates location of the decimal priceCoef * 10^(-priceExp)",
                "  }",
                "  event SetRule(",
                "    address indexed owner,",
                "    address indexed senderToken,",
                "    address indexed signerToken,",
                "    uint256 maxSenderAmount,",
                "    uint256 priceCoef,",
                "    uint256 priceExp",
                "  );",
                "  event UnsetRule(",
                "    address indexed owner,",
                "    address indexed senderToken,",
                "    address indexed signerToken",
                "  );",
                "  event ProvideOrder(",
                "    address indexed owner,",
                "    address tradeWallet,",
                "    address indexed senderToken,",
                "    address indexed signerToken,",
                "    uint256 senderAmount,",
                "    uint256 priceCoef,",
                "    uint256 priceExp",
                "  );",
                "  function setRule(",
                "    address senderToken,",
                "    address signerToken,",
                "    uint256 maxSenderAmount,",
                "    uint256 priceCoef,",
                "    uint256 priceExp",
                "  ) external;",
                "  function unsetRule(",
                "    address senderToken,",
                "    address signerToken",
                "  ) external;",
                "  function provideOrder(",
                "    Types.Order calldata order",
                "  ) external;",
                "  function rules(address, address) external view returns (Rule memory);",
                "  function getSignerSideQuote(",
                "    uint256 senderAmount,",
                "    address senderToken,",
                "    address signerToken",
                "  ) external view returns (",
                "    uint256 signerAmount",
                "  );",
                "  function getSenderSideQuote(",
                "    uint256 signerAmount,",
                "    address signerToken,",
                "    address senderToken",
                "  ) external view returns (",
                "    uint256 senderAmount",
                "  );",
                "  function getMaxQuote(",
                "    address senderToken,",
                "    address signerToken",
                "  ) external view returns (",
                "    uint256 senderAmount,",
                "    uint256 signerAmount",
                "  );",
                "  function owner()",
                "    external view returns (address);",
                "  function tradeWallet()",
                "    external view returns (address);",
                "}",
                "// File: @airswap/indexer/contracts/interfaces/IIndexer.sol",
                "/*",
                "  Copyright 2020 Swap Holdings Ltd.",
                "  Licensed under the Apache License, Version 2.0 (the \"License\");",
                "  you may not use this file except in compliance with the License.",
                "  You may obtain a copy of the License at",
                "    http://www.apache.org/licenses/LICENSE-2.0",
                "  Unless required by applicable law or agreed to in writing, software",
                "  distributed under the License is distributed on an \"AS IS\" BASIS,",
                "  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
                "  See the License for the specific language governing permissions and",
                "  limitations under the License.",
                "*/",
                "interface IIndexer {",
                "  event CreateIndex(",
                "    address indexed signerToken,",
                "    address indexed senderToken,",
                "    bytes2 protocol,",
                "    address indexAddress",
                "  );",
                "  event Stake(",
                "    address indexed staker,",
                "    address indexed signerToken,",
                "    address indexed senderToken,",
                "    bytes2 protocol,",
                "    uint256 stakeAmount",
                "  );",
                "  event Unstake(",
                "    address indexed staker,",
                "    address indexed signerToken,",
                "    address indexed senderToken,",
                "    bytes2 protocol,",
                "    uint256 stakeAmount",
                "  );",
                "  event AddTokenToBlacklist(",
                "    address token",
                "  );",
                "  event RemoveTokenFromBlacklist(",
                "    address token",
                "  );",
                "  function setLocatorWhitelist(",
                "    bytes2 protocol,",
                "    address newLocatorWhitelist",
                "  ) external;",
                "  function createIndex(",
                "    address signerToken,",
                "    address senderToken,",
                "    bytes2 protocol",
                "  ) external returns (address);",
                "  function addTokenToBlacklist(",
                "    address token",
                "  ) external;",
                "  function removeTokenFromBlacklist(",
                "    address token",
                "  ) external;",
                "  function setIntent(",
                "    address signerToken,",
                "    address senderToken,",
                "    bytes2 protocol,",
                "    uint256 stakingAmount,",
                "    bytes32 locator",
                "  ) external;",
                "  function unsetIntent(",
                "    address signerToken,",
                "    address senderToken,",
                "    bytes2 protocol",
                "  ) external;",
                "  function stakingToken() external view returns (address);",
                "  function indexes(address, address, bytes2) external view returns (address);",
                "  function tokenBlacklist(address) external view returns (bool);",
                "  function getStakedAmount(",
                "    address user,",
                "    address signerToken,",
                "    address senderToken,",
                "    bytes2 protocol",
                "  ) external view returns (uint256);",
                "  function getLocators(",
                "    address signerToken,",
                "    address senderToken,",
                "    bytes2 protocol,",
                "    address cursor,",
                "    uint256 limit",
                "  ) external view returns (",
                "    bytes32[] memory,",
                "    uint256[] memory,",
                "    address",
                "  );",
                "}",
                "// File: @airswap/transfers/contracts/interfaces/ITransferHandler.sol",
                "/*",
                "  Copyright 2020 Swap Holdings Ltd.",
                "  Licensed under the Apache License, Version 2.0 (the \"License\");",
                "  you may not use this file except in compliance with the License.",
                "  You may obtain a copy of the License at",
                "    http://www.apache.org/licenses/LICENSE-2.0",
                "  Unless required by applicable law or agreed to in writing, software",
                "  distributed under the License is distributed on an \"AS IS\" BASIS,",
                "  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
                "  See the License for the specific language governing permissions and",
                "  limitations under the License.",
                "*/",
                "/**",
                "  * @title ITransferHandler: interface for token transfers",
                "  */",
                "interface ITransferHandler {",
                " /**",
                "  * @notice Function to wrap token transfer for different token types",
                "  * @param from address Wallet address to transfer from",
                "  * @param to address Wallet address to transfer to",
                "  * @param amount uint256 Amount for ERC-20",
                "  * @param id token ID for ERC-721",
                "  * @param token address Contract address of token",
                "  * @return bool on success of the token transfer",
                "  */",
                "  function transferTokens(",
                "    address from,",
                "    address to,",
                "    uint256 amount,",
                "    uint256 id,",
                "    address token",
                "  ) external returns (bool);",
                "}",
                "// File: openzeppelin-solidity/contracts/GSN/Context.sol",
                "/*",
                " * @dev Provides information about the current execution context, including the",
                " * sender of the transaction and its data. While these are generally available",
                " * via msg.sender and msg.data, they should not be accessed in such a direct",
                " * manner, since when dealing with GSN meta-transactions the account sending and",
                " * paying for execution may not be the actual sender (as far as an application",
                " * is concerned).",
                " *",
                " * This contract is only required for intermediate, library-like contracts.",
                " */",
                "contract Context {",
                "    // Empty internal constructor, to prevent people from mistakenly deploying",
                "    // an instance of this contract, which should be used via inheritance.",
                "    constructor () internal { }",
                "    // solhint-disable-previous-line no-empty-blocks",
                "    function _msgSender() internal view returns (address payable) {",
                "        return msg.sender;",
                "    }",
                "    function _msgData() internal view returns (bytes memory) {",
                "        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691",
                "        return msg.data;",
                "    }",
                "}",
                "// File: openzeppelin-solidity/contracts/ownership/Ownable.sol",
                "/**",
                " * @dev Contract module which provides a basic access control mechanism, where",
                " * there is an account (an owner) that can be granted exclusive access to",
                " * specific functions.",
                " *",
                " * This module is used through inheritance. It will make available the modifier",
                " * `onlyOwner`, which can be applied to your functions to restrict their use to",
                " * the owner.",
                " */",
                "contract Ownable is Context {",
                "    address private _owner;",
                "    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);",
                "    /**",
                "     * @dev Initializes the contract setting the deployer as the initial owner.",
                "     */",
                "    constructor () internal {",
                "        _owner = _msgSender();",
                "        emit OwnershipTransferred(address(0), _owner);",
                "    }",
                "    /**",
                "     * @dev Returns the address of the current owner.",
                "     */",
                "    function owner() public view returns (address) {",
                "        return _owner;",
                "    }",
                "    /**",
                "     * @dev Throws if called by any account other than the owner.",
                "     */",
                "    modifier onlyOwner() {",
                "        require(isOwner(), \"Ownable: caller is not the owner\");",
                "        _;",
                "    }",
                "    /**",
                "     * @dev Returns true if the caller is the current owner.",
                "     */",
                "    function isOwner() public view returns (bool) {",
                "        return _msgSender() == _owner;",
                "    }",
                "    /**",
                "     * @dev Leaves the contract without owner. It will not be possible to call",
                "     * `onlyOwner` functions anymore. Can only be called by the current owner.",
                "     *",
                "     * NOTE: Renouncing ownership will leave the contract without an owner,",
                "     * thereby removing any functionality that is only available to the owner.",
                "     */",
                "    function renounceOwnership() public onlyOwner {",
                "        emit OwnershipTransferred(_owner, address(0));",
                "        _owner = address(0);",
                "    }",
                "    /**",
                "     * @dev Transfers ownership of the contract to a new account (`newOwner`).",
                "     * Can only be called by the current owner.",
                "     */",
                "    function transferOwnership(address newOwner) public onlyOwner {",
                "        _transferOwnership(newOwner);",
                "    }",
                "    /**",
                "     * @dev Transfers ownership of the contract to a new account (`newOwner`).",
                "     */",
                "    function _transferOwnership(address newOwner) internal {",
                "        require(newOwner != address(0), \"Ownable: new owner is the zero address\");",
                "        emit OwnershipTransferred(_owner, newOwner);",
                "        _owner = newOwner;",
                "    }",
                "}",
                "// File: @airswap/transfers/contracts/TransferHandlerRegistry.sol",
                "/*",
                "  Copyright 2020 Swap Holdings Ltd.",
                "  Licensed under the Apache License, Version 2.0 (the \"License\");",
                "  you may not use this file except in compliance with the License.",
                "  You may obtain a copy of the License at",
                "    http://www.apache.org/licenses/LICENSE-2.0",
                "  Unless required by applicable law or agreed to in writing, software",
                "  distributed under the License is distributed on an \"AS IS\" BASIS,",
                "  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
                "  See the License for the specific language governing permissions and",
                "  limitations under the License.",
                "*/",
                "/**",
                "  * @title TransferHandlerRegistry: holds registry of contract to",
                "  * facilitate token transfers",
                "  */",
                "contract TransferHandlerRegistry is Ownable {",
                "  event AddTransferHandler(",
                "    bytes4 kind,",
                "    address contractAddress",
                "  );",
                "  // Mapping of bytes4 to contract interface type",
                "  mapping (bytes4 => ITransferHandler) public transferHandlers;",
                "  /**",
                "  * @notice Adds handler to mapping",
                "  * @param kind bytes4 Key value that defines a token type",
                "  * @param transferHandler ITransferHandler",
                "  */",
                "  function addTransferHandler(bytes4 kind, ITransferHandler transferHandler)",
                "    external onlyOwner {",
                "      require(address(transferHandlers[kind]) == address(0), \"HANDLER_EXISTS_FOR_KIND\");",
                "      transferHandlers[kind] = transferHandler;",
                "      emit AddTransferHandler(kind, address(transferHandler));",
                "    }",
                "}",
                "// File: @airswap/swap/contracts/interfaces/ISwap.sol",
                "/*",
                "  Copyright 2020 Swap Holdings Ltd.",
                "  Licensed under the Apache License, Version 2.0 (the \"License\");",
                "  you may not use this file except in compliance with the License.",
                "  You may obtain a copy of the License at",
                "    http://www.apache.org/licenses/LICENSE-2.0",
                "  Unless required by applicable law or agreed to in writing, software",
                "  distributed under the License is distributed on an \"AS IS\" BASIS,",
                "  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
                "  See the License for the specific language governing permissions and",
                "  limitations under the License.",
                "*/",
                "interface ISwap {",
                "  event Swap(",
                "    uint256 indexed nonce,",
                "    uint256 timestamp,",
                "    address indexed signerWallet,",
                "    uint256 signerAmount,",
                "    uint256 signerId,",
                "    address signerToken,",
                "    address indexed senderWallet,",
                "    uint256 senderAmount,",
                "    uint256 senderId,",
                "    address senderToken,",
                "    address affiliateWallet,",
                "    uint256 affiliateAmount,",
                "    uint256 affiliateId,",
                "    address affiliateToken",
                "  );",
                "  event Cancel(",
                "    uint256 indexed nonce,",
                "    address indexed signerWallet",
                "  );",
                "  event CancelUpTo(",
                "    uint256 indexed nonce,",
                "    address indexed signerWallet",
                "  );",
                "  event AuthorizeSender(",
                "    address indexed authorizerAddress,",
                "    address indexed authorizedSender",
                "  );",
                "  event AuthorizeSigner(",
                "    address indexed authorizerAddress,",
                "    address indexed authorizedSigner",
                "  );",
                "  event RevokeSender(",
                "    address indexed authorizerAddress,",
                "    address indexed revokedSender",
                "  );",
                "  event RevokeSigner(",
                "    address indexed authorizerAddress,",
                "    address indexed revokedSigner",
                "  );",
                "  /**",
                "    * @notice Atomic Token Swap",
                "    * @param order Types.Order",
                "    */",
                "  function swap(",
                "    Types.Order calldata order",
                "  ) external;",
                "  /**",
                "    * @notice Cancel one or more open orders by nonce",
                "    * @param nonces uint256[]",
                "    */",
                "  function cancel(",
                "    uint256[] calldata nonces",
                "  ) external;",
                "  /**",
                "    * @notice Cancels all orders below a nonce value",
                "    * @dev These orders can be made active by reducing the minimum nonce",
                "    * @param minimumNonce uint256",
                "    */",
                "  function cancelUpTo(",
                "    uint256 minimumNonce",
                "  ) external;",
                "  /**",
                "    * @notice Authorize a delegated sender",
                "    * @param authorizedSender address",
                "    */",
                "  function authorizeSender(",
                "    address authorizedSender",
                "  ) external;",
                "  /**",
                "    * @notice Authorize a delegated signer",
                "    * @param authorizedSigner address",
                "    */",
                "  function authorizeSigner(",
                "    address authorizedSigner",
                "  ) external;",
                "  /**",
                "    * @notice Revoke an authorization",
                "    * @param authorizedSender address",
                "    */",
                "  function revokeSender(",
                "    address authorizedSender",
                "  ) external;",
                "  /**",
                "    * @notice Revoke an authorization",
                "    * @param authorizedSigner address",
                "    */",
                "  function revokeSigner(",
                "    address authorizedSigner",
                "  ) external;",
                "  function senderAuthorizations(address, address) external view returns (bool);",
                "  function signerAuthorizations(address, address) external view returns (bool);",
                "  function signerNonceStatus(address, uint256) external view returns (byte);",
                "  function signerMinimumNonce(address) external view returns (uint256);",
                "  function registry() external view returns (TransferHandlerRegistry);",
                "}",
                "// File: openzeppelin-solidity/contracts/math/SafeMath.sol",
                "/**",
                " * @dev Wrappers over Solidity's arithmetic operations with added overflow",
                " * checks.",
                " *",
                " * Arithmetic operations in Solidity wrap on overflow. This can easily result",
                " * in bugs, because programmers usually assume that an overflow raises an",
                " * error, which is the standard behavior in high level programming languages.",
                " * `SafeMath` restores this intuition by reverting the transaction when an",
                " * operation overflows.",
                " *",
                " * Using this library instead of the unchecked operations eliminates an entire",
                " * class of bugs, so it's recommended to use it always.",
                " */",
                "library SafeMath {",
                "    /**",
                "     * @dev Returns the addition of two unsigned integers, reverting on",
                "     * overflow.",
                "     *",
                "     * Counterpart to Solidity's `+` operator.",
                "     *",
                "     * Requirements:",
                "     * - Addition cannot overflow.",
                "     */",
                "    function add(uint256 a, uint256 b) internal pure returns (uint256) {",
                "        uint256 c = a + b;",
                "        require(c >= a, \"SafeMath: addition overflow\");",
                "        return c;",
                "    }",
                "    /**",
                "     * @dev Returns the subtraction of two unsigned integers, reverting on",
                "     * overflow (when the result is negative).",
                "     *",
                "     * Counterpart to Solidity's `-` operator.",
                "     *",
                "     * Requirements:",
                "     * - Subtraction cannot overflow.",
                "     */",
                "    function sub(uint256 a, uint256 b) internal pure returns (uint256) {",
                "        return sub(a, b, \"SafeMath: subtraction overflow\");",
                "    }",
                "    /**",
                "     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on",
                "     * overflow (when the result is negative).",
                "     *",
                "     * Counterpart to Solidity's `-` operator.",
                "     *",
                "     * Requirements:",
                "     * - Subtraction cannot overflow.",
                "     *",
                "     * _Available since v2.4.0._",
                "     */",
                "    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {",
                "        require(b <= a, errorMessage);",
                "        uint256 c = a - b;",
                "        return c;",
                "    }",
                "    /**",
                "     * @dev Returns the multiplication of two unsigned integers, reverting on",
                "     * overflow.",
                "     *",
                "     * Counterpart to Solidity's `*` operator.",
                "     *",
                "     * Requirements:",
                "     * - Multiplication cannot overflow.",
                "     */",
                "    function mul(uint256 a, uint256 b) internal pure returns (uint256) {",
                "        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the",
                "        // benefit is lost if 'b' is also tested.",
                "        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522",
                "        if (a == 0) {",
                "            return 0;",
                "        }",
                "        uint256 c = a * b;",
                "        require(c / a == b, \"SafeMath: multiplication overflow\");",
                "        return c;",
                "    }",
                "    /**",
                "     * @dev Returns the integer division of two unsigned integers. Reverts on",
                "     * division by zero. The result is rounded towards zero.",
                "     *",
                "     * Counterpart to Solidity's `/` operator. Note: this function uses a",
                "     * `revert` opcode (which leaves remaining gas untouched) while Solidity",
                "     * uses an invalid opcode to revert (consuming all remaining gas).",
                "     *",
                "     * Requirements:",
                "     * - The divisor cannot be zero.",
                "     */",
                "    function div(uint256 a, uint256 b) internal pure returns (uint256) {",
                "        return div(a, b, \"SafeMath: division by zero\");",
                "    }",
                "    /**",
                "     * @dev Returns the integer division of two unsigned integers. Reverts with custom message on",
                "     * division by zero. The result is rounded towards zero.",
                "     *",
                "     * Counterpart to Solidity's `/` operator. Note: this function uses a",
                "     * `revert` opcode (which leaves remaining gas untouched) while Solidity",
                "     * uses an invalid opcode to revert (consuming all remaining gas).",
                "     *",
                "     * Requirements:",
                "     * - The divisor cannot be zero.",
                "     *",
                "     * _Available since v2.4.0._",
                "     */",
                "    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {",
                "        // Solidity only automatically asserts when dividing by 0",
                "        require(b > 0, errorMessage);",
                "        uint256 c = a / b;",
                "        // assert(a == b * c + a % b); // There is no case in which this doesn't hold",
                "        return c;",
                "    }",
                "    /**",
                "     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),",
                "     * Reverts when dividing by zero.",
                "     *",
                "     * Counterpart to Solidity's `%` operator. This function uses a `revert`",
                "     * opcode (which leaves remaining gas untouched) while Solidity uses an",
                "     * invalid opcode to revert (consuming all remaining gas).",
                "     *",
                "     * Requirements:",
                "     * - The divisor cannot be zero.",
                "     */",
                "    function mod(uint256 a, uint256 b) internal pure returns (uint256) {",
                "        return mod(a, b, \"SafeMath: modulo by zero\");",
                "    }",
                "    /**",
                "     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),",
                "     * Reverts with custom message when dividing by zero.",
                "     *",
                "     * Counterpart to Solidity's `%` operator. This function uses a `revert`",
                "     * opcode (which leaves remaining gas untouched) while Solidity uses an",
                "     * invalid opcode to revert (consuming all remaining gas).",
                "     *",
                "     * Requirements:",
                "     * - The divisor cannot be zero.",
                "     *",
                "     * _Available since v2.4.0._",
                "     */",
                "    function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {",
                "        require(b != 0, errorMessage);",
                "        return a % b;",
                "    }",
                "}",
                "// File: openzeppelin-solidity/contracts/token/ERC20/IERC20.sol",
                "/**",
                " * @dev Interface of the ERC20 standard as defined in the EIP. Does not include",
                " * the optional functions; to access them see {ERC20Detailed}.",
                " */",
                "interface IERC20 {",
                "    /**",
                "     * @dev Returns the amount of tokens in existence.",
                "     */",
                "    function totalSupply() external view returns (uint256);",
                "    /**",
                "     * @dev Returns the amount of tokens owned by `account`.",
                "     */",
                "    function balanceOf(address account) external view returns (uint256);",
                "    /**",
                "     * @dev Moves `amount` tokens from the caller's account to `recipient`.",
                "     *",
                "     * Returns a boolean value indicating whether the operation succeeded.",
                "     *",
                "     * Emits a {Transfer} event.",
                "     */",
                "    function transfer(address recipient, uint256 amount) external returns (bool);",
                "    /**",
                "     * @dev Returns the remaining number of tokens that `spender` will be",
                "     * allowed to spend on behalf of `owner` through {transferFrom}. This is",
                "     * zero by default.",
                "     *",
                "     * This value changes when {approve} or {transferFrom} are called.",
                "     */",
                "    function allowance(address owner, address spender) external view returns (uint256);",
                "    /**",
                "     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.",
                "     *",
                "     * Returns a boolean value indicating whether the operation succeeded.",
                "     *",
                "     * IMPORTANT: Beware that changing an allowance with this method brings the risk",
                "     * that someone may use both the old and the new allowance by unfortunate",
                "     * transaction ordering. One possible solution to mitigate this race",
                "     * condition is to first reduce the spender's allowance to 0 and set the",
                "     * desired value afterwards:",
                "     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729",
                "     *",
                "     * Emits an {Approval} event.",
                "     */",
                "    function approve(address spender, uint256 amount) external returns (bool);",
                "    /**",
                "     * @dev Moves `amount` tokens from `sender` to `recipient` using the",
                "     * allowance mechanism. `amount` is then deducted from the caller's",
                "     * allowance.",
                "     *",
                "     * Returns a boolean value indicating whether the operation succeeded.",
                "     *",
                "     * Emits a {Transfer} event.",
                "     */",
                "    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);",
                "    /**",
                "     * @dev Emitted when `value` tokens are moved from one account (`from`) to",
                "     * another (`to`).",
                "     *",
                "     * Note that `value` may be zero.",
                "     */",
                "    event Transfer(address indexed from, address indexed to, uint256 value);",
                "    /**",
                "     * @dev Emitted when the allowance of a `spender` for an `owner` is set by",
                "     * a call to {approve}. `value` is the new allowance.",
                "     */",
                "    event Approval(address indexed owner, address indexed spender, uint256 value);",
                "}",
                "// File: @airswap/delegate/contracts/Delegate.sol",
                "/*",
                "  Copyright 2020 Swap Holdings Ltd.",
                "  Licensed under the Apache License, Version 2.0 (the \"License\");",
                "  you may not use this file except in compliance with the License.",
                "  You may obtain a copy of the License at",
                "    http://www.apache.org/licenses/LICENSE-2.0",
                "  Unless required by applicable law or agreed to in writing, software",
                "  distributed under the License is distributed on an \"AS IS\" BASIS,",
                "  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
                "  See the License for the specific language governing permissions and",
                "  limitations under the License.",
                "*/",
                "/**",
                "  * @title Delegate: Deployable Trading Rules for the AirSwap Network",
                "  * @notice Supports fungible tokens (ERC-20)",
                "  * @dev inherits IDelegate, Ownable uses SafeMath library",
                "  */",
                "contract Delegate is IDelegate, Ownable {",
                "  using SafeMath for uint256;",
                "  // The Swap contract to be used to settle trades",
                "  ISwap public swapContract;",
                "  // The Indexer to stake intent to trade on",
                "  IIndexer public indexer;",
                "  // Maximum integer for token transfer approval",
                "  uint256 constant internal MAX_INT =  2**256 - 1;",
                "  // Address holding tokens that will be trading through this delegate",
                "  address public tradeWallet;",
                "  // Mapping of senderToken to signerToken for rule lookup",
                "  mapping (address => mapping (address => Rule)) public rules;",
                "  // ERC-20 (fungible token) interface identifier (ERC-165)",
                "  bytes4 constant internal ERC20_INTERFACE_ID = 0x36372b07;",
                "  // The protocol identifier for setting intents on an Index",
                "  bytes2 public protocol;",
                "  /**",
                "    * @notice Contract Constructor",
                "    * @dev owner defaults to msg.sender if delegateContractOwner is provided as address(0)",
                "    * @param delegateSwap address Swap contract the delegate will deploy with",
                "    * @param delegateIndexer address Indexer contract the delegate will deploy with",
                "    * @param delegateContractOwner address Owner of the delegate",
                "    * @param delegateTradeWallet address Wallet the delegate will trade from",
                "    * @param delegateProtocol bytes2 The protocol identifier for Delegate contracts",
                "    */",
                "  constructor(",
                "    ISwap delegateSwap,",
                "    IIndexer delegateIndexer,",
                "    address delegateContractOwner,",
                "    address delegateTradeWallet,",
                "    bytes2 delegateProtocol",
                "  ) public {",
                "    swapContract = delegateSwap;",
                "    indexer = delegateIndexer;",
                "    protocol = delegateProtocol;",
                "    // If no delegate owner is provided, the deploying address is the owner.",
                "    if (delegateContractOwner != address(0)) {",
                "      transferOwnership(delegateContractOwner);",
                "    }",
                "    // If no trade wallet is provided, the owner's wallet is the trade wallet.",
                "    if (delegateTradeWallet != address(0)) {",
                "      tradeWallet = delegateTradeWallet;",
                "    } else {",
                "      tradeWallet = owner();",
                "    }",
                "    // Ensure that the indexer can pull funds from delegate account.",
                "    require(",
                "      IERC20(indexer.stakingToken())",
                "      .approve(address(indexer), MAX_INT), \"STAKING_APPROVAL_FAILED\"",
                "    );",
                "  }",
                "  /**",
                "    * @notice Set a Trading Rule",
                "    * @dev only callable by the owner of the contract",
                "    * @dev 1 senderToken = priceCoef * 10^(-priceExp) * signerToken",
                "    * @param senderToken address Address of an ERC-20 token the delegate would send",
                "    * @param signerToken address Address of an ERC-20 token the consumer would send",
                "    * @param maxSenderAmount uint256 Maximum amount of ERC-20 token the delegate would send",
                "    * @param priceCoef uint256 Whole number that will be multiplied by 10^(-priceExp) - the price coefficient",
                "    * @param priceExp uint256 Exponent of the price to indicate location of the decimal priceCoef * 10^(-priceExp)",
                "    */",
                "  function setRule(",
                "    address senderToken,",
                "    address signerToken,",
                "    uint256 maxSenderAmount,",
                "    uint256 priceCoef,",
                "    uint256 priceExp",
                "  ) external onlyOwner {",
                "    _setRule(",
                "      senderToken,",
                "      signerToken,",
                "      maxSenderAmount,",
                "      priceCoef,",
                "      priceExp",
                "    );",
                "  }",
                "  /**",
                "    * @notice Unset a Trading Rule",
                "    * @dev only callable by the owner of the contract, removes from a mapping",
                "    * @param senderToken address Address of an ERC-20 token the delegate would send",
                "    * @param signerToken address Address of an ERC-20 token the consumer would send",
                "    */",
                "  function unsetRule(",
                "    address senderToken,",
                "    address signerToken",
                "  ) external onlyOwner {",
                "    _unsetRule(",
                "      senderToken,",
                "      signerToken",
                "    );",
                "  }",
                "  /**",
                "    * @notice sets a rule on the delegate and an intent on the indexer",
                "    * @dev only callable by owner",
                "    * @dev delegate needs to be given allowance from msg.sender for the newStakeAmount",
                "    * @dev swap needs to be given permission to move funds from the delegate",
                "    * @param senderToken address Token the delgeate will send",
                "    * @param signerToken address Token the delegate will receive",
                "    * @param rule Rule Rule to set on a delegate",
                "    * @param newStakeAmount uint256 Amount to stake for an intent",
                "    */",
                "  function setRuleAndIntent(",
                "    address senderToken,",
                "    address signerToken,",
                "    Rule calldata rule,",
                "    uint256 newStakeAmount",
                "  ) external onlyOwner {",
                "    _setRule(",
                "      senderToken,",
                "      signerToken,",
                "      rule.maxSenderAmount,",
                "      rule.priceCoef,",
                "      rule.priceExp",
                "    );",
                "    // get currentAmount staked or 0 if never staked",
                "    uint256 oldStakeAmount = indexer.getStakedAmount(address(this), signerToken, senderToken, protocol);",
                "    if (oldStakeAmount == newStakeAmount && oldStakeAmount > 0) {",
                "      return; // forgo trying to reset intent with non-zero same stake amount",
                "    } else if (oldStakeAmount < newStakeAmount) {",
                "      // transfer only the difference from the sender to the Delegate.",
                "      require(",
                "        IERC20(indexer.stakingToken())",
                "        .transferFrom(msg.sender, address(this), newStakeAmount - oldStakeAmount), \"STAKING_TRANSFER_FAILED\"",
                "      );",
                "    }",
                "    indexer.setIntent(",
                "      signerToken,",
                "      senderToken,",
                "      protocol,",
                "      newStakeAmount,",
                "      bytes32(uint256(address(this)) << 96) //NOTE: this will pad 0's to the right",
                "    );",
                "    if (oldStakeAmount > newStakeAmount) {",
                "      // return excess stake back",
                "      require(",
                "        IERC20(indexer.stakingToken())",
                "        .transfer(msg.sender, oldStakeAmount - newStakeAmount), \"STAKING_RETURN_FAILED\"",
                "      );",
                "    }",
                "  }",
                "  /**",
                "    * @notice unsets a rule on the delegate and removes an intent on the indexer",
                "    * @dev only callable by owner",
                "    * @param senderToken address Maker token in the token pair for rules and intents",
                "    * @param signerToken address Taker token  in the token pair for rules and intents",
                "    */",
                "  function unsetRuleAndIntent(",
                "    address senderToken,",
                "    address signerToken",
                "  ) external onlyOwner {",
                "    _unsetRule(senderToken, signerToken);",
                "    // Query the indexer for the amount staked.",
                "    uint256 stakedAmount = indexer.getStakedAmount(address(this), signerToken, senderToken, protocol);",
                "    indexer.unsetIntent(signerToken, senderToken, protocol);",
                "    // Upon unstaking, the Delegate will be given the staking amount.",
                "    // This is returned to the msg.sender.",
                "    if (stakedAmount > 0) {",
                "      require(",
                "        IERC20(indexer.stakingToken())",
                "          .transfer(msg.sender, stakedAmount),\"STAKING_RETURN_FAILED\"",
                "      );",
                "    }",
                "  }",
                "  /**",
                "    * @notice Provide an Order",
                "    * @dev Rules get reset with new maxSenderAmount",
                "    * @param order Types.Order Order a user wants to submit to Swap.",
                "    */",
                "  function provideOrder(",
                "    Types.Order calldata order",
                "  ) external {",
                "    Rule memory rule = rules[order.sender.token][order.signer.token];",
                "    require(order.signature.v != 0,",
                "      \"SIGNATURE_MUST_BE_SENT\");",
                "    // Ensure the order is for the trade wallet.",
                "    require(order.sender.wallet == tradeWallet,",
                "      \"SENDER_WALLET_INVALID\");",
                "    // Ensure the tokens are valid ERC20 tokens.",
                "    require(order.signer.kind == ERC20_INTERFACE_ID,",
                "      \"SIGNER_KIND_MUST_BE_ERC20\");",
                "    require(order.sender.kind == ERC20_INTERFACE_ID,",
                "      \"SENDER_KIND_MUST_BE_ERC20\");",
                "    // Ensure that a rule exists.",
                "    require(rule.maxSenderAmount != 0,",
                "      \"TOKEN_PAIR_INACTIVE\");",
                "    // Ensure the order does not exceed the maximum amount.",
                "    require(order.sender.amount <= rule.maxSenderAmount,",
                "      \"AMOUNT_EXCEEDS_MAX\");",
                "    // Ensure the order is priced according to the rule.",
                "    require(order.sender.amount <= _calculateSenderAmount(order.signer.amount, rule.priceCoef, rule.priceExp),",
                "      \"PRICE_INVALID\");",
                "    // Overwrite the rule with a decremented maxSenderAmount.",
                "    rules[order.sender.token][order.signer.token] = Rule({",
                "      maxSenderAmount: (rule.maxSenderAmount).sub(order.sender.amount),",
                "      priceCoef: rule.priceCoef,",
                "      priceExp: rule.priceExp",
                "    });",
                "    // Perform the swap.",
                "    swapContract.swap(order);",
                "    emit ProvideOrder(",
                "      owner(),",
                "      tradeWallet,",
                "      order.sender.token,",
                "      order.signer.token,",
                "      order.sender.amount,",
                "      rule.priceCoef,",
                "      rule.priceExp",
                "    );",
                "  }",
                "  /**",
                "    * @notice Set a new trade wallet",
                "    * @param newTradeWallet address Address of the new trade wallet",
                "    */",
                "  function setTradeWallet(address newTradeWallet) external onlyOwner {",
                "    require(newTradeWallet != address(0), \"TRADE_WALLET_REQUIRED\");",
                "    tradeWallet = newTradeWallet;",
                "  }",
                "  /**",
                "    * @notice Get a Signer-Side Quote from the Delegate",
                "    * @param senderAmount uint256 Amount of ERC-20 token the delegate would send",
                "    * @param senderToken address Address of an ERC-20 token the delegate would send",
                "    * @param signerToken address Address of an ERC-20 token the consumer would send",
                "    * @return uint256 signerAmount Amount of ERC-20 token the consumer would send",
                "    */",
                "  function getSignerSideQuote(",
                "    uint256 senderAmount,",
                "    address senderToken,",
                "    address signerToken",
                "  ) external view returns (",
                "    uint256 signerAmount",
                "  ) {",
                "    Rule memory rule = rules[senderToken][signerToken];",
                "    // Ensure that a rule exists.",
                "    if(rule.maxSenderAmount > 0) {",
                "      // Ensure the senderAmount does not exceed maximum for the rule.",
                "      if(senderAmount <= rule.maxSenderAmount) {",
                "        signerAmount = _calculateSignerAmount(senderAmount, rule.priceCoef, rule.priceExp);",
                "        // Return the quote.",
                "        return signerAmount;",
                "      }",
                "    }",
                "    return 0;",
                "  }",
                "  /**",
                "    * @notice Get a Sender-Side Quote from the Delegate",
                "    * @param signerAmount uint256 Amount of ERC-20 token the consumer would send",
                "    * @param signerToken address Address of an ERC-20 token the consumer would send",
                "    * @param senderToken address Address of an ERC-20 token the delegate would send",
                "    * @return uint256 senderAmount Amount of ERC-20 token the delegate would send",
                "    */",
                "  function getSenderSideQuote(",
                "    uint256 signerAmount,",
                "    address signerToken,",
                "    address senderToken",
                "  ) external view returns (",
                "    uint256 senderAmount",
                "  ) {",
                "    Rule memory rule = rules[senderToken][signerToken];",
                "    // Ensure that a rule exists.",
                "    if(rule.maxSenderAmount > 0) {",
                "      // Calculate the senderAmount.",
                "      senderAmount = _calculateSenderAmount(signerAmount, rule.priceCoef, rule.priceExp);",
                "      // Ensure the senderAmount does not exceed the maximum trade amount.",
                "      if(senderAmount <= rule.maxSenderAmount) {",
                "        return senderAmount;",
                "      }",
                "    }",
                "    return 0;",
                "  }",
                "  /**",
                "    * @notice Get a Maximum Quote from the Delegate",
                "    * @param senderToken address Address of an ERC-20 token the delegate would send",
                "    * @param signerToken address Address of an ERC-20 token the consumer would send",
                "    * @return uint256 senderAmount Amount the delegate would send",
                "    * @return uint256 signerAmount Amount the consumer would send",
                "    */",
                "  function getMaxQuote(",
                "    address senderToken,",
                "    address signerToken",
                "  ) external view returns (",
                "    uint256 senderAmount,",
                "    uint256 signerAmount",
                "  ) {",
                "    Rule memory rule = rules[senderToken][signerToken];",
                "    senderAmount = rule.maxSenderAmount;",
                "    // Ensure that a rule exists.",
                "    if (senderAmount > 0) {",
                "      // calculate the signerAmount",
                "      signerAmount = _calculateSignerAmount(senderAmount, rule.priceCoef, rule.priceExp);",
                "      // Return the maxSenderAmount and calculated signerAmount.",
                "      return (",
                "        senderAmount,",
                "        signerAmount",
                "      );",
                "    }",
                "    return (0, 0);",
                "  }",
                "  /**",
                "    * @notice Set a Trading Rule",
                "    * @dev only callable by the owner of the contract",
                "    * @dev 1 senderToken = priceCoef * 10^(-priceExp) * signerToken",
                "    * @param senderToken address Address of an ERC-20 token the delegate would send",
                "    * @param signerToken address Address of an ERC-20 token the consumer would send",
                "    * @param maxSenderAmount uint256 Maximum amount of ERC-20 token the delegate would send",
                "    * @param priceCoef uint256 Whole number that will be multiplied by 10^(-priceExp) - the price coefficient",
                "    * @param priceExp uint256 Exponent of the price to indicate location of the decimal priceCoef * 10^(-priceExp)",
                "    */",
                "  function _setRule(",
                "    address senderToken,",
                "    address signerToken,",
                "    uint256 maxSenderAmount,",
                "    uint256 priceCoef,",
                "    uint256 priceExp",
                "  ) internal {",
                "    require(priceCoef > 0, \"PRICE_COEF_INVALID\");",
                "    rules[senderToken][signerToken] = Rule({",
                "      maxSenderAmount: maxSenderAmount,",
                "      priceCoef: priceCoef,",
                "      priceExp: priceExp",
                "    });",
                "    emit SetRule(",
                "      owner(),",
                "      senderToken,",
                "      signerToken,",
                "      maxSenderAmount,",
                "      priceCoef,",
                "      priceExp",
                "    );",
                "  }",
                "  /**",
                "    * @notice Unset a Trading Rule",
                "    * @param senderToken address Address of an ERC-20 token the delegate would send",
                "    * @param signerToken address Address of an ERC-20 token the consumer would send",
                "    */",
                "  function _unsetRule(",
                "    address senderToken,",
                "    address signerToken",
                "  ) internal {",
                "    // using non-zero rule.priceCoef for rule existence check",
                "    if (rules[senderToken][signerToken].priceCoef > 0) {",
                "      // Delete the rule.",
                "      delete rules[senderToken][signerToken];",
                "      emit UnsetRule(",
                "        owner(),",
                "        senderToken,",
                "        signerToken",
                "    );",
                "    }",
                "  }",
                "  /**",
                "    * @notice Calculate the signer amount for a given sender amount and price",
                "    * @param senderAmount uint256 The amount the delegate would send in the swap",
                "    * @param priceCoef uint256 Coefficient of the token price defined in the rule",
                "    * @param priceExp uint256 Exponent of the token price defined in the rule",
                "    */",
                "  function _calculateSignerAmount(",
                "    uint256 senderAmount,",
                "    uint256 priceCoef,",
                "    uint256 priceExp",
                "  ) internal pure returns (",
                "    uint256 signerAmount",
                "  ) {",
                "    // Calculate the signer amount using the price formula",
                "    uint256 multiplier = senderAmount.mul(priceCoef);",
                "    signerAmount = multiplier.div(10 ** priceExp);",
                "    // If the div rounded down, round up",
                "    if (multiplier.mod(10 ** priceExp) > 0) {",
                "      signerAmount++;",
                "    }",
                "  }",
                "  /**",
                "    * @notice Calculate the sender amount for a given signer amount and price",
                "    * @param signerAmount uint256 The amount the signer would send in the swap",
                "    * @param priceCoef uint256 Coefficient of the token price defined in the rule",
                "    * @param priceExp uint256 Exponent of the token price defined in the rule",
                "    */",
                "  function _calculateSenderAmount(",
                "    uint256 signerAmount,",
                "    uint256 priceCoef,",
                "    uint256 priceExp",
                "  ) internal pure returns (",
                "    uint256 senderAmount",
                "  ) {",
                "    // Calculate the sender anount using the price formula",
                "    senderAmount = signerAmount",
                "      .mul(10 ** priceExp)",
                "      .div(priceCoef);",
                "  }",
                "}",
                "// File: @airswap/delegate/contracts/interfaces/IDelegateFactory.sol",
                "/*",
                "  Copyright 2020 Swap Holdings Ltd.",
                "  Licensed under the Apache License, Version 2.0 (the \"License\");",
                "  you may not use this file except in compliance with the License.",
                "  You may obtain a copy of the License at",
                "    http://www.apache.org/licenses/LICENSE-2.0",
                "  Unless required by applicable law or agreed to in writing, software",
                "  distributed under the License is distributed on an \"AS IS\" BASIS,",
                "  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
                "  See the License for the specific language governing permissions and",
                "  limitations under the License.",
                "*/",
                "interface IDelegateFactory {",
                "  event CreateDelegate(",
                "    address indexed delegateContract,",
                "    address swapContract,",
                "    address indexerContract,",
                "    address indexed delegateContractOwner,",
                "    address delegateTradeWallet",
                "  );",
                "  /**",
                "    * @notice Deploy a trusted delegate contract",
                "    * @param delegateTradeWallet the wallet the delegate will trade from",
                "    * @return delegateContractAddress address of the delegate contract created",
                "    */",
                "  function createDelegate(",
                "    address delegateTradeWallet",
                "  ) external returns (address delegateContractAddress);",
                "}",
                "// File: @airswap/indexer/contracts/interfaces/ILocatorWhitelist.sol",
                "/*",
                "  Copyright 2020 Swap Holdings Ltd.",
                "  Licensed under the Apache License, Version 2.0 (the \"License\");",
                "  you may not use this file except in compliance with the License.",
                "  You may obtain a copy of the License at",
                "    http://www.apache.org/licenses/LICENSE-2.0",
                "  Unless required by applicable law or agreed to in writing, software",
                "  distributed under the License is distributed on an \"AS IS\" BASIS,",
                "  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
                "  See the License for the specific language governing permissions and",
                "  limitations under the License.",
                "*/",
                "interface ILocatorWhitelist {",
                "  function has(",
                "    bytes32 locator",
                "  ) external view returns (bool);",
                "}",
                "// File: @airswap/delegate/contracts/DelegateFactory.sol",
                "/*",
                "  Copyright 2020 Swap Holdings Ltd.",
                "  Licensed under the Apache License, Version 2.0 (the \"License\");",
                "  you may not use this file except in compliance with the License.",
                "  You may obtain a copy of the License at",
                "    http://www.apache.org/licenses/LICENSE-2.0",
                "  Unless required by applicable law or agreed to in writing, software",
                "  distributed under the License is distributed on an \"AS IS\" BASIS,",
                "  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
                "  See the License for the specific language governing permissions and",
                "  limitations under the License.",
                "*/",
                "contract DelegateFactory is IDelegateFactory, ILocatorWhitelist {",
                "  // Mapping specifying whether an address was deployed by this factory",
                "  mapping(address => bool) internal _deployedAddresses;",
                "  // The swap and indexer contracts to use in the deployment of Delegates",
                "  ISwap public swapContract;",
                "  IIndexer public indexerContract;",
                "  bytes2 public protocol;",
                "  /**",
                "    * @notice Create a new Delegate contract",
                "    * @dev swapContract is unable to be changed after the factory sets it",
                "    * @param factorySwapContract address Swap contract the delegate will deploy with",
                "    * @param factoryIndexerContract address Indexer contract the delegate will deploy with",
                "    * @param factoryProtocol bytes2 Protocol type of the delegates the factory deploys",
                "    */",
                "  constructor(",
                "    ISwap factorySwapContract,",
                "    IIndexer factoryIndexerContract,",
                "    bytes2 factoryProtocol",
                "  ) public {",
                "    swapContract = factorySwapContract;",
                "    indexerContract = factoryIndexerContract;",
                "    protocol = factoryProtocol;",
                "  }",
                "  /**",
                "    * @param delegateTradeWallet address Wallet the delegate will trade from",
                "    * @return address delegateContractAddress Address of the delegate contract created",
                "    */",
                "  function createDelegate(",
                "    address delegateTradeWallet",
                "  ) external returns (address delegateContractAddress) {",
                "    delegateContractAddress = address(",
                "      new Delegate(swapContract, indexerContract, msg.sender, delegateTradeWallet, protocol)",
                "    );",
                "    _deployedAddresses[delegateContractAddress] = true;",
                "    emit CreateDelegate(",
                "      delegateContractAddress,",
                "      address(swapContract),",
                "      address(indexerContract),",
                "      msg.sender,",
                "      delegateTradeWallet",
                "    );",
                "    return delegateContractAddress;",
                "  }",
                "  /**",
                "    * @notice To check whether a locator was deployed",
                "    * @dev Implements ILocatorWhitelist.has",
                "    * @param locator bytes32 Locator of the delegate in question",
                "    * @return bool True if the delegate was deployed by this contract",
                "    */",
                "  function has(bytes32 locator) external view returns (bool) {",
                "    return _deployedAddresses[address(bytes20(locator))];",
                "  }",
                "}",
                "// File: @airswap/indexer/contracts/Index.sol",
                "/*",
                "  Copyright 2020 Swap Holdings Ltd.",
                "  Licensed under the Apache License, Version 2.0 (the \"License\");",
                "  you may not use this file except in compliance with the License.",
                "  You may obtain a copy of the License at",
                "    http://www.apache.org/licenses/LICENSE-2.0",
                "  Unless required by applicable law or agreed to in writing, software",
                "  distributed under the License is distributed on an \"AS IS\" BASIS,",
                "  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
                "  See the License for the specific language governing permissions and",
                "  limitations under the License.",
                "*/",
                "/**",
                "  * @title Index: A List of Locators",
                "  * @notice The Locators are sorted in reverse order based on the score",
                "  * meaning that the first element in the list has the largest score",
                "  * and final element has the smallest",
                "  * @dev A mapping is used to mimic a circular linked list structure",
                "  * where every mapping Entry contains a pointer to the next",
                "  * and the previous",
                "  */",
                "contract Index is Ownable {",
                "  // The number of entries in the index",
                "  uint256 public length;",
                "  // Identifier to use for the head of the list",
                "  address constant internal HEAD = address(uint160(2**160-1));",
                "  // Mapping of an identifier to its entry",
                "  mapping(address => Entry) public entries;",
                "  /**",
                "    * @notice Index Entry",
                "    * @param score uint256",
                "    * @param locator bytes32",
                "    * @param prev address Previous address in the linked list",
                "    * @param next address Next address in the linked list",
                "    */",
                "  struct Entry {",
                "    bytes32 locator;",
                "    uint256 score;",
                "    address prev;",
                "    address next;",
                "  }",
                "  /**",
                "    * @notice Contract Events",
                "    */",
                "  event SetLocator(",
                "    address indexed identifier,",
                "    uint256 score,",
                "    bytes32 indexed locator",
                "  );",
                "  event UnsetLocator(",
                "    address indexed identifier",
                "  );",
                "  /**",
                "    * @notice Contract Constructor",
                "    */",
                "  constructor() public {",
                "    // Create initial entry.",
                "    entries[HEAD] = Entry(bytes32(0), 0, HEAD, HEAD);",
                "  }",
                "  /**",
                "    * @notice Set a Locator",
                "    * @param identifier address On-chain address identifying the owner of a locator",
                "    * @param score uint256 Score for the locator being set",
                "    * @param locator bytes32 Locator",
                "    */",
                "  function setLocator(",
                "    address identifier,",
                "    uint256 score,",
                "    bytes32 locator",
                "  ) external onlyOwner {",
                "    // Ensure the entry does not already exist.",
                "    require(!_hasEntry(identifier), \"ENTRY_ALREADY_EXISTS\");",
                "    _setLocator(identifier, score, locator);",
                "    // Increment the index length.",
                "    length = length + 1;",
                "    emit SetLocator(identifier, score, locator);",
                "  }",
                "  /**",
                "    * @notice Unset a Locator",
                "    * @param identifier address On-chain address identifying the owner of a locator",
                "    */",
                "  function unsetLocator(",
                "    address identifier",
                "  ) external onlyOwner {",
                "    _unsetLocator(identifier);",
                "    // Decrement the index length.",
                "    length = length - 1;",
                "    emit UnsetLocator(identifier);",
                "  }",
                "  /**",
                "    * @notice Update a Locator",
                "    * @dev score and/or locator do not need to be different from old values",
                "    * @param identifier address On-chain address identifying the owner of a locator",
                "    * @param score uint256 Score for the locator being set",
                "    * @param locator bytes32 Locator",
                "    */",
                "  function updateLocator(",
                "    address identifier,",
                "    uint256 score,",
                "    bytes32 locator",
                "  ) external onlyOwner {",
                "    // Don't need to update length as it is not used in set/unset logic",
                "    _unsetLocator(identifier);",
                "    _setLocator(identifier, score, locator);",
                "    emit SetLocator(identifier, score, locator);",
                "  }",
                "  /**",
                "    * @notice Get a Score",
                "    * @param identifier address On-chain address identifying the owner of a locator",
                "    * @return uint256 Score corresponding to the identifier",
                "    */",
                "  function getScore(",
                "    address identifier",
                "  ) external view returns (uint256) {",
                "    return entries[identifier].score;",
                "  }",
                "    /**",
                "    * @notice Get a Locator",
                "    * @param identifier address On-chain address identifying the owner of a locator",
                "    * @return bytes32 Locator information",
                "    */",
                "  function getLocator(",
                "    address identifier",
                "  ) external view returns (bytes32) {",
                "    return entries[identifier].locator;",
                "  }",
                "  /**",
                "    * @notice Get a Range of Locators",
                "    * @dev start value of 0x0 starts at the head",
                "    * @param cursor address Cursor to start with",
                "    * @param limit uint256 Maximum number of locators to return",
                "    * @return bytes32[] List of locators",
                "    * @return uint256[] List of scores corresponding to locators",
                "    * @return address The next cursor to provide for pagination",
                "    */",
                "  function getLocators(",
                "    address cursor,",
                "    uint256 limit",
                "  ) external view returns (",
                "    bytes32[] memory locators,",
                "    uint256[] memory scores,",
                "    address nextCursor",
                "  ) {",
                "    address identifier;",
                "    // If a valid cursor is provided, start there.",
                "    if (cursor != address(0) && cursor != HEAD) {",
                "      // Check that the provided cursor exists.",
                "      if (!_hasEntry(cursor)) {",
                "        return (new bytes32[](0), new uint256[](0), address(0));",
                "      }",
                "      // Set the starting identifier to the provided cursor.",
                "      identifier = cursor;",
                "    } else {",
                "      identifier = entries[HEAD].next;",
                "    }",
                "    // Although it's not known how many entries are between `cursor` and the end",
                "    // We know that it is no more than `length`",
                "    uint256 size = (length < limit) ? length : limit;",
                "    locators = new bytes32[](size);",
                "    scores = new uint256[](size);",
                "    // Iterate over the list until the end or size.",
                "    uint256 i;",
                "    while (i < size && identifier != HEAD) {",
                "      locators[i] = entries[identifier].locator;",
                "      scores[i] = entries[identifier].score;",
                "      i = i + 1;",
                "      identifier = entries[identifier].next;",
                "    }",
                "    return (locators, scores, identifier);",
                "  }",
                "  /**",
                "    * @notice Internal function to set a Locator",
                "    * @param identifier address On-chain address identifying the owner of a locator",
                "    * @param score uint256 Score for the locator being set",
                "    * @param locator bytes32 Locator",
                "    */",
                "  function _setLocator(",
                "    address identifier,",
                "    uint256 score,",
                "    bytes32 locator",
                "  ) internal {",
                "    // Disallow locator set to 0x0 to ensure list integrity.",
                "    require(locator != bytes32(0), \"LOCATOR_MUST_BE_SENT\");",
                "    // Find the first entry with a lower score.",
                "    address nextEntry = _getEntryLowerThan(score);",
                "    // Link the new entry between previous and next.",
                "    address prevEntry = entries[nextEntry].prev;",
                "    entries[prevEntry].next = identifier;",
                "    entries[nextEntry].prev = identifier;",
                "    entries[identifier] = Entry(locator, score, prevEntry, nextEntry);",
                "  }",
                "  /**",
                "    * @notice Internal function to unset a Locator",
                "    * @param identifier address On-chain address identifying the owner of a locator",
                "    */",
                "  function _unsetLocator(",
                "    address identifier",
                "  ) internal {",
                "    // Ensure the entry exists.",
                "    require(_hasEntry(identifier), \"ENTRY_DOES_NOT_EXIST\");",
                "    // Link the previous and next entries together.",
                "    address prevUser = entries[identifier].prev;",
                "    address nextUser = entries[identifier].next;",
                "    entries[prevUser].next = nextUser;",
                "    entries[nextUser].prev = prevUser;",
                "    // Delete entry from the index.",
                "    delete entries[identifier];",
                "  }",
                "  /**",
                "    * @notice Check if the Index has an Entry",
                "    * @param identifier address On-chain address identifying the owner of a locator",
                "    * @return bool True if the identifier corresponds to an Entry in the list",
                "    */",
                "  function _hasEntry(",
                "    address identifier",
                "  ) internal view returns (bool) {",
                "    return entries[identifier].locator != bytes32(0);",
                "  }",
                "  /**",
                "    * @notice Returns the largest scoring Entry Lower than a Score",
                "    * @param score uint256 Score in question",
                "    * @return address Identifier of the largest score lower than score",
                "    */",
                "  function _getEntryLowerThan(",
                "    uint256 score",
                "  ) internal view returns (address) {",
                "    address identifier = entries[HEAD].next;",
                "    // Head indicates last because the list is circular.",
                "    if (score == 0) {",
                "      return HEAD;",
                "    }",
                "    // Iterate until a lower score is found.",
                "    while (score <= entries[identifier].score) {",
                "      identifier = entries[identifier].next;",
                "    }",
                "    return identifier;",
                "  }",
                "}",
                "// File: @airswap/indexer/contracts/Indexer.sol",
                "/*",
                "  Copyright 2020 Swap Holdings Ltd.",
                "  Licensed under the Apache License, Version 2.0 (the \"License\");",
                "  you may not use this file except in compliance with the License.",
                "  You may obtain a copy of the License at",
                "    http://www.apache.org/licenses/LICENSE-2.0",
                "  Unless required by applicable law or agreed to in writing, software",
                "  distributed under the License is distributed on an \"AS IS\" BASIS,",
                "  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
                "  See the License for the specific language governing permissions and",
                "  limitations under the License.",
                "*/",
                "/**",
                "  * @title Indexer: A Collection of Index contracts by Token Pair",
                "  */",
                "contract Indexer is IIndexer, Ownable {",
                "  // Token to be used for staking (ERC-20)",
                "  IERC20 public stakingToken;",
                "  // Mapping of signer token to sender token to protocol type to index",
                "  mapping (address => mapping (address => mapping (bytes2 => Index))) public indexes;",
                "  // The whitelist contract for checking whether a peer is whitelisted per peer type",
                "  mapping (bytes2 => address) public locatorWhitelists;",
                "  // Mapping of token address to boolean",
                "  mapping (address => bool) public tokenBlacklist;",
                "  /**",
                "    * @notice Contract Constructor",
                "    * @param indexerStakingToken address",
                "    */",
                "  constructor(",
                "    address indexerStakingToken",
                "  ) public {",
                "    stakingToken = IERC20(indexerStakingToken);",
                "  }",
                "  /**",
                "    * @notice Modifier to check an index exists",
                "    */",
                "  modifier indexExists(address signerToken, address senderToken, bytes2 protocol) {",
                "    require(indexes[signerToken][senderToken][protocol] != Index(0),",
                "      \"INDEX_DOES_NOT_EXIST\");",
                "    _;",
                "  }",
                "  /**",
                "    * @notice Set the address of an ILocatorWhitelist to use",
                "    * @dev Allows removal of locatorWhitelist by passing 0x0",
                "    * @param protocol bytes2 Protocol type for locators",
                "    * @param newLocatorWhitelist address Locator whitelist",
                "    */",
                "  function setLocatorWhitelist(",
                "    bytes2 protocol,",
                "    address newLocatorWhitelist",
                "  ) external onlyOwner {",
                "    locatorWhitelists[protocol] = newLocatorWhitelist;",
                "  }",
                "  /**",
                "    * @notice Create an Index (List of Locators for a Token Pair)",
                "    * @dev Deploys a new Index contract and stores the address. If the Index already",
                "    * @dev exists, returns its address, and does not emit a CreateIndex event",
                "    * @param signerToken address Signer token for the Index",
                "    * @param senderToken address Sender token for the Index",
                "    * @param protocol bytes2 Protocol type for locators in Index",
                "    */",
                "  function createIndex(",
                "    address signerToken,",
                "    address senderToken,",
                "    bytes2 protocol",
                "  ) external returns (address) {",
                "    // If the Index does not exist, create it.",
                "    if (indexes[signerToken][senderToken][protocol] == Index(0)) {",
                "      // Create a new Index contract for the token pair.",
                "      indexes[signerToken][senderToken][protocol] = new Index();",
                "      emit CreateIndex(signerToken, senderToken, protocol, address(indexes[signerToken][senderToken][protocol]));",
                "    }",
                "    // Return the address of the Index contract.",
                "    return address(indexes[signerToken][senderToken][protocol]);",
                "  }",
                "  /**",
                "    * @notice Add a Token to the Blacklist",
                "    * @param token address Token to blacklist",
                "    */",
                "  function addTokenToBlacklist(",
                "    address token",
                "  ) external onlyOwner {",
                "    if (!tokenBlacklist[token]) {",
                "      tokenBlacklist[token] = true;",
                "      emit AddTokenToBlacklist(token);",
                "    }",
                "  }",
                "  /**",
                "    * @notice Remove a Token from the Blacklist",
                "    * @param token address Token to remove from the blacklist",
                "    */",
                "  function removeTokenFromBlacklist(",
                "    address token",
                "  ) external onlyOwner {",
                "    if (tokenBlacklist[token]) {",
                "      tokenBlacklist[token] = false;",
                "      emit RemoveTokenFromBlacklist(token);",
                "    }",
                "  }",
                "  /**",
                "    * @notice Set an Intent to Trade",
                "    * @dev Requires approval to transfer staking token for sender",
                "    *",
                "    * @param signerToken address Signer token of the Index being staked",
                "    * @param senderToken address Sender token of the Index being staked",
                "    * @param protocol bytes2 Protocol type for locator in Intent",
                "    * @param stakingAmount uint256 Amount being staked",
                "    * @param locator bytes32 Locator of the staker",
                "    */",
                "  function setIntent(",
                "    address signerToken,",
                "    address senderToken,",
                "    bytes2 protocol,",
                "    uint256 stakingAmount,",
                "    bytes32 locator",
                "  ) external indexExists(signerToken, senderToken, protocol) {",
                "    // If whitelist set, ensure the locator is valid.",
                "    if (locatorWhitelists[protocol] != address(0)) {",
                "      require(ILocatorWhitelist(locatorWhitelists[protocol]).has(locator),",
                "      \"LOCATOR_NOT_WHITELISTED\");",
                "    }",
                "    // Ensure neither of the tokens are blacklisted.",
                "    require(!tokenBlacklist[signerToken] && !tokenBlacklist[senderToken],",
                "      \"PAIR_IS_BLACKLISTED\");",
                "    bool notPreviouslySet = (indexes[signerToken][senderToken][protocol].getLocator(msg.sender) == bytes32(0));",
                "    if (notPreviouslySet) {",
                "      // Only transfer for staking if stakingAmount is set.",
                "      if (stakingAmount > 0) {",
                "        // Transfer the stakingAmount for staking.",
                "        require(stakingToken.transferFrom(msg.sender, address(this), stakingAmount),",
                "          \"STAKING_FAILED\");",
                "      }",
                "      // Set the locator on the index.",
                "      indexes[signerToken][senderToken][protocol].setLocator(msg.sender, stakingAmount, locator);",
                "      emit Stake(msg.sender, signerToken, senderToken, protocol, stakingAmount);",
                "    } else {",
                "      uint256 oldStake = indexes[signerToken][senderToken][protocol].getScore(msg.sender);",
                "      _updateIntent(msg.sender, signerToken, senderToken, protocol, stakingAmount, locator, oldStake);",
                "    }",
                "  }",
                "  /**",
                "    * @notice Unset an Intent to Trade",
                "    * @dev Users are allowed to unstake from blacklisted indexes",
                "    *",
                "    * @param signerToken address Signer token of the Index being unstaked",
                "    * @param senderToken address Sender token of the Index being staked",
                "    * @param protocol bytes2 Protocol type for locators in Intent",
                "    */",
                "  function unsetIntent(",
                "    address signerToken,",
                "    address senderToken,",
                "    bytes2 protocol",
                "  ) external {",
                "    _unsetIntent(msg.sender, signerToken, senderToken, protocol);",
                "  }",
                "  /**",
                "    * @notice Get the locators of those trading a token pair",
                "    * @dev Users are allowed to unstake from blacklisted indexes",
                "    *",
                "    * @param signerToken address Signer token of the trading pair",
                "    * @param senderToken address Sender token of the trading pair",
                "    * @param protocol bytes2 Protocol type for locators in Intent",
                "    * @param cursor address Address to start from",
                "    * @param limit uint256 Total number of locators to return",
                "    * @return bytes32[] List of locators",
                "    * @return uint256[] List of scores corresponding to locators",
                "    * @return address The next cursor to provide for pagination",
                "    */",
                "  function getLocators(",
                "    address signerToken,",
                "    address senderToken,",
                "    bytes2 protocol,",
                "    address cursor,",
                "    uint256 limit",
                "  ) external view returns (",
                "    bytes32[] memory locators,",
                "    uint256[] memory scores,",
                "    address nextCursor",
                "  ) {",
                "    // Ensure neither token is blacklisted.",
                "    if (tokenBlacklist[signerToken] || tokenBlacklist[senderToken]) {",
                "      return (new bytes32[](0), new uint256[](0), address(0));",
                "    }",
                "    // Ensure the index exists.",
                "    if (indexes[signerToken][senderToken][protocol] == Index(0)) {",
                "      return (new bytes32[](0), new uint256[](0), address(0));",
                "    }",
                "    return indexes[signerToken][senderToken][protocol].getLocators(cursor, limit);",
                "  }",
                "  /**",
                "    * @notice Gets the Stake Amount for a User",
                "    * @param user address User who staked",
                "    * @param signerToken address Signer token the user staked on",
                "    * @param senderToken address Sender token the user staked on",
                "    * @param protocol bytes2 Protocol type for locators in Intent",
                "    * @return uint256 Amount the user staked",
                "    */",
                "  function getStakedAmount(",
                "    address user,",
                "    address signerToken,",
                "    address senderToken,",
                "    bytes2 protocol",
                "  ) public view returns (uint256 stakedAmount) {",
                "    if (indexes[signerToken][senderToken][protocol] == Index(0)) {",
                "      return 0;",
                "    }",
                "    // Return the score, equivalent to the stake amount.",
                "    return indexes[signerToken][senderToken][protocol].getScore(user);",
                "  }",
                "  function _updateIntent(",
                "    address user,",
                "    address signerToken,",
                "    address senderToken,",
                "    bytes2 protocol,",
                "    uint256 newAmount,",
                "    bytes32 newLocator,",
                "    uint256 oldAmount",
                "  ) internal {",
                "    // If the new stake is bigger, collect the difference.",
                "    if (oldAmount < newAmount) {",
                "      // Note: SafeMath not required due to the inequality check above",
                "      require(stakingToken.transferFrom(user, address(this), newAmount - oldAmount),",
                "        \"STAKING_FAILED\");",
                "    }",
                "    // If the old stake is bigger, return the excess.",
                "    if (newAmount < oldAmount) {",
                "      // Note: SafeMath not required due to the inequality check above",
                "      require(stakingToken.transfer(user, oldAmount - newAmount));",
                "    }",
                "    // Update their intent.",
                "    indexes[signerToken][senderToken][protocol].updateLocator(user, newAmount, newLocator);",
                "    emit Stake(user, signerToken, senderToken, protocol, newAmount);",
                "  }",
                "  /**",
                "    * @notice Unset intents and return staked tokens",
                "    * @param user address Address of the user who staked",
                "    * @param signerToken address Signer token of the trading pair",
                "    * @param senderToken address Sender token of the trading pair",
                "    * @param protocol bytes2 Protocol type for locators in Intent",
                "    */",
                "  function _unsetIntent(",
                "    address user,",
                "    address signerToken,",
                "    address senderToken,",
                "    bytes2 protocol",
                "  ) internal indexExists(signerToken, senderToken, protocol) {",
                "     // Get the score for the user.",
                "    uint256 score = indexes[signerToken][senderToken][protocol].getScore(user);",
                "    // Unset the locator on the index.",
                "    indexes[signerToken][senderToken][protocol].unsetLocator(user);",
                "    if (score > 0) {",
                "      // Return the staked tokens. Reverts on failure.",
                "      require(stakingToken.transfer(user, score));",
                "    }",
                "    emit Unstake(user, signerToken, senderToken, protocol, score);",
                "  }",
                "}",
                "// File: @airswap/swap/contracts/Swap.sol",
                "/*",
                "  Copyright 2020 Swap Holdings Ltd.",
                "  Licensed under the Apache License, Version 2.0 (the \"License\");",
                "  you may not use this file except in compliance with the License.",
                "  You may obtain a copy of the License at",
                "    http://www.apache.org/licenses/LICENSE-2.0",
                "  Unless required by applicable law or agreed to in writing, software",
                "  distributed under the License is distributed on an \"AS IS\" BASIS,",
                "  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
                "  See the License for the specific language governing permissions and",
                "  limitations under the License.",
                "*/",
                "/**",
                "  * @title Swap: The Atomic Swap used on the AirSwap Network",
                "  */",
                "contract Swap is ISwap {",
                "  // Domain and version for use in signatures (EIP-712)",
                "  bytes constant internal DOMAIN_NAME = \"SWAP\";",
                "  bytes constant internal DOMAIN_VERSION = \"2\";",
                "  // Unique domain identifier for use in signatures (EIP-712)",
                "  bytes32 private _domainSeparator;",
                "  // Possible nonce statuses",
                "  byte constant internal AVAILABLE = 0x00;",
                "  byte constant internal UNAVAILABLE = 0x01;",
                "  // Mapping of sender address to a delegated sender address and bool",
                "  mapping (address => mapping (address => bool)) public senderAuthorizations;",
                "  // Mapping of signer address to a delegated signer and bool",
                "  mapping (address => mapping (address => bool)) public signerAuthorizations;",
                "  // Mapping of signers to nonces with value AVAILABLE (0x00) or UNAVAILABLE (0x01)",
                "  mapping (address => mapping (uint256 => byte)) public signerNonceStatus;",
                "  // Mapping of signer addresses to an optionally set minimum valid nonce",
                "  mapping (address => uint256) public signerMinimumNonce;",
                "  // A registry storing a transfer handler for different token kinds",
                "  TransferHandlerRegistry public registry;",
                "  /**",
                "    * @notice Contract Constructor",
                "    * @dev Sets domain for signature validation (EIP-712)",
                "    * @param swapRegistry TransferHandlerRegistry",
                "    */",
                "  constructor(TransferHandlerRegistry swapRegistry) public {",
                "    _domainSeparator = Types.hashDomain(",
                "      DOMAIN_NAME,",
                "      DOMAIN_VERSION,",
                "      address(this)",
                "    );",
                "    registry = swapRegistry;",
                "  }",
                "  /**",
                "    * @notice Atomic Token Swap",
                "    * @param order Types.Order Order to settle",
                "    */",
                "  function swap(",
                "    Types.Order calldata order",
                "  ) external {",
                "    // Ensure the order is not expired.",
                "    require(order.expiry > block.timestamp,",
                "      \"ORDER_EXPIRED\");",
                "    // Ensure the nonce is AVAILABLE (0x00).",
                "    require(signerNonceStatus[order.signer.wallet][order.nonce] == AVAILABLE,",
                "      \"ORDER_TAKEN_OR_CANCELLED\");",
                "    // Ensure the order nonce is above the minimum.",
                "    require(order.nonce >= signerMinimumNonce[order.signer.wallet],",
                "      \"NONCE_TOO_LOW\");",
                "    // Mark the nonce UNAVAILABLE (0x01).",
                "    signerNonceStatus[order.signer.wallet][order.nonce] = UNAVAILABLE;",
                "    // Validate the sender side of the trade.",
                "    address finalSenderWallet;",
                "    if (order.sender.wallet == address(0)) {",
                "      /**",
                "        * Sender is not specified. The msg.sender of the transaction becomes",
                "        * the sender of the order.",
                "        */",
                "      finalSenderWallet = msg.sender;",
                "    } else {",
                "      /**",
                "        * Sender is specified. If the msg.sender is not the specified sender,",
                "        * this determines whether the msg.sender is an authorized sender.",
                "        */",
                "      require(isSenderAuthorized(order.sender.wallet, msg.sender),",
                "          \"SENDER_UNAUTHORIZED\");",
                "      // The msg.sender is authorized.",
                "      finalSenderWallet = order.sender.wallet;",
                "    }",
                "    // Validate the signer side of the trade.",
                "    if (order.signature.v == 0) {",
                "      /**",
                "        * Signature is not provided. The signer may have authorized the",
                "        * msg.sender to swap on its behalf, which does not require a signature.",
                "        */",
                "      require(isSignerAuthorized(order.signer.wallet, msg.sender),",
                "        \"SIGNER_UNAUTHORIZED\");",
                "    } else {",
                "      /**",
                "        * The signature is provided. Determine whether the signer is",
                "        * authorized and if so validate the signature itself.",
                "        */",
                "      require(isSignerAuthorized(order.signer.wallet, order.signature.signatory),",
                "        \"SIGNER_UNAUTHORIZED\");",
                "      // Ensure the signature is valid.",
                "      require(isValid(order, _domainSeparator),",
                "        \"SIGNATURE_INVALID\");",
                "    }",
                "    // Transfer token from sender to signer.",
                "    transferToken(",
                "      finalSenderWallet,",
                "      order.signer.wallet,",
                "      order.sender.amount,",
                "      order.sender.id,",
                "      order.sender.token,",
                "      order.sender.kind",
                "    );",
                "    // Transfer token from signer to sender.",
                "    transferToken(",
                "      order.signer.wallet,",
                "      finalSenderWallet,",
                "      order.signer.amount,",
                "      order.signer.id,",
                "      order.signer.token,",
                "      order.signer.kind",
                "    );",
                "    // Transfer token from signer to affiliate if specified.",
                "    if (order.affiliate.token != address(0)) {",
                "      transferToken(",
                "        order.signer.wallet,",
                "        order.affiliate.wallet,",
                "        order.affiliate.amount,",
                "        order.affiliate.id,",
                "        order.affiliate.token,",
                "        order.affiliate.kind",
                "      );",
                "    }",
                "    emit Swap(",
                "      order.nonce,",
                "      block.timestamp,",
                "      order.signer.wallet,",
                "      order.signer.amount,",
                "      order.signer.id,",
                "      order.signer.token,",
                "      finalSenderWallet,",
                "      order.sender.amount,",
                "      order.sender.id,",
                "      order.sender.token,",
                "      order.affiliate.wallet,",
                "      order.affiliate.amount,",
                "      order.affiliate.id,",
                "      order.affiliate.token",
                "    );",
                "  }",
                "  /**",
                "    * @notice Cancel one or more open orders by nonce",
                "    * @dev Cancelled nonces are marked UNAVAILABLE (0x01)",
                "    * @dev Emits a Cancel event",
                "    * @dev Out of gas may occur in arrays of length > 400",
                "    * @param nonces uint256[] List of nonces to cancel",
                "    */",
                "  function cancel(",
                "    uint256[] calldata nonces",
                "  ) external {",
                "    for (uint256 i = 0; i < nonces.length; i++) {",
                "      if (signerNonceStatus[msg.sender][nonces[i]] == AVAILABLE) {",
                "        signerNonceStatus[msg.sender][nonces[i]] = UNAVAILABLE;",
                "        emit Cancel(nonces[i], msg.sender);",
                "      }",
                "    }",
                "  }",
                "  /**",
                "    * @notice Cancels all orders below a nonce value",
                "    * @dev Emits a CancelUpTo event",
                "    * @param minimumNonce uint256 Minimum valid nonce",
                "    */",
                "  function cancelUpTo(",
                "    uint256 minimumNonce",
                "  ) external {",
                "    signerMinimumNonce[msg.sender] = minimumNonce;",
                "    emit CancelUpTo(minimumNonce, msg.sender);",
                "  }",
                "  /**",
                "    * @notice Authorize a delegated sender",
                "    * @dev Emits an AuthorizeSender event",
                "    * @param authorizedSender address Address to authorize",
                "    */",
                "  function authorizeSender(",
                "    address authorizedSender",
                "  ) external {",
                "    require(msg.sender != authorizedSender, \"SELF_AUTH_INVALID\");",
                "    if (!senderAuthorizations[msg.sender][authorizedSender]) {",
                "      senderAuthorizations[msg.sender][authorizedSender] = true;",
                "      emit AuthorizeSender(msg.sender, authorizedSender);",
                "    }",
                "  }",
                "  /**",
                "    * @notice Authorize a delegated signer",
                "    * @dev Emits an AuthorizeSigner event",
                "    * @param authorizedSigner address Address to authorize",
                "    */",
                "  function authorizeSigner(",
                "    address authorizedSigner",
                "  ) external {",
                "    require(msg.sender != authorizedSigner, \"SELF_AUTH_INVALID\");",
                "    if (!signerAuthorizations[msg.sender][authorizedSigner]) {",
                "      signerAuthorizations[msg.sender][authorizedSigner] = true;",
                "      emit AuthorizeSigner(msg.sender, authorizedSigner);",
                "    }",
                "  }",
                "  /**",
                "    * @notice Revoke an authorized sender",
                "    * @dev Emits a RevokeSender event",
                "    * @param authorizedSender address Address to revoke",
                "    */",
                "  function revokeSender(",
                "    address authorizedSender",
                "  ) external {",
                "    if (senderAuthorizations[msg.sender][authorizedSender]) {",
                "      delete senderAuthorizations[msg.sender][authorizedSender];",
                "      emit RevokeSender(msg.sender, authorizedSender);",
                "    }",
                "  }",
                "  /**",
                "    * @notice Revoke an authorized signer",
                "    * @dev Emits a RevokeSigner event",
                "    * @param authorizedSigner address Address to revoke",
                "    */",
                "  function revokeSigner(",
                "    address authorizedSigner",
                "  ) external {",
                "    if (signerAuthorizations[msg.sender][authorizedSigner]) {",
                "      delete signerAuthorizations[msg.sender][authorizedSigner];",
                "      emit RevokeSigner(msg.sender, authorizedSigner);",
                "    }",
                "  }",
                "  /**",
                "    * @notice Determine whether a sender delegate is authorized",
                "    * @param authorizer address Address doing the authorization",
                "    * @param delegate address Address being authorized",
                "    * @return bool True if a delegate is authorized to send",
                "    */",
                "  function isSenderAuthorized(",
                "    address authorizer,",
                "    address delegate",
                "  ) internal view returns (bool) {",
                "    return ((authorizer == delegate) ||",
                "      senderAuthorizations[authorizer][delegate]);",
                "  }",
                "  /**",
                "    * @notice Determine whether a signer delegate is authorized",
                "    * @param authorizer address Address doing the authorization",
                "    * @param delegate address Address being authorized",
                "    * @return bool True if a delegate is authorized to sign",
                "    */",
                "  function isSignerAuthorized(",
                "    address authorizer,",
                "    address delegate",
                "  ) internal view returns (bool) {",
                "    return ((authorizer == delegate) ||",
                "      signerAuthorizations[authorizer][delegate]);",
                "  }",
                "  /**",
                "    * @notice Validate signature using an EIP-712 typed data hash",
                "    * @param order Types.Order Order to validate",
                "    * @param domainSeparator bytes32 Domain identifier used in signatures (EIP-712)",
                "    * @return bool True if order has a valid signature",
                "    */",
                "  function isValid(",
                "    Types.Order memory order,",
                "    bytes32 domainSeparator",
                "  ) internal pure returns (bool) {",
                "    if (order.signature.version == byte(0x01)) {",
                "      return order.signature.signatory == ecrecover(",
                "        Types.hashOrder(",
                "          order,",
                "          domainSeparator",
                "        ),",
                "        order.signature.v,",
                "        order.signature.r,",
                "        order.signature.s",
                "      );",
                "    }",
                "    if (order.signature.version == byte(0x45)) {",
                "      return order.signature.signatory == ecrecover(",
                "        keccak256(",
                "          abi.encodePacked(",
                "            \"\\x19Ethereum Signed Message:\\n32\",",
                "            Types.hashOrder(order, domainSeparator)",
                "          )",
                "        ),",
                "        order.signature.v,",
                "        order.signature.r,",
                "        order.signature.s",
                "      );",
                "    }",
                "    return false;",
                "  }",
                "  /**",
                "    * @notice Perform token transfer for tokens in registry",
                "    * @dev Transfer type specified by the bytes4 kind param",
                "    * @dev ERC721: uses transferFrom for transfer",
                "    * @dev ERC20: Takes into account non-standard ERC-20 tokens.",
                "    * @param from address Wallet address to transfer from",
                "    * @param to address Wallet address to transfer to",
                "    * @param amount uint256 Amount for ERC-20",
                "    * @param id token ID for ERC-721",
                "    * @param token address Contract address of token",
                "    * @param kind bytes4 EIP-165 interface ID of the token",
                "    */",
                "  function transferToken(",
                "      address from,",
                "      address to,",
                "      uint256 amount,",
                "      uint256 id,",
                "      address token,",
                "      bytes4 kind",
                "  ) internal {",
                "    // Ensure the transfer is not to self.",
                "    require(from != to, \"SELF_TRANSFER_INVALID\");",
                "    ITransferHandler transferHandler = registry.transferHandlers(kind);",
                "    require(address(transferHandler) != address(0), \"TOKEN_KIND_UNKNOWN\");",
                "    // delegatecall required to pass msg.sender as Swap contract to handle the",
                "    // token transfer in the calling contract",
                "    (bool success, bytes memory data) = address(transferHandler).",
                "      delegatecall(abi.encodeWithSelector(",
                "        transferHandler.transferTokens.selector,",
                "        from,",
                "        to,",
                "        amount,",
                "        id,",
                "        token",
                "    ));",
                "    require(success && abi.decode(data, (bool)), \"TRANSFER_FAILED\");",
                "  }",
                "}",
                "// File: @airswap/tokens/contracts/interfaces/IWETH.sol",
                "interface IWETH {",
                "  function deposit() external payable;",
                "  function withdraw(uint256) external;",
                "  function totalSupply() external view returns (uint256);",
                "  function balanceOf(address account) external view returns (uint256);",
                "  function transfer(address recipient, uint256 amount) external returns (bool);",
                "  function allowance(address owner, address spender) external view returns (uint256);",
                "  function approve(address spender, uint256 amount) external returns (bool);",
                "  function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);",
                "  event Transfer(address indexed from, address indexed to, uint256 value);",
                "  event Approval(address indexed owner, address indexed spender, uint256 value);",
                "}",
                "// File: @airswap/wrapper/contracts/Wrapper.sol",
                "/*",
                "  Copyright 2020 Swap Holdings Ltd.",
                "  Licensed under the Apache License, Version 2.0 (the \"License\");",
                "  you may not use this file except in compliance with the License.",
                "  You may obtain a copy of the License at",
                "    http://www.apache.org/licenses/LICENSE-2.0",
                "  Unless required by applicable law or agreed to in writing, software",
                "  distributed under the License is distributed on an \"AS IS\" BASIS,",
                "  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
                "  See the License for the specific language governing permissions and",
                "  limitations under the License.",
                "*/",
                "/**",
                "  * @title Wrapper: Send and receive ether for WETH trades",
                "  */",
                "contract Wrapper {",
                "  // The Swap contract to settle trades",
                "  ISwap public swapContract;",
                "  // The WETH contract to wrap ether",
                "  IWETH public wethContract;",
                "  /**",
                "    * @notice Contract Constructor",
                "    * @param wrapperSwapContract address",
                "    * @param wrapperWethContract address",
                "    */",
                "  constructor(",
                "    address wrapperSwapContract,",
                "    address wrapperWethContract",
                "  ) public {",
                "    swapContract = ISwap(wrapperSwapContract);",
                "    wethContract = IWETH(wrapperWethContract);",
                "  }",
                "  /**",
                "    * @notice Required when withdrawing from WETH",
                "    * @dev During unwraps, WETH.withdraw transfers ether to msg.sender (this contract)",
                "    */",
                "  function() external payable {",
                "    // Ensure the message sender is the WETH contract.",
                "    if(msg.sender != address(wethContract)) {",
                "      revert(\"DO_NOT_SEND_ETHER\");",
                "    }",
                "  }",
                "  /**",
                "    * @notice Send an Order to be forwarded to Swap",
                "    * @dev Sender must authorize this contract on the swapContract",
                "    * @dev Sender must approve this contract on the wethContract",
                "    * @param order Types.Order The Order",
                "    */",
                "  function swap(",
                "    Types.Order calldata order",
                "  ) external payable {",
                "    // Ensure msg.sender is sender wallet.",
                "    require(order.sender.wallet == msg.sender,",
                "      \"MSG_SENDER_MUST_BE_ORDER_SENDER\");",
                "    // Ensure that the signature is present.",
                "    // The signature will be explicitly checked in Swap.",
                "    require(order.signature.v != 0,",
                "      \"SIGNATURE_MUST_BE_SENT\");",
                "    // Wraps ETH to WETH when the sender provides ETH and the order is WETH",
                "    _wrapEther(order.sender);",
                "    // Perform the swap.",
                "    swapContract.swap(order);",
                "    // Unwraps WETH to ETH when the sender receives WETH",
                "    _unwrapEther(order.sender.wallet, order.signer.token, order.signer.amount);",
                "  }",
                "  /**",
                "    * @notice Send an Order to be forwarded to a Delegate",
                "    * @dev Sender must authorize the Delegate contract on the swapContract",
                "    * @dev Sender must approve this contract on the wethContract",
                "    * @dev Delegate's tradeWallet must be order.sender - checked in Delegate",
                "    * @param order Types.Order The Order",
                "    * @param delegate IDelegate The Delegate to provide the order to",
                "    */",
                "  function provideDelegateOrder(",
                "    Types.Order calldata order,",
                "    IDelegate delegate",
                "  ) external payable {",
                "    // Ensure that the signature is present.",
                "    // The signature will be explicitly checked in Swap.",
                "    require(order.signature.v != 0,",
                "      \"SIGNATURE_MUST_BE_SENT\");",
                "    // Wraps ETH to WETH when the signer provides ETH and the order is WETH",
                "    _wrapEther(order.signer);",
                "    // Provide the order to the Delegate.",
                "    delegate.provideOrder(order);",
                "    // Unwraps WETH to ETH when the signer receives WETH",
                "    _unwrapEther(order.signer.wallet, order.sender.token, order.sender.amount);",
                "  }",
                "  /**",
                "    * @notice Wraps ETH to WETH when a trade requires it",
                "    * @param party Types.Party The side of the trade that may need wrapping",
                "    */",
                "  function _wrapEther(Types.Party memory party) internal {",
                "    // Check whether ether needs wrapping",
                "    if (party.token == address(wethContract)) {",
                "      // Ensure message value is param.",
                "      require(party.amount == msg.value,",
                "        \"VALUE_MUST_BE_SENT\");",
                "      // Wrap (deposit) the ether.",
                "      wethContract.deposit.value(msg.value)();",
                "      // Transfer the WETH from the wrapper to party.",
                "      // Return value not checked - WETH throws on error and does not return false",
                "      wethContract.transfer(party.wallet, party.amount);",
                "    } else {",
                "      // Ensure no unexpected ether is sent.",
                "      require(msg.value == 0,",
                "        \"VALUE_MUST_BE_ZERO\");",
                "    }",
                "  }",
                "  /**",
                "    * @notice Unwraps WETH to ETH when a trade requires it",
                "    * @dev The unwrapping only succeeds if recipientWallet has approved transferFrom",
                "    * @param recipientWallet address The trade recipient, who may have received WETH",
                "    * @param receivingToken address The token address the recipient received",
                "    * @param amount uint256 The amount of token the recipient received",
                "    */",
                "  function _unwrapEther(address recipientWallet, address receivingToken, uint256 amount) internal {",
                "    // Check whether ether needs unwrapping",
                "    if (receivingToken == address(wethContract)) {",
                "      // Transfer weth from the recipient to the wrapper.",
                "      wethContract.transferFrom(recipientWallet, address(this), amount);",
                "      // Unwrap (withdraw) the ether.",
                "      wethContract.withdraw(amount);",
                "      // Transfer ether to the recipient.",
                "      // solium-disable-next-line security/no-call-value",
                "      (bool success, ) = recipientWallet.call.value(amount)(\"\");",
                "      require(success, \"ETH_RETURN_FAILED\");",
                "    }",
                "  }",
                "}",
                "// File: openzeppelin-solidity/contracts/introspection/IERC165.sol",
                "/**",
                " * @dev Interface of the ERC165 standard, as defined in the",
                " * https://eips.ethereum.org/EIPS/eip-165[EIP].",
                " *",
                " * Implementers can declare support of contract interfaces, which can then be",
                " * queried by others ({ERC165Checker}).",
                " *",
                " * For an implementation, see {ERC165}.",
                " */",
                "interface IERC165 {",
                "    /**",
                "     * @dev Returns true if this contract implements the interface defined by",
                "     * `interfaceId`. See the corresponding",
                "     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[EIP section]",
                "     * to learn more about how these ids are created.",
                "     *",
                "     * This function call must use less than 30 000 gas.",
                "     */",
                "    function supportsInterface(bytes4 interfaceId) external view returns (bool);",
                "}",
                "// File: @airswap/tokens/contracts/interfaces/IERC1155.sol",
                "/**",
                " *",
                " * Copied from OpenZeppelin ERC1155 feature branch from (20642cca30fa18fb167df6db1889b558742d189a)",
                " * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/feature-erc1155/contracts/token/ERC1155/ERC1155.sol",
                " */",
                "/**",
                "    @title ERC-1155 Multi Token Standard basic interface",
                "    @dev See https://eips.ethereum.org/EIPS/eip-1155",
                " */",
                "contract IERC1155 is IERC165 {",
                "    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);",
                "    event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values);",
                "    event ApprovalForAll(address indexed account, address indexed operator, bool approved);",
                "    event URI(string value, uint256 indexed id);",
                "    function balanceOf(address account, uint256 id) public view returns (uint256);",
                "    function balanceOfBatch(address[] memory accounts, uint256[] memory ids) public view returns (uint256[] memory);",
                "    function setApprovalForAll(address operator, bool approved) external;",
                "    function isApprovedForAll(address account, address operator) external view returns (bool);",
                "    function safeTransferFrom(address from, address to, uint256 id, uint256 value, bytes calldata data) external;",
                "    function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata values, bytes calldata data) external;",
                "}",
                "// File: @airswap/transfers/contracts/handlers/ERC1155TransferHandler.sol",
                "/*",
                "  Copyright 2020 Swap Holdings Ltd.",
                "  Licensed under the Apache License, Version 2.0 (the \"License\");",
                "  you may not use this file except in compliance with the License.",
                "  You may obtain a copy of the License at",
                "    http://www.apache.org/licenses/LICENSE-2.0",
                "  Unless required by applicable law or agreed to in writing, software",
                "  distributed under the License is distributed on an \"AS IS\" BASIS,",
                "  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
                "  See the License for the specific language governing permissions and",
                "  limitations under the License.",
                "*/",
                "contract ERC1155TransferHandler is ITransferHandler {",
                " /**",
                "  * @notice Function to wrap safeTransferFrom for ERC1155",
                "  * @param from address Wallet address to transfer from",
                "  * @param to address Wallet address to transfer to",
                "  * @param amount uint256 Amount for ERC-1155",
                "  * @param id uint256 token ID for ERC-1155",
                "  * @param token address Contract address of token",
                "  * @return bool on success of the token transfer",
                "  */",
                "  function transferTokens(",
                "    address from,",
                "    address to,",
                "    uint256 amount,",
                "    uint256 id,",
                "    address token",
                "  ) external returns (bool) {",
                "    IERC1155(token).safeTransferFrom(",
                "      from,",
                "      to,",
                "      id,",
                "      amount,",
                "      \"\" // bytes are empty",
                "    );",
                "    return true;",
                "  }",
                "}",
                "// File: openzeppelin-solidity/contracts/utils/Address.sol",
                "/**",
                " * @dev Collection of functions related to the address type",
                " */",
                "library Address {",
                "    /**",
                "     * @dev Returns true if `account` is a contract.",
                "     *",
                "     * This test is non-exhaustive, and there may be false-negatives: during the",
                "     * execution of a contract's constructor, its address will be reported as",
                "     * not containing a contract.",
                "     *",
                "     * IMPORTANT: It is unsafe to assume that an address for which this",
                "     * function returns false is an externally-owned account (EOA) and not a",
                "     * contract.",
                "     */",
                "    function isContract(address account) internal view returns (bool) {",
                "        // This method relies in extcodesize, which returns 0 for contracts in",
                "        // construction, since the code is only stored at the end of the",
                "        // constructor execution.",
                "        // According to EIP-1052, 0x0 is the value returned for not-yet created accounts",
                "        // and 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470 is returned",
                "        // for accounts without code, i.e. `keccak256('')`",
                "        bytes32 codehash;",
                "        bytes32 accountHash = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;",
                "        // solhint-disable-next-line no-inline-assembly",
                "        assembly { codehash := extcodehash(account) }",
                "        return (codehash != 0x0 && codehash != accountHash);",
                "    }",
                "    /**",
                "     * @dev Converts an `address` into `address payable`. Note that this is",
                "     * simply a type cast: the actual underlying value is not changed.",
                "     *",
                "     * _Available since v2.4.0._",
                "     */",
                "    function toPayable(address account) internal pure returns (address payable) {",
                "        return address(uint160(account));",
                "    }",
                "    /**",
                "     * @dev Replacement for Solidity's `transfer`: sends `amount` wei to",
                "     * `recipient`, forwarding all available gas and reverting on errors.",
                "     *",
                "     * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost",
                "     * of certain opcodes, possibly making contracts go over the 2300 gas limit",
                "     * imposed by `transfer`, making them unable to receive funds via",
                "     * `transfer`. {sendValue} removes this limitation.",
                "     *",
                "     * https://diligence.consensys.net/posts/2019/09/stop-using-soliditys-transfer-now/[Learn more].",
                "     *",
                "     * IMPORTANT: because control is transferred to `recipient`, care must be",
                "     * taken to not create reentrancy vulnerabilities. Consider using",
                "     * {ReentrancyGuard} or the",
                "     * https://solidity.readthedocs.io/en/v0.5.11/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].",
                "     *",
                "     * _Available since v2.4.0._",
                "     */",
                "    function sendValue(address payable recipient, uint256 amount) internal {",
                "        require(address(this).balance >= amount, \"Address: insufficient balance\");",
                "        // solhint-disable-next-line avoid-call-value",
                "        (bool success, ) = recipient.call.value(amount)(\"\");",
                "        require(success, \"Address: unable to send value, recipient may have reverted\");",
                "    }",
                "}",
                "// File: openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol",
                "/**",
                " * @title SafeERC20",
                " * @dev Wrappers around ERC20 operations that throw on failure (when the token",
                " * contract returns false). Tokens that return no value (and instead revert or",
                " * throw on failure) are also supported, non-reverting calls are assumed to be",
                " * successful.",
                " * To use this library you can add a `using SafeERC20 for ERC20;` statement to your contract,",
                " * which allows you to call the safe operations as `token.safeTransfer(...)`, etc.",
                " */",
                "library SafeERC20 {",
                "    using SafeMath for uint256;",
                "    using Address for address;",
                "    function safeTransfer(IERC20 token, address to, uint256 value) internal {",
                "        callOptionalReturn(token, abi.encodeWithSelector(token.transfer.selector, to, value));",
                "    }",
                "    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {",
                "        callOptionalReturn(token, abi.encodeWithSelector(token.transferFrom.selector, from, to, value));",
                "    }",
                "    function safeApprove(IERC20 token, address spender, uint256 value) internal {",
                "        // safeApprove should only be called when setting an initial allowance,",
                "        // or when resetting it to zero. To increase and decrease it, use",
                "        // 'safeIncreaseAllowance' and 'safeDecreaseAllowance'",
                "        // solhint-disable-next-line max-line-length",
                "        require((value == 0) || (token.allowance(address(this), spender) == 0),",
                "            \"SafeERC20: approve from non-zero to non-zero allowance\"",
                "        );",
                "        callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, value));",
                "    }",
                "    function safeIncreaseAllowance(IERC20 token, address spender, uint256 value) internal {",
                "        uint256 newAllowance = token.allowance(address(this), spender).add(value);",
                "        callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, newAllowance));",
                "    }",
                "    function safeDecreaseAllowance(IERC20 token, address spender, uint256 value) internal {",
                "        uint256 newAllowance = token.allowance(address(this), spender).sub(value, \"SafeERC20: decreased allowance below zero\");",
                "        callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, newAllowance));",
                "    }",
                "    /**",
                "     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement",
                "     * on the return value: the return value is optional (but if data is returned, it must not be false).",
                "     * @param token The token targeted by the call.",
                "     * @param data The call data (encoded using abi.encode or one of its variants).",
                "     */",
                "    function callOptionalReturn(IERC20 token, bytes memory data) private {",
                "        // We need to perform a low level call here, to bypass Solidity's return data size checking mechanism, since",
                "        // we're implementing it ourselves.",
                "        // A Solidity high level call has three parts:",
                "        //  1. The target address is checked to verify it contains contract code",
                "        //  2. The call itself is made, and success asserted",
                "        //  3. The return value is decoded, which in turn checks the size of the returned data.",
                "        // solhint-disable-next-line max-line-length",
                "        require(address(token).isContract(), \"SafeERC20: call to non-contract\");",
                "        // solhint-disable-next-line avoid-low-level-calls",
                "        (bool success, bytes memory returndata) = address(token).call(data);",
                "        require(success, \"SafeERC20: low-level call failed\");",
                "        if (returndata.length > 0) { // Return data is optional",
                "            // solhint-disable-next-line max-line-length",
                "            require(abi.decode(returndata, (bool)), \"SafeERC20: ERC20 operation did not succeed\");",
                "        }",
                "    }",
                "}",
                "// File: @airswap/transfers/contracts/handlers/ERC20TransferHandler.sol",
                "/*",
                "  Copyright 2020 Swap Holdings Ltd.",
                "  Licensed under the Apache License, Version 2.0 (the \"License\");",
                "  you may not use this file except in compliance with the License.",
                "  You may obtain a copy of the License at",
                "    http://www.apache.org/licenses/LICENSE-2.0",
                "  Unless required by applicable law or agreed to in writing, software",
                "  distributed under the License is distributed on an \"AS IS\" BASIS,",
                "  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
                "  See the License for the specific language governing permissions and",
                "  limitations under the License.",
                "*/",
                "contract ERC20TransferHandler is ITransferHandler {",
                "  using SafeERC20 for IERC20;",
                " /**",
                "  * @notice Function to wrap safeTransferFrom for ERC20",
                "  * @param from address Wallet address to transfer from",
                "  * @param to address Wallet address to transfer to",
                "  * @param amount uint256 Amount for ERC-20",
                "  * @param id uint256 ID, must be 0 for this contract",
                "  * @param token address Contract address of token",
                "  * @return bool on success of the token transfer",
                "  */",
                "  function transferTokens(",
                "    address from,",
                "    address to,",
                "    uint256 amount,",
                "    uint256 id,",
                "    address token",
                "  ) external returns (bool) {",
                "    require(id == 0, \"ID_INVALID\");",
                "    IERC20(token).safeTransferFrom(from, to, amount);",
                "    return true;",
                "  }",
                "}",
                "// File: openzeppelin-solidity/contracts/token/ERC721/IERC721.sol",
                "/**",
                " * @dev Required interface of an ERC721 compliant contract.",
                " */",
                "contract IERC721 is IERC165 {",
                "    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);",
                "    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);",
                "    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);",
                "    /**",
                "     * @dev Returns the number of NFTs in `owner`'s account.",
                "     */",
                "    function balanceOf(address owner) public view returns (uint256 balance);",
                "    /**",
                "     * @dev Returns the owner of the NFT specified by `tokenId`.",
                "     */",
                "    function ownerOf(uint256 tokenId) public view returns (address owner);",
                "    /**",
                "     * @dev Transfers a specific NFT (`tokenId`) from one account (`from`) to",
                "     * another (`to`).",
                "     *",
                "     *",
                "     *",
                "     * Requirements:",
                "     * - `from`, `to` cannot be zero.",
                "     * - `tokenId` must be owned by `from`.",
                "     * - If the caller is not `from`, it must be have been allowed to move this",
                "     * NFT by either {approve} or {setApprovalForAll}.",
                "     */",
                "    function safeTransferFrom(address from, address to, uint256 tokenId) public;",
                "    /**",
                "     * @dev Transfers a specific NFT (`tokenId`) from one account (`from`) to",
                "     * another (`to`).",
                "     *",
                "     * Requirements:",
                "     * - If the caller is not `from`, it must be approved to move this NFT by",
                "     * either {approve} or {setApprovalForAll}.",
                "     */",
                "    function transferFrom(address from, address to, uint256 tokenId) public;",
                "    function approve(address to, uint256 tokenId) public;",
                "    function getApproved(uint256 tokenId) public view returns (address operator);",
                "    function setApprovalForAll(address operator, bool _approved) public;",
                "    function isApprovedForAll(address owner, address operator) public view returns (bool);",
                "    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public;",
                "}",
                "// File: @airswap/transfers/contracts/handlers/ERC721TransferHandler.sol",
                "/*",
                "  Copyright 2020 Swap Holdings Ltd.",
                "  Licensed under the Apache License, Version 2.0 (the \"License\");",
                "  you may not use this file except in compliance with the License.",
                "  You may obtain a copy of the License at",
                "    http://www.apache.org/licenses/LICENSE-2.0",
                "  Unless required by applicable law or agreed to in writing, software",
                "  distributed under the License is distributed on an \"AS IS\" BASIS,",
                "  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
                "  See the License for the specific language governing permissions and",
                "  limitations under the License.",
                "*/",
                "contract ERC721TransferHandler is ITransferHandler {",
                " /**",
                "  * @notice Function to wrap safeTransferFrom for ERC721",
                "  * @param from address Wallet address to transfer from",
                "  * @param to address Wallet address to transfer to",
                "  * @param amount uint256, must be 0 for this contract",
                "  * @param id uint256 ID for ERC721",
                "  * @param token address Contract address of token",
                "  * @return bool on success of the token transfer",
                "  */",
                "  function transferTokens(",
                "    address from,",
                "    address to,",
                "    uint256 amount,",
                "    uint256 id,",
                "    address token)",
                "  external returns (bool) {",
                "    require(amount == 0, \"AMOUNT_INVALID\");",
                "    IERC721(token).safeTransferFrom(from, to, id);",
                "    return true;",
                "  }",
                "}",
                "// File: @airswap/transfers/contracts/interfaces/IKittyCoreTokenTransfer.sol",
                "/*",
                "  Copyright 2020 Swap Holdings Ltd.",
                "  Licensed under the Apache License, Version 2.0 (the \"License\");",
                "  you may not use this file except in compliance with the License.",
                "  You may obtain a copy of the License at",
                "    http://www.apache.org/licenses/LICENSE-2.0",
                "  Unless required by applicable law or agreed to in writing, software",
                "  distributed under the License is distributed on an \"AS IS\" BASIS,",
                "  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
                "  See the License for the specific language governing permissions and",
                "  limitations under the License.",
                "*/",
                "/**",
                " * @title IKittyCoreTokenTransfer",
                " * @dev transferFrom function from KittyCore",
                " */",
                "contract IKittyCoreTokenTransfer {",
                "  function transferFrom(address from, address to, uint256 tokenId) external;",
                "}",
                "// File: @airswap/transfers/contracts/handlers/KittyCoreTransferHandler.sol",
                "/*",
                "  Copyright 2020 Swap Holdings Ltd.",
                "  Licensed under the Apache License, Version 2.0 (the \"License\");",
                "  you may not use this file except in compliance with the License.",
                "  You may obtain a copy of the License at",
                "    http://www.apache.org/licenses/LICENSE-2.0",
                "  Unless required by applicable law or agreed to in writing, software",
                "  distributed under the License is distributed on an \"AS IS\" BASIS,",
                "  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
                "  See the License for the specific language governing permissions and",
                "  limitations under the License.",
                "*/",
                "contract KittyCoreTransferHandler is ITransferHandler {",
                " /**",
                "  * @notice Function to wrap transferFrom for CKitty",
                "  * @param from address Wallet address to transfer from",
                "  * @param to address Wallet address to transfer to",
                "  * @param amount uint256, must be 0 for this contract",
                "  * @param id uint256 ID for ERC721",
                "  * @param token address Contract address of token",
                "  * @return bool on success of the token transfer",
                "  */",
                "  function transferTokens(",
                "    address from,",
                "    address to,",
                "    uint256 amount,",
                "    uint256 id,",
                "    address token",
                "  ) external returns (bool) {",
                "    require(amount == 0, \"AMOUNT_INVALID\");",
                "    IKittyCoreTokenTransfer(token).transferFrom(from, to, id);",
                "    return true;",
                "  }",
                "}",
                "// File: contracts/Imports.sol",
                "//Import all the contracts desired to be deployed",
                "contract Imports {}",
                ""
              ]
            }
          },
          "sourceRangesById": {
            "18": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 24,
                "column": 2
              },
              "to": {
                "line": 31,
                "column": 2
              }
            },
            "29": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 32,
                "column": 2
              },
              "to": {
                "line": 38,
                "column": 2
              }
            },
            "42": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 39,
                "column": 2
              },
              "to": {
                "line": 46,
                "column": 2
              }
            },
            "207": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 22,
                "column": 0
              },
              "to": {
                "line": 144,
                "column": 0
              }
            },
            "214": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 159,
                "column": 2
              },
              "to": {
                "line": 163,
                "column": 2
              }
            },
            "228": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 164,
                "column": 2
              },
              "to": {
                "line": 171,
                "column": 3
              }
            },
            "236": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 172,
                "column": 2
              },
              "to": {
                "line": 176,
                "column": 3
              }
            },
            "252": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 177,
                "column": 2
              },
              "to": {
                "line": 185,
                "column": 3
              }
            },
            "330": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 158,
                "column": 0
              },
              "to": {
                "line": 226,
                "column": 0
              }
            },
            "340": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 241,
                "column": 2
              },
              "to": {
                "line": 246,
                "column": 3
              }
            },
            "352": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 247,
                "column": 2
              },
              "to": {
                "line": 253,
                "column": 3
              }
            },
            "364": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 254,
                "column": 2
              },
              "to": {
                "line": 260,
                "column": 3
              }
            },
            "368": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 261,
                "column": 2
              },
              "to": {
                "line": 263,
                "column": 3
              }
            },
            "372": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 264,
                "column": 2
              },
              "to": {
                "line": 266,
                "column": 3
              }
            },
            "480": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 240,
                "column": 0
              },
              "to": {
                "line": 314,
                "column": 0
              }
            },
            "496": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 331,
                "column": 0
              },
              "to": {
                "line": 348,
                "column": 0
              }
            },
            "521": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 360,
                "column": 0
              },
              "to": {
                "line": 372,
                "column": 0
              }
            },
            "531": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 385,
                "column": 4
              },
              "to": {
                "line": 385,
                "column": 87
              }
            },
            "632": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 383,
                "column": 0
              },
              "to": {
                "line": 438,
                "column": 0
              }
            },
            "640": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 457,
                "column": 2
              },
              "to": {
                "line": 460,
                "column": 3
              }
            },
            "681": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 456,
                "column": 0
              },
              "to": {
                "line": 474,
                "column": 0
              }
            },
            "711": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 489,
                "column": 2
              },
              "to": {
                "line": 504,
                "column": 3
              }
            },
            "717": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 505,
                "column": 2
              },
              "to": {
                "line": 508,
                "column": 3
              }
            },
            "723": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 509,
                "column": 2
              },
              "to": {
                "line": 512,
                "column": 3
              }
            },
            "729": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 513,
                "column": 2
              },
              "to": {
                "line": 516,
                "column": 3
              }
            },
            "735": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 517,
                "column": 2
              },
              "to": {
                "line": 520,
                "column": 3
              }
            },
            "741": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 521,
                "column": 2
              },
              "to": {
                "line": 524,
                "column": 3
              }
            },
            "747": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 525,
                "column": 2
              },
              "to": {
                "line": 528,
                "column": 3
              }
            },
            "823": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 488,
                "column": 0
              },
              "to": {
                "line": 584,
                "column": 0
              }
            },
            "1008": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 599,
                "column": 0
              },
              "to": {
                "line": 727,
                "column": 0
              }
            },
            "1066": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 789,
                "column": 4
              },
              "to": {
                "line": 789,
                "column": 75
              }
            },
            "1074": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 794,
                "column": 4
              },
              "to": {
                "line": 794,
                "column": 81
              }
            },
            "1075": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 733,
                "column": 0
              },
              "to": {
                "line": 795,
                "column": 0
              }
            },
            "1819": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 814,
                "column": 0
              },
              "to": {
                "line": 1202,
                "column": 0
              }
            },
            "1831": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 1217,
                "column": 2
              },
              "to": {
                "line": 1223,
                "column": 3
              }
            },
            "1839": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 1216,
                "column": 0
              },
              "to": {
                "line": 1232,
                "column": 0
              }
            },
            "1847": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 1246,
                "column": 0
              },
              "to": {
                "line": 1250,
                "column": 0
              }
            },
            "1943": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 1264,
                "column": 0
              },
              "to": {
                "line": 1316,
                "column": 0
              }
            },
            "1971": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 1353,
                "column": 2
              },
              "to": {
                "line": 1358,
                "column": 2
              }
            },
            "1979": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 1362,
                "column": 2
              },
              "to": {
                "line": 1366,
                "column": 3
              }
            },
            "1983": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 1367,
                "column": 2
              },
              "to": {
                "line": 1369,
                "column": 3
              }
            },
            "2411": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 1339,
                "column": 0
              },
              "to": {
                "line": 1555,
                "column": 0
              }
            },
            "3017": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 1572,
                "column": 0
              },
              "to": {
                "line": 1813,
                "column": 0
              }
            },
            "3712": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 1830,
                "column": 0
              },
              "to": {
                "line": 2144,
                "column": 0
              }
            },
            "3778": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 2155,
                "column": 2
              },
              "to": {
                "line": 2155,
                "column": 73
              }
            },
            "3786": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 2156,
                "column": 2
              },
              "to": {
                "line": 2156,
                "column": 79
              }
            },
            "3787": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 2146,
                "column": 0
              },
              "to": {
                "line": 2157,
                "column": 0
              }
            },
            "4015": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 2174,
                "column": 0
              },
              "to": {
                "line": 2288,
                "column": 0
              }
            },
            "4023": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 2299,
                "column": 0
              },
              "to": {
                "line": 2309,
                "column": 0
              }
            },
            "4037": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 2321,
                "column": 4
              },
              "to": {
                "line": 2321,
                "column": 119
              }
            },
            "4051": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 2322,
                "column": 4
              },
              "to": {
                "line": 2322,
                "column": 124
              }
            },
            "4059": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 2323,
                "column": 4
              },
              "to": {
                "line": 2323,
                "column": 90
              }
            },
            "4065": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 2324,
                "column": 4
              },
              "to": {
                "line": 2324,
                "column": 47
              }
            },
            "4131": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 2320,
                "column": 0
              },
              "to": {
                "line": 2331,
                "column": 0
              }
            },
            "4163": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 2345,
                "column": 0
              },
              "to": {
                "line": 2371,
                "column": 0
              }
            },
            "4236": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 2376,
                "column": 0
              },
              "to": {
                "line": 2434,
                "column": 0
              }
            },
            "4451": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 2445,
                "column": 0
              },
              "to": {
                "line": 2495,
                "column": 0
              }
            },
            "4491": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 2509,
                "column": 0
              },
              "to": {
                "line": 2531,
                "column": 0
              }
            },
            "4501": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 2537,
                "column": 4
              },
              "to": {
                "line": 2537,
                "column": 85
              }
            },
            "4509": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 2538,
                "column": 4
              },
              "to": {
                "line": 2538,
                "column": 92
              }
            },
            "4517": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 2539,
                "column": 4
              },
              "to": {
                "line": 2539,
                "column": 88
              }
            },
            "4591": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 2536,
                "column": 0
              },
              "to": {
                "line": 2575,
                "column": 0
              }
            },
            "4628": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 2589,
                "column": 0
              },
              "to": {
                "line": 2610,
                "column": 0
              }
            },
            "4638": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 2628,
                "column": 0
              },
              "to": {
                "line": 2630,
                "column": 0
              }
            },
            "4675": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 2644,
                "column": 0
              },
              "to": {
                "line": 2665,
                "column": 0
              }
            },
            "4676": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 2668,
                "column": 0
              },
              "to": {
                "line": 2668,
                "column": 18
              }
            }
          }
        }
      }
    },
    "desc": "Airswap tx"
  },
  {
    "tx": {
      "kind": "function",
      "class": {
        "typeClass": "contract",
        "kind": "native",
        "id": "shimmedcompilationNumber(0):1272",
        "typeName": "Moloch",
        "contractKind": "contract",
        "payable": false
      },
      "abi": {
        "inputs": [
          {
            "name": "sharesToBurn",
            "type": "uint256"
          }
        ],
        "name": "ragequit",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      "arguments": [
        {
          "name": "sharesToBurn",
          "value": {
            "type": {
              "typeClass": "uint",
              "bits": 256,
              "typeHint": "uint256"
            },
            "kind": "value",
            "value": {
              "asString": "34",
              "rawAsString": "34"
            }
          }
        }
      ],
      "selector": "0x8436593f",
      "decodingMode": "full"
    },
    "definitions": {
      "compilationsById": {
        "shimmedcompilationNumber(0)": {
          "sourcesById": {
            "0": {
              "language": "Solidity",
              "lines": [
                "/**",
                " *Submitted for verification at Etherscan.io on 20XX-XX-XX",
                "*/",
                "",
                "pragma solidity ^0.5.3;\r",
                "\r",
                "contract Moloch {\r",
                "    using SafeMath for uint256;\r",
                "\r",
                "    /***************\r",
                "    GLOBAL CONSTANTS\r",
                "    ***************/\r",
                "    uint256 public periodDuration; // default = 17280 = 4.8 hours in seconds (5 periods per day)\r",
                "    uint256 public votingPeriodLength; // default = 35 periods (7 days)\r",
                "    uint256 public gracePeriodLength; // default = 35 periods (7 days)\r",
                "    uint256 public abortWindow; // default = 5 periods (1 day)\r",
                "    uint256 public proposalDeposit; // default = 10 ETH (~$1,000 worth of ETH at contract deployment)\r",
                "    uint256 public dilutionBound; // default = 3 - maximum multiplier a YES voter will be obligated to pay in case of mass ragequit\r",
                "    uint256 public processingReward; // default = 0.1 - amount of ETH to give to whoever processes a proposal\r",
                "    uint256 public summoningTime; // needed to determine the current period\r",
                "\r",
                "    IERC20 public approvedToken; // approved token contract reference; default = wETH\r",
                "    GuildBank public guildBank; // guild bank contract reference\r",
                "\r",
                "    // HARD-CODED LIMITS\r",
                "    // These numbers are quite arbitrary; they are small enough to avoid overflows when doing calculations\r",
                "    // with periods or shares, yet big enough to not limit reasonable use cases.\r",
                "    uint256 constant MAX_VOTING_PERIOD_LENGTH = 10**18; // maximum length of voting period\r",
                "    uint256 constant MAX_GRACE_PERIOD_LENGTH = 10**18; // maximum length of grace period\r",
                "    uint256 constant MAX_DILUTION_BOUND = 10**18; // maximum dilution bound\r",
                "    uint256 constant MAX_NUMBER_OF_SHARES = 10**18; // maximum number of shares that can be minted\r",
                "\r",
                "    /***************\r",
                "    EVENTS\r",
                "    ***************/\r",
                "    event SubmitProposal(uint256 proposalIndex, address indexed delegateKey, address indexed memberAddress, address indexed applicant, uint256 tokenTribute, uint256 sharesRequested);\r",
                "    event SubmitVote(uint256 indexed proposalIndex, address indexed delegateKey, address indexed memberAddress, uint8 uintVote);\r",
                "    event ProcessProposal(uint256 indexed proposalIndex, address indexed applicant, address indexed memberAddress, uint256 tokenTribute, uint256 sharesRequested, bool didPass);\r",
                "    event Ragequit(address indexed memberAddress, uint256 sharesToBurn);\r",
                "    event Abort(uint256 indexed proposalIndex, address applicantAddress);\r",
                "    event UpdateDelegateKey(address indexed memberAddress, address newDelegateKey);\r",
                "    event SummonComplete(address indexed summoner, uint256 shares);\r",
                "\r",
                "    /******************\r",
                "    INTERNAL ACCOUNTING\r",
                "    ******************/\r",
                "    uint256 public totalShares = 0; // total shares across all members\r",
                "    uint256 public totalSharesRequested = 0; // total shares that have been requested in unprocessed proposals\r",
                "\r",
                "    enum Vote {\r",
                "        Null, // default value, counted as abstention\r",
                "        Yes,\r",
                "        No\r",
                "    }\r",
                "\r",
                "    struct Member {\r",
                "        address delegateKey; // the key responsible for submitting proposals and voting - defaults to member address unless updated\r",
                "        uint256 shares; // the # of shares assigned to this member\r",
                "        bool exists; // always true once a member has been created\r",
                "        uint256 highestIndexYesVote; // highest proposal index # on which the member voted YES\r",
                "    }\r",
                "\r",
                "    struct Proposal {\r",
                "        address proposer; // the member who submitted the proposal\r",
                "        address applicant; // the applicant who wishes to become a member - this key will be used for withdrawals\r",
                "        uint256 sharesRequested; // the # of shares the applicant is requesting\r",
                "        uint256 startingPeriod; // the period in which voting can start for this proposal\r",
                "        uint256 yesVotes; // the total number of YES votes for this proposal\r",
                "        uint256 noVotes; // the total number of NO votes for this proposal\r",
                "        bool processed; // true only if the proposal has been processed\r",
                "        bool didPass; // true only if the proposal passed\r",
                "        bool aborted; // true only if applicant calls \"abort\" fn before end of voting period\r",
                "        uint256 tokenTribute; // amount of tokens offered as tribute\r",
                "        string details; // proposal details - could be IPFS hash, plaintext, or JSON\r",
                "        uint256 maxTotalSharesAtYesVote; // the maximum # of total shares encountered at a yes vote on this proposal\r",
                "        mapping (address => Vote) votesByMember; // the votes on this proposal by each member\r",
                "    }\r",
                "\r",
                "    mapping (address => Member) public members;\r",
                "    mapping (address => address) public memberAddressByDelegateKey;\r",
                "    Proposal[] public proposalQueue;\r",
                "\r",
                "    /********\r",
                "    MODIFIERS\r",
                "    ********/\r",
                "    modifier onlyMember {\r",
                "        require(members[msg.sender].shares > 0, \"Moloch::onlyMember - not a member\");\r",
                "        _;\r",
                "    }\r",
                "\r",
                "    modifier onlyDelegate {\r",
                "        require(members[memberAddressByDelegateKey[msg.sender]].shares > 0, \"Moloch::onlyDelegate - not a delegate\");\r",
                "        _;\r",
                "    }\r",
                "\r",
                "    /********\r",
                "    FUNCTIONS\r",
                "    ********/\r",
                "    constructor(\r",
                "        address summoner,\r",
                "        address _approvedToken,\r",
                "        uint256 _periodDuration,\r",
                "        uint256 _votingPeriodLength,\r",
                "        uint256 _gracePeriodLength,\r",
                "        uint256 _abortWindow,\r",
                "        uint256 _proposalDeposit,\r",
                "        uint256 _dilutionBound,\r",
                "        uint256 _processingReward\r",
                "    ) public {\r",
                "        require(summoner != address(0), \"Moloch::constructor - summoner cannot be 0\");\r",
                "        require(_approvedToken != address(0), \"Moloch::constructor - _approvedToken cannot be 0\");\r",
                "        require(_periodDuration > 0, \"Moloch::constructor - _periodDuration cannot be 0\");\r",
                "        require(_votingPeriodLength > 0, \"Moloch::constructor - _votingPeriodLength cannot be 0\");\r",
                "        require(_votingPeriodLength <= MAX_VOTING_PERIOD_LENGTH, \"Moloch::constructor - _votingPeriodLength exceeds limit\");\r",
                "        require(_gracePeriodLength <= MAX_GRACE_PERIOD_LENGTH, \"Moloch::constructor - _gracePeriodLength exceeds limit\");\r",
                "        require(_abortWindow > 0, \"Moloch::constructor - _abortWindow cannot be 0\");\r",
                "        require(_abortWindow <= _votingPeriodLength, \"Moloch::constructor - _abortWindow must be smaller than or equal to _votingPeriodLength\");\r",
                "        require(_dilutionBound > 0, \"Moloch::constructor - _dilutionBound cannot be 0\");\r",
                "        require(_dilutionBound <= MAX_DILUTION_BOUND, \"Moloch::constructor - _dilutionBound exceeds limit\");\r",
                "        require(_proposalDeposit >= _processingReward, \"Moloch::constructor - _proposalDeposit cannot be smaller than _processingReward\");\r",
                "\r",
                "        approvedToken = IERC20(_approvedToken);\r",
                "\r",
                "        guildBank = new GuildBank(_approvedToken);\r",
                "\r",
                "        periodDuration = _periodDuration;\r",
                "        votingPeriodLength = _votingPeriodLength;\r",
                "        gracePeriodLength = _gracePeriodLength;\r",
                "        abortWindow = _abortWindow;\r",
                "        proposalDeposit = _proposalDeposit;\r",
                "        dilutionBound = _dilutionBound;\r",
                "        processingReward = _processingReward;\r",
                "\r",
                "        summoningTime = now;\r",
                "\r",
                "        members[summoner] = Member(summoner, 1, true, 0);\r",
                "        memberAddressByDelegateKey[summoner] = summoner;\r",
                "        totalShares = 1;\r",
                "\r",
                "        emit SummonComplete(summoner, 1);\r",
                "    }\r",
                "\r",
                "    /*****************\r",
                "    PROPOSAL FUNCTIONS\r",
                "    *****************/\r",
                "\r",
                "    function submitProposal(\r",
                "        address applicant,\r",
                "        uint256 tokenTribute,\r",
                "        uint256 sharesRequested,\r",
                "        string memory details\r",
                "    )\r",
                "        public\r",
                "        onlyDelegate\r",
                "    {\r",
                "        require(applicant != address(0), \"Moloch::submitProposal - applicant cannot be 0\");\r",
                "\r",
                "        // Make sure we won't run into overflows when doing calculations with shares.\r",
                "        // Note that totalShares + totalSharesRequested + sharesRequested is an upper bound\r",
                "        // on the number of shares that can exist until this proposal has been processed.\r",
                "        require(totalShares.add(totalSharesRequested).add(sharesRequested) <= MAX_NUMBER_OF_SHARES, \"Moloch::submitProposal - too many shares requested\");\r",
                "\r",
                "        totalSharesRequested = totalSharesRequested.add(sharesRequested);\r",
                "\r",
                "        address memberAddress = memberAddressByDelegateKey[msg.sender];\r",
                "\r",
                "        // collect proposal deposit from proposer and store it in the Moloch until the proposal is processed\r",
                "        require(approvedToken.transferFrom(msg.sender, address(this), proposalDeposit), \"Moloch::submitProposal - proposal deposit token transfer failed\");\r",
                "\r",
                "        // collect tribute from applicant and store it in the Moloch until the proposal is processed\r",
                "        require(approvedToken.transferFrom(applicant, address(this), tokenTribute), \"Moloch::submitProposal - tribute token transfer failed\");\r",
                "\r",
                "        // compute startingPeriod for proposal\r",
                "        uint256 startingPeriod = max(\r",
                "            getCurrentPeriod(),\r",
                "            proposalQueue.length == 0 ? 0 : proposalQueue[proposalQueue.length.sub(1)].startingPeriod\r",
                "        ).add(1);\r",
                "\r",
                "        // create proposal ...\r",
                "        Proposal memory proposal = Proposal({\r",
                "            proposer: memberAddress,\r",
                "            applicant: applicant,\r",
                "            sharesRequested: sharesRequested,\r",
                "            startingPeriod: startingPeriod,\r",
                "            yesVotes: 0,\r",
                "            noVotes: 0,\r",
                "            processed: false,\r",
                "            didPass: false,\r",
                "            aborted: false,\r",
                "            tokenTribute: tokenTribute,\r",
                "            details: details,\r",
                "            maxTotalSharesAtYesVote: 0\r",
                "        });\r",
                "\r",
                "        // ... and append it to the queue\r",
                "        proposalQueue.push(proposal);\r",
                "\r",
                "        uint256 proposalIndex = proposalQueue.length.sub(1);\r",
                "        emit SubmitProposal(proposalIndex, msg.sender, memberAddress, applicant, tokenTribute, sharesRequested);\r",
                "    }\r",
                "\r",
                "    function submitVote(uint256 proposalIndex, uint8 uintVote) public onlyDelegate {\r",
                "        address memberAddress = memberAddressByDelegateKey[msg.sender];\r",
                "        Member storage member = members[memberAddress];\r",
                "\r",
                "        require(proposalIndex < proposalQueue.length, \"Moloch::submitVote - proposal does not exist\");\r",
                "        Proposal storage proposal = proposalQueue[proposalIndex];\r",
                "\r",
                "        require(uintVote < 3, \"Moloch::submitVote - uintVote must be less than 3\");\r",
                "        Vote vote = Vote(uintVote);\r",
                "\r",
                "        require(getCurrentPeriod() >= proposal.startingPeriod, \"Moloch::submitVote - voting period has not started\");\r",
                "        require(!hasVotingPeriodExpired(proposal.startingPeriod), \"Moloch::submitVote - proposal voting period has expired\");\r",
                "        require(proposal.votesByMember[memberAddress] == Vote.Null, \"Moloch::submitVote - member has already voted on this proposal\");\r",
                "        require(vote == Vote.Yes || vote == Vote.No, \"Moloch::submitVote - vote must be either Yes or No\");\r",
                "        require(!proposal.aborted, \"Moloch::submitVote - proposal has been aborted\");\r",
                "\r",
                "        // store vote\r",
                "        proposal.votesByMember[memberAddress] = vote;\r",
                "\r",
                "        // count vote\r",
                "        if (vote == Vote.Yes) {\r",
                "            proposal.yesVotes = proposal.yesVotes.add(member.shares);\r",
                "\r",
                "            // set highest index (latest) yes vote - must be processed for member to ragequit\r",
                "            if (proposalIndex > member.highestIndexYesVote) {\r",
                "                member.highestIndexYesVote = proposalIndex;\r",
                "            }\r",
                "\r",
                "            // set maximum of total shares encountered at a yes vote - used to bound dilution for yes voters\r",
                "            if (totalShares > proposal.maxTotalSharesAtYesVote) {\r",
                "                proposal.maxTotalSharesAtYesVote = totalShares;\r",
                "            }\r",
                "\r",
                "        } else if (vote == Vote.No) {\r",
                "            proposal.noVotes = proposal.noVotes.add(member.shares);\r",
                "        }\r",
                "\r",
                "        emit SubmitVote(proposalIndex, msg.sender, memberAddress, uintVote);\r",
                "    }\r",
                "\r",
                "    function processProposal(uint256 proposalIndex) public {\r",
                "        require(proposalIndex < proposalQueue.length, \"Moloch::processProposal - proposal does not exist\");\r",
                "        Proposal storage proposal = proposalQueue[proposalIndex];\r",
                "\r",
                "        require(getCurrentPeriod() >= proposal.startingPeriod.add(votingPeriodLength).add(gracePeriodLength), \"Moloch::processProposal - proposal is not ready to be processed\");\r",
                "        require(proposal.processed == false, \"Moloch::processProposal - proposal has already been processed\");\r",
                "        require(proposalIndex == 0 || proposalQueue[proposalIndex.sub(1)].processed, \"Moloch::processProposal - previous proposal must be processed\");\r",
                "\r",
                "        proposal.processed = true;\r",
                "        totalSharesRequested = totalSharesRequested.sub(proposal.sharesRequested);\r",
                "\r",
                "        bool didPass = proposal.yesVotes > proposal.noVotes;\r",
                "\r",
                "        // Make the proposal fail if the dilutionBound is exceeded\r",
                "        if (totalShares.mul(dilutionBound) < proposal.maxTotalSharesAtYesVote) {\r",
                "            didPass = false;\r",
                "        }\r",
                "\r",
                "        // PROPOSAL PASSED\r",
                "        if (didPass && !proposal.aborted) {\r",
                "\r",
                "            proposal.didPass = true;\r",
                "\r",
                "            // if the applicant is already a member, add to their existing shares\r",
                "            if (members[proposal.applicant].exists) {\r",
                "                members[proposal.applicant].shares = members[proposal.applicant].shares.add(proposal.sharesRequested);\r",
                "\r",
                "            // the applicant is a new member, create a new record for them\r",
                "            } else {\r",
                "                // if the applicant address is already taken by a member's delegateKey, reset it to their member address\r",
                "                if (members[memberAddressByDelegateKey[proposal.applicant]].exists) {\r",
                "                    address memberToOverride = memberAddressByDelegateKey[proposal.applicant];\r",
                "                    memberAddressByDelegateKey[memberToOverride] = memberToOverride;\r",
                "                    members[memberToOverride].delegateKey = memberToOverride;\r",
                "                }\r",
                "\r",
                "                // use applicant address as delegateKey by default\r",
                "                members[proposal.applicant] = Member(proposal.applicant, proposal.sharesRequested, true, 0);\r",
                "                memberAddressByDelegateKey[proposal.applicant] = proposal.applicant;\r",
                "            }\r",
                "\r",
                "            // mint new shares\r",
                "            totalShares = totalShares.add(proposal.sharesRequested);\r",
                "\r",
                "            // transfer tokens to guild bank\r",
                "            require(\r",
                "                approvedToken.transfer(address(guildBank), proposal.tokenTribute),\r",
                "                \"Moloch::processProposal - token transfer to guild bank failed\"\r",
                "            );\r",
                "\r",
                "        // PROPOSAL FAILED OR ABORTED\r",
                "        } else {\r",
                "            // return all tokens to the applicant\r",
                "            require(\r",
                "                approvedToken.transfer(proposal.applicant, proposal.tokenTribute),\r",
                "                \"Moloch::processProposal - failing vote token transfer failed\"\r",
                "            );\r",
                "        }\r",
                "\r",
                "        // send msg.sender the processingReward\r",
                "        require(\r",
                "            approvedToken.transfer(msg.sender, processingReward),\r",
                "            \"Moloch::processProposal - failed to send processing reward to msg.sender\"\r",
                "        );\r",
                "\r",
                "        // return deposit to proposer (subtract processing reward)\r",
                "        require(\r",
                "            approvedToken.transfer(proposal.proposer, proposalDeposit.sub(processingReward)),\r",
                "            \"Moloch::processProposal - failed to return proposal deposit to proposer\"\r",
                "        );\r",
                "\r",
                "        emit ProcessProposal(\r",
                "            proposalIndex,\r",
                "            proposal.applicant,\r",
                "            proposal.proposer,\r",
                "            proposal.tokenTribute,\r",
                "            proposal.sharesRequested,\r",
                "            didPass\r",
                "        );\r",
                "    }\r",
                "\r",
                "    function ragequit(uint256 sharesToBurn) public onlyMember {\r",
                "        uint256 initialTotalShares = totalShares;\r",
                "\r",
                "        Member storage member = members[msg.sender];\r",
                "\r",
                "        require(member.shares >= sharesToBurn, \"Moloch::ragequit - insufficient shares\");\r",
                "\r",
                "        require(canRagequit(member.highestIndexYesVote), \"Moloch::ragequit - cant ragequit until highest index proposal member voted YES on is processed\");\r",
                "\r",
                "        // burn shares\r",
                "        member.shares = member.shares.sub(sharesToBurn);\r",
                "        totalShares = totalShares.sub(sharesToBurn);\r",
                "\r",
                "        // instruct guildBank to transfer fair share of tokens to the ragequitter\r",
                "        require(\r",
                "            guildBank.withdraw(msg.sender, sharesToBurn, initialTotalShares),\r",
                "            \"Moloch::ragequit - withdrawal of tokens from guildBank failed\"\r",
                "        );\r",
                "\r",
                "        emit Ragequit(msg.sender, sharesToBurn);\r",
                "    }\r",
                "\r",
                "    function abort(uint256 proposalIndex) public {\r",
                "        require(proposalIndex < proposalQueue.length, \"Moloch::abort - proposal does not exist\");\r",
                "        Proposal storage proposal = proposalQueue[proposalIndex];\r",
                "\r",
                "        require(msg.sender == proposal.applicant, \"Moloch::abort - msg.sender must be applicant\");\r",
                "        require(getCurrentPeriod() < proposal.startingPeriod.add(abortWindow), \"Moloch::abort - abort window must not have passed\");\r",
                "        require(!proposal.aborted, \"Moloch::abort - proposal must not have already been aborted\");\r",
                "\r",
                "        uint256 tokensToAbort = proposal.tokenTribute;\r",
                "        proposal.tokenTribute = 0;\r",
                "        proposal.aborted = true;\r",
                "\r",
                "        // return all tokens to the applicant\r",
                "        require(\r",
                "            approvedToken.transfer(proposal.applicant, tokensToAbort),\r",
                "            \"Moloch::processProposal - failed to return tribute to applicant\"\r",
                "        );\r",
                "\r",
                "        emit Abort(proposalIndex, msg.sender);\r",
                "    }\r",
                "\r",
                "    function updateDelegateKey(address newDelegateKey) public onlyMember {\r",
                "        require(newDelegateKey != address(0), \"Moloch::updateDelegateKey - newDelegateKey cannot be 0\");\r",
                "\r",
                "        // skip checks if member is setting the delegate key to their member address\r",
                "        if (newDelegateKey != msg.sender) {\r",
                "            require(!members[newDelegateKey].exists, \"Moloch::updateDelegateKey - cant overwrite existing members\");\r",
                "            require(!members[memberAddressByDelegateKey[newDelegateKey]].exists, \"Moloch::updateDelegateKey - cant overwrite existing delegate keys\");\r",
                "        }\r",
                "\r",
                "        Member storage member = members[msg.sender];\r",
                "        memberAddressByDelegateKey[member.delegateKey] = address(0);\r",
                "        memberAddressByDelegateKey[newDelegateKey] = msg.sender;\r",
                "        member.delegateKey = newDelegateKey;\r",
                "\r",
                "        emit UpdateDelegateKey(msg.sender, newDelegateKey);\r",
                "    }\r",
                "\r",
                "    /***************\r",
                "    GETTER FUNCTIONS\r",
                "    ***************/\r",
                "\r",
                "    function max(uint256 x, uint256 y) internal pure returns (uint256) {\r",
                "        return x >= y ? x : y;\r",
                "    }\r",
                "\r",
                "    function getCurrentPeriod() public view returns (uint256) {\r",
                "        return now.sub(summoningTime).div(periodDuration);\r",
                "    }\r",
                "\r",
                "    function getProposalQueueLength() public view returns (uint256) {\r",
                "        return proposalQueue.length;\r",
                "    }\r",
                "\r",
                "    // can only ragequit if the latest proposal you voted YES on has been processed\r",
                "    function canRagequit(uint256 highestIndexYesVote) public view returns (bool) {\r",
                "        require(highestIndexYesVote < proposalQueue.length, \"Moloch::canRagequit - proposal does not exist\");\r",
                "        return proposalQueue[highestIndexYesVote].processed;\r",
                "    }\r",
                "\r",
                "    function hasVotingPeriodExpired(uint256 startingPeriod) public view returns (bool) {\r",
                "        return getCurrentPeriod() >= startingPeriod.add(votingPeriodLength);\r",
                "    }\r",
                "\r",
                "    function getMemberProposalVote(address memberAddress, uint256 proposalIndex) public view returns (Vote) {\r",
                "        require(members[memberAddress].exists, \"Moloch::getMemberProposalVote - member doesn't exist\");\r",
                "        require(proposalIndex < proposalQueue.length, \"Moloch::getMemberProposalVote - proposal doesn't exist\");\r",
                "        return proposalQueue[proposalIndex].votesByMember[memberAddress];\r",
                "    }\r",
                "}\r",
                "\r",
                "interface IERC20 {\r",
                "    function transfer(address to, uint256 value) external returns (bool);\r",
                "\r",
                "    function approve(address spender, uint256 value) external returns (bool);\r",
                "\r",
                "    function transferFrom(address from, address to, uint256 value) external returns (bool);\r",
                "\r",
                "    function totalSupply() external view returns (uint256);\r",
                "\r",
                "    function balanceOf(address who) external view returns (uint256);\r",
                "\r",
                "    function allowance(address owner, address spender) external view returns (uint256);\r",
                "\r",
                "    event Transfer(address indexed from, address indexed to, uint256 value);\r",
                "\r",
                "    event Approval(address indexed owner, address indexed spender, uint256 value);\r",
                "}\r",
                "\r",
                "contract Ownable {\r",
                "    address private _owner;\r",
                "\r",
                "    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);\r",
                "\r",
                "    /**\r",
                "     * @dev The Ownable constructor sets the original `owner` of the contract to the sender\r",
                "     * account.\r",
                "     */\r",
                "    constructor () internal {\r",
                "        _owner = msg.sender;\r",
                "        emit OwnershipTransferred(address(0), _owner);\r",
                "    }\r",
                "\r",
                "    /**\r",
                "     * @return the address of the owner.\r",
                "     */\r",
                "    function owner() public view returns (address) {\r",
                "        return _owner;\r",
                "    }\r",
                "\r",
                "    /**\r",
                "     * @dev Throws if called by any account other than the owner.\r",
                "     */\r",
                "    modifier onlyOwner() {\r",
                "        require(isOwner());\r",
                "        _;\r",
                "    }\r",
                "\r",
                "    /**\r",
                "     * @return true if `msg.sender` is the owner of the contract.\r",
                "     */\r",
                "    function isOwner() public view returns (bool) {\r",
                "        return msg.sender == _owner;\r",
                "    }\r",
                "\r",
                "    /**\r",
                "     * @dev Allows the current owner to relinquish control of the contract.\r",
                "     * @notice Renouncing to ownership will leave the contract without an owner.\r",
                "     * It will not be possible to call the functions with the `onlyOwner`\r",
                "     * modifier anymore.\r",
                "     */\r",
                "    function renounceOwnership() public onlyOwner {\r",
                "        emit OwnershipTransferred(_owner, address(0));\r",
                "        _owner = address(0);\r",
                "    }\r",
                "\r",
                "    /**\r",
                "     * @dev Allows the current owner to transfer control of the contract to a newOwner.\r",
                "     * @param newOwner The address to transfer ownership to.\r",
                "     */\r",
                "    function transferOwnership(address newOwner) public onlyOwner {\r",
                "        _transferOwnership(newOwner);\r",
                "    }\r",
                "\r",
                "    /**\r",
                "     * @dev Transfers control of the contract to a newOwner.\r",
                "     * @param newOwner The address to transfer ownership to.\r",
                "     */\r",
                "    function _transferOwnership(address newOwner) internal {\r",
                "        require(newOwner != address(0));\r",
                "        emit OwnershipTransferred(_owner, newOwner);\r",
                "        _owner = newOwner;\r",
                "    }\r",
                "}\r",
                "\r",
                "contract GuildBank is Ownable {\r",
                "    using SafeMath for uint256;\r",
                "\r",
                "    IERC20 public approvedToken; // approved token contract reference\r",
                "\r",
                "    event Withdrawal(address indexed receiver, uint256 amount);\r",
                "\r",
                "    constructor(address approvedTokenAddress) public {\r",
                "        approvedToken = IERC20(approvedTokenAddress);\r",
                "    }\r",
                "\r",
                "    function withdraw(address receiver, uint256 shares, uint256 totalShares) public onlyOwner returns (bool) {\r",
                "        uint256 amount = approvedToken.balanceOf(address(this)).mul(shares).div(totalShares);\r",
                "        emit Withdrawal(receiver, amount);\r",
                "        return approvedToken.transfer(receiver, amount);\r",
                "    }\r",
                "}\r",
                "\r",
                "library SafeMath {\r",
                "    /**\r",
                "     * @dev Multiplies two unsigned integers, reverts on overflow.\r",
                "     */\r",
                "    function mul(uint256 a, uint256 b) internal pure returns (uint256) {\r",
                "        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the\r",
                "        // benefit is lost if 'b' is also tested.\r",
                "        // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522\r",
                "        if (a == 0) {\r",
                "            return 0;\r",
                "        }\r",
                "\r",
                "        uint256 c = a * b;\r",
                "        require(c / a == b);\r",
                "\r",
                "        return c;\r",
                "    }\r",
                "\r",
                "    /**\r",
                "     * @dev Integer division of two unsigned integers truncating the quotient, reverts on division by zero.\r",
                "     */\r",
                "    function div(uint256 a, uint256 b) internal pure returns (uint256) {\r",
                "        // Solidity only automatically asserts when dividing by 0\r",
                "        require(b > 0);\r",
                "        uint256 c = a / b;\r",
                "        // assert(a == b * c + a % b); // There is no case in which this doesn't hold\r",
                "\r",
                "        return c;\r",
                "    }\r",
                "\r",
                "    /**\r",
                "     * @dev Subtracts two unsigned integers, reverts on overflow (i.e. if subtrahend is greater than minuend).\r",
                "     */\r",
                "    function sub(uint256 a, uint256 b) internal pure returns (uint256) {\r",
                "        require(b <= a);\r",
                "        uint256 c = a - b;\r",
                "\r",
                "        return c;\r",
                "    }\r",
                "\r",
                "    /**\r",
                "     * @dev Adds two unsigned integers, reverts on overflow.\r",
                "     */\r",
                "    function add(uint256 a, uint256 b) internal pure returns (uint256) {\r",
                "        uint256 c = a + b;\r",
                "        require(c >= a);\r",
                "\r",
                "        return c;\r",
                "    }\r",
                "\r",
                "    /**\r",
                "     * @dev Divides two unsigned integers and returns the remainder (unsigned integer modulo),\r",
                "     * reverts when dividing by zero.\r",
                "     */\r",
                "    function mod(uint256 a, uint256 b) internal pure returns (uint256) {\r",
                "        require(b != 0);\r",
                "        return a % b;\r",
                "    }\r",
                "}"
              ]
            }
          },
          "sourceRangesById": {
            "58": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 35,
                "column": 4
              },
              "to": {
                "line": 35,
                "column": 181
              }
            },
            "68": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 36,
                "column": 4
              },
              "to": {
                "line": 36,
                "column": 127
              }
            },
            "82": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 37,
                "column": 4
              },
              "to": {
                "line": 37,
                "column": 175
              }
            },
            "88": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 38,
                "column": 4
              },
              "to": {
                "line": 38,
                "column": 71
              }
            },
            "94": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 39,
                "column": 4
              },
              "to": {
                "line": 39,
                "column": 72
              }
            },
            "100": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 40,
                "column": 4
              },
              "to": {
                "line": 40,
                "column": 82
              }
            },
            "106": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 41,
                "column": 4
              },
              "to": {
                "line": 41,
                "column": 66
              }
            },
            "116": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 49,
                "column": 4
              },
              "to": {
                "line": 53,
                "column": 4
              }
            },
            "125": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 55,
                "column": 4
              },
              "to": {
                "line": 60,
                "column": 4
              }
            },
            "154": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 62,
                "column": 4
              },
              "to": {
                "line": 76,
                "column": 4
              }
            },
            "1272": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 6,
                "column": 0
              },
              "to": {
                "line": 413,
                "column": 0
              }
            },
            "1330": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 428,
                "column": 4
              },
              "to": {
                "line": 428,
                "column": 75
              }
            },
            "1338": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 430,
                "column": 4
              },
              "to": {
                "line": 430,
                "column": 81
              }
            },
            "1339": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 415,
                "column": 0
              },
              "to": {
                "line": 431,
                "column": 0
              }
            },
            "1347": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 436,
                "column": 4
              },
              "to": {
                "line": 436,
                "column": 87
              }
            },
            "1446": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 433,
                "column": 0
              },
              "to": {
                "line": 497,
                "column": 0
              }
            },
            "1459": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 504,
                "column": 4
              },
              "to": {
                "line": 504,
                "column": 62
              }
            },
            "1512": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 499,
                "column": 0
              },
              "to": {
                "line": 515,
                "column": 0
              }
            },
            "1638": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 517,
                "column": 0
              },
              "to": {
                "line": 575,
                "column": 0
              }
            }
          }
        }
      }
    },
    "desc": "MolochDao Rage quit"
  },
  {
    "tx": {
      "kind": "message",
      "class": {
        "typeClass": "contract",
        "kind": "native",
        "id": "shimmedcompilationNumber(0):317",
        "typeName": "UpgradableProxy",
        "contractKind": "contract",
        "payable": true
      },
      "abi": {
        "stateMutability": "payable",
        "type": "fallback"
      },
      "data": "0x4faa8a260000000000000000000000001843b97aa4f16b5ed64069c0c956a455b24faacb",
      "decodingMode": "full"
    },
    "definitions": {
      "compilationsById": {
        "shimmedcompilationNumber(0)": {
          "sourcesById": {
            "0": {
              "language": "Solidity",
              "lines": [
                "/**",
                " *Submitted for verification at Etherscan.io on 20XX-XX-XX",
                "*/",
                "",
                "// File: contracts/common/Proxy/IERCProxy.sol\r",
                "\r",
                "pragma solidity 0.6.6;\r",
                "\r",
                "interface IERCProxy {\r",
                "    function proxyType() external pure returns (uint256 proxyTypeId);\r",
                "\r",
                "    function implementation() external view returns (address codeAddr);\r",
                "}\r",
                "\r",
                "// File: contracts/common/Proxy/Proxy.sol\r",
                "\r",
                "pragma solidity 0.6.6;\r",
                "\r",
                "\r",
                "abstract contract Proxy is IERCProxy {\r",
                "    function delegatedFwd(address _dst, bytes memory _calldata) internal {\r",
                "        // solium-disable-next-line security/no-inline-assembly\r",
                "        assembly {\r",
                "            let result := delegatecall(\r",
                "                sub(gas(), 10000),\r",
                "                _dst,\r",
                "                add(_calldata, 0x20),\r",
                "                mload(_calldata),\r",
                "                0,\r",
                "                0\r",
                "            )\r",
                "            let size := returndatasize()\r",
                "\r",
                "            let ptr := mload(0x40)\r",
                "            returndatacopy(ptr, 0, size)\r",
                "\r",
                "            // revert instead of invalid() bc if the underlying call failed with invalid() it already wasted gas.\r",
                "            // if the call returned error data, forward it\r",
                "            switch result\r",
                "                case 0 {\r",
                "                    revert(ptr, size)\r",
                "                }\r",
                "                default {\r",
                "                    return(ptr, size)\r",
                "                }\r",
                "        }\r",
                "    }\r",
                "\r",
                "    function proxyType() external virtual override pure returns (uint256 proxyTypeId) {\r",
                "        // Upgradeable proxy\r",
                "        proxyTypeId = 2;\r",
                "    }\r",
                "\r",
                "    function implementation() external virtual override view returns (address);\r",
                "}\r",
                "\r",
                "// File: contracts/common/Proxy/UpgradableProxy.sol\r",
                "\r",
                "pragma solidity 0.6.6;\r",
                "\r",
                "\r",
                "contract UpgradableProxy is Proxy {\r",
                "    event ProxyUpdated(address indexed _new, address indexed _old);\r",
                "    event ProxyOwnerUpdate(address _new, address _old);\r",
                "\r",
                "    bytes32 constant IMPLEMENTATION_SLOT = keccak256(\"matic.network.proxy.implementation\");\r",
                "    bytes32 constant OWNER_SLOT = keccak256(\"matic.network.proxy.owner\");\r",
                "\r",
                "    constructor(address _proxyTo) public {\r",
                "        setProxyOwner(msg.sender);\r",
                "        setImplementation(_proxyTo);\r",
                "    }\r",
                "\r",
                "    fallback() external payable {\r",
                "        delegatedFwd(loadImplementation(), msg.data);\r",
                "    }\r",
                "\r",
                "    receive() external payable {\r",
                "        delegatedFwd(loadImplementation(), msg.data);\r",
                "    }\r",
                "\r",
                "    modifier onlyProxyOwner() {\r",
                "        require(loadProxyOwner() == msg.sender, \"NOT_OWNER\");\r",
                "        _;\r",
                "    }\r",
                "\r",
                "    function proxyOwner() external view returns(address) {\r",
                "        return loadProxyOwner();\r",
                "    }\r",
                "\r",
                "    function loadProxyOwner() internal view returns(address) {\r",
                "        address _owner;\r",
                "        bytes32 position = OWNER_SLOT;\r",
                "        assembly {\r",
                "            _owner := sload(position)\r",
                "        }\r",
                "        return _owner;\r",
                "    }\r",
                "\r",
                "    function implementation() external override view returns (address) {\r",
                "        return loadImplementation();\r",
                "    }\r",
                "\r",
                "    function loadImplementation() internal view returns(address) {\r",
                "        address _impl;\r",
                "        bytes32 position = IMPLEMENTATION_SLOT;\r",
                "        assembly {\r",
                "            _impl := sload(position)\r",
                "        }\r",
                "        return _impl;\r",
                "    }\r",
                "\r",
                "    function transferProxyOwnership(address newOwner) public onlyProxyOwner {\r",
                "        require(newOwner != address(0), \"ZERO_ADDRESS\");\r",
                "        emit ProxyOwnerUpdate(newOwner, loadProxyOwner());\r",
                "        setProxyOwner(newOwner);\r",
                "    }\r",
                "\r",
                "    function setProxyOwner(address newOwner) private {\r",
                "        bytes32 position = OWNER_SLOT;\r",
                "        assembly {\r",
                "            sstore(position, newOwner)\r",
                "        }\r",
                "    }\r",
                "\r",
                "    function updateImplementation(address _newProxyTo) public onlyProxyOwner {\r",
                "        require(_newProxyTo != address(0x0), \"INVALID_PROXY_ADDRESS\");\r",
                "        require(isContract(_newProxyTo), \"DESTINATION_ADDRESS_IS_NOT_A_CONTRACT\");\r",
                "\r",
                "        emit ProxyUpdated(_newProxyTo, loadImplementation());\r",
                "        \r",
                "        setImplementation(_newProxyTo);\r",
                "    }\r",
                "\r",
                "    function updateAndCall(address _newProxyTo, bytes memory data) payable public onlyProxyOwner {\r",
                "        updateImplementation(_newProxyTo);\r",
                "\r",
                "        (bool success, bytes memory returnData) = address(this).call{value: msg.value}(data);\r",
                "        require(success, string(returnData));\r",
                "    }\r",
                "\r",
                "    function setImplementation(address _newProxyTo) private {\r",
                "        bytes32 position = IMPLEMENTATION_SLOT;\r",
                "        assembly {\r",
                "            sstore(position, _newProxyTo)\r",
                "        }\r",
                "    }\r",
                "    \r",
                "    function isContract(address _target) internal view returns (bool) {\r",
                "        if (_target == address(0)) {\r",
                "            return false;\r",
                "        }\r",
                "\r",
                "        uint256 size;\r",
                "        assembly {\r",
                "            size := extcodesize(_target)\r",
                "        }\r",
                "        return size > 0;\r",
                "    }\r",
                "}\r",
                "\r",
                "// File: contracts/root/RootChainManager/RootChainManagerProxy.sol\r",
                "\r",
                "pragma solidity 0.6.6;\r",
                "\r",
                "\r",
                "contract RootChainManagerProxy is UpgradableProxy {\r",
                "    constructor(address _proxyTo)\r",
                "        public\r",
                "        UpgradableProxy(_proxyTo)\r",
                "    {}\r",
                "}"
              ]
            }
          },
          "sourceRangesById": {
            "12": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 8,
                "column": 0
              },
              "to": {
                "line": 12,
                "column": 0
              }
            },
            "42": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 19,
                "column": 0
              },
              "to": {
                "line": 54,
                "column": 0
              }
            },
            "51": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 62,
                "column": 4
              },
              "to": {
                "line": 62,
                "column": 66
              }
            },
            "57": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 63,
                "column": 4
              },
              "to": {
                "line": 63,
                "column": 54
              }
            },
            "317": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 61,
                "column": 0
              },
              "to": {
                "line": 159,
                "column": 0
              }
            },
            "330": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 166,
                "column": 0
              },
              "to": {
                "line": 171,
                "column": 0
              }
            }
          }
        }
      }
    },
    "desc": "Polygon deposit"
  },
  {
    "tx": {
      "kind": "function",
      "class": {
        "typeClass": "contract",
        "kind": "native",
        "id": "shimmedcompilationNumber(0):1970",
        "typeName": "SwapRouter",
        "contractKind": "contract",
        "payable": true
      },
      "abi": {
        "inputs": [
          {
            "components": [
              {
                "internalType": "address",
                "name": "tokenIn",
                "type": "address"
              },
              {
                "internalType": "address",
                "name": "tokenOut",
                "type": "address"
              },
              {
                "internalType": "uint24",
                "name": "fee",
                "type": "uint24"
              },
              {
                "internalType": "address",
                "name": "recipient",
                "type": "address"
              },
              {
                "internalType": "uint256",
                "name": "deadline",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "amountIn",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "amountOutMinimum",
                "type": "uint256"
              },
              {
                "internalType": "uint160",
                "name": "sqrtPriceLimitX96",
                "type": "uint160"
              }
            ],
            "internalType": "struct ISwapRouter.ExactInputSingleParams",
            "name": "params",
            "type": "tuple"
          }
        ],
        "name": "exactInputSingle",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "amountOut",
            "type": "uint256"
          }
        ],
        "stateMutability": "payable",
        "type": "function"
      },
      "arguments": [
        {
          "name": "params",
          "value": {
            "type": {
              "typeClass": "struct",
              "kind": "local",
              "id": "shimmedcompilationNumber(0):2860",
              "typeName": "ExactInputSingleParams",
              "definingContractName": "ISwapRouter",
              "location": "calldata"
            },
            "kind": "value",
            "value": [
              {
                "name": "tokenIn",
                "value": {
                  "type": {
                    "typeClass": "address",
                    "kind": "general",
                    "typeHint": "address"
                  },
                  "kind": "value",
                  "value": {
                    "asAddress": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
                    "rawAsHex": "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
                  }
                }
              },
              {
                "name": "tokenOut",
                "value": {
                  "type": {
                    "typeClass": "address",
                    "kind": "general",
                    "typeHint": "address"
                  },
                  "kind": "value",
                  "value": {
                    "asAddress": "0xDe30da39c46104798bB5aA3fe8B9e0e1F348163F",
                    "rawAsHex": "0x000000000000000000000000de30da39c46104798bb5aa3fe8b9e0e1f348163f"
                  }
                }
              },
              {
                "name": "fee",
                "value": {
                  "type": {
                    "typeClass": "uint",
                    "bits": 24,
                    "typeHint": "uint24"
                  },
                  "kind": "value",
                  "value": {
                    "asString": "3000",
                    "rawAsString": "3000"
                  }
                }
              },
              {
                "name": "recipient",
                "value": {
                  "type": {
                    "typeClass": "address",
                    "kind": "general",
                    "typeHint": "address"
                  },
                  "kind": "value",
                  "value": {
                    "asAddress": "0xEB0d7e41840066F834eeAd0A22242E2A3A0c8108",
                    "rawAsHex": "0x000000000000000000000000eb0d7e41840066f834eead0a22242e2a3a0c8108"
                  }
                }
              },
              {
                "name": "deadline",
                "value": {
                  "type": {
                    "typeClass": "uint",
                    "bits": 256,
                    "typeHint": "uint256"
                  },
                  "kind": "value",
                  "value": {
                    "asString": "1623295758",
                    "rawAsString": "1623295758"
                  }
                }
              },
              {
                "name": "amountIn",
                "value": {
                  "type": {
                    "typeClass": "uint",
                    "bits": 256,
                    "typeHint": "uint256"
                  },
                  "kind": "value",
                  "value": {
                    "asString": "947761864335456327",
                    "rawAsString": "947761864335456327"
                  }
                }
              },
              {
                "name": "amountOutMinimum",
                "value": {
                  "type": {
                    "typeClass": "uint",
                    "bits": 256,
                    "typeHint": "uint256"
                  },
                  "kind": "value",
                  "value": {
                    "asString": "247249836670459470768",
                    "rawAsString": "247249836670459470768"
                  }
                }
              },
              {
                "name": "sqrtPriceLimitX96",
                "value": {
                  "type": {
                    "typeClass": "uint",
                    "bits": 160,
                    "typeHint": "uint160"
                  },
                  "kind": "value",
                  "value": {
                    "asString": "0",
                    "rawAsString": "0"
                  }
                }
              }
            ]
          }
        }
      ],
      "selector": "0x414bf389",
      "decodingMode": "full"
    },
    "definitions": {
      "compilationsById": {
        "shimmedcompilationNumber(0)": {
          "sourcesById": {
            "0": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: MIT",
                "",
                "pragma solidity >=0.6.0 <0.8.0;",
                "",
                "/**",
                " * @dev Interface of the ERC20 Permit extension allowing approvals to be made via signatures, as defined in",
                " * https://eips.ethereum.org/EIPS/eip-2612[EIP-2612].",
                " *",
                " * Adds the {permit} method, which can be used to change an account's ERC20 allowance (see {IERC20-allowance}) by",
                " * presenting a message signed by the account. By not relying on `{IERC20-approve}`, the token holder account doesn't",
                " * need to send a transaction, and thus is not required to hold Ether at all.",
                " */",
                "interface IERC20Permit {",
                "    /**",
                "     * @dev Sets `value` as the allowance of `spender` over `owner`'s tokens,",
                "     * given `owner`'s signed approval.",
                "     *",
                "     * IMPORTANT: The same issues {IERC20-approve} has related to transaction",
                "     * ordering also apply here.",
                "     *",
                "     * Emits an {Approval} event.",
                "     *",
                "     * Requirements:",
                "     *",
                "     * - `spender` cannot be the zero address.",
                "     * - `deadline` must be a timestamp in the future.",
                "     * - `v`, `r` and `s` must be a valid `secp256k1` signature from `owner`",
                "     * over the EIP712-formatted function arguments.",
                "     * - the signature must use ``owner``'s current nonce (see {nonces}).",
                "     *",
                "     * For more information on the signature format, see the",
                "     * https://eips.ethereum.org/EIPS/eip-2612#specification[relevant EIP",
                "     * section].",
                "     */",
                "    function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external;",
                "",
                "    /**",
                "     * @dev Returns the current nonce for `owner`. This value must be",
                "     * included whenever a signature is generated for {permit}.",
                "     *",
                "     * Every successful call to {permit} increases ``owner``'s nonce by one. This",
                "     * prevents a signature from being used multiple times.",
                "     */",
                "    function nonces(address owner) external view returns (uint256);",
                "",
                "    /**",
                "     * @dev Returns the domain separator used in the encoding of the signature for `permit`, as defined by {EIP712}.",
                "     */",
                "    // solhint-disable-next-line func-name-mixedcase",
                "    function DOMAIN_SEPARATOR() external view returns (bytes32);",
                "}",
                ""
              ]
            },
            "1": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: MIT",
                "",
                "pragma solidity ^0.7.0;",
                "",
                "/**",
                " * @dev Interface of the ERC20 standard as defined in the EIP.",
                " */",
                "interface IERC20 {",
                "    /**",
                "     * @dev Returns the amount of tokens in existence.",
                "     */",
                "    function totalSupply() external view returns (uint256);",
                "",
                "    /**",
                "     * @dev Returns the amount of tokens owned by `account`.",
                "     */",
                "    function balanceOf(address account) external view returns (uint256);",
                "",
                "    /**",
                "     * @dev Moves `amount` tokens from the caller's account to `recipient`.",
                "     *",
                "     * Returns a boolean value indicating whether the operation succeeded.",
                "     *",
                "     * Emits a {Transfer} event.",
                "     */",
                "    function transfer(address recipient, uint256 amount) external returns (bool);",
                "",
                "    /**",
                "     * @dev Returns the remaining number of tokens that `spender` will be",
                "     * allowed to spend on behalf of `owner` through {transferFrom}. This is",
                "     * zero by default.",
                "     *",
                "     * This value changes when {approve} or {transferFrom} are called.",
                "     */",
                "    function allowance(address owner, address spender) external view returns (uint256);",
                "",
                "    /**",
                "     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.",
                "     *",
                "     * Returns a boolean value indicating whether the operation succeeded.",
                "     *",
                "     * IMPORTANT: Beware that changing an allowance with this method brings the risk",
                "     * that someone may use both the old and the new allowance by unfortunate",
                "     * transaction ordering. One possible solution to mitigate this race",
                "     * condition is to first reduce the spender's allowance to 0 and set the",
                "     * desired value afterwards:",
                "     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729",
                "     *",
                "     * Emits an {Approval} event.",
                "     */",
                "    function approve(address spender, uint256 amount) external returns (bool);",
                "",
                "    /**",
                "     * @dev Moves `amount` tokens from `sender` to `recipient` using the",
                "     * allowance mechanism. `amount` is then deducted from the caller's",
                "     * allowance.",
                "     *",
                "     * Returns a boolean value indicating whether the operation succeeded.",
                "     *",
                "     * Emits a {Transfer} event.",
                "     */",
                "    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);",
                "",
                "    /**",
                "     * @dev Emitted when `value` tokens are moved from one account (`from`) to",
                "     * another (`to`).",
                "     *",
                "     * Note that `value` may be zero.",
                "     */",
                "    event Transfer(address indexed from, address indexed to, uint256 value);",
                "",
                "    /**",
                "     * @dev Emitted when the allowance of a `spender` for an `owner` is set by",
                "     * a call to {approve}. `value` is the new allowance.",
                "     */",
                "    event Approval(address indexed owner, address indexed spender, uint256 value);",
                "}",
                ""
              ]
            },
            "2": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity >=0.5.0;",
                "",
                "import './pool/IUniswapV3PoolImmutables.sol';",
                "import './pool/IUniswapV3PoolState.sol';",
                "import './pool/IUniswapV3PoolDerivedState.sol';",
                "import './pool/IUniswapV3PoolActions.sol';",
                "import './pool/IUniswapV3PoolOwnerActions.sol';",
                "import './pool/IUniswapV3PoolEvents.sol';",
                "",
                "/// @title The interface for a Uniswap V3 Pool",
                "/// @notice A Uniswap pool facilitates swapping and automated market making between any two assets that strictly conform",
                "/// to the ERC20 specification",
                "/// @dev The pool interface is broken up into many smaller pieces",
                "interface IUniswapV3Pool is",
                "    IUniswapV3PoolImmutables,",
                "    IUniswapV3PoolState,",
                "    IUniswapV3PoolDerivedState,",
                "    IUniswapV3PoolActions,",
                "    IUniswapV3PoolOwnerActions,",
                "    IUniswapV3PoolEvents",
                "{",
                "",
                "}",
                ""
              ]
            },
            "3": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity >=0.5.0;",
                "",
                "/// @title Callback for IUniswapV3PoolActions#swap",
                "/// @notice Any contract that calls IUniswapV3PoolActions#swap must implement this interface",
                "interface IUniswapV3SwapCallback {",
                "    /// @notice Called to `msg.sender` after executing a swap via IUniswapV3Pool#swap.",
                "    /// @dev In the implementation you must pay the pool tokens owed for the swap.",
                "    /// The caller of this method must be checked to be a UniswapV3Pool deployed by the canonical UniswapV3Factory.",
                "    /// amount0Delta and amount1Delta can both be 0 if no tokens were swapped.",
                "    /// @param amount0Delta The amount of token0 that was sent (negative) or must be received (positive) by the pool by",
                "    /// the end of the swap. If positive, the callback must send that amount of token0 to the pool.",
                "    /// @param amount1Delta The amount of token1 that was sent (negative) or must be received (positive) by the pool by",
                "    /// the end of the swap. If positive, the callback must send that amount of token1 to the pool.",
                "    /// @param data Any data passed through by the caller via the IUniswapV3PoolActions#swap call",
                "    function uniswapV3SwapCallback(",
                "        int256 amount0Delta,",
                "        int256 amount1Delta,",
                "        bytes calldata data",
                "    ) external;",
                "}",
                ""
              ]
            },
            "4": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity >=0.5.0;",
                "",
                "/// @title Permissionless pool actions",
                "/// @notice Contains pool methods that can be called by anyone",
                "interface IUniswapV3PoolActions {",
                "    /// @notice Sets the initial price for the pool",
                "    /// @dev Price is represented as a sqrt(amountToken1/amountToken0) Q64.96 value",
                "    /// @param sqrtPriceX96 the initial sqrt price of the pool as a Q64.96",
                "    function initialize(uint160 sqrtPriceX96) external;",
                "",
                "    /// @notice Adds liquidity for the given recipient/tickLower/tickUpper position",
                "    /// @dev The caller of this method receives a callback in the form of IUniswapV3MintCallback#uniswapV3MintCallback",
                "    /// in which they must pay any token0 or token1 owed for the liquidity. The amount of token0/token1 due depends",
                "    /// on tickLower, tickUpper, the amount of liquidity, and the current price.",
                "    /// @param recipient The address for which the liquidity will be created",
                "    /// @param tickLower The lower tick of the position in which to add liquidity",
                "    /// @param tickUpper The upper tick of the position in which to add liquidity",
                "    /// @param amount The amount of liquidity to mint",
                "    /// @param data Any data that should be passed through to the callback",
                "    /// @return amount0 The amount of token0 that was paid to mint the given amount of liquidity. Matches the value in the callback",
                "    /// @return amount1 The amount of token1 that was paid to mint the given amount of liquidity. Matches the value in the callback",
                "    function mint(",
                "        address recipient,",
                "        int24 tickLower,",
                "        int24 tickUpper,",
                "        uint128 amount,",
                "        bytes calldata data",
                "    ) external returns (uint256 amount0, uint256 amount1);",
                "",
                "    /// @notice Collects tokens owed to a position",
                "    /// @dev Does not recompute fees earned, which must be done either via mint or burn of any amount of liquidity.",
                "    /// Collect must be called by the position owner. To withdraw only token0 or only token1, amount0Requested or",
                "    /// amount1Requested may be set to zero. To withdraw all tokens owed, caller may pass any value greater than the",
                "    /// actual tokens owed, e.g. type(uint128).max. Tokens owed may be from accumulated swap fees or burned liquidity.",
                "    /// @param recipient The address which should receive the fees collected",
                "    /// @param tickLower The lower tick of the position for which to collect fees",
                "    /// @param tickUpper The upper tick of the position for which to collect fees",
                "    /// @param amount0Requested How much token0 should be withdrawn from the fees owed",
                "    /// @param amount1Requested How much token1 should be withdrawn from the fees owed",
                "    /// @return amount0 The amount of fees collected in token0",
                "    /// @return amount1 The amount of fees collected in token1",
                "    function collect(",
                "        address recipient,",
                "        int24 tickLower,",
                "        int24 tickUpper,",
                "        uint128 amount0Requested,",
                "        uint128 amount1Requested",
                "    ) external returns (uint128 amount0, uint128 amount1);",
                "",
                "    /// @notice Burn liquidity from the sender and account tokens owed for the liquidity to the position",
                "    /// @dev Can be used to trigger a recalculation of fees owed to a position by calling with an amount of 0",
                "    /// @dev Fees must be collected separately via a call to #collect",
                "    /// @param tickLower The lower tick of the position for which to burn liquidity",
                "    /// @param tickUpper The upper tick of the position for which to burn liquidity",
                "    /// @param amount How much liquidity to burn",
                "    /// @return amount0 The amount of token0 sent to the recipient",
                "    /// @return amount1 The amount of token1 sent to the recipient",
                "    function burn(",
                "        int24 tickLower,",
                "        int24 tickUpper,",
                "        uint128 amount",
                "    ) external returns (uint256 amount0, uint256 amount1);",
                "",
                "    /// @notice Swap token0 for token1, or token1 for token0",
                "    /// @dev The caller of this method receives a callback in the form of IUniswapV3SwapCallback#uniswapV3SwapCallback",
                "    /// @param recipient The address to receive the output of the swap",
                "    /// @param zeroForOne The direction of the swap, true for token0 to token1, false for token1 to token0",
                "    /// @param amountSpecified The amount of the swap, which implicitly configures the swap as exact input (positive), or exact output (negative)",
                "    /// @param sqrtPriceLimitX96 The Q64.96 sqrt price limit. If zero for one, the price cannot be less than this",
                "    /// value after the swap. If one for zero, the price cannot be greater than this value after the swap",
                "    /// @param data Any data to be passed through to the callback",
                "    /// @return amount0 The delta of the balance of token0 of the pool, exact when negative, minimum when positive",
                "    /// @return amount1 The delta of the balance of token1 of the pool, exact when negative, minimum when positive",
                "    function swap(",
                "        address recipient,",
                "        bool zeroForOne,",
                "        int256 amountSpecified,",
                "        uint160 sqrtPriceLimitX96,",
                "        bytes calldata data",
                "    ) external returns (int256 amount0, int256 amount1);",
                "",
                "    /// @notice Receive token0 and/or token1 and pay it back, plus a fee, in the callback",
                "    /// @dev The caller of this method receives a callback in the form of IUniswapV3FlashCallback#uniswapV3FlashCallback",
                "    /// @dev Can be used to donate underlying tokens pro-rata to currently in-range liquidity providers by calling",
                "    /// with 0 amount{0,1} and sending the donation amount(s) from the callback",
                "    /// @param recipient The address which will receive the token0 and token1 amounts",
                "    /// @param amount0 The amount of token0 to send",
                "    /// @param amount1 The amount of token1 to send",
                "    /// @param data Any data to be passed through to the callback",
                "    function flash(",
                "        address recipient,",
                "        uint256 amount0,",
                "        uint256 amount1,",
                "        bytes calldata data",
                "    ) external;",
                "",
                "    /// @notice Increase the maximum number of price and liquidity observations that this pool will store",
                "    /// @dev This method is no-op if the pool already has an observationCardinalityNext greater than or equal to",
                "    /// the input observationCardinalityNext.",
                "    /// @param observationCardinalityNext The desired minimum number of observations for the pool to store",
                "    function increaseObservationCardinalityNext(uint16 observationCardinalityNext) external;",
                "}",
                ""
              ]
            },
            "5": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity >=0.5.0;",
                "",
                "/// @title Pool state that is not stored",
                "/// @notice Contains view functions to provide information about the pool that is computed rather than stored on the",
                "/// blockchain. The functions here may have variable gas costs.",
                "interface IUniswapV3PoolDerivedState {",
                "    /// @notice Returns the cumulative tick and liquidity as of each timestamp `secondsAgo` from the current block timestamp",
                "    /// @dev To get a time weighted average tick or liquidity-in-range, you must call this with two values, one representing",
                "    /// the beginning of the period and another for the end of the period. E.g., to get the last hour time-weighted average tick,",
                "    /// you must call it with secondsAgos = [3600, 0].",
                "    /// @dev The time weighted average tick represents the geometric time weighted average price of the pool, in",
                "    /// log base sqrt(1.0001) of token1 / token0. The TickMath library can be used to go from a tick value to a ratio.",
                "    /// @param secondsAgos From how long ago each cumulative tick and liquidity value should be returned",
                "    /// @return tickCumulatives Cumulative tick values as of each `secondsAgos` from the current block timestamp",
                "    /// @return secondsPerLiquidityCumulativeX128s Cumulative seconds per liquidity-in-range value as of each `secondsAgos` from the current block",
                "    /// timestamp",
                "    function observe(uint32[] calldata secondsAgos)",
                "        external",
                "        view",
                "        returns (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s);",
                "",
                "    /// @notice Returns a snapshot of the tick cumulative, seconds per liquidity and seconds inside a tick range",
                "    /// @dev Snapshots must only be compared to other snapshots, taken over a period for which a position existed.",
                "    /// I.e., snapshots cannot be compared if a position is not held for the entire period between when the first",
                "    /// snapshot is taken and the second snapshot is taken.",
                "    /// @param tickLower The lower tick of the range",
                "    /// @param tickUpper The upper tick of the range",
                "    /// @return tickCumulativeInside The snapshot of the tick accumulator for the range",
                "    /// @return secondsPerLiquidityInsideX128 The snapshot of seconds per liquidity for the range",
                "    /// @return secondsInside The snapshot of seconds per liquidity for the range",
                "    function snapshotCumulativesInside(int24 tickLower, int24 tickUpper)",
                "        external",
                "        view",
                "        returns (",
                "            int56 tickCumulativeInside,",
                "            uint160 secondsPerLiquidityInsideX128,",
                "            uint32 secondsInside",
                "        );",
                "}",
                ""
              ]
            },
            "6": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity >=0.5.0;",
                "",
                "/// @title Events emitted by a pool",
                "/// @notice Contains all events emitted by the pool",
                "interface IUniswapV3PoolEvents {",
                "    /// @notice Emitted exactly once by a pool when #initialize is first called on the pool",
                "    /// @dev Mint/Burn/Swap cannot be emitted by the pool before Initialize",
                "    /// @param sqrtPriceX96 The initial sqrt price of the pool, as a Q64.96",
                "    /// @param tick The initial tick of the pool, i.e. log base 1.0001 of the starting price of the pool",
                "    event Initialize(uint160 sqrtPriceX96, int24 tick);",
                "",
                "    /// @notice Emitted when liquidity is minted for a given position",
                "    /// @param sender The address that minted the liquidity",
                "    /// @param owner The owner of the position and recipient of any minted liquidity",
                "    /// @param tickLower The lower tick of the position",
                "    /// @param tickUpper The upper tick of the position",
                "    /// @param amount The amount of liquidity minted to the position range",
                "    /// @param amount0 How much token0 was required for the minted liquidity",
                "    /// @param amount1 How much token1 was required for the minted liquidity",
                "    event Mint(",
                "        address sender,",
                "        address indexed owner,",
                "        int24 indexed tickLower,",
                "        int24 indexed tickUpper,",
                "        uint128 amount,",
                "        uint256 amount0,",
                "        uint256 amount1",
                "    );",
                "",
                "    /// @notice Emitted when fees are collected by the owner of a position",
                "    /// @dev Collect events may be emitted with zero amount0 and amount1 when the caller chooses not to collect fees",
                "    /// @param owner The owner of the position for which fees are collected",
                "    /// @param tickLower The lower tick of the position",
                "    /// @param tickUpper The upper tick of the position",
                "    /// @param amount0 The amount of token0 fees collected",
                "    /// @param amount1 The amount of token1 fees collected",
                "    event Collect(",
                "        address indexed owner,",
                "        address recipient,",
                "        int24 indexed tickLower,",
                "        int24 indexed tickUpper,",
                "        uint128 amount0,",
                "        uint128 amount1",
                "    );",
                "",
                "    /// @notice Emitted when a position's liquidity is removed",
                "    /// @dev Does not withdraw any fees earned by the liquidity position, which must be withdrawn via #collect",
                "    /// @param owner The owner of the position for which liquidity is removed",
                "    /// @param tickLower The lower tick of the position",
                "    /// @param tickUpper The upper tick of the position",
                "    /// @param amount The amount of liquidity to remove",
                "    /// @param amount0 The amount of token0 withdrawn",
                "    /// @param amount1 The amount of token1 withdrawn",
                "    event Burn(",
                "        address indexed owner,",
                "        int24 indexed tickLower,",
                "        int24 indexed tickUpper,",
                "        uint128 amount,",
                "        uint256 amount0,",
                "        uint256 amount1",
                "    );",
                "",
                "    /// @notice Emitted by the pool for any swaps between token0 and token1",
                "    /// @param sender The address that initiated the swap call, and that received the callback",
                "    /// @param recipient The address that received the output of the swap",
                "    /// @param amount0 The delta of the token0 balance of the pool",
                "    /// @param amount1 The delta of the token1 balance of the pool",
                "    /// @param sqrtPriceX96 The sqrt(price) of the pool after the swap, as a Q64.96",
                "    /// @param liquidity The liquidity of the pool after the swap",
                "    /// @param tick The log base 1.0001 of price of the pool after the swap",
                "    event Swap(",
                "        address indexed sender,",
                "        address indexed recipient,",
                "        int256 amount0,",
                "        int256 amount1,",
                "        uint160 sqrtPriceX96,",
                "        uint128 liquidity,",
                "        int24 tick",
                "    );",
                "",
                "    /// @notice Emitted by the pool for any flashes of token0/token1",
                "    /// @param sender The address that initiated the swap call, and that received the callback",
                "    /// @param recipient The address that received the tokens from flash",
                "    /// @param amount0 The amount of token0 that was flashed",
                "    /// @param amount1 The amount of token1 that was flashed",
                "    /// @param paid0 The amount of token0 paid for the flash, which can exceed the amount0 plus the fee",
                "    /// @param paid1 The amount of token1 paid for the flash, which can exceed the amount1 plus the fee",
                "    event Flash(",
                "        address indexed sender,",
                "        address indexed recipient,",
                "        uint256 amount0,",
                "        uint256 amount1,",
                "        uint256 paid0,",
                "        uint256 paid1",
                "    );",
                "",
                "    /// @notice Emitted by the pool for increases to the number of observations that can be stored",
                "    /// @dev observationCardinalityNext is not the observation cardinality until an observation is written at the index",
                "    /// just before a mint/swap/burn.",
                "    /// @param observationCardinalityNextOld The previous value of the next observation cardinality",
                "    /// @param observationCardinalityNextNew The updated value of the next observation cardinality",
                "    event IncreaseObservationCardinalityNext(",
                "        uint16 observationCardinalityNextOld,",
                "        uint16 observationCardinalityNextNew",
                "    );",
                "",
                "    /// @notice Emitted when the protocol fee is changed by the pool",
                "    /// @param feeProtocol0Old The previous value of the token0 protocol fee",
                "    /// @param feeProtocol1Old The previous value of the token1 protocol fee",
                "    /// @param feeProtocol0New The updated value of the token0 protocol fee",
                "    /// @param feeProtocol1New The updated value of the token1 protocol fee",
                "    event SetFeeProtocol(uint8 feeProtocol0Old, uint8 feeProtocol1Old, uint8 feeProtocol0New, uint8 feeProtocol1New);",
                "",
                "    /// @notice Emitted when the collected protocol fees are withdrawn by the factory owner",
                "    /// @param sender The address that collects the protocol fees",
                "    /// @param recipient The address that receives the collected protocol fees",
                "    /// @param amount0 The amount of token0 protocol fees that is withdrawn",
                "    /// @param amount0 The amount of token1 protocol fees that is withdrawn",
                "    event CollectProtocol(address indexed sender, address indexed recipient, uint128 amount0, uint128 amount1);",
                "}",
                ""
              ]
            },
            "7": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity >=0.5.0;",
                "",
                "/// @title Pool state that never changes",
                "/// @notice These parameters are fixed for a pool forever, i.e., the methods will always return the same values",
                "interface IUniswapV3PoolImmutables {",
                "    /// @notice The contract that deployed the pool, which must adhere to the IUniswapV3Factory interface",
                "    /// @return The contract address",
                "    function factory() external view returns (address);",
                "",
                "    /// @notice The first of the two tokens of the pool, sorted by address",
                "    /// @return The token contract address",
                "    function token0() external view returns (address);",
                "",
                "    /// @notice The second of the two tokens of the pool, sorted by address",
                "    /// @return The token contract address",
                "    function token1() external view returns (address);",
                "",
                "    /// @notice The pool's fee in hundredths of a bip, i.e. 1e-6",
                "    /// @return The fee",
                "    function fee() external view returns (uint24);",
                "",
                "    /// @notice The pool tick spacing",
                "    /// @dev Ticks can only be used at multiples of this value, minimum of 1 and always positive",
                "    /// e.g.: a tickSpacing of 3 means ticks can be initialized every 3rd tick, i.e., ..., -6, -3, 0, 3, 6, ...",
                "    /// This value is an int24 to avoid casting even though it is always positive.",
                "    /// @return The tick spacing",
                "    function tickSpacing() external view returns (int24);",
                "",
                "    /// @notice The maximum amount of position liquidity that can use any tick in the range",
                "    /// @dev This parameter is enforced per tick to prevent liquidity from overflowing a uint128 at any point, and",
                "    /// also prevents out-of-range liquidity from being used to prevent adding in-range liquidity to a pool",
                "    /// @return The max amount of liquidity per tick",
                "    function maxLiquidityPerTick() external view returns (uint128);",
                "}",
                ""
              ]
            },
            "8": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity >=0.5.0;",
                "",
                "/// @title Permissioned pool actions",
                "/// @notice Contains pool methods that may only be called by the factory owner",
                "interface IUniswapV3PoolOwnerActions {",
                "    /// @notice Set the denominator of the protocol's % share of the fees",
                "    /// @param feeProtocol0 new protocol fee for token0 of the pool",
                "    /// @param feeProtocol1 new protocol fee for token1 of the pool",
                "    function setFeeProtocol(uint8 feeProtocol0, uint8 feeProtocol1) external;",
                "",
                "    /// @notice Collect the protocol fee accrued to the pool",
                "    /// @param recipient The address to which collected protocol fees should be sent",
                "    /// @param amount0Requested The maximum amount of token0 to send, can be 0 to collect fees in only token1",
                "    /// @param amount1Requested The maximum amount of token1 to send, can be 0 to collect fees in only token0",
                "    /// @return amount0 The protocol fee collected in token0",
                "    /// @return amount1 The protocol fee collected in token1",
                "    function collectProtocol(",
                "        address recipient,",
                "        uint128 amount0Requested,",
                "        uint128 amount1Requested",
                "    ) external returns (uint128 amount0, uint128 amount1);",
                "}",
                ""
              ]
            },
            "9": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity >=0.5.0;",
                "",
                "/// @title Pool state that can change",
                "/// @notice These methods compose the pool's state, and can change with any frequency including multiple times",
                "/// per transaction",
                "interface IUniswapV3PoolState {",
                "    /// @notice The 0th storage slot in the pool stores many values, and is exposed as a single method to save gas",
                "    /// when accessed externally.",
                "    /// @return sqrtPriceX96 The current price of the pool as a sqrt(token1/token0) Q64.96 value",
                "    /// tick The current tick of the pool, i.e. according to the last tick transition that was run.",
                "    /// This value may not always be equal to SqrtTickMath.getTickAtSqrtRatio(sqrtPriceX96) if the price is on a tick",
                "    /// boundary.",
                "    /// observationIndex The index of the last oracle observation that was written,",
                "    /// observationCardinality The current maximum number of observations stored in the pool,",
                "    /// observationCardinalityNext The next maximum number of observations, to be updated when the observation.",
                "    /// feeProtocol The protocol fee for both tokens of the pool.",
                "    /// Encoded as two 4 bit values, where the protocol fee of token1 is shifted 4 bits and the protocol fee of token0",
                "    /// is the lower 4 bits. Used as the denominator of a fraction of the swap fee, e.g. 4 means 1/4th of the swap fee.",
                "    /// unlocked Whether the pool is currently locked to reentrancy",
                "    function slot0()",
                "        external",
                "        view",
                "        returns (",
                "            uint160 sqrtPriceX96,",
                "            int24 tick,",
                "            uint16 observationIndex,",
                "            uint16 observationCardinality,",
                "            uint16 observationCardinalityNext,",
                "            uint8 feeProtocol,",
                "            bool unlocked",
                "        );",
                "",
                "    /// @notice The fee growth as a Q128.128 fees of token0 collected per unit of liquidity for the entire life of the pool",
                "    /// @dev This value can overflow the uint256",
                "    function feeGrowthGlobal0X128() external view returns (uint256);",
                "",
                "    /// @notice The fee growth as a Q128.128 fees of token1 collected per unit of liquidity for the entire life of the pool",
                "    /// @dev This value can overflow the uint256",
                "    function feeGrowthGlobal1X128() external view returns (uint256);",
                "",
                "    /// @notice The amounts of token0 and token1 that are owed to the protocol",
                "    /// @dev Protocol fees will never exceed uint128 max in either token",
                "    function protocolFees() external view returns (uint128 token0, uint128 token1);",
                "",
                "    /// @notice The currently in range liquidity available to the pool",
                "    /// @dev This value has no relationship to the total liquidity across all ticks",
                "    function liquidity() external view returns (uint128);",
                "",
                "    /// @notice Look up information about a specific tick in the pool",
                "    /// @param tick The tick to look up",
                "    /// @return liquidityGross the total amount of position liquidity that uses the pool either as tick lower or",
                "    /// tick upper,",
                "    /// liquidityNet how much liquidity changes when the pool price crosses the tick,",
                "    /// feeGrowthOutside0X128 the fee growth on the other side of the tick from the current tick in token0,",
                "    /// feeGrowthOutside1X128 the fee growth on the other side of the tick from the current tick in token1,",
                "    /// tickCumulativeOutside the cumulative tick value on the other side of the tick from the current tick",
                "    /// secondsPerLiquidityOutsideX128 the seconds spent per liquidity on the other side of the tick from the current tick,",
                "    /// secondsOutside the seconds spent on the other side of the tick from the current tick,",
                "    /// initialized Set to true if the tick is initialized, i.e. liquidityGross is greater than 0, otherwise equal to false.",
                "    /// Outside values can only be used if the tick is initialized, i.e. if liquidityGross is greater than 0.",
                "    /// In addition, these values are only relative and must be used only in comparison to previous snapshots for",
                "    /// a specific position.",
                "    function ticks(int24 tick)",
                "        external",
                "        view",
                "        returns (",
                "            uint128 liquidityGross,",
                "            int128 liquidityNet,",
                "            uint256 feeGrowthOutside0X128,",
                "            uint256 feeGrowthOutside1X128,",
                "            int56 tickCumulativeOutside,",
                "            uint160 secondsPerLiquidityOutsideX128,",
                "            uint32 secondsOutside,",
                "            bool initialized",
                "        );",
                "",
                "    /// @notice Returns 256 packed tick initialized boolean values. See TickBitmap for more information",
                "    function tickBitmap(int16 wordPosition) external view returns (uint256);",
                "",
                "    /// @notice Returns the information about a position by the position's key",
                "    /// @param key The position's key is a hash of a preimage composed by the owner, tickLower and tickUpper",
                "    /// @return _liquidity The amount of liquidity in the position,",
                "    /// Returns feeGrowthInside0LastX128 fee growth of token0 inside the tick range as of the last mint/burn/poke,",
                "    /// Returns feeGrowthInside1LastX128 fee growth of token1 inside the tick range as of the last mint/burn/poke,",
                "    /// Returns tokensOwed0 the computed amount of token0 owed to the position as of the last mint/burn/poke,",
                "    /// Returns tokensOwed1 the computed amount of token1 owed to the position as of the last mint/burn/poke",
                "    function positions(bytes32 key)",
                "        external",
                "        view",
                "        returns (",
                "            uint128 _liquidity,",
                "            uint256 feeGrowthInside0LastX128,",
                "            uint256 feeGrowthInside1LastX128,",
                "            uint128 tokensOwed0,",
                "            uint128 tokensOwed1",
                "        );",
                "",
                "    /// @notice Returns data about a specific observation index",
                "    /// @param index The element of the observations array to fetch",
                "    /// @dev You most likely want to use #observe() instead of this method to get an observation as of some amount of time",
                "    /// ago, rather than at a specific index in the array.",
                "    /// @return blockTimestamp The timestamp of the observation,",
                "    /// Returns tickCumulative the tick multiplied by seconds elapsed for the life of the pool as of the observation timestamp,",
                "    /// Returns secondsPerLiquidityCumulativeX128 the seconds per in range liquidity for the life of the pool as of the observation timestamp,",
                "    /// Returns initialized whether the observation has been initialized and the values are safe to use",
                "    function observations(uint256 index)",
                "        external",
                "        view",
                "        returns (",
                "            uint32 blockTimestamp,",
                "            int56 tickCumulative,",
                "            uint160 secondsPerLiquidityCumulativeX128,",
                "            bool initialized",
                "        );",
                "}",
                ""
              ]
            },
            "10": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity >=0.7.0;",
                "",
                "/// @title Optimized overflow and underflow safe math operations",
                "/// @notice Contains methods for doing math operations that revert on overflow or underflow for minimal gas cost",
                "library LowGasSafeMath {",
                "    /// @notice Returns x + y, reverts if sum overflows uint256",
                "    /// @param x The augend",
                "    /// @param y The addend",
                "    /// @return z The sum of x and y",
                "    function add(uint256 x, uint256 y) internal pure returns (uint256 z) {",
                "        require((z = x + y) >= x);",
                "    }",
                "",
                "    /// @notice Returns x - y, reverts if underflows",
                "    /// @param x The minuend",
                "    /// @param y The subtrahend",
                "    /// @return z The difference of x and y",
                "    function sub(uint256 x, uint256 y) internal pure returns (uint256 z) {",
                "        require((z = x - y) <= x);",
                "    }",
                "",
                "    /// @notice Returns x * y, reverts if overflows",
                "    /// @param x The multiplicand",
                "    /// @param y The multiplier",
                "    /// @return z The product of x and y",
                "    function mul(uint256 x, uint256 y) internal pure returns (uint256 z) {",
                "        require(x == 0 || (z = x * y) / x == y);",
                "    }",
                "",
                "    /// @notice Returns x + y, reverts if overflows or underflows",
                "    /// @param x The augend",
                "    /// @param y The addend",
                "    /// @return z The sum of x and y",
                "    function add(int256 x, int256 y) internal pure returns (int256 z) {",
                "        require((z = x + y) >= x == (y >= 0));",
                "    }",
                "",
                "    /// @notice Returns x - y, reverts if overflows or underflows",
                "    /// @param x The minuend",
                "    /// @param y The subtrahend",
                "    /// @return z The difference of x and y",
                "    function sub(int256 x, int256 y) internal pure returns (int256 z) {",
                "        require((z = x - y) <= x == (y >= 0));",
                "    }",
                "}",
                ""
              ]
            },
            "11": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity >=0.5.0;",
                "",
                "/// @title Safe casting methods",
                "/// @notice Contains methods for safely casting between types",
                "library SafeCast {",
                "    /// @notice Cast a uint256 to a uint160, revert on overflow",
                "    /// @param y The uint256 to be downcasted",
                "    /// @return z The downcasted integer, now type uint160",
                "    function toUint160(uint256 y) internal pure returns (uint160 z) {",
                "        require((z = uint160(y)) == y);",
                "    }",
                "",
                "    /// @notice Cast a int256 to a int128, revert on overflow or underflow",
                "    /// @param y The int256 to be downcasted",
                "    /// @return z The downcasted integer, now type int128",
                "    function toInt128(int256 y) internal pure returns (int128 z) {",
                "        require((z = int128(y)) == y);",
                "    }",
                "",
                "    /// @notice Cast a uint256 to a int256, revert on overflow",
                "    /// @param y The uint256 to be casted",
                "    /// @return z The casted integer, now type int256",
                "    function toInt256(uint256 y) internal pure returns (int256 z) {",
                "        require(y < 2**255);",
                "        z = int256(y);",
                "    }",
                "}",
                ""
              ]
            },
            "12": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity >=0.5.0;",
                "",
                "/// @title Math library for computing sqrt prices from ticks and vice versa",
                "/// @notice Computes sqrt price for ticks of size 1.0001, i.e. sqrt(1.0001^tick) as fixed point Q64.96 numbers. Supports",
                "/// prices between 2**-128 and 2**128",
                "library TickMath {",
                "    /// @dev The minimum tick that may be passed to #getSqrtRatioAtTick computed from log base 1.0001 of 2**-128",
                "    int24 internal constant MIN_TICK = -887272;",
                "    /// @dev The maximum tick that may be passed to #getSqrtRatioAtTick computed from log base 1.0001 of 2**128",
                "    int24 internal constant MAX_TICK = -MIN_TICK;",
                "",
                "    /// @dev The minimum value that can be returned from #getSqrtRatioAtTick. Equivalent to getSqrtRatioAtTick(MIN_TICK)",
                "    uint160 internal constant MIN_SQRT_RATIO = 4295128739;",
                "    /// @dev The maximum value that can be returned from #getSqrtRatioAtTick. Equivalent to getSqrtRatioAtTick(MAX_TICK)",
                "    uint160 internal constant MAX_SQRT_RATIO = 1461446703485210103287273052203988822378723970342;",
                "",
                "    /// @notice Calculates sqrt(1.0001^tick) * 2^96",
                "    /// @dev Throws if |tick| > max tick",
                "    /// @param tick The input tick for the above formula",
                "    /// @return sqrtPriceX96 A Fixed point Q64.96 number representing the sqrt of the ratio of the two assets (token1/token0)",
                "    /// at the given tick",
                "    function getSqrtRatioAtTick(int24 tick) internal pure returns (uint160 sqrtPriceX96) {",
                "        uint256 absTick = tick < 0 ? uint256(-int256(tick)) : uint256(int256(tick));",
                "        require(absTick <= uint256(MAX_TICK), 'T');",
                "",
                "        uint256 ratio = absTick & 0x1 != 0 ? 0xfffcb933bd6fad37aa2d162d1a594001 : 0x100000000000000000000000000000000;",
                "        if (absTick & 0x2 != 0) ratio = (ratio * 0xfff97272373d413259a46990580e213a) >> 128;",
                "        if (absTick & 0x4 != 0) ratio = (ratio * 0xfff2e50f5f656932ef12357cf3c7fdcc) >> 128;",
                "        if (absTick & 0x8 != 0) ratio = (ratio * 0xffe5caca7e10e4e61c3624eaa0941cd0) >> 128;",
                "        if (absTick & 0x10 != 0) ratio = (ratio * 0xffcb9843d60f6159c9db58835c926644) >> 128;",
                "        if (absTick & 0x20 != 0) ratio = (ratio * 0xff973b41fa98c081472e6896dfb254c0) >> 128;",
                "        if (absTick & 0x40 != 0) ratio = (ratio * 0xff2ea16466c96a3843ec78b326b52861) >> 128;",
                "        if (absTick & 0x80 != 0) ratio = (ratio * 0xfe5dee046a99a2a811c461f1969c3053) >> 128;",
                "        if (absTick & 0x100 != 0) ratio = (ratio * 0xfcbe86c7900a88aedcffc83b479aa3a4) >> 128;",
                "        if (absTick & 0x200 != 0) ratio = (ratio * 0xf987a7253ac413176f2b074cf7815e54) >> 128;",
                "        if (absTick & 0x400 != 0) ratio = (ratio * 0xf3392b0822b70005940c7a398e4b70f3) >> 128;",
                "        if (absTick & 0x800 != 0) ratio = (ratio * 0xe7159475a2c29b7443b29c7fa6e889d9) >> 128;",
                "        if (absTick & 0x1000 != 0) ratio = (ratio * 0xd097f3bdfd2022b8845ad8f792aa5825) >> 128;",
                "        if (absTick & 0x2000 != 0) ratio = (ratio * 0xa9f746462d870fdf8a65dc1f90e061e5) >> 128;",
                "        if (absTick & 0x4000 != 0) ratio = (ratio * 0x70d869a156d2a1b890bb3df62baf32f7) >> 128;",
                "        if (absTick & 0x8000 != 0) ratio = (ratio * 0x31be135f97d08fd981231505542fcfa6) >> 128;",
                "        if (absTick & 0x10000 != 0) ratio = (ratio * 0x9aa508b5b7a84e1c677de54f3e99bc9) >> 128;",
                "        if (absTick & 0x20000 != 0) ratio = (ratio * 0x5d6af8dedb81196699c329225ee604) >> 128;",
                "        if (absTick & 0x40000 != 0) ratio = (ratio * 0x2216e584f5fa1ea926041bedfe98) >> 128;",
                "        if (absTick & 0x80000 != 0) ratio = (ratio * 0x48a170391f7dc42444e8fa2) >> 128;",
                "",
                "        if (tick > 0) ratio = type(uint256).max / ratio;",
                "",
                "        // this divides by 1<<32 rounding up to go from a Q128.128 to a Q128.96.",
                "        // we then downcast because we know the result always fits within 160 bits due to our tick input constraint",
                "        // we round up in the division so getTickAtSqrtRatio of the output price is always consistent",
                "        sqrtPriceX96 = uint160((ratio >> 32) + (ratio % (1 << 32) == 0 ? 0 : 1));",
                "    }",
                "",
                "    /// @notice Calculates the greatest tick value such that getRatioAtTick(tick) <= ratio",
                "    /// @dev Throws in case sqrtPriceX96 < MIN_SQRT_RATIO, as MIN_SQRT_RATIO is the lowest value getRatioAtTick may",
                "    /// ever return.",
                "    /// @param sqrtPriceX96 The sqrt ratio for which to compute the tick as a Q64.96",
                "    /// @return tick The greatest tick for which the ratio is less than or equal to the input ratio",
                "    function getTickAtSqrtRatio(uint160 sqrtPriceX96) internal pure returns (int24 tick) {",
                "        // second inequality must be < because the price can never reach the price at the max tick",
                "        require(sqrtPriceX96 >= MIN_SQRT_RATIO && sqrtPriceX96 < MAX_SQRT_RATIO, 'R');",
                "        uint256 ratio = uint256(sqrtPriceX96) << 32;",
                "",
                "        uint256 r = ratio;",
                "        uint256 msb = 0;",
                "",
                "        assembly {",
                "            let f := shl(7, gt(r, 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF))",
                "            msb := or(msb, f)",
                "            r := shr(f, r)",
                "        }",
                "        assembly {",
                "            let f := shl(6, gt(r, 0xFFFFFFFFFFFFFFFF))",
                "            msb := or(msb, f)",
                "            r := shr(f, r)",
                "        }",
                "        assembly {",
                "            let f := shl(5, gt(r, 0xFFFFFFFF))",
                "            msb := or(msb, f)",
                "            r := shr(f, r)",
                "        }",
                "        assembly {",
                "            let f := shl(4, gt(r, 0xFFFF))",
                "            msb := or(msb, f)",
                "            r := shr(f, r)",
                "        }",
                "        assembly {",
                "            let f := shl(3, gt(r, 0xFF))",
                "            msb := or(msb, f)",
                "            r := shr(f, r)",
                "        }",
                "        assembly {",
                "            let f := shl(2, gt(r, 0xF))",
                "            msb := or(msb, f)",
                "            r := shr(f, r)",
                "        }",
                "        assembly {",
                "            let f := shl(1, gt(r, 0x3))",
                "            msb := or(msb, f)",
                "            r := shr(f, r)",
                "        }",
                "        assembly {",
                "            let f := gt(r, 0x1)",
                "            msb := or(msb, f)",
                "        }",
                "",
                "        if (msb >= 128) r = ratio >> (msb - 127);",
                "        else r = ratio << (127 - msb);",
                "",
                "        int256 log_2 = (int256(msb) - 128) << 64;",
                "",
                "        assembly {",
                "            r := shr(127, mul(r, r))",
                "            let f := shr(128, r)",
                "            log_2 := or(log_2, shl(63, f))",
                "            r := shr(f, r)",
                "        }",
                "        assembly {",
                "            r := shr(127, mul(r, r))",
                "            let f := shr(128, r)",
                "            log_2 := or(log_2, shl(62, f))",
                "            r := shr(f, r)",
                "        }",
                "        assembly {",
                "            r := shr(127, mul(r, r))",
                "            let f := shr(128, r)",
                "            log_2 := or(log_2, shl(61, f))",
                "            r := shr(f, r)",
                "        }",
                "        assembly {",
                "            r := shr(127, mul(r, r))",
                "            let f := shr(128, r)",
                "            log_2 := or(log_2, shl(60, f))",
                "            r := shr(f, r)",
                "        }",
                "        assembly {",
                "            r := shr(127, mul(r, r))",
                "            let f := shr(128, r)",
                "            log_2 := or(log_2, shl(59, f))",
                "            r := shr(f, r)",
                "        }",
                "        assembly {",
                "            r := shr(127, mul(r, r))",
                "            let f := shr(128, r)",
                "            log_2 := or(log_2, shl(58, f))",
                "            r := shr(f, r)",
                "        }",
                "        assembly {",
                "            r := shr(127, mul(r, r))",
                "            let f := shr(128, r)",
                "            log_2 := or(log_2, shl(57, f))",
                "            r := shr(f, r)",
                "        }",
                "        assembly {",
                "            r := shr(127, mul(r, r))",
                "            let f := shr(128, r)",
                "            log_2 := or(log_2, shl(56, f))",
                "            r := shr(f, r)",
                "        }",
                "        assembly {",
                "            r := shr(127, mul(r, r))",
                "            let f := shr(128, r)",
                "            log_2 := or(log_2, shl(55, f))",
                "            r := shr(f, r)",
                "        }",
                "        assembly {",
                "            r := shr(127, mul(r, r))",
                "            let f := shr(128, r)",
                "            log_2 := or(log_2, shl(54, f))",
                "            r := shr(f, r)",
                "        }",
                "        assembly {",
                "            r := shr(127, mul(r, r))",
                "            let f := shr(128, r)",
                "            log_2 := or(log_2, shl(53, f))",
                "            r := shr(f, r)",
                "        }",
                "        assembly {",
                "            r := shr(127, mul(r, r))",
                "            let f := shr(128, r)",
                "            log_2 := or(log_2, shl(52, f))",
                "            r := shr(f, r)",
                "        }",
                "        assembly {",
                "            r := shr(127, mul(r, r))",
                "            let f := shr(128, r)",
                "            log_2 := or(log_2, shl(51, f))",
                "            r := shr(f, r)",
                "        }",
                "        assembly {",
                "            r := shr(127, mul(r, r))",
                "            let f := shr(128, r)",
                "            log_2 := or(log_2, shl(50, f))",
                "        }",
                "",
                "        int256 log_sqrt10001 = log_2 * 255738958999603826347141; // 128.128 number",
                "",
                "        int24 tickLow = int24((log_sqrt10001 - 3402992956809132418596140100660247210) >> 128);",
                "        int24 tickHi = int24((log_sqrt10001 + 291339464771989622907027621153398088495) >> 128);",
                "",
                "        tick = tickLow == tickHi ? tickLow : getSqrtRatioAtTick(tickHi) <= sqrtPriceX96 ? tickHi : tickLow;",
                "    }",
                "}",
                ""
              ]
            },
            "13": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity =0.7.6;",
                "pragma abicoder v2;",
                "",
                "import '@uniswap/v3-core/contracts/libraries/SafeCast.sol';",
                "import '@uniswap/v3-core/contracts/libraries/TickMath.sol';",
                "import '@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol';",
                "",
                "import './interfaces/ISwapRouter.sol';",
                "import './base/PeripheryImmutableState.sol';",
                "import './base/PeripheryValidation.sol';",
                "import './base/PeripheryPaymentsWithFee.sol';",
                "import './base/Multicall.sol';",
                "import './base/SelfPermit.sol';",
                "import './libraries/Path.sol';",
                "import './libraries/PoolAddress.sol';",
                "import './libraries/CallbackValidation.sol';",
                "import './interfaces/external/IWETH9.sol';",
                "",
                "/// @title Uniswap V3 Swap Router",
                "/// @notice Router for stateless execution of swaps against Uniswap V3",
                "contract SwapRouter is",
                "    ISwapRouter,",
                "    PeripheryImmutableState,",
                "    PeripheryValidation,",
                "    PeripheryPaymentsWithFee,",
                "    Multicall,",
                "    SelfPermit",
                "{",
                "    using Path for bytes;",
                "    using SafeCast for uint256;",
                "",
                "    /// @dev Used as the placeholder value for amountInCached, because the computed amount in for an exact output swap",
                "    /// can never actually be this value",
                "    uint256 private constant DEFAULT_AMOUNT_IN_CACHED = type(uint256).max;",
                "",
                "    /// @dev Transient storage variable used for returning the computed amount in for an exact output swap.",
                "    uint256 private amountInCached = DEFAULT_AMOUNT_IN_CACHED;",
                "",
                "    constructor(address _factory, address _WETH9) PeripheryImmutableState(_factory, _WETH9) {}",
                "",
                "    /// @dev Returns the pool for the given token pair and fee. The pool contract may or may not exist.",
                "    function getPool(",
                "        address tokenA,",
                "        address tokenB,",
                "        uint24 fee",
                "    ) private view returns (IUniswapV3Pool) {",
                "        return IUniswapV3Pool(PoolAddress.computeAddress(factory, PoolAddress.getPoolKey(tokenA, tokenB, fee)));",
                "    }",
                "",
                "    struct SwapCallbackData {",
                "        bytes path;",
                "        address payer;",
                "    }",
                "",
                "    /// @inheritdoc IUniswapV3SwapCallback",
                "    function uniswapV3SwapCallback(",
                "        int256 amount0Delta,",
                "        int256 amount1Delta,",
                "        bytes calldata _data",
                "    ) external override {",
                "        require(amount0Delta > 0 || amount1Delta > 0); // swaps entirely within 0-liquidity regions are not supported",
                "        SwapCallbackData memory data = abi.decode(_data, (SwapCallbackData));",
                "        (address tokenIn, address tokenOut, uint24 fee) = data.path.decodeFirstPool();",
                "        CallbackValidation.verifyCallback(factory, tokenIn, tokenOut, fee);",
                "",
                "        (bool isExactInput, uint256 amountToPay) =",
                "            amount0Delta > 0",
                "                ? (tokenIn < tokenOut, uint256(amount0Delta))",
                "                : (tokenOut < tokenIn, uint256(amount1Delta));",
                "        if (isExactInput) {",
                "            pay(tokenIn, data.payer, msg.sender, amountToPay);",
                "        } else {",
                "            // either initiate the next swap or pay",
                "            if (data.path.hasMultiplePools()) {",
                "                data.path = data.path.skipToken();",
                "                exactOutputInternal(amountToPay, msg.sender, 0, data);",
                "            } else {",
                "                amountInCached = amountToPay;",
                "                tokenIn = tokenOut; // swap in/out because exact output swaps are reversed",
                "                pay(tokenIn, data.payer, msg.sender, amountToPay);",
                "            }",
                "        }",
                "    }",
                "",
                "    /// @dev Performs a single exact input swap",
                "    function exactInputInternal(",
                "        uint256 amountIn,",
                "        address recipient,",
                "        uint160 sqrtPriceLimitX96,",
                "        SwapCallbackData memory data",
                "    ) private returns (uint256 amountOut) {",
                "        // allow swapping to the router address with address 0",
                "        if (recipient == address(0)) recipient = address(this);",
                "",
                "        (address tokenIn, address tokenOut, uint24 fee) = data.path.decodeFirstPool();",
                "",
                "        bool zeroForOne = tokenIn < tokenOut;",
                "",
                "        (int256 amount0, int256 amount1) =",
                "            getPool(tokenIn, tokenOut, fee).swap(",
                "                recipient,",
                "                zeroForOne,",
                "                amountIn.toInt256(),",
                "                sqrtPriceLimitX96 == 0",
                "                    ? (zeroForOne ? TickMath.MIN_SQRT_RATIO + 1 : TickMath.MAX_SQRT_RATIO - 1)",
                "                    : sqrtPriceLimitX96,",
                "                abi.encode(data)",
                "            );",
                "",
                "        return uint256(-(zeroForOne ? amount1 : amount0));",
                "    }",
                "",
                "    /// @inheritdoc ISwapRouter",
                "    function exactInputSingle(ExactInputSingleParams calldata params)",
                "        external",
                "        payable",
                "        override",
                "        checkDeadline(params.deadline)",
                "        returns (uint256 amountOut)",
                "    {",
                "        amountOut = exactInputInternal(",
                "            params.amountIn,",
                "            params.recipient,",
                "            params.sqrtPriceLimitX96,",
                "            SwapCallbackData({path: abi.encodePacked(params.tokenIn, params.fee, params.tokenOut), payer: msg.sender})",
                "        );",
                "        require(amountOut >= params.amountOutMinimum, 'Too little received');",
                "    }",
                "",
                "    /// @inheritdoc ISwapRouter",
                "    function exactInput(ExactInputParams memory params)",
                "        external",
                "        payable",
                "        override",
                "        checkDeadline(params.deadline)",
                "        returns (uint256 amountOut)",
                "    {",
                "        address payer = msg.sender; // msg.sender pays for the first hop",
                "",
                "        while (true) {",
                "            bool hasMultiplePools = params.path.hasMultiplePools();",
                "",
                "            // the outputs of prior swaps become the inputs to subsequent ones",
                "            params.amountIn = exactInputInternal(",
                "                params.amountIn,",
                "                hasMultiplePools ? address(this) : params.recipient, // for intermediate swaps, this contract custodies",
                "                0,",
                "                SwapCallbackData({",
                "                    path: params.path.getFirstPool(), // only the first pool in the path is necessary",
                "                    payer: payer",
                "                })",
                "            );",
                "",
                "            // decide whether to continue or terminate",
                "            if (hasMultiplePools) {",
                "                payer = address(this); // at this point, the caller has paid",
                "                params.path = params.path.skipToken();",
                "            } else {",
                "                amountOut = params.amountIn;",
                "                break;",
                "            }",
                "        }",
                "",
                "        require(amountOut >= params.amountOutMinimum, 'Too little received');",
                "    }",
                "",
                "    /// @dev Performs a single exact output swap",
                "    function exactOutputInternal(",
                "        uint256 amountOut,",
                "        address recipient,",
                "        uint160 sqrtPriceLimitX96,",
                "        SwapCallbackData memory data",
                "    ) private returns (uint256 amountIn) {",
                "        // allow swapping to the router address with address 0",
                "        if (recipient == address(0)) recipient = address(this);",
                "",
                "        (address tokenOut, address tokenIn, uint24 fee) = data.path.decodeFirstPool();",
                "",
                "        bool zeroForOne = tokenIn < tokenOut;",
                "",
                "        (int256 amount0Delta, int256 amount1Delta) =",
                "            getPool(tokenIn, tokenOut, fee).swap(",
                "                recipient,",
                "                zeroForOne,",
                "                -amountOut.toInt256(),",
                "                sqrtPriceLimitX96 == 0",
                "                    ? (zeroForOne ? TickMath.MIN_SQRT_RATIO + 1 : TickMath.MAX_SQRT_RATIO - 1)",
                "                    : sqrtPriceLimitX96,",
                "                abi.encode(data)",
                "            );",
                "",
                "        uint256 amountOutReceived;",
                "        (amountIn, amountOutReceived) = zeroForOne",
                "            ? (uint256(amount0Delta), uint256(-amount1Delta))",
                "            : (uint256(amount1Delta), uint256(-amount0Delta));",
                "        // it's technically possible to not receive the full output amount,",
                "        // so if no price limit has been specified, require this possibility away",
                "        if (sqrtPriceLimitX96 == 0) require(amountOutReceived == amountOut);",
                "    }",
                "",
                "    /// @inheritdoc ISwapRouter",
                "    function exactOutputSingle(ExactOutputSingleParams calldata params)",
                "        external",
                "        payable",
                "        override",
                "        checkDeadline(params.deadline)",
                "        returns (uint256 amountIn)",
                "    {",
                "        // avoid an SLOAD by using the swap return data",
                "        amountIn = exactOutputInternal(",
                "            params.amountOut,",
                "            params.recipient,",
                "            params.sqrtPriceLimitX96,",
                "            SwapCallbackData({path: abi.encodePacked(params.tokenOut, params.fee, params.tokenIn), payer: msg.sender})",
                "        );",
                "",
                "        require(amountIn <= params.amountInMaximum, 'Too much requested');",
                "        // has to be reset even though we don't use it in the single hop case",
                "        amountInCached = DEFAULT_AMOUNT_IN_CACHED;",
                "    }",
                "",
                "    /// @inheritdoc ISwapRouter",
                "    function exactOutput(ExactOutputParams calldata params)",
                "        external",
                "        payable",
                "        override",
                "        checkDeadline(params.deadline)",
                "        returns (uint256 amountIn)",
                "    {",
                "        // it's okay that the payer is fixed to msg.sender here, as they're only paying for the \"final\" exact output",
                "        // swap, which happens first, and subsequent swaps are paid for within nested callback frames",
                "        exactOutputInternal(",
                "            params.amountOut,",
                "            params.recipient,",
                "            0,",
                "            SwapCallbackData({path: params.path, payer: msg.sender})",
                "        );",
                "",
                "        amountIn = amountInCached;",
                "        require(amountIn <= params.amountInMaximum, 'Too much requested');",
                "        amountInCached = DEFAULT_AMOUNT_IN_CACHED;",
                "    }",
                "}",
                ""
              ]
            },
            "14": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity =0.7.6;",
                "",
                "/// @title Function for getting block timestamp",
                "/// @dev Base contract that is overridden for tests",
                "abstract contract BlockTimestamp {",
                "    /// @dev Method that exists purely to be overridden for tests",
                "    /// @return The current block timestamp",
                "    function _blockTimestamp() internal view virtual returns (uint256) {",
                "        return block.timestamp;",
                "    }",
                "}",
                ""
              ]
            },
            "15": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity =0.7.6;",
                "pragma abicoder v2;",
                "",
                "import '../interfaces/IMulticall.sol';",
                "",
                "/// @title Multicall",
                "/// @notice Enables calling multiple methods in a single call to the contract",
                "abstract contract Multicall is IMulticall {",
                "    /// @inheritdoc IMulticall",
                "    function multicall(bytes[] calldata data) external payable override returns (bytes[] memory results) {",
                "        results = new bytes[](data.length);",
                "        for (uint256 i = 0; i < data.length; i++) {",
                "            (bool success, bytes memory result) = address(this).delegatecall(data[i]);",
                "",
                "            if (!success) {",
                "                // Next 5 lines from https://ethereum.stackexchange.com/a/83577",
                "                if (result.length < 68) revert();",
                "                assembly {",
                "                    result := add(result, 0x04)",
                "                }",
                "                revert(abi.decode(result, (string)));",
                "            }",
                "",
                "            results[i] = result;",
                "        }",
                "    }",
                "}",
                ""
              ]
            },
            "16": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity =0.7.6;",
                "",
                "import '../interfaces/IPeripheryImmutableState.sol';",
                "",
                "/// @title Immutable state",
                "/// @notice Immutable state used by periphery contracts",
                "abstract contract PeripheryImmutableState is IPeripheryImmutableState {",
                "    /// @inheritdoc IPeripheryImmutableState",
                "    address public immutable override factory;",
                "    /// @inheritdoc IPeripheryImmutableState",
                "    address public immutable override WETH9;",
                "",
                "    constructor(address _factory, address _WETH9) {",
                "        factory = _factory;",
                "        WETH9 = _WETH9;",
                "    }",
                "}",
                ""
              ]
            },
            "17": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity >=0.7.5;",
                "",
                "import '@openzeppelin/contracts/token/ERC20/IERC20.sol';",
                "",
                "import '../interfaces/IPeripheryPayments.sol';",
                "import '../interfaces/external/IWETH9.sol';",
                "",
                "import '../libraries/TransferHelper.sol';",
                "",
                "import './PeripheryImmutableState.sol';",
                "",
                "abstract contract PeripheryPayments is IPeripheryPayments, PeripheryImmutableState {",
                "    receive() external payable {",
                "        require(msg.sender == WETH9, 'Not WETH9');",
                "    }",
                "",
                "    /// @inheritdoc IPeripheryPayments",
                "    function unwrapWETH9(uint256 amountMinimum, address recipient) external payable override {",
                "        uint256 balanceWETH9 = IWETH9(WETH9).balanceOf(address(this));",
                "        require(balanceWETH9 >= amountMinimum, 'Insufficient WETH9');",
                "",
                "        if (balanceWETH9 > 0) {",
                "            IWETH9(WETH9).withdraw(balanceWETH9);",
                "            TransferHelper.safeTransferETH(recipient, balanceWETH9);",
                "        }",
                "    }",
                "",
                "    /// @inheritdoc IPeripheryPayments",
                "    function sweepToken(",
                "        address token,",
                "        uint256 amountMinimum,",
                "        address recipient",
                "    ) external payable override {",
                "        uint256 balanceToken = IERC20(token).balanceOf(address(this));",
                "        require(balanceToken >= amountMinimum, 'Insufficient token');",
                "",
                "        if (balanceToken > 0) {",
                "            TransferHelper.safeTransfer(token, recipient, balanceToken);",
                "        }",
                "    }",
                "",
                "    /// @inheritdoc IPeripheryPayments",
                "    function refundETH() external payable override {",
                "        if (address(this).balance > 0) TransferHelper.safeTransferETH(msg.sender, address(this).balance);",
                "    }",
                "",
                "    /// @param token The token to pay",
                "    /// @param payer The entity that must pay",
                "    /// @param recipient The entity that will receive payment",
                "    /// @param value The amount to pay",
                "    function pay(",
                "        address token,",
                "        address payer,",
                "        address recipient,",
                "        uint256 value",
                "    ) internal {",
                "        if (token == WETH9 && address(this).balance >= value) {",
                "            // pay with WETH9",
                "            IWETH9(WETH9).deposit{value: value}(); // wrap only what is needed to pay",
                "            IWETH9(WETH9).transfer(recipient, value);",
                "        } else if (payer == address(this)) {",
                "            // pay with tokens already in the contract (for the exact input multihop case)",
                "            TransferHelper.safeTransfer(token, recipient, value);",
                "        } else {",
                "            // pull payment",
                "            TransferHelper.safeTransferFrom(token, payer, recipient, value);",
                "        }",
                "    }",
                "}",
                ""
              ]
            },
            "18": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity >=0.7.5;",
                "",
                "import '@openzeppelin/contracts/token/ERC20/IERC20.sol';",
                "import '@uniswap/v3-core/contracts/libraries/LowGasSafeMath.sol';",
                "",
                "import './PeripheryPayments.sol';",
                "import '../interfaces/IPeripheryPaymentsWithFee.sol';",
                "",
                "import '../interfaces/external/IWETH9.sol';",
                "import '../libraries/TransferHelper.sol';",
                "",
                "abstract contract PeripheryPaymentsWithFee is PeripheryPayments, IPeripheryPaymentsWithFee {",
                "    using LowGasSafeMath for uint256;",
                "",
                "    /// @inheritdoc IPeripheryPaymentsWithFee",
                "    function unwrapWETH9WithFee(",
                "        uint256 amountMinimum,",
                "        address recipient,",
                "        uint256 feeBips,",
                "        address feeRecipient",
                "    ) public payable override {",
                "        require(feeBips > 0 && feeBips <= 100);",
                "",
                "        uint256 balanceWETH9 = IWETH9(WETH9).balanceOf(address(this));",
                "        require(balanceWETH9 >= amountMinimum, 'Insufficient WETH9');",
                "",
                "        if (balanceWETH9 > 0) {",
                "            IWETH9(WETH9).withdraw(balanceWETH9);",
                "            uint256 feeAmount = balanceWETH9.mul(feeBips) / 10_000;",
                "            if (feeAmount > 0) TransferHelper.safeTransferETH(feeRecipient, feeAmount);",
                "            TransferHelper.safeTransferETH(recipient, balanceWETH9 - feeAmount);",
                "        }",
                "    }",
                "",
                "    /// @inheritdoc IPeripheryPaymentsWithFee",
                "    function sweepTokenWithFee(",
                "        address token,",
                "        uint256 amountMinimum,",
                "        address recipient,",
                "        uint256 feeBips,",
                "        address feeRecipient",
                "    ) public payable override {",
                "        require(feeBips > 0 && feeBips <= 100);",
                "",
                "        uint256 balanceToken = IERC20(token).balanceOf(address(this));",
                "        require(balanceToken >= amountMinimum, 'Insufficient token');",
                "",
                "        if (balanceToken > 0) {",
                "            uint256 feeAmount = balanceToken.mul(feeBips) / 10_000;",
                "            if (feeAmount > 0) TransferHelper.safeTransfer(token, feeRecipient, feeAmount);",
                "            TransferHelper.safeTransfer(token, recipient, balanceToken - feeAmount);",
                "        }",
                "    }",
                "}",
                ""
              ]
            },
            "19": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity =0.7.6;",
                "",
                "import './BlockTimestamp.sol';",
                "",
                "abstract contract PeripheryValidation is BlockTimestamp {",
                "    modifier checkDeadline(uint256 deadline) {",
                "        require(_blockTimestamp() <= deadline, 'Transaction too old');",
                "        _;",
                "    }",
                "}",
                ""
              ]
            },
            "20": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity >=0.5.0;",
                "",
                "import '@openzeppelin/contracts/token/ERC20/IERC20.sol';",
                "import '@openzeppelin/contracts/drafts/IERC20Permit.sol';",
                "",
                "import '../interfaces/ISelfPermit.sol';",
                "import '../interfaces/external/IERC20PermitAllowed.sol';",
                "",
                "/// @title Self Permit",
                "/// @notice Functionality to call permit on any EIP-2612-compliant token for use in the route",
                "/// @dev These functions are expected to be embedded in multicalls to allow EOAs to approve a contract and call a function",
                "/// that requires an approval in a single transaction.",
                "abstract contract SelfPermit is ISelfPermit {",
                "    /// @inheritdoc ISelfPermit",
                "    function selfPermit(",
                "        address token,",
                "        uint256 value,",
                "        uint256 deadline,",
                "        uint8 v,",
                "        bytes32 r,",
                "        bytes32 s",
                "    ) public payable override {",
                "        IERC20Permit(token).permit(msg.sender, address(this), value, deadline, v, r, s);",
                "    }",
                "",
                "    /// @inheritdoc ISelfPermit",
                "    function selfPermitIfNecessary(",
                "        address token,",
                "        uint256 value,",
                "        uint256 deadline,",
                "        uint8 v,",
                "        bytes32 r,",
                "        bytes32 s",
                "    ) external payable override {",
                "        if (IERC20(token).allowance(msg.sender, address(this)) < value) selfPermit(token, value, deadline, v, r, s);",
                "    }",
                "",
                "    /// @inheritdoc ISelfPermit",
                "    function selfPermitAllowed(",
                "        address token,",
                "        uint256 nonce,",
                "        uint256 expiry,",
                "        uint8 v,",
                "        bytes32 r,",
                "        bytes32 s",
                "    ) public payable override {",
                "        IERC20PermitAllowed(token).permit(msg.sender, address(this), nonce, expiry, true, v, r, s);",
                "    }",
                "",
                "    /// @inheritdoc ISelfPermit",
                "    function selfPermitAllowedIfNecessary(",
                "        address token,",
                "        uint256 nonce,",
                "        uint256 expiry,",
                "        uint8 v,",
                "        bytes32 r,",
                "        bytes32 s",
                "    ) external payable override {",
                "        if (IERC20(token).allowance(msg.sender, address(this)) < type(uint256).max)",
                "            selfPermitAllowed(token, nonce, expiry, v, r, s);",
                "    }",
                "}",
                ""
              ]
            },
            "21": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity >=0.7.5;",
                "pragma abicoder v2;",
                "",
                "/// @title Multicall interface",
                "/// @notice Enables calling multiple methods in a single call to the contract",
                "interface IMulticall {",
                "    /// @notice Call multiple functions in the current contract and return the data from all of them if they all succeed",
                "    /// @dev The `msg.value` should not be trusted for any method callable from multicall.",
                "    /// @param data The encoded function data for each of the calls to make to this contract",
                "    /// @return results The results from each of the calls passed in via data",
                "    function multicall(bytes[] calldata data) external payable returns (bytes[] memory results);",
                "}",
                ""
              ]
            },
            "22": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity >=0.5.0;",
                "",
                "/// @title Immutable state",
                "/// @notice Functions that return immutable state of the router",
                "interface IPeripheryImmutableState {",
                "    /// @return Returns the address of the Uniswap V3 factory",
                "    function factory() external view returns (address);",
                "",
                "    /// @return Returns the address of WETH9",
                "    function WETH9() external view returns (address);",
                "}",
                ""
              ]
            },
            "23": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity >=0.7.5;",
                "",
                "/// @title Periphery Payments",
                "/// @notice Functions to ease deposits and withdrawals of ETH",
                "interface IPeripheryPayments {",
                "    /// @notice Unwraps the contract's WETH9 balance and sends it to recipient as ETH.",
                "    /// @dev The amountMinimum parameter prevents malicious contracts from stealing WETH9 from users.",
                "    /// @param amountMinimum The minimum amount of WETH9 to unwrap",
                "    /// @param recipient The address receiving ETH",
                "    function unwrapWETH9(uint256 amountMinimum, address recipient) external payable;",
                "",
                "    /// @notice Refunds any ETH balance held by this contract to the `msg.sender`",
                "    /// @dev Useful for bundling with mint or increase liquidity that uses ether, or exact output swaps",
                "    /// that use ether for the input amount",
                "    function refundETH() external payable;",
                "",
                "    /// @notice Transfers the full amount of a token held by this contract to recipient",
                "    /// @dev The amountMinimum parameter prevents malicious contracts from stealing the token from users",
                "    /// @param token The contract address of the token which will be transferred to `recipient`",
                "    /// @param amountMinimum The minimum amount of token required for a transfer",
                "    /// @param recipient The destination address of the token",
                "    function sweepToken(",
                "        address token,",
                "        uint256 amountMinimum,",
                "        address recipient",
                "    ) external payable;",
                "}",
                ""
              ]
            },
            "24": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity >=0.7.5;",
                "",
                "import './IPeripheryPayments.sol';",
                "",
                "/// @title Periphery Payments",
                "/// @notice Functions to ease deposits and withdrawals of ETH",
                "interface IPeripheryPaymentsWithFee is IPeripheryPayments {",
                "    /// @notice Unwraps the contract's WETH9 balance and sends it to recipient as ETH, with a percentage between",
                "    /// 0 (exclusive), and 1 (inclusive) going to feeRecipient",
                "    /// @dev The amountMinimum parameter prevents malicious contracts from stealing WETH9 from users.",
                "    function unwrapWETH9WithFee(",
                "        uint256 amountMinimum,",
                "        address recipient,",
                "        uint256 feeBips,",
                "        address feeRecipient",
                "    ) external payable;",
                "",
                "    /// @notice Transfers the full amount of a token held by this contract to recipient, with a percentage between",
                "    /// 0 (exclusive) and 1 (inclusive) going to feeRecipient",
                "    /// @dev The amountMinimum parameter prevents malicious contracts from stealing the token from users",
                "    function sweepTokenWithFee(",
                "        address token,",
                "        uint256 amountMinimum,",
                "        address recipient,",
                "        uint256 feeBips,",
                "        address feeRecipient",
                "    ) external payable;",
                "}",
                ""
              ]
            },
            "25": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity >=0.7.5;",
                "",
                "/// @title Self Permit",
                "/// @notice Functionality to call permit on any EIP-2612-compliant token for use in the route",
                "interface ISelfPermit {",
                "    /// @notice Permits this contract to spend a given token from `msg.sender`",
                "    /// @dev The `owner` is always msg.sender and the `spender` is always address(this).",
                "    /// @param token The address of the token spent",
                "    /// @param value The amount that can be spent of token",
                "    /// @param deadline A timestamp, the current blocktime must be less than or equal to this timestamp",
                "    /// @param v Must produce valid secp256k1 signature from the holder along with `r` and `s`",
                "    /// @param r Must produce valid secp256k1 signature from the holder along with `v` and `s`",
                "    /// @param s Must produce valid secp256k1 signature from the holder along with `r` and `v`",
                "    function selfPermit(",
                "        address token,",
                "        uint256 value,",
                "        uint256 deadline,",
                "        uint8 v,",
                "        bytes32 r,",
                "        bytes32 s",
                "    ) external payable;",
                "",
                "    /// @notice Permits this contract to spend a given token from `msg.sender`",
                "    /// @dev The `owner` is always msg.sender and the `spender` is always address(this).",
                "    /// Can be used instead of #selfPermit to prevent calls from failing due to a frontrun of a call to #selfPermit",
                "    /// @param token The address of the token spent",
                "    /// @param value The amount that can be spent of token",
                "    /// @param deadline A timestamp, the current blocktime must be less than or equal to this timestamp",
                "    /// @param v Must produce valid secp256k1 signature from the holder along with `r` and `s`",
                "    /// @param r Must produce valid secp256k1 signature from the holder along with `v` and `s`",
                "    /// @param s Must produce valid secp256k1 signature from the holder along with `r` and `v`",
                "    function selfPermitIfNecessary(",
                "        address token,",
                "        uint256 value,",
                "        uint256 deadline,",
                "        uint8 v,",
                "        bytes32 r,",
                "        bytes32 s",
                "    ) external payable;",
                "",
                "    /// @notice Permits this contract to spend the sender's tokens for permit signatures that have the `allowed` parameter",
                "    /// @dev The `owner` is always msg.sender and the `spender` is always address(this)",
                "    /// @param token The address of the token spent",
                "    /// @param nonce The current nonce of the owner",
                "    /// @param expiry The timestamp at which the permit is no longer valid",
                "    /// @param v Must produce valid secp256k1 signature from the holder along with `r` and `s`",
                "    /// @param r Must produce valid secp256k1 signature from the holder along with `v` and `s`",
                "    /// @param s Must produce valid secp256k1 signature from the holder along with `r` and `v`",
                "    function selfPermitAllowed(",
                "        address token,",
                "        uint256 nonce,",
                "        uint256 expiry,",
                "        uint8 v,",
                "        bytes32 r,",
                "        bytes32 s",
                "    ) external payable;",
                "",
                "    /// @notice Permits this contract to spend the sender's tokens for permit signatures that have the `allowed` parameter",
                "    /// @dev The `owner` is always msg.sender and the `spender` is always address(this)",
                "    /// Can be used instead of #selfPermitAllowed to prevent calls from failing due to a frontrun of a call to #selfPermitAllowed.",
                "    /// @param token The address of the token spent",
                "    /// @param nonce The current nonce of the owner",
                "    /// @param expiry The timestamp at which the permit is no longer valid",
                "    /// @param v Must produce valid secp256k1 signature from the holder along with `r` and `s`",
                "    /// @param r Must produce valid secp256k1 signature from the holder along with `v` and `s`",
                "    /// @param s Must produce valid secp256k1 signature from the holder along with `r` and `v`",
                "    function selfPermitAllowedIfNecessary(",
                "        address token,",
                "        uint256 nonce,",
                "        uint256 expiry,",
                "        uint8 v,",
                "        bytes32 r,",
                "        bytes32 s",
                "    ) external payable;",
                "}",
                ""
              ]
            },
            "26": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity >=0.7.5;",
                "pragma abicoder v2;",
                "",
                "import '@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol';",
                "",
                "/// @title Router token swapping functionality",
                "/// @notice Functions for swapping tokens via Uniswap V3",
                "interface ISwapRouter is IUniswapV3SwapCallback {",
                "    struct ExactInputSingleParams {",
                "        address tokenIn;",
                "        address tokenOut;",
                "        uint24 fee;",
                "        address recipient;",
                "        uint256 deadline;",
                "        uint256 amountIn;",
                "        uint256 amountOutMinimum;",
                "        uint160 sqrtPriceLimitX96;",
                "    }",
                "",
                "    /// @notice Swaps `amountIn` of one token for as much as possible of another token",
                "    /// @param params The parameters necessary for the swap, encoded as `ExactInputSingleParams` in calldata",
                "    /// @return amountOut The amount of the received token",
                "    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);",
                "",
                "    struct ExactInputParams {",
                "        bytes path;",
                "        address recipient;",
                "        uint256 deadline;",
                "        uint256 amountIn;",
                "        uint256 amountOutMinimum;",
                "    }",
                "",
                "    /// @notice Swaps `amountIn` of one token for as much as possible of another along the specified path",
                "    /// @param params The parameters necessary for the multi-hop swap, encoded as `ExactInputParams` in calldata",
                "    /// @return amountOut The amount of the received token",
                "    function exactInput(ExactInputParams calldata params) external payable returns (uint256 amountOut);",
                "",
                "    struct ExactOutputSingleParams {",
                "        address tokenIn;",
                "        address tokenOut;",
                "        uint24 fee;",
                "        address recipient;",
                "        uint256 deadline;",
                "        uint256 amountOut;",
                "        uint256 amountInMaximum;",
                "        uint160 sqrtPriceLimitX96;",
                "    }",
                "",
                "    /// @notice Swaps as little as possible of one token for `amountOut` of another token",
                "    /// @param params The parameters necessary for the swap, encoded as `ExactOutputSingleParams` in calldata",
                "    /// @return amountIn The amount of the input token",
                "    function exactOutputSingle(ExactOutputSingleParams calldata params) external payable returns (uint256 amountIn);",
                "",
                "    struct ExactOutputParams {",
                "        bytes path;",
                "        address recipient;",
                "        uint256 deadline;",
                "        uint256 amountOut;",
                "        uint256 amountInMaximum;",
                "    }",
                "",
                "    /// @notice Swaps as little as possible of one token for `amountOut` of another along the specified path (reversed)",
                "    /// @param params The parameters necessary for the multi-hop swap, encoded as `ExactOutputParams` in calldata",
                "    /// @return amountIn The amount of the input token",
                "    function exactOutput(ExactOutputParams calldata params) external payable returns (uint256 amountIn);",
                "}",
                ""
              ]
            },
            "27": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity >=0.5.0;",
                "",
                "/// @title Interface for permit",
                "/// @notice Interface used by DAI/CHAI for permit",
                "interface IERC20PermitAllowed {",
                "    /// @notice Approve the spender to spend some tokens via the holder signature",
                "    /// @dev This is the permit interface used by DAI and CHAI",
                "    /// @param holder The address of the token holder, the token owner",
                "    /// @param spender The address of the token spender",
                "    /// @param nonce The holder's nonce, increases at each call to permit",
                "    /// @param expiry The timestamp at which the permit is no longer valid",
                "    /// @param allowed Boolean that sets approval amount, true for type(uint256).max and false for 0",
                "    /// @param v Must produce valid secp256k1 signature from the holder along with `r` and `s`",
                "    /// @param r Must produce valid secp256k1 signature from the holder along with `v` and `s`",
                "    /// @param s Must produce valid secp256k1 signature from the holder along with `r` and `v`",
                "    function permit(",
                "        address holder,",
                "        address spender,",
                "        uint256 nonce,",
                "        uint256 expiry,",
                "        bool allowed,",
                "        uint8 v,",
                "        bytes32 r,",
                "        bytes32 s",
                "    ) external;",
                "}",
                ""
              ]
            },
            "28": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity =0.7.6;",
                "",
                "import '@openzeppelin/contracts/token/ERC20/IERC20.sol';",
                "",
                "/// @title Interface for WETH9",
                "interface IWETH9 is IERC20 {",
                "    /// @notice Deposit ether to get wrapped ether",
                "    function deposit() external payable;",
                "",
                "    /// @notice Withdraw wrapped ether to get ether",
                "    function withdraw(uint256) external;",
                "}",
                ""
              ]
            },
            "29": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "/*",
                " * @title Solidity Bytes Arrays Utils",
                " * @author Gonçalo Sá <goncalo.sa@consensys.net>",
                " *",
                " * @dev Bytes tightly packed arrays utility library for ethereum contracts written in Solidity.",
                " *      The library lets you concatenate, slice and type cast bytes arrays both in memory and storage.",
                " */",
                "pragma solidity >=0.5.0 <0.8.0;",
                "",
                "library BytesLib {",
                "    function slice(",
                "        bytes memory _bytes,",
                "        uint256 _start,",
                "        uint256 _length",
                "    ) internal pure returns (bytes memory) {",
                "        require(_length + 31 >= _length, 'slice_overflow');",
                "        require(_start + _length >= _start, 'slice_overflow');",
                "        require(_bytes.length >= _start + _length, 'slice_outOfBounds');",
                "",
                "        bytes memory tempBytes;",
                "",
                "        assembly {",
                "            switch iszero(_length)",
                "                case 0 {",
                "                    // Get a location of some free memory and store it in tempBytes as",
                "                    // Solidity does for memory variables.",
                "                    tempBytes := mload(0x40)",
                "",
                "                    // The first word of the slice result is potentially a partial",
                "                    // word read from the original array. To read it, we calculate",
                "                    // the length of that partial word and start copying that many",
                "                    // bytes into the array. The first word we copy will start with",
                "                    // data we don't care about, but the last `lengthmod` bytes will",
                "                    // land at the beginning of the contents of the new array. When",
                "                    // we're done copying, we overwrite the full first word with",
                "                    // the actual length of the slice.",
                "                    let lengthmod := and(_length, 31)",
                "",
                "                    // The multiplication in the next line is necessary",
                "                    // because when slicing multiples of 32 bytes (lengthmod == 0)",
                "                    // the following copy loop was copying the origin's length",
                "                    // and then ending prematurely not copying everything it should.",
                "                    let mc := add(add(tempBytes, lengthmod), mul(0x20, iszero(lengthmod)))",
                "                    let end := add(mc, _length)",
                "",
                "                    for {",
                "                        // The multiplication in the next line has the same exact purpose",
                "                        // as the one above.",
                "                        let cc := add(add(add(_bytes, lengthmod), mul(0x20, iszero(lengthmod))), _start)",
                "                    } lt(mc, end) {",
                "                        mc := add(mc, 0x20)",
                "                        cc := add(cc, 0x20)",
                "                    } {",
                "                        mstore(mc, mload(cc))",
                "                    }",
                "",
                "                    mstore(tempBytes, _length)",
                "",
                "                    //update free-memory pointer",
                "                    //allocating the array padded to 32 bytes like the compiler does now",
                "                    mstore(0x40, and(add(mc, 31), not(31)))",
                "                }",
                "                //if we want a zero-length slice let's just return a zero-length array",
                "                default {",
                "                    tempBytes := mload(0x40)",
                "                    //zero out the 32 bytes slice we are about to return",
                "                    //we need to do it because Solidity does not garbage collect",
                "                    mstore(tempBytes, 0)",
                "",
                "                    mstore(0x40, add(tempBytes, 0x20))",
                "                }",
                "        }",
                "",
                "        return tempBytes;",
                "    }",
                "",
                "    function toAddress(bytes memory _bytes, uint256 _start) internal pure returns (address) {",
                "        require(_start + 20 >= _start, 'toAddress_overflow');",
                "        require(_bytes.length >= _start + 20, 'toAddress_outOfBounds');",
                "        address tempAddress;",
                "",
                "        assembly {",
                "            tempAddress := div(mload(add(add(_bytes, 0x20), _start)), 0x1000000000000000000000000)",
                "        }",
                "",
                "        return tempAddress;",
                "    }",
                "",
                "    function toUint24(bytes memory _bytes, uint256 _start) internal pure returns (uint24) {",
                "        require(_start + 3 >= _start, 'toUint24_overflow');",
                "        require(_bytes.length >= _start + 3, 'toUint24_outOfBounds');",
                "        uint24 tempUint;",
                "",
                "        assembly {",
                "            tempUint := mload(add(add(_bytes, 0x3), _start))",
                "        }",
                "",
                "        return tempUint;",
                "    }",
                "}",
                ""
              ]
            },
            "30": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity =0.7.6;",
                "",
                "import '@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol';",
                "import './PoolAddress.sol';",
                "",
                "/// @notice Provides validation for callbacks from Uniswap V3 Pools",
                "library CallbackValidation {",
                "    /// @notice Returns the address of a valid Uniswap V3 Pool",
                "    /// @param factory The contract address of the Uniswap V3 factory",
                "    /// @param tokenA The contract address of either token0 or token1",
                "    /// @param tokenB The contract address of the other token",
                "    /// @param fee The fee collected upon every swap in the pool, denominated in hundredths of a bip",
                "    /// @return pool The V3 pool contract address",
                "    function verifyCallback(",
                "        address factory,",
                "        address tokenA,",
                "        address tokenB,",
                "        uint24 fee",
                "    ) internal view returns (IUniswapV3Pool pool) {",
                "        return verifyCallback(factory, PoolAddress.getPoolKey(tokenA, tokenB, fee));",
                "    }",
                "",
                "    /// @notice Returns the address of a valid Uniswap V3 Pool",
                "    /// @param factory The contract address of the Uniswap V3 factory",
                "    /// @param poolKey The identifying key of the V3 pool",
                "    /// @return pool The V3 pool contract address",
                "    function verifyCallback(address factory, PoolAddress.PoolKey memory poolKey)",
                "        internal",
                "        view",
                "        returns (IUniswapV3Pool pool)",
                "    {",
                "        pool = IUniswapV3Pool(PoolAddress.computeAddress(factory, poolKey));",
                "        require(msg.sender == address(pool));",
                "    }",
                "}",
                ""
              ]
            },
            "31": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity >=0.6.0;",
                "",
                "import './BytesLib.sol';",
                "",
                "/// @title Functions for manipulating path data for multihop swaps",
                "library Path {",
                "    using BytesLib for bytes;",
                "",
                "    /// @dev The length of the bytes encoded address",
                "    uint256 private constant ADDR_SIZE = 20;",
                "    /// @dev The length of the bytes encoded fee",
                "    uint256 private constant FEE_SIZE = 3;",
                "",
                "    /// @dev The offset of a single token address and pool fee",
                "    uint256 private constant NEXT_OFFSET = ADDR_SIZE + FEE_SIZE;",
                "    /// @dev The offset of an encoded pool key",
                "    uint256 private constant POP_OFFSET = NEXT_OFFSET + ADDR_SIZE;",
                "    /// @dev The minimum length of an encoding that contains 2 or more pools",
                "    uint256 private constant MULTIPLE_POOLS_MIN_LENGTH = POP_OFFSET + NEXT_OFFSET;",
                "",
                "    /// @notice Returns true iff the path contains two or more pools",
                "    /// @param path The encoded swap path",
                "    /// @return True if path contains two or more pools, otherwise false",
                "    function hasMultiplePools(bytes memory path) internal pure returns (bool) {",
                "        return path.length >= MULTIPLE_POOLS_MIN_LENGTH;",
                "    }",
                "",
                "    /// @notice Decodes the first pool in path",
                "    /// @param path The bytes encoded swap path",
                "    /// @return tokenA The first token of the given pool",
                "    /// @return tokenB The second token of the given pool",
                "    /// @return fee The fee level of the pool",
                "    function decodeFirstPool(bytes memory path)",
                "        internal",
                "        pure",
                "        returns (",
                "            address tokenA,",
                "            address tokenB,",
                "            uint24 fee",
                "        )",
                "    {",
                "        tokenA = path.toAddress(0);",
                "        fee = path.toUint24(ADDR_SIZE);",
                "        tokenB = path.toAddress(NEXT_OFFSET);",
                "    }",
                "",
                "    /// @notice Gets the segment corresponding to the first pool in the path",
                "    /// @param path The bytes encoded swap path",
                "    /// @return The segment containing all data necessary to target the first pool in the path",
                "    function getFirstPool(bytes memory path) internal pure returns (bytes memory) {",
                "        return path.slice(0, POP_OFFSET);",
                "    }",
                "",
                "    /// @notice Skips a token + fee element from the buffer and returns the remainder",
                "    /// @param path The swap path",
                "    /// @return The remaining token + fee elements in the path",
                "    function skipToken(bytes memory path) internal pure returns (bytes memory) {",
                "        return path.slice(NEXT_OFFSET, path.length - NEXT_OFFSET);",
                "    }",
                "}",
                ""
              ]
            },
            "32": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity >=0.5.0;",
                "",
                "/// @title Provides functions for deriving a pool address from the factory, tokens, and the fee",
                "library PoolAddress {",
                "    bytes32 internal constant POOL_INIT_CODE_HASH = 0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54;",
                "",
                "    /// @notice The identifying key of the pool",
                "    struct PoolKey {",
                "        address token0;",
                "        address token1;",
                "        uint24 fee;",
                "    }",
                "",
                "    /// @notice Returns PoolKey: the ordered tokens with the matched fee levels",
                "    /// @param tokenA The first token of a pool, unsorted",
                "    /// @param tokenB The second token of a pool, unsorted",
                "    /// @param fee The fee level of the pool",
                "    /// @return Poolkey The pool details with ordered token0 and token1 assignments",
                "    function getPoolKey(",
                "        address tokenA,",
                "        address tokenB,",
                "        uint24 fee",
                "    ) internal pure returns (PoolKey memory) {",
                "        if (tokenA > tokenB) (tokenA, tokenB) = (tokenB, tokenA);",
                "        return PoolKey({token0: tokenA, token1: tokenB, fee: fee});",
                "    }",
                "",
                "    /// @notice Deterministically computes the pool address given the factory and PoolKey",
                "    /// @param factory The Uniswap V3 factory contract address",
                "    /// @param key The PoolKey",
                "    /// @return pool The contract address of the V3 pool",
                "    function computeAddress(address factory, PoolKey memory key) internal pure returns (address pool) {",
                "        require(key.token0 < key.token1);",
                "        pool = address(",
                "            uint256(",
                "                keccak256(",
                "                    abi.encodePacked(",
                "                        hex'ff',",
                "                        factory,",
                "                        keccak256(abi.encode(key.token0, key.token1, key.fee)),",
                "                        POOL_INIT_CODE_HASH",
                "                    )",
                "                )",
                "            )",
                "        );",
                "    }",
                "}",
                ""
              ]
            },
            "33": {
              "language": "Solidity",
              "lines": [
                "// SPDX-License-Identifier: GPL-2.0-or-later",
                "pragma solidity >=0.6.0;",
                "",
                "import '@openzeppelin/contracts/token/ERC20/IERC20.sol';",
                "",
                "library TransferHelper {",
                "    /// @notice Transfers tokens from the targeted address to the given destination",
                "    /// @notice Errors with 'STF' if transfer fails",
                "    /// @param token The contract address of the token to be transferred",
                "    /// @param from The originating address from which the tokens will be transferred",
                "    /// @param to The destination address of the transfer",
                "    /// @param value The amount to be transferred",
                "    function safeTransferFrom(",
                "        address token,",
                "        address from,",
                "        address to,",
                "        uint256 value",
                "    ) internal {",
                "        (bool success, bytes memory data) =",
                "            token.call(abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, value));",
                "        require(success && (data.length == 0 || abi.decode(data, (bool))), 'STF');",
                "    }",
                "",
                "    /// @notice Transfers tokens from msg.sender to a recipient",
                "    /// @dev Errors with ST if transfer fails",
                "    /// @param token The contract address of the token which will be transferred",
                "    /// @param to The recipient of the transfer",
                "    /// @param value The value of the transfer",
                "    function safeTransfer(",
                "        address token,",
                "        address to,",
                "        uint256 value",
                "    ) internal {",
                "        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(IERC20.transfer.selector, to, value));",
                "        require(success && (data.length == 0 || abi.decode(data, (bool))), 'ST');",
                "    }",
                "",
                "    /// @notice Approves the stipulated contract to spend the given allowance in the given token",
                "    /// @dev Errors with 'SA' if transfer fails",
                "    /// @param token The contract address of the token to be approved",
                "    /// @param to The target of the approval",
                "    /// @param value The amount of the given token the target will be allowed to spend",
                "    function safeApprove(",
                "        address token,",
                "        address to,",
                "        uint256 value",
                "    ) internal {",
                "        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(IERC20.approve.selector, to, value));",
                "        require(success && (data.length == 0 || abi.decode(data, (bool))), 'SA');",
                "    }",
                "",
                "    /// @notice Transfers ETH to the recipient address",
                "    /// @dev Fails with `STE`",
                "    /// @param to The destination of the transfer",
                "    /// @param value The value to be transferred",
                "    function safeTransferETH(address to, uint256 value) internal {",
                "        (bool success, ) = to.call{value: value}(new bytes(0));",
                "        require(success, 'STE');",
                "    }",
                "}",
                ""
              ]
            }
          },
          "sourceRangesById": {
            "35": {
              "source": {
                "id": "0"
              },
              "from": {
                "line": 12,
                "column": 0
              },
              "to": {
                "line": 50,
                "column": 0
              }
            },
            "103": {
              "source": {
                "id": "1"
              },
              "from": {
                "line": 69,
                "column": 4
              },
              "to": {
                "line": 69,
                "column": 75
              }
            },
            "112": {
              "source": {
                "id": "1"
              },
              "from": {
                "line": 75,
                "column": 4
              },
              "to": {
                "line": 75,
                "column": 81
              }
            },
            "113": {
              "source": {
                "id": "1"
              },
              "from": {
                "line": 7,
                "column": 0
              },
              "to": {
                "line": 76,
                "column": 0
              }
            },
            "135": {
              "source": {
                "id": "2"
              },
              "from": {
                "line": 14,
                "column": 0
              },
              "to": {
                "line": 23,
                "column": 0
              }
            },
            "149": {
              "source": {
                "id": "3"
              },
              "from": {
                "line": 5,
                "column": 0
              },
              "to": {
                "line": 20,
                "column": 0
              }
            },
            "245": {
              "source": {
                "id": "4"
              },
              "from": {
                "line": 5,
                "column": 0
              },
              "to": {
                "line": 102,
                "column": 0
              }
            },
            "276": {
              "source": {
                "id": "5"
              },
              "from": {
                "line": 6,
                "column": 0
              },
              "to": {
                "line": 39,
                "column": 0
              }
            },
            "286": {
              "source": {
                "id": "6"
              },
              "from": {
                "line": 10,
                "column": 4
              },
              "to": {
                "line": 10,
                "column": 54
              }
            },
            "303": {
              "source": {
                "id": "6"
              },
              "from": {
                "line": 20,
                "column": 4
              },
              "to": {
                "line": 28,
                "column": 5
              }
            },
            "318": {
              "source": {
                "id": "6"
              },
              "from": {
                "line": 37,
                "column": 4
              },
              "to": {
                "line": 44,
                "column": 5
              }
            },
            "333": {
              "source": {
                "id": "6"
              },
              "from": {
                "line": 54,
                "column": 4
              },
              "to": {
                "line": 61,
                "column": 5
              }
            },
            "350": {
              "source": {
                "id": "6"
              },
              "from": {
                "line": 71,
                "column": 4
              },
              "to": {
                "line": 79,
                "column": 5
              }
            },
            "365": {
              "source": {
                "id": "6"
              },
              "from": {
                "line": 88,
                "column": 4
              },
              "to": {
                "line": 95,
                "column": 5
              }
            },
            "372": {
              "source": {
                "id": "6"
              },
              "from": {
                "line": 102,
                "column": 4
              },
              "to": {
                "line": 105,
                "column": 5
              }
            },
            "383": {
              "source": {
                "id": "6"
              },
              "from": {
                "line": 112,
                "column": 4
              },
              "to": {
                "line": 112,
                "column": 116
              }
            },
            "394": {
              "source": {
                "id": "6"
              },
              "from": {
                "line": 119,
                "column": 4
              },
              "to": {
                "line": 119,
                "column": 110
              }
            },
            "395": {
              "source": {
                "id": "6"
              },
              "from": {
                "line": 5,
                "column": 0
              },
              "to": {
                "line": 120,
                "column": 0
              }
            },
            "435": {
              "source": {
                "id": "7"
              },
              "from": {
                "line": 5,
                "column": 0
              },
              "to": {
                "line": 34,
                "column": 0
              }
            },
            "461": {
              "source": {
                "id": "8"
              },
              "from": {
                "line": 5,
                "column": 0
              },
              "to": {
                "line": 22,
                "column": 0
              }
            },
            "569": {
              "source": {
                "id": "9"
              },
              "from": {
                "line": 6,
                "column": 0
              },
              "to": {
                "line": 115,
                "column": 0
              }
            },
            "699": {
              "source": {
                "id": "10"
              },
              "from": {
                "line": 5,
                "column": 0
              },
              "to": {
                "line": 45,
                "column": 0
              }
            },
            "769": {
              "source": {
                "id": "11"
              },
              "from": {
                "line": 5,
                "column": 0
              },
              "to": {
                "line": 27,
                "column": 0
              }
            },
            "1304": {
              "source": {
                "id": "12"
              },
              "from": {
                "line": 6,
                "column": 0
              },
              "to": {
                "line": 204,
                "column": 0
              }
            },
            "1394": {
              "source": {
                "id": "13"
              },
              "from": {
                "line": 50,
                "column": 4
              },
              "to": {
                "line": 53,
                "column": 4
              }
            },
            "1970": {
              "source": {
                "id": "13"
              },
              "from": {
                "line": 21,
                "column": 0
              },
              "to": {
                "line": 243,
                "column": 0
              }
            },
            "1984": {
              "source": {
                "id": "14"
              },
              "from": {
                "line": 5,
                "column": 0
              },
              "to": {
                "line": 11,
                "column": 0
              }
            },
            "2069": {
              "source": {
                "id": "15"
              },
              "from": {
                "line": 8,
                "column": 0
              },
              "to": {
                "line": 27,
                "column": 0
              }
            },
            "2100": {
              "source": {
                "id": "16"
              },
              "from": {
                "line": 7,
                "column": 0
              },
              "to": {
                "line": 17,
                "column": 0
              }
            },
            "2310": {
              "source": {
                "id": "17"
              },
              "from": {
                "line": 12,
                "column": 0
              },
              "to": {
                "line": 69,
                "column": 0
              }
            },
            "2491": {
              "source": {
                "id": "18"
              },
              "from": {
                "line": 12,
                "column": 0
              },
              "to": {
                "line": 54,
                "column": 0
              }
            },
            "2511": {
              "source": {
                "id": "19"
              },
              "from": {
                "line": 5,
                "column": 0
              },
              "to": {
                "line": 10,
                "column": 0
              }
            },
            "2678": {
              "source": {
                "id": "20"
              },
              "from": {
                "line": 13,
                "column": 0
              },
              "to": {
                "line": 62,
                "column": 0
              }
            },
            "2693": {
              "source": {
                "id": "21"
              },
              "from": {
                "line": 6,
                "column": 0
              },
              "to": {
                "line": 12,
                "column": 0
              }
            },
            "2709": {
              "source": {
                "id": "22"
              },
              "from": {
                "line": 5,
                "column": 0
              },
              "to": {
                "line": 11,
                "column": 0
              }
            },
            "2735": {
              "source": {
                "id": "23"
              },
              "from": {
                "line": 5,
                "column": 0
              },
              "to": {
                "line": 27,
                "column": 0
              }
            },
            "2768": {
              "source": {
                "id": "24"
              },
              "from": {
                "line": 7,
                "column": 0
              },
              "to": {
                "line": 28,
                "column": 0
              }
            },
            "2836": {
              "source": {
                "id": "25"
              },
              "from": {
                "line": 5,
                "column": 0
              },
              "to": {
                "line": 75,
                "column": 0
              }
            },
            "2860": {
              "source": {
                "id": "26"
              },
              "from": {
                "line": 9,
                "column": 4
              },
              "to": {
                "line": 18,
                "column": 4
              }
            },
            "2879": {
              "source": {
                "id": "26"
              },
              "from": {
                "line": 25,
                "column": 4
              },
              "to": {
                "line": 31,
                "column": 4
              }
            },
            "2904": {
              "source": {
                "id": "26"
              },
              "from": {
                "line": 38,
                "column": 4
              },
              "to": {
                "line": 47,
                "column": 4
              }
            },
            "2923": {
              "source": {
                "id": "26"
              },
              "from": {
                "line": 54,
                "column": 4
              },
              "to": {
                "line": 60,
                "column": 4
              }
            },
            "2932": {
              "source": {
                "id": "26"
              },
              "from": {
                "line": 8,
                "column": 0
              },
              "to": {
                "line": 66,
                "column": 0
              }
            },
            "2956": {
              "source": {
                "id": "27"
              },
              "from": {
                "line": 5,
                "column": 0
              },
              "to": {
                "line": 26,
                "column": 0
              }
            },
            "2973": {
              "source": {
                "id": "28"
              },
              "from": {
                "line": 6,
                "column": 0
              },
              "to": {
                "line": 12,
                "column": 0
              }
            },
            "3092": {
              "source": {
                "id": "29"
              },
              "from": {
                "line": 10,
                "column": 2
              }
            },
            "3154": {
              "source": {
                "id": "30"
              },
              "from": {
                "line": 7,
                "column": 0
              },
              "to": {
                "line": 35,
                "column": 0
              }
            },
            "3269": {
              "source": {
                "id": "31"
              },
              "from": {
                "line": 6,
                "column": 0
              },
              "to": {
                "line": 60,
                "column": 0
              }
            },
            "3282": {
              "source": {
                "id": "32"
              },
              "from": {
                "line": 8,
                "column": 4
              },
              "to": {
                "line": 12,
                "column": 4
              }
            },
            "3361": {
              "source": {
                "id": "32"
              },
              "from": {
                "line": 4,
                "column": 0
              },
              "to": {
                "line": 47,
                "column": 0
              }
            },
            "3532": {
              "source": {
                "id": "33"
              },
              "from": {
                "line": 5,
                "column": 0
              },
              "to": {
                "line": 59,
                "column": 0
              }
            }
          }
        }
      }
    },
    "desc": "Uniswap v3 swap"
  }
]