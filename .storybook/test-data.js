import { TRANSACTION_STATUSES } from '../shared/constants/transaction';

const state = {
  "invalidCustomNetwork": {
    "state": "CLOSED",
    "networkName": ""
  },
  "unconnectedAccount": {
    "state": "CLOSED"
  },
  "activeTab": {},
  "metamask": {
    "isInitialized": true,
    "isUnlocked": true,
    "isAccountMenuOpen": false,
    "rpcUrl": "https://rawtestrpc.metamask.io/",
    "identities": {
      "0x983211ce699ea5ab57cc528086154b6db1ad8e55": {
        "name": "Account 1",
        "address": "0x983211ce699ea5ab57cc528086154b6db1ad8e55"
      },
      "0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e": {
        "name": "Account 2",
        "address": "0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e"
      },
      "0x9d0ba4ddac06032527b140912ec808ab9451b788": {
        "name": "Account 3",
        "address": "0x9d0ba4ddac06032527b140912ec808ab9451b788"
      }
    },
    "unapprovedTxs": {
      "7786962153682822": {
        "id": 7786962153682822,
        "time": 1620710815484,
        "status": "unapproved",
        "metamaskNetworkId": "3",
        "chainId": "0x3",
        "loadingDefaults": false,
        "txParams": {
          "from": "0x64a845a5b02460acf8a3d84503b0d68d028b4bb4",
          "to": "0xad6d458402f60fd3bd25163575031acdce07538d",
          "value": "0x0",
          "data": "0xa9059cbb000000000000000000000000b19ac54efa18cc3a14a5b821bfec73d284bf0c5e0000000000000000000000000000000000000000000000003782dace9d900000",
          "gas": "0xcb28",
          "gasPrice": "0x77359400"
        },
        "type": "standard",
        "origin": "metamask",
        "transactionCategory": "transfer",
        "history": [
          {
            "id": 7786962153682822,
            "time": 1620710815484,
            "status": "unapproved",
            "metamaskNetworkId": "3",
            "chainId": "0x3",
            "loadingDefaults": true,
            "txParams": {
              "from": "0x64a845a5b02460acf8a3d84503b0d68d028b4bb4",
              "to": "0xad6d458402f60fd3bd25163575031acdce07538d",
              "value": "0x0",
              "data": "0xa9059cbb000000000000000000000000b19ac54efa18cc3a14a5b821bfec73d284bf0c5e0000000000000000000000000000000000000000000000003782dace9d900000",
              "gas": "0xcb28",
              "gasPrice": "0x77359400"
            },
            "type": "standard",
            "origin": "metamask",
            "transactionCategory": "transfer"
          },
          [
            {
              "op": "replace",
              "path": "/loadingDefaults",
              "value": false,
              "note": "Added new unapproved transaction.",
              "timestamp": 1620710815497
            }
          ]
        ]
      }
    },
    "frequentRpcList": [],
    "addressBook": {
      "undefined": {
        "0": {
          "address": "0x39a4e4Af7cCB654dB9500F258c64781c8FbD39F0",
          "name": "",
          "isEns": false
        }
      }
    },
    "contractExchangeRates": {
      "0xad6d458402f60fd3bd25163575031acdce07538d": 0
    },
    "tokens": [
      {
        "address": "0xad6d458402f60fd3bd25163575031acdce07538d",
        "symbol": "DAI",
        "decimals": 18
      }
    ],
    "pendingTokens": {},
    "customNonceValue": "",
    "send": {
      "gasLimit": "0xcb28",
      "gasPrice": null,
      "gasTotal": null,
      "tokenBalance": "8.7a73149c048545a3fe58",
      "from": "",
      "to": "0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e",
      "amount": "3782dace9d900000",
      "memo": "",
      "errors": {},
      "maxModeOn": false,
      "editingTransactionId": null,
      "toNickname": "Account 2",
      "ensResolution": null,
      "ensResolutionError": "",
      "token": {
        "address": "0xad6d458402f60fd3bd25163575031acdce07538d",
        "symbol": "DAI",
        "decimals": 18
      }
    },
    "useBlockie": false,
    "featureFlags": {},
    "welcomeScreenSeen": false,
    "currentLocale": "en",
    "preferences": {
      "useNativeCurrencyAsPrimaryCurrency": true
    },
    "firstTimeFlowType": "create",
    "completedOnboarding": true,
    "knownMethodData": {
      "0x60806040": {
        "name": "Approve Tokens"
      },
      "0x095ea7b3": {
        "name": "Approve Tokens"
      }
    },
    "participateInMetaMetrics": true,
    "metaMetricsSendCount": 2,
    "nextNonce": 71,
    "connectedStatusPopoverHasBeenShown": true,
    "swapsWelcomeMessageHasBeenShown": true,
    "defaultHomeActiveTabName": "Assets",
    "provider": {
      "type": "ropsten",
      "ticker": "ETH",
      "nickname": "",
      "rpcUrl": "",
      "chainId": "0x3"
    },
    "previousProviderStore": {
      "type": "ropsten",
      "ticker": "ETH",
      "nickname": "",
      "rpcUrl": "",
      "chainId": "0x3"
    },
    "network": "3",
    "accounts": {
      "0x983211ce699ea5ab57cc528086154b6db1ad8e55": {
        "address": "0x983211ce699ea5ab57cc528086154b6db1ad8e55",
        "balance": "0x176e5b6f173ebe66"
      },
      "0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e": {
        "address": "0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e",
        "balance": "0x2d3142f5000"
      },
      "0x9d0ba4ddac06032527b140912ec808ab9451b788": {
        "address": "0x9d0ba4ddac06032527b140912ec808ab9451b788",
        "balance": "0x15f6f0b9d4f8d000"
      }
    },
    "currentBlockGasLimit": "0x793af4",
    "currentNetworkTxList": [
      {
        "id": 1906703652727041,
        "time": 1553838926044,
        "status": "confirmed",
        "metamaskNetworkId": "3",
        "loadingDefaults": false,
        "txParams": {
          "from": "0xf16346af1bb21803f92ffc2bf2fe9998b8e8ce96",
          "to": "0x39a4e4af7ccb654db9500f258c64781c8fbd39f0",
          "value": "0x16345785d8a0000",
          "gas": "0x73f780",
          "gasPrice": "0x2540be400",
          "nonce": "0x0"
        },
        "type": "standard",
        "history": [
          {
            "id": 1906703652727041,
            "time": 1553838926044,
            "status": "unapproved",
            "metamaskNetworkId": "3",
            "loadingDefaults": true,
            "txParams": {
              "from": "0xf16346af1bb21803f92ffc2bf2fe9998b8e8ce96",
              "to": "0x39a4e4af7ccb654db9500f258c64781c8fbd39f0",
              "value": "0x16345785d8a0000",
              "gas": "0x73f780",
              "gasPrice": "0x2540be400"
            },
            "type": "standard"
          },
          [
            {
              "op": "replace",
              "path": "/loadingDefaults",
              "value": false,
              "timestamp": 1553838926157
            },
            {
              "op": "add",
              "path": "/gasPriceSpecified",
              "value": true
            },
            {
              "op": "add",
              "path": "/gasLimitSpecified",
              "value": true
            },
            {
              "op": "add",
              "path": "/estimatedGas",
              "value": "0x73f780"
            }
          ],
          [
            {
              "op": "add",
              "path": "/origin",
              "value": "MetaMask",
              "note": "#newUnapprovedTransaction - adding the origin",
              "timestamp": 1553838926159
            }
          ],
          [],
          [
            {
              "op": "replace",
              "path": "/status",
              "value": "approved",
              "note": "txStateManager: setting status to approved",
              "timestamp": 1553838927535
            }
          ],
          [
            {
              "op": "add",
              "path": "/txParams/nonce",
              "value": "0x0",
              "note": "transactions#approveTransaction",
              "timestamp": 1553838927896
            },
            {
              "op": "add",
              "path": "/nonceDetails",
              "value": {
                "params": {
                  "highestLocallyConfirmed": 0,
                  "highestSuggested": 0,
                  "nextNetworkNonce": 0
                },
                "local": {
                  "name": "local",
                  "nonce": 0,
                  "details": {
                    "startPoint": 0,
                    "highest": 0
                  }
                },
                "network": {
                  "name": "network",
                  "nonce": 0,
                  "details": {
                    "blockNumber": "0x50d73b",
                    "baseCount": 0
                  }
                }
              }
            }
          ],
          [
            {
              "op": "replace",
              "path": "/status",
              "value": "signed",
              "note": "transactions#publishTransaction",
              "timestamp": 1553838927998
            },
            {
              "op": "add",
              "path": "/rawTx",
              "value": "0xf86d808502540be4008373f7809439a4e4af7ccb654db9500f258c64781c8fbd39f088016345785d8a0000802aa00bdac6289397d679cdd8c103a55624c652bce8922e7a0281ee8b2d374a04d2c1a06b11052ba9ac8237a30f52e676b09ad42e242803c4c4c3fe1efa3adb22b9bad7"
            }
          ],
          [],
          [
            {
              "op": "add",
              "path": "/hash",
              "value": "0x2e3d17fb649fda62b14135d6f42c0512904a14853a2c2477d41383ff82185178",
              "note": "transactions#setTxHash",
              "timestamp": 1553838928455
            }
          ],
          [
            {
              "op": "add",
              "path": "/submittedTime",
              "value": 1553838928461,
              "note": "txStateManager - add submitted time stamp",
              "timestamp": 1553838928467
            }
          ],
          [
            {
              "op": "replace",
              "path": "/status",
              "value": "submitted",
              "note": "txStateManager: setting status to submitted",
              "timestamp": 1553838928487
            }
          ],
          [
            {
              "op": "add",
              "path": "/firstRetryBlockNumber",
              "value": "0x50d73d",
              "note": "transactions/pending-tx-tracker#event: tx:block-update",
              "timestamp": 1553838933344
            }
          ],
          [
            {
              "op": "add",
              "path": "/txReceipt",
              "value": {
                "blockHash": "0x60ff8434b5afca720c2787f6794552355ed220477c02e58ebddcb24e218c949d",
                "blockNumber": "50d73d",
                "contractAddress": null,
                "cumulativeGasUsed": "176e6",
                "from": "0xf16346af1bb21803f92ffc2bf2fe9998b8e8ce96",
                "gasUsed": "535e",
                "logs": [],
                "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
                "status": "0x0",
                "to": "0x39a4e4af7ccb654db9500f258c64781c8fbd39f0",
                "transactionHash": "0x2e3d17fb649fda62b14135d6f42c0512904a14853a2c2477d41383ff82185178",
                "transactionIndex": "1"
              },
              "note": "transactions#confirmTransaction - add txReceipt",
              "timestamp": 1553838933688
            }
          ],
          [
            {
              "op": "replace",
              "path": "/txReceipt/transactionIndex",
              "value": "1",
              "note": "transactions#confirmTransaction - add txReceipt",
              "timestamp": 1553838933693
            },
            {
              "op": "replace",
              "path": "/txReceipt/cumulativeGasUsed",
              "value": "176e6"
            },
            {
              "op": "replace",
              "path": "/txReceipt/blockNumber",
              "value": "50d73d"
            },
            {
              "op": "replace",
              "path": "/status",
              "value": "confirmed"
            }
          ],
          [
            {
              "op": "replace",
              "path": "/txReceipt/transactionIndex",
              "value": "1",
              "note": "txStateManager: setting status to confirmed",
              "timestamp": 1553838933696
            },
            {
              "op": "replace",
              "path": "/txReceipt/cumulativeGasUsed",
              "value": "176e6"
            },
            {
              "op": "replace",
              "path": "/txReceipt/blockNumber",
              "value": "50d73d"
            }
          ],
          [
            {
              "op": "replace",
              "path": "/txReceipt/transactionIndex",
              "value": "1",
              "note": "txStateManager: setting status to confirmed",
              "timestamp": 1553838933706
            },
            {
              "op": "replace",
              "path": "/txReceipt/cumulativeGasUsed",
              "value": "176e6"
            },
            {
              "op": "replace",
              "path": "/txReceipt/blockNumber",
              "value": "50d73d"
            }
          ]
        ],
        "gasPriceSpecified": true,
        "gasLimitSpecified": true,
        "estimatedGas": "0x73f780",
        "origin": "https://metamask.github.io",
        "nonceDetails": {
          "params": {
            "highestLocallyConfirmed": 0,
            "highestSuggested": 0,
            "nextNetworkNonce": 0
          },
          "local": {
            "name": "local",
            "nonce": 0,
            "details": {
              "startPoint": 0,
              "highest": 0
            }
          },
          "network": {
            "name": "network",
            "nonce": 0,
            "details": {
              "blockNumber": "0x50d73b",
              "baseCount": 0
            }
          }
        },
        "rawTx": "0xf86d808502540be4008373f7809439a4e4af7ccb654db9500f258c64781c8fbd39f088016345785d8a0000802aa00bdac6289397d679cdd8c103a55624c652bce8922e7a0281ee8b2d374a04d2c1a06b11052ba9ac8237a30f52e676b09ad42e242803c4c4c3fe1efa3adb22b9bad7",
        "hash": "0x2e3d17fb649fda62b14135d6f42c0512904a14853a2c2477d41383ff82185178",
        "submittedTime": 1553838928461,
        "firstRetryBlockNumber": "0x50d73d",
        "txReceipt": {
          "blockHash": "0x60ff8434b5afca720c2787f6794552355ed220477c02e58ebddcb24e218c949d",
          "blockNumber": {
            "negative": 0,
            "words": [
              5297981
            ],
            "length": 1,
            "red": null
          },
          "contractAddress": null,
          "cumulativeGasUsed": {
            "negative": 0,
            "words": [
              95974
            ],
            "length": 1,
            "red": null
          },
          "from": "0xf16346af1bb21803f92ffc2bf2fe9998b8e8ce96",
          "gasUsed": "535e",
          "logs": [],
          "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
          "status": "0x0",
          "to": "0x39a4e4af7ccb654db9500f258c64781c8fbd39f0",
          "transactionHash": "0x2e3d17fb649fda62b14135d6f42c0512904a14853a2c2477d41383ff82185178",
          "transactionIndex": {
            "negative": 0,
            "words": [
              1
            ],
            "length": 1,
            "red": null
          }
        }
      },
      {
        "id": 7786962153682821,
        "time": 1620710712088,
        "status": "confirmed",
        "metamaskNetworkId": "3",
        "chainId": "0x3",
        "loadingDefaults": false,
        "txParams": {
          "from": "0x64a845a5b02460acf8a3d84503b0d68d028b4bb4",
          "to": "0xe592427a0aece92de3edee1f18e0157c05861564",
          "nonce": "0x46",
          "value": "0x16345785d8a0000",
          "data": "0x414bf389000000000000000000000000c778417e063141139fce010982780140aa0cd5ab000000000000000000000000ad6d458402f60fd3bd25163575031acdce07538d000000000000000000000000000000000000000000000000000000000000271000000000000000000000000064a845a5b02460acf8a3d84503b0d68d028b4bb400000000000000000000000000000000000000000000000000000000609a19c1000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000758af2769f88f49b0000000000000000000000000000000000000000000000000000000000000000",
          "gas": "0x28b28",
          "gasPrice": "0x77359400"
        },
        "type": "standard",
        "origin": "https://app.uniswap.org",
        "transactionCategory": "contractInteraction",
        "history": [
          {
            "id": 7786962153682821,
            "time": 1620710712088,
            "status": "unapproved",
            "metamaskNetworkId": "3",
            "chainId": "0x3",
            "loadingDefaults": true,
            "txParams": {
              "from": "0x64a845a5b02460acf8a3d84503b0d68d028b4bb4",
              "to": "0xe592427a0aece92de3edee1f18e0157c05861564",
              "value": "0x16345785d8a0000",
              "data": "0x414bf389000000000000000000000000c778417e063141139fce010982780140aa0cd5ab000000000000000000000000ad6d458402f60fd3bd25163575031acdce07538d000000000000000000000000000000000000000000000000000000000000271000000000000000000000000064a845a5b02460acf8a3d84503b0d68d028b4bb400000000000000000000000000000000000000000000000000000000609a19c1000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000758af2769f88f49b0000000000000000000000000000000000000000000000000000000000000000",
              "gas": "0x28b28"
            },
            "type": "standard",
            "origin": "https://app.uniswap.org",
            "transactionCategory": "contractInteraction"
          },
          [
            {
              "op": "add",
              "path": "/txParams/gasPrice",
              "value": "0x77359400",
              "note": "Added new unapproved transaction.",
              "timestamp": 1620710713248
            },
            {
              "op": "replace",
              "path": "/loadingDefaults",
              "value": false
            }
          ],
          [
            {
              "op": "replace",
              "path": "/status",
              "value": "approved",
              "note": "txStateManager: setting status to approved",
              "timestamp": 1620710721750
            }
          ],
          [
            {
              "op": "add",
              "path": "/txParams/nonce",
              "value": "0x46",
              "note": "transactions#approveTransaction",
              "timestamp": 1620710721758
            },
            {
              "op": "add",
              "path": "/nonceDetails",
              "value": {
                "params": {
                  "highestLocallyConfirmed": 0,
                  "highestSuggested": 70,
                  "nextNetworkNonce": 70
                },
                "local": {
                  "name": "local",
                  "nonce": 70,
                  "details": {
                    "startPoint": 70,
                    "highest": 70
                  }
                },
                "network": {
                  "name": "network",
                  "nonce": 70,
                  "details": {
                    "blockNumber": "0x9bd392",
                    "baseCount": 70
                  }
                }
              }
            }
          ],
          [
            {
              "op": "add",
              "path": "/r",
              "value": "0xb0f6e9f5028f6466c84d9408249d5a90f3447068bcb15379875c8759a7183d88",
              "note": "transactions#signTransaction: add r, s, v values",
              "timestamp": 1620710721876
            },
            {
              "op": "add",
              "path": "/s",
              "value": "0x4cb2f35f1faa3395fc49d657f10ee1e51db7b0057c5d357420fa1862e20b0021"
            },
            {
              "op": "add",
              "path": "/v",
              "value": "0x2a"
            }
          ],
          [
            {
              "op": "replace",
              "path": "/status",
              "value": "signed",
              "note": "txStateManager: setting status to signed",
              "timestamp": 1620710721884
            }
          ],
          [
            {
              "op": "add",
              "path": "/rawTx",
              "value": "0xf9017246847735940083028b2894e592427a0aece92de3edee1f18e0157c0586156488016345785d8a0000b90104414bf389000000000000000000000000c778417e063141139fce010982780140aa0cd5ab000000000000000000000000ad6d458402f60fd3bd25163575031acdce07538d000000000000000000000000000000000000000000000000000000000000271000000000000000000000000064a845a5b02460acf8a3d84503b0d68d028b4bb400000000000000000000000000000000000000000000000000000000609a19c1000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000758af2769f88f49b00000000000000000000000000000000000000000000000000000000000000002aa0b0f6e9f5028f6466c84d9408249d5a90f3447068bcb15379875c8759a7183d88a04cb2f35f1faa3395fc49d657f10ee1e51db7b0057c5d357420fa1862e20b0021",
              "note": "transactions#publishTransaction",
              "timestamp": 1620710721887
            }
          ],
          [
            {
              "op": "add",
              "path": "/hash",
              "value": "0xd39f4f513741152ac3af0c863b30eae5ede8b2d393f28ccd2cc590d2501393f4",
              "note": "transactions#setTxHash",
              "timestamp": 1620710722261
            }
          ],
          [
            {
              "op": "add",
              "path": "/submittedTime",
              "value": 1620710722262,
              "note": "txStateManager - add submitted time stamp",
              "timestamp": 1620710722275
            }
          ],
          [
            {
              "op": "replace",
              "path": "/status",
              "value": "submitted",
              "note": "txStateManager: setting status to submitted",
              "timestamp": 1620710722277
            }
          ],
          [
            {
              "op": "add",
              "path": "/firstRetryBlockNumber",
              "value": "0x9bd393",
              "note": "transactions/pending-tx-tracker#event: tx:block-update",
              "timestamp": 1620710724922
            }
          ],
          [
            {
              "op": "add",
              "path": "/warning",
              "value": {
                "error": "[ethjs-query] while formatting outputs from rpc '{\"value\":{\"code\":-32000,\"message\":\"already known\"}}'",
                "message": "There was an error when resubmitting this transaction."
              },
              "note": "transactions/pending-tx-tracker#event: tx:warning",
              "timestamp": 1620710752072
            }
          ],
          [
            {
              "op": "replace",
              "path": "/status",
              "value": "confirmed",
              "note": "txStateManager: setting status to confirmed",
              "timestamp": 1620710771188
            },
            {
              "op": "add",
              "path": "/txReceipt",
              "value": {
                "blockHash": "0xc7e0e8ba643e07c426d73fd925819731b3ee7c6e0571e85502f7c9b57851f5b8",
                "blockNumber": "9bd395",
                "contractAddress": null,
                "cumulativeGasUsed": "b2b06",
                "from": "0x64a845a5b02460acf8a3d84503b0d68d028b4bb4",
                "gasUsed": "1f434",
                "logs": [
                  {
                    "address": "0xad6d458402f60fd3bd25163575031acdce07538d",
                    "blockHash": "0xc7e0e8ba643e07c426d73fd925819731b3ee7c6e0571e85502f7c9b57851f5b8",
                    "blockNumber": "9bd395",
                    "data": "0x00000000000000000000000000000000000000000000000075a909beef0df4da",
                    "logIndex": "b",
                    "removed": false,
                    "topics": [
                      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                      "0x00000000000000000000000090b07e2096098f77d7cebb6c03a3537ae2b89d5e",
                      "0x00000000000000000000000064a845a5b02460acf8a3d84503b0d68d028b4bb4"
                    ],
                    "transactionHash": "0xd39f4f513741152ac3af0c863b30eae5ede8b2d393f28ccd2cc590d2501393f4",
                    "transactionIndex": "b"
                  },
                  {
                    "address": "0xc778417e063141139fce010982780140aa0cd5ab",
                    "blockHash": "0xc7e0e8ba643e07c426d73fd925819731b3ee7c6e0571e85502f7c9b57851f5b8",
                    "blockNumber": "9bd395",
                    "data": "0x000000000000000000000000000000000000000000000000016345785d8a0000",
                    "logIndex": "c",
                    "removed": false,
                    "topics": [
                      "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c",
                      "0x000000000000000000000000e592427a0aece92de3edee1f18e0157c05861564"
                    ],
                    "transactionHash": "0xd39f4f513741152ac3af0c863b30eae5ede8b2d393f28ccd2cc590d2501393f4",
                    "transactionIndex": "b"
                  },
                  {
                    "address": "0xc778417e063141139fce010982780140aa0cd5ab",
                    "blockHash": "0xc7e0e8ba643e07c426d73fd925819731b3ee7c6e0571e85502f7c9b57851f5b8",
                    "blockNumber": "9bd395",
                    "data": "0x000000000000000000000000000000000000000000000000016345785d8a0000",
                    "logIndex": "d",
                    "removed": false,
                    "topics": [
                      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                      "0x000000000000000000000000e592427a0aece92de3edee1f18e0157c05861564",
                      "0x00000000000000000000000090b07e2096098f77d7cebb6c03a3537ae2b89d5e"
                    ],
                    "transactionHash": "0xd39f4f513741152ac3af0c863b30eae5ede8b2d393f28ccd2cc590d2501393f4",
                    "transactionIndex": "b"
                  },
                  {
                    "address": "0x90b07e2096098f77d7cebb6c03a3537ae2b89d5e",
                    "blockHash": "0xc7e0e8ba643e07c426d73fd925819731b3ee7c6e0571e85502f7c9b57851f5b8",
                    "blockNumber": "9bd395",
                    "data": "0xffffffffffffffffffffffffffffffffffffffffffffffff8a56f64110f20b26000000000000000000000000000000000000000000000000016345785d8a000000000000000000000000000000000000000000001badbb8b801b2396c0e8c03f00000000000000000000000000000000000000000000002c8c22b01119acf9c1ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff5233",
                    "logIndex": "e",
                    "removed": false,
                    "topics": [
                      "0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67",
                      "0x000000000000000000000000e592427a0aece92de3edee1f18e0157c05861564",
                      "0x00000000000000000000000064a845a5b02460acf8a3d84503b0d68d028b4bb4"
                    ],
                    "transactionHash": "0xd39f4f513741152ac3af0c863b30eae5ede8b2d393f28ccd2cc590d2501393f4",
                    "transactionIndex": "b"
                  }
                ],
                "logsBloom": "0x00004002000000000000000000000000000000004000000000000020001000000000000000010000100000000000000000000000000020000000000000000000040000000000000800000008000000000000000000000000000000008000000000000000000000000000100000000000000004000000000000000010000800002000000000000000000000000000000000000003000000000000000000000000000000000040000000000000800000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000002000000000400000002000000001",
                "status": "0x1",
                "to": "0xe592427a0aece92de3edee1f18e0157c05861564",
                "transactionHash": "0xd39f4f513741152ac3af0c863b30eae5ede8b2d393f28ccd2cc590d2501393f4",
                "transactionIndex": "b",
                "type": "0x0"
              }
            }
          ],
          [
            {
              "op": "replace",
              "path": "/txReceipt/transactionIndex",
              "value": "b",
              "note": "transactions#confirmTransaction - add txReceipt",
              "timestamp": 1620710771204
            },
            {
              "op": "replace",
              "path": "/txReceipt/logs/3/transactionIndex",
              "value": "b"
            },
            {
              "op": "replace",
              "path": "/txReceipt/logs/3/logIndex",
              "value": "e"
            },
            {
              "op": "replace",
              "path": "/txReceipt/logs/3/blockNumber",
              "value": "9bd395"
            },
            {
              "op": "replace",
              "path": "/txReceipt/logs/2/transactionIndex",
              "value": "b"
            },
            {
              "op": "replace",
              "path": "/txReceipt/logs/2/logIndex",
              "value": "d"
            },
            {
              "op": "replace",
              "path": "/txReceipt/logs/2/blockNumber",
              "value": "9bd395"
            },
            {
              "op": "replace",
              "path": "/txReceipt/logs/1/transactionIndex",
              "value": "b"
            },
            {
              "op": "replace",
              "path": "/txReceipt/logs/1/logIndex",
              "value": "c"
            },
            {
              "op": "replace",
              "path": "/txReceipt/logs/1/blockNumber",
              "value": "9bd395"
            },
            {
              "op": "replace",
              "path": "/txReceipt/logs/0/transactionIndex",
              "value": "b"
            },
            {
              "op": "replace",
              "path": "/txReceipt/logs/0/logIndex",
              "value": "b"
            },
            {
              "op": "replace",
              "path": "/txReceipt/logs/0/blockNumber",
              "value": "9bd395"
            },
            {
              "op": "replace",
              "path": "/txReceipt/cumulativeGasUsed",
              "value": "b2b06"
            },
            {
              "op": "replace",
              "path": "/txReceipt/blockNumber",
              "value": "9bd395"
            }
          ]
        ],
        "nonceDetails": {
          "params": {
            "highestLocallyConfirmed": 0,
            "highestSuggested": 70,
            "nextNetworkNonce": 70
          },
          "local": {
            "name": "local",
            "nonce": 70,
            "details": {
              "startPoint": 70,
              "highest": 70
            }
          },
          "network": {
            "name": "network",
            "nonce": 70,
            "details": {
              "blockNumber": "0x9bd392",
              "baseCount": 70
            }
          }
        },
        "r": "0xb0f6e9f5028f6466c84d9408249d5a90f3447068bcb15379875c8759a7183d88",
        "s": "0x4cb2f35f1faa3395fc49d657f10ee1e51db7b0057c5d357420fa1862e20b0021",
        "v": "0x2a",
        "rawTx": "0xf9017246847735940083028b2894e592427a0aece92de3edee1f18e0157c0586156488016345785d8a0000b90104414bf389000000000000000000000000c778417e063141139fce010982780140aa0cd5ab000000000000000000000000ad6d458402f60fd3bd25163575031acdce07538d000000000000000000000000000000000000000000000000000000000000271000000000000000000000000064a845a5b02460acf8a3d84503b0d68d028b4bb400000000000000000000000000000000000000000000000000000000609a19c1000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000758af2769f88f49b00000000000000000000000000000000000000000000000000000000000000002aa0b0f6e9f5028f6466c84d9408249d5a90f3447068bcb15379875c8759a7183d88a04cb2f35f1faa3395fc49d657f10ee1e51db7b0057c5d357420fa1862e20b0021",
        "hash": "0xd39f4f513741152ac3af0c863b30eae5ede8b2d393f28ccd2cc590d2501393f4",
        "submittedTime": 1620710722262,
        "firstRetryBlockNumber": "0x9bd393",
        "warning": {
          "error": "[ethjs-query] while formatting outputs from rpc '{\"value\":{\"code\":-32000,\"message\":\"already known\"}}'",
          "message": "There was an error when resubmitting this transaction."
        },
        "txReceipt": {
          "blockHash": "0xc7e0e8ba643e07c426d73fd925819731b3ee7c6e0571e85502f7c9b57851f5b8",
          "blockNumber": "9bd395",
          "contractAddress": null,
          "cumulativeGasUsed": "b2b06",
          "from": "0x64a845a5b02460acf8a3d84503b0d68d028b4bb4",
          "gasUsed": "1f434",
          "logs": [
            {
              "address": "0xad6d458402f60fd3bd25163575031acdce07538d",
              "blockHash": "0xc7e0e8ba643e07c426d73fd925819731b3ee7c6e0571e85502f7c9b57851f5b8",
              "blockNumber": "9bd395",
              "data": "0x00000000000000000000000000000000000000000000000075a909beef0df4da",
              "logIndex": "b",
              "removed": false,
              "topics": [
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                "0x00000000000000000000000090b07e2096098f77d7cebb6c03a3537ae2b89d5e",
                "0x00000000000000000000000064a845a5b02460acf8a3d84503b0d68d028b4bb4"
              ],
              "transactionHash": "0xd39f4f513741152ac3af0c863b30eae5ede8b2d393f28ccd2cc590d2501393f4",
              "transactionIndex": "b"
            },
            {
              "address": "0xc778417e063141139fce010982780140aa0cd5ab",
              "blockHash": "0xc7e0e8ba643e07c426d73fd925819731b3ee7c6e0571e85502f7c9b57851f5b8",
              "blockNumber": "9bd395",
              "data": "0x000000000000000000000000000000000000000000000000016345785d8a0000",
              "logIndex": "c",
              "removed": false,
              "topics": [
                "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c",
                "0x000000000000000000000000e592427a0aece92de3edee1f18e0157c05861564"
              ],
              "transactionHash": "0xd39f4f513741152ac3af0c863b30eae5ede8b2d393f28ccd2cc590d2501393f4",
              "transactionIndex": "b"
            },
            {
              "address": "0xc778417e063141139fce010982780140aa0cd5ab",
              "blockHash": "0xc7e0e8ba643e07c426d73fd925819731b3ee7c6e0571e85502f7c9b57851f5b8",
              "blockNumber": "9bd395",
              "data": "0x000000000000000000000000000000000000000000000000016345785d8a0000",
              "logIndex": "d",
              "removed": false,
              "topics": [
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                "0x000000000000000000000000e592427a0aece92de3edee1f18e0157c05861564",
                "0x00000000000000000000000090b07e2096098f77d7cebb6c03a3537ae2b89d5e"
              ],
              "transactionHash": "0xd39f4f513741152ac3af0c863b30eae5ede8b2d393f28ccd2cc590d2501393f4",
              "transactionIndex": "b"
            },
            {
              "address": "0x90b07e2096098f77d7cebb6c03a3537ae2b89d5e",
              "blockHash": "0xc7e0e8ba643e07c426d73fd925819731b3ee7c6e0571e85502f7c9b57851f5b8",
              "blockNumber": "9bd395",
              "data": "0xffffffffffffffffffffffffffffffffffffffffffffffff8a56f64110f20b26000000000000000000000000000000000000000000000000016345785d8a000000000000000000000000000000000000000000001badbb8b801b2396c0e8c03f00000000000000000000000000000000000000000000002c8c22b01119acf9c1ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff5233",
              "logIndex": "e",
              "removed": false,
              "topics": [
                "0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67",
                "0x000000000000000000000000e592427a0aece92de3edee1f18e0157c05861564",
                "0x00000000000000000000000064a845a5b02460acf8a3d84503b0d68d028b4bb4"
              ],
              "transactionHash": "0xd39f4f513741152ac3af0c863b30eae5ede8b2d393f28ccd2cc590d2501393f4",
              "transactionIndex": "b"
            }
          ],
          "logsBloom": "0x00004002000000000000000000000000000000004000000000000020001000000000000000010000100000000000000000000000000020000000000000000000040000000000000800000008000000000000000000000000000000008000000000000000000000000000100000000000000004000000000000000010000800002000000000000000000000000000000000000003000000000000000000000000000000000040000000000000800000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000002000000000400000002000000001",
          "status": "0x1",
          "to": "0xe592427a0aece92de3edee1f18e0157c05861564",
          "transactionHash": "0xd39f4f513741152ac3af0c863b30eae5ede8b2d393f28ccd2cc590d2501393f4",
          "transactionIndex": "b",
          "type": "0x0"
        }
      },
      {
        "id": 7786962153682822,
        "time": 1620710815484,
        "status": "unapproved",
        "metamaskNetworkId": "3",
        "chainId": "0x3",
        "loadingDefaults": false,
        "txParams": {
          "from": "0x64a845a5b02460acf8a3d84503b0d68d028b4bb4",
          "to": "0xad6d458402f60fd3bd25163575031acdce07538d",
          "value": "0x0",
          "data": "0xa9059cbb000000000000000000000000b19ac54efa18cc3a14a5b821bfec73d284bf0c5e0000000000000000000000000000000000000000000000003782dace9d900000",
          "gas": "0xcb28",
          "gasPrice": "0x77359400"
        },
        "type": "standard",
        "origin": "metamask",
        "transactionCategory": "transfer",
        "history": [
          {
            "id": 7786962153682822,
            "time": 1620710815484,
            "status": "unapproved",
            "metamaskNetworkId": "3",
            "chainId": "0x3",
            "loadingDefaults": true,
            "txParams": {
              "from": "0x64a845a5b02460acf8a3d84503b0d68d028b4bb4",
              "to": "0xad6d458402f60fd3bd25163575031acdce07538d",
              "value": "0x0",
              "data": "0xa9059cbb000000000000000000000000b19ac54efa18cc3a14a5b821bfec73d284bf0c5e0000000000000000000000000000000000000000000000003782dace9d900000",
              "gas": "0xcb28",
              "gasPrice": "0x77359400"
            },
            "type": "standard",
            "origin": "metamask",
            "transactionCategory": "transfer"
          },
          [
            {
              "op": "replace",
              "path": "/loadingDefaults",
              "value": false,
              "note": "Added new unapproved transaction.",
              "timestamp": 1620710815497
            }
          ]
        ]
      }
    ],
    "cachedBalances": {
      "1": {
        "0x64a845a5b02460acf8a3d84503b0d68d028b4bb4": "0x0",
        "0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e": "0xcaf5317161f400",
        "0x9d0ba4ddac06032527b140912ec808ab9451b788": "0x0"
      },
      "3": {
        "0x64a845a5b02460acf8a3d84503b0d68d028b4bb4": "0x18d289d450bace66",
        "0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e": "0x2d3142f5000",
        "0x9d0ba4ddac06032527b140912ec808ab9451b788": "0x15f6f0b9d4f8d000"
      },
      "0x3": {
        "0x64a845a5b02460acf8a3d84503b0d68d028b4bb4": "0x176e5b6f173ebe66",
        "0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e": "0x2d3142f5000",
        "0x9d0ba4ddac06032527b140912ec808ab9451b788": "0x15f6f0b9d4f8d000"
      }
    },
    "unapprovedMsgs": {},
    "unapprovedMsgCount": 0,
    "unapprovedPersonalMsgs": {},
    "unapprovedPersonalMsgCount": 0,
    "unapprovedDecryptMsgs": {},
    "unapprovedDecryptMsgCount": 0,
    "unapprovedEncryptionPublicKeyMsgs": {},
    "unapprovedEncryptionPublicKeyMsgCount": 0,
    "unapprovedTypedMessages": {},
    "unapprovedTypedMessagesCount": 0,
    "keyringTypes": [
      "Simple Key Pair",
      "HD Key Tree",
      "Trezor Hardware",
      "Ledger Hardware"
    ],
    "keyrings": [
      {
        "type": "HD Key Tree",
        "accounts": [
          "0x64a845a5b02460acf8a3d84503b0d68d028b4bb4",
          "0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e",
          "0x9d0ba4ddac06032527b140912ec808ab9451b788"
        ]
      }
    ],
    "frequentRpcListDetail": [
      {
        "rpcUrl": "http://localhost:8545",
        "chainId": "0x539",
        "ticker": "ETH",
        "nickname": "Localhost 8545",
        "rpcPrefs": {}
      }
    ],
    "accountTokens": {
      "0x64a845a5b02460acf8a3d84503b0d68d028b4bb4": {
        "0x1": [
          {
            "address": "0x6b175474e89094c44da98b954eedeac495271d0f",
            "symbol": "DAI",
            "decimals": 18
          },
          {
            "address": "0x0d8775f648430679a709e98d2b0cb6250d2887ef",
            "symbol": "BAT",
            "decimals": 18
          }
        ],
        "0x3": [
          {
            "address": "0xad6d458402f60fd3bd25163575031acdce07538d",
            "symbol": "DAI",
            "decimals": 18
          }
        ]
      },
      "0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e": {},
      "0x9d0ba4ddac06032527b140912ec808ab9451b788": {}
    },
    "accountHiddenTokens": {
      "0x64a845a5b02460acf8a3d84503b0d68d028b4bb4": {
        "0x3": []
      }
    },
    "assetImages": {
      "0xad6d458402f60fd3bd25163575031acdce07538d": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xaD6D458402F60fD3Bd25163575031ACDce07538D/logo.png"
    },
    "hiddenTokens": [],
    "suggestedTokens": {},
    "useNonceField": false,
    "usePhishDetect": true,
    "lostIdentities": {},
    "forgottenPassword": false,
    "ipfsGateway": "dweb.link",
    "infuraBlocked": false,
    "migratedPrivacyMode": false,
    "selectedAddress": "0x64a845a5b02460acf8a3d84503b0d68d028b4bb4",
    "metaMetricsId": "0xc2377d11fec1c3b7dd88c4854240ee5e3ed0d9f63b00456d98d80320337b827f",
    "conversionDate": 1620710825.03,
    "conversionRate": 3910.28,
    "currentCurrency": "usd",
    "nativeCurrency": "ETH",
    "usdConversionRate": 3910.28,
    "ticker": "ETH",
    "alertEnabledness": {
      "unconnectedAccount": true,
      "web3ShimUsage": true
    },
    "unconnectedAccountAlertShownOrigins": {},
    "web3ShimUsageOrigins": {},
    "seedPhraseBackedUp": null,
    "onboardingTabs": {},
    "incomingTransactions": {
      "0x2de9256a7c604586f7ecfd87ae9509851e217f588f9f85feed793c54ed2ce0aa": {
        "blockNumber": "8888976",
        "id": 4678200543090532,
        "metamaskNetworkId": "1",
        "status": "confirmed",
        "time": 1573114896000,
        "txParams": {
          "from": "0x3f1b52850109023775d238c7ed5d5e7161041fd1",
          "gas": "0x5208",
          "gasPrice": "0x124101100",
          "nonce": "0x35",
          "to": "0x045c619e4d29bba3b92769508831b681b83d6a96",
          "value": "0xbca9bce4d98ca3"
        },
        "hash": "0x2de9256a7c604586f7ecfd87ae9509851e217f588f9f85feed793c54ed2ce0aa",
        "transactionCategory": "incoming"
      },
      "0x320a1fd769373578f78570e5d8f56e89bc7bce9657bb5f4c12d8fe790d471bfd": {
        "blockNumber": "9453174",
        "id": 4678200543090535,
        "metamaskNetworkId": "1",
        "status": "confirmed",
        "time": 1581312411000,
        "txParams": {
          "from": "0xa17bd07d6d38cb9e37b29f7659a4b1047701e969",
          "gas": "0xc350",
          "gasPrice": "0x1a13b8600",
          "nonce": "0x0",
          "to": "0x045c619e4d29bba3b92769508831b681b83d6a96",
          "value": "0xcdb08ab4254000"
        },
        "hash": "0x320a1fd769373578f78570e5d8f56e89bc7bce9657bb5f4c12d8fe790d471bfd",
        "transactionCategory": "incoming"
      },
      "0x8add6c1ea089a8de9b15fa2056b1875360f17916755c88ace9e5092b7a4b1239": {
        "blockNumber": "10892417",
        "id": 4678200543090542,
        "metamaskNetworkId": "1",
        "status": "confirmed",
        "time": 1600515224000,
        "txParams": {
          "from": "0x0681d8db095565fe8a346fa0277bffde9c0edbbf",
          "gas": "0x5208",
          "gasPrice": "0x1d1a94a200",
          "nonce": "0x2bb8a5",
          "to": "0x045c619e4d29bba3b92769508831b681b83d6a96",
          "value": "0xe6ed27d6668000"
        },
        "hash": "0x8add6c1ea089a8de9b15fa2056b1875360f17916755c88ace9e5092b7a4b1239",
        "transactionCategory": "incoming"
      },
      "0x50be62ab1cabd03ff104c602c11fdef7a50f3d73c55006d5583ba97950ab1144": {
        "blockNumber": "10902987",
        "id": 4678200543090545,
        "metamaskNetworkId": "1",
        "status": "confirmed",
        "time": 1600654021000,
        "txParams": {
          "from": "0x64a845a5b02460acf8a3d84503b0d68d028b4bb4",
          "gas": "0x5208",
          "gasPrice": "0x147d357000",
          "nonce": "0xf",
          "to": "0x045c619e4d29bba3b92769508831b681b83d6a96",
          "value": "0x63eb89da4ed00000"
        },
        "hash": "0x50be62ab1cabd03ff104c602c11fdef7a50f3d73c55006d5583ba97950ab1144",
        "transactionCategory": "incoming"
      }
    },
    "incomingTxLastFetchedBlocksByNetwork": {
      "ropsten": 8872820,
      "rinkeby": null,
      "kovan": null,
      "goerli": null,
      "mainnet": 10902989
    },
    "permissionsRequests": [],
    "permissionsDescriptions": {},
    "domains": {
      "https://app.uniswap.org": {
        "permissions": [
          {
            "@context": [
              "https://github.com/MetaMask/rpc-cap"
            ],
            "invoker": "https://app.uniswap.org",
            "parentCapability": "eth_accounts",
            "id": "a7342e4b-beae-4525-a36c-c0635fd03359",
            "date": 1620710693178,
            "caveats": [
              {
                "type": "limitResponseLength",
                "value": 1,
                "name": "primaryAccountOnly"
              },
              {
                "type": "filterResponse",
                "value": [
                  "0x64a845a5b02460acf8a3d84503b0d68d028b4bb4"
                ],
                "name": "exposedAccounts"
              }
            ]
          }
        ]
      }
    },
    "permissionsLog": [
      {
        "id": 522690215,
        "method": "eth_accounts",
        "methodType": "restricted",
        "origin": "https://metamask.io",
        "request": {
          "method": "eth_accounts",
          "params": [],
          "jsonrpc": "2.0",
          "id": 522690215,
          "origin": "https://metamask.io",
          "tabId": 5
        },
        "requestTime": 1602643170686,
        "response": {
          "id": 522690215,
          "jsonrpc": "2.0",
          "result": []
        },
        "responseTime": 1602643170688,
        "success": true
      },
      {
        "id": 1620464600,
        "method": "eth_accounts",
        "methodType": "restricted",
        "origin": "https://widget.getacute.io",
        "request": {
          "method": "eth_accounts",
          "params": [],
          "jsonrpc": "2.0",
          "id": 1620464600,
          "origin": "https://widget.getacute.io",
          "tabId": 5
        },
        "requestTime": 1602643172935,
        "response": {
          "id": 1620464600,
          "jsonrpc": "2.0",
          "result": []
        },
        "responseTime": 1602643172935,
        "success": true
      },
      {
        "id": 4279100021,
        "method": "eth_accounts",
        "methodType": "restricted",
        "origin": "https://app.uniswap.org",
        "request": {
          "method": "eth_accounts",
          "jsonrpc": "2.0",
          "id": 4279100021,
          "origin": "https://app.uniswap.org",
          "tabId": 5
        },
        "requestTime": 1620710669962,
        "response": {
          "id": 4279100021,
          "jsonrpc": "2.0",
          "result": []
        },
        "responseTime": 1620710669963,
        "success": true
      },
      {
        "id": 4279100022,
        "method": "eth_requestAccounts",
        "methodType": "restricted",
        "origin": "https://app.uniswap.org",
        "request": {
          "method": "eth_requestAccounts",
          "jsonrpc": "2.0",
          "id": 4279100022,
          "origin": "https://app.uniswap.org",
          "tabId": 5
        },
        "requestTime": 1620710686872,
        "response": {
          "id": 4279100022,
          "jsonrpc": "2.0",
          "result": [
            "0x64a845a5b02460acf8a3d84503b0d68d028b4bb4"
          ]
        },
        "responseTime": 1620710693187,
        "success": true
      },
      {
        "id": 4279100023,
        "method": "eth_requestAccounts",
        "methodType": "restricted",
        "origin": "https://app.uniswap.org",
        "request": {
          "method": "eth_requestAccounts",
          "jsonrpc": "2.0",
          "id": 4279100023,
          "origin": "https://app.uniswap.org",
          "tabId": 5
        },
        "requestTime": 1620710693204,
        "response": {
          "id": 4279100023,
          "jsonrpc": "2.0",
          "result": [
            "0x64a845a5b02460acf8a3d84503b0d68d028b4bb4"
          ]
        },
        "responseTime": 1620710693213,
        "success": true
      },
      {
        "id": 4279100034,
        "method": "eth_accounts",
        "methodType": "restricted",
        "origin": "https://app.uniswap.org",
        "request": {
          "method": "eth_accounts",
          "params": [],
          "jsonrpc": "2.0",
          "id": 4279100034,
          "origin": "https://app.uniswap.org",
          "tabId": 5
        },
        "requestTime": 1620710712072,
        "response": {
          "id": 4279100034,
          "jsonrpc": "2.0",
          "result": [
            "0x64a845a5b02460acf8a3d84503b0d68d028b4bb4"
          ]
        },
        "responseTime": 1620710712075,
        "success": true
      }
    ],
    "permissionsHistory": {
      "https://app.uniswap.org": {
        "eth_accounts": {
          "lastApproved": 1620710693213,
          "accounts": {
            "0x64a845a5b02460acf8a3d84503b0d68d028b4bb4": 1620710693213
          }
        }
      }
    },
    "domainMetadata": {
      "https://metamask.github.io": {
        "name": "E2E Test Dapp",
        "icon": "https://metamask.github.io/test-dapp/metamask-fox.svg",
        "lastUpdated": 1620723443380,
        "host": "metamask.github.io"
      }
    },
    "threeBoxSyncingAllowed": false,
    "showRestorePrompt": true,
    "threeBoxLastUpdated": 0,
    "threeBoxAddress": null,
    "threeBoxSynced": false,
    "threeBoxDisabled": false,
    "swapsState": {
      "quotes": {},
      "fetchParams": null,
      "tokens": null,
      "tradeTxId": null,
      "approveTxId": null,
      "quotesLastFetched": null,
      "customMaxGas": "",
      "customGasPrice": null,
      "selectedAggId": null,
      "customApproveTxData": "",
      "errorKey": "",
      "topAggId": null,
      "routeState": "",
      "swapsFeatureIsLive": false,
      "swapsQuoteRefreshTime": 60000
    },
    "ensResolutionsByAddress": {},
    "pendingApprovals": {},
    "pendingApprovalCount": 0
  },
  "appState": {
    "shouldClose": false,
    "menuOpen": false,
    "modal": {
      "open": false,
      "modalState": {
        "name": null,
        "props": {}
      },
      "previousModalState": {
        "name": null
      }
    },
    "sidebar": {
      "isOpen": false,
      "transitionName": "",
      "type": "",
      "props": {}
    },
    "alertOpen": false,
    "alertMessage": null,
    "qrCodeData": null,
    "networkDropdownOpen": false,
    "accountDetail": {
      "subview": "transactions"
    },
    "isLoading": false,
    "warning": null,
    "buyView": {},
    "isMouseUser": true,
    "gasIsLoading": false,
    "defaultHdPaths": {
      "trezor": "m/44'/60'/0'/0",
      "ledger": "m/44'/60'/0'/0/0"
    },
    "networksTabSelectedRpcUrl": "",
    "networksTabIsInAddMode": false,
    "loadingMethodData": false,
    "show3BoxModalAfterImport": false,
    "threeBoxLastUpdated": null,
    "requestAccountTabs": {},
    "openMetaMaskTabs": {},
    "currentWindowTab": {}
  },
  "history": {
    "mostRecentOverviewPage": "/"
  },
  "send": {
    "toDropdownOpen": false,
    "gasButtonGroupShown": true,
    "errors": {}
  },
  "confirmTransaction": {
    "txData": {
      "id": 3111025347726181,
      "time": 1620723786838,
      "status": "unapproved",
      "metamaskNetworkId": "3",
      "chainId": "0x3",
      "loadingDefaults": false,
      "txParams": {
        "from": "0x983211ce699ea5ab57cc528086154b6db1ad8e55",
        "to": "0xad6d458402f60fd3bd25163575031acdce07538d",
        "value": "0x0",
        "data": "0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000011170",
        "gas": "0xea60",
        "gasPrice": "0x4a817c800"
      },
      "type": "standard",
      "origin": "https://metamask.github.io",
      "transactionCategory": "approve",
      "history": [
        {
          "id": 3111025347726181,
          "time": 1620723786838,
          "status": "unapproved",
          "metamaskNetworkId": "3",
          "chainId": "0x3",
          "loadingDefaults": true,
          "txParams": {
            "from": "0x983211ce699ea5ab57cc528086154b6db1ad8e55",
            "to": "0xad6d458402f60fd3bd25163575031acdce07538d",
            "value": "0x0",
            "data": "0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000011170",
            "gas": "0xea60",
            "gasPrice": "0x4a817c800"
          },
          "type": "standard",
          "origin": "https://metamask.github.io",
          "transactionCategory": "approve"
        },
        [
          {
            "op": "replace",
            "path": "/loadingDefaults",
            "value": false,
            "note": "Added new unapproved transaction.",
            "timestamp": 1620723786844
          }
        ]
      ]
    },
    "tokenData": {
      "args": [
        "0x9bc5baF874d2DA8D216aE9f137804184EE5AfEF4",
        {
          "type": "BigNumber",
          "hex": "0x011170"
        }
      ],
      "functionFragment": {
        "type": "function",
        "name": "approve",
        "constant": false,
        "inputs": [
          {
            "name": "_spender",
            "type": "address",
            "indexed": null,
            "components": null,
            "arrayLength": null,
            "arrayChildren": null,
            "baseType": "address",
            "_isParamType": true
          },
          {
            "name": "_value",
            "type": "uint256",
            "indexed": null,
            "components": null,
            "arrayLength": null,
            "arrayChildren": null,
            "baseType": "uint256",
            "_isParamType": true
          }
        ],
        "outputs": [
          {
            "name": "success",
            "type": "bool",
            "indexed": null,
            "components": null,
            "arrayLength": null,
            "arrayChildren": null,
            "baseType": "bool",
            "_isParamType": true
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "gas": null,
        "_isFragment": true
      },
      "name": "approve",
      "signature": "approve(address,uint256)",
      "sighash": "0x095ea7b3",
      "value": {
        "type": "BigNumber",
        "hex": "0x00"
      }
    },
    "fiatTransactionAmount": "0",
    "fiatTransactionFee": "4.72",
    "fiatTransactionTotal": "4.72",
    "ethTransactionAmount": "0",
    "ethTransactionFee": "0.0012",
    "ethTransactionTotal": "0.0012",
    "hexTransactionAmount": "0x0",
    "hexTransactionFee": "0x44364c5bb0000",
    "hexTransactionTotal": "0x44364c5bb0000",
    "nonce": ""
  },
  "swaps": {
    "aggregatorMetadata": null,
    "approveTxId": null,
    "balanceError": false,
    "fetchingQuotes": false,
    "fromToken": null,
    "quotesFetchStartTime": null,
    "topAssets": {},
    "toToken": null,
    "customGas": {
      "price": null,
      "limit": null,
      "loading": "INITIAL",
      "priceEstimates": {},
      "fallBackPrice": null
    }
  },
  "gas": {
    "customData": {
      "price": null,
      "limit": "0xcb28"
    },
    "basicEstimates": {
      "average": 2
    },
    "basicEstimateIsLoading": false
  }
}

export default state;
