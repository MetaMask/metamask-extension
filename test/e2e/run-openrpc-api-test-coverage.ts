import testCoverage from '@open-rpc/test-coverage';
import { parseOpenRPCDocument } from '@open-rpc/schema-utils-js';
import HtmlReporter from '@open-rpc/test-coverage/build/reporters/html-reporter';
import ExamplesRule from '@open-rpc/test-coverage/build/rules/examples-rule';
import JsonSchemaFakerRule from '@open-rpc/test-coverage/build/rules/json-schema-faker-rule';

import {
  ExampleObject,
  ExamplePairingObject,
  MethodObject,
} from '@open-rpc/meta-schema';
import openrpcDocument from '@metamask/api-specs';
import { ConfirmationsRejectRule } from './api-specs/ConfirmationRejectionRule';

import { Driver, PAGES } from './webdriver/driver';

import { createDriverTransport } from './api-specs/helpers';

import FixtureBuilder from './fixture-builder';
import {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  ACCOUNT_1,
} from './helpers';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const mockServer = require('@open-rpc/mock-server/build/index').default;

async function main() {
  const port = 8545;
  const chainId = 1337;
  await withFixtures(
    {
      dapp: true,
      fixtures: new FixtureBuilder().build(),
      disableGanache: true,
      title: 'api-specs coverage',
    },
    async ({ driver }: { driver: Driver }) => {
      await unlockWallet(driver);

      // Navigate to extension home screen
      await driver.navigate(PAGES.HOME);

      // Open Dapp
      await openDapp(driver, undefined, DAPP_URL);

      const transport = createDriverTransport(driver);

      const transaction =
        openrpcDocument.components?.schemas?.TransactionInfo?.allOf?.[0];

      if (transaction) {
        delete transaction.unevaluatedProperties;
      }

      const chainIdMethod = openrpcDocument.methods.find(
        (m) => (m as MethodObject).name === 'eth_chainId',
      );
      (chainIdMethod as MethodObject).examples = [
        {
          name: 'chainIdExample',
          description: 'Example of a chainId request',
          params: [],
          result: {
            name: 'chainIdResult',
            value: `0x${chainId.toString(16)}`,
          },
        },
      ];

      const getBalanceMethod = openrpcDocument.methods.find(
        (m) => (m as MethodObject).name === 'eth_getBalance',
      );

      (getBalanceMethod as MethodObject).examples = [
        {
          name: 'getBalanceExample',
          description: 'Example of a getBalance request',
          params: [
            {
              name: 'address',
              value: ACCOUNT_1,
            },
            {
              name: 'tag',
              value: 'latest',
            },
          ],
          result: {
            name: 'getBalanceResult',
            value: '0x1a8819e0c9bab700', // can we get this from a variable too
          },
        },
      ];

      const blockNumber = openrpcDocument.methods.find(
        (m) => (m as MethodObject).name === 'eth_blockNumber',
      );

      (blockNumber as MethodObject).examples = [
        {
          name: 'blockNumberExample',
          description: 'Example of a blockNumber request',
          params: [],
          result: {
            name: 'blockNumberResult',
            value: '0x1',
          },
        },
      ];

      const personalSign = openrpcDocument.methods.find(
        (m) => (m as MethodObject).name === 'personal_sign',
      );

      (personalSign as MethodObject).examples = [
        {
          name: 'personalSignExample',
          description: 'Example of a personalSign request',
          params: [
            {
              name: 'data',
              value: '0xdeadbeef',
            },
            {
              name: 'address',
              value: ACCOUNT_1,
            },
          ],
          result: {
            name: 'personalSignResult',
            value: '0x1a8819e0c9bab700',
          },
        },
      ];

      const switchEthereumChain = openrpcDocument.methods.find(
        (m) => (m as MethodObject).name === 'wallet_switchEthereumChain',
      );
      (switchEthereumChain as MethodObject).examples = [
        {
          name: 'wallet_switchEthereumChain',
          description:
            'Example of a wallet_switchEthereumChain request to sepolia',
          params: [
            {
              name: 'SwitchEthereumChainParameter',
              value: {
                chainId: '0xaa36a7',
              },
            },
          ],
          result: {
            name: 'wallet_switchEthereumChain',
            value: null,
          },
        },
      ];

      const signTypedData4 = openrpcDocument.methods.find(
        (m) => (m as MethodObject).name === 'eth_signTypedData_v4',
      );

      const signTypedData4Example = (signTypedData4 as MethodObject)
        .examples?.[0] as ExamplePairingObject;

      // just update address for signTypedData
      (signTypedData4Example.params[0] as ExampleObject).value = ACCOUNT_1;

      // update chainId for signTypedData
      (
        signTypedData4Example.params[1] as ExampleObject
      ).value.domain.chainId = 1337;

      // net_version missing from execution-apis. see here: https://github.com/ethereum/execution-apis/issues/540
      const netVersion: MethodObject = {
        name: 'net_version',
        summary: 'Returns the current network ID.',
        params: [],
        result: {
          description: 'Returns the current network ID.',
          name: 'net_version',
          schema: {
            type: 'string',
          },
        },
        description: 'Returns the current network ID.',
        examples: [
          {
            name: 'net_version',
            description: 'Example of a net_version request',
            params: [],
            result: {
              name: 'net_version',
              description: 'The current network ID',
              value: '0x1',
            },
          },
        ],
      };
      // add net_version
      (openrpcDocument.methods as MethodObject[]).push(
        netVersion as unknown as MethodObject,
      );

      const getEncryptionPublicKey = openrpcDocument.methods.find(
        (m) => (m as MethodObject).name === 'eth_getEncryptionPublicKey',
      );

      (getEncryptionPublicKey as MethodObject).examples = [
        {
          name: 'getEncryptionPublicKeyExample',
          description: 'Example of a getEncryptionPublicKey request',
          params: [
            {
              name: 'address',
              value: ACCOUNT_1,
            },
          ],
          result: {
            name: 'getEncryptionPublicKeyResult',
            value: '0x1a8819e0c9bab700',
          },
        },
      ];

      const getTransactionCount = openrpcDocument.methods.find(
        (m) => (m as MethodObject).name === 'eth_getTransactionCount',
      );
      (getTransactionCount as MethodObject).examples = [
        {
          name: 'getTransactionCountExampleEarliest',
          description: 'Example of a pending getTransactionCount request',
          params: [
            {
              name: 'address',
              value: ACCOUNT_1,
            },
            {
              name: 'tag',
              value: 'earliest',
            },
          ],
          result: {
            name: 'getTransactionCountResult',
            value: '0x0',
          },
        },
        {
          name: 'getTransactionCountExampleFinalized',
          description: 'Example of a pending getTransactionCount request',
          params: [
            {
              name: 'address',
              value: ACCOUNT_1,
            },
            {
              name: 'tag',
              value: 'finalized',
            },
          ],
          result: {
            name: 'getTransactionCountResult',
            value: '0x0',
          },
        },
        {
          name: 'getTransactionCountExampleSafe',
          description: 'Example of a pending getTransactionCount request',
          params: [
            {
              name: 'address',
              value: ACCOUNT_1,
            },
            {
              name: 'tag',
              value: 'safe',
            },
          ],
          result: {
            name: 'getTransactionCountResult',
            value: '0x0',
          },
        },
        {
          name: 'getTransactionCountExample',
          description: 'Example of a getTransactionCount request',
          params: [
            {
              name: 'address',
              value: ACCOUNT_1,
            },
            {
              name: 'tag',
              value: 'latest',
            },
          ],
          result: {
            name: 'getTransactionCountResult',
            value: '0x0',
          },
        },
        // returns a number right now. see here: https://github.com/MetaMask/metamask-extension/pull/14822
        // {
        //   name: 'getTransactionCountExamplePending',
        //   description: 'Example of a pending getTransactionCount request',
        //   params: [
        //     {
        //       name: 'address',
        //       value: ACCOUNT_1,
        //     },
        //     {
        //       name: 'tag',
        //       value: 'pending',
        //     },
        //   ],
        //   result: {
        //     name: 'getTransactionCountResult',
        //     value: '0x0',
        //   },
        // },
      ];

      const getProof = openrpcDocument.methods.find(
        (m) => (m as MethodObject).name === 'eth_getProof',
      );
      (getProof as MethodObject).examples = [
        {
          name: 'getProofExample',
          description: 'Example of a getProof request',
          params: [
            {
              name: 'address',
              value: ACCOUNT_1,
            },
            {
              name: 'keys',
              value: ['0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421'],
            },
            {
              name: 'tag',
              value: 'latest',
            },
          ],
          result: {
            name: 'getProofResult',
            value: {
                "address": ACCOUNT_1,
                "balance": "0x15af1d78b58c40000",
                "codeHash": "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
                "nonce": "0x0",
                "storageHash": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
                "accountProof": [
                    "0xf9017180a0ab8cdb808c8303bb61fb48e276217be9770fa83ecf3f90f2234d558885f5abf18080a0de26cb1b4fd99c4d3ed75d4a67931e3c252605c7d68e0148d5327f341bfd5283a0de86ea5531307567132648d5c7956cb6082d6803f3dbc9e16b2dd20b320ca93aa0c2c799b60a0cd6acd42c1015512872e86c186bcf196e85061e76842f3b7cf86080a04fa8b5b81f5814f27b3a3e2b6273792dc150c94bea8f90c4b4d3fb4f52cd80dea0c326f61dd1e74e037d4db73aede5642260bf92869081753bbace550a73989aeda06301b39b2ea8a44df8b0356120db64b788e71f52e1d7a6309d0d2e5b86fee7cb80a029087b3ba8c5129e161e2cb956640f4d8e31a35f3f133c19a1044993def98b61a0a5ac64bb99d260ef6b13a4f2040ed48a4936664ec13d400238b5004841a4d888a0a9e6cc0d5192cb036c2454c7cf19ff53abf1861b50043a7b3713bc003a5a7d88a0144540d36e30b250d25bd5c34d819538742dc54c2017c4eb1fabb8e45f72759180",
                    "0xf85180a0563305036bc8702a52ae6338bfbeca18e8f42fd5ee640e72e18f31455d3be5f880808080808080808080a02fb46956347985b9870156b5747712899d213b1636ad4fe553c63e33521d567a80808080",
                    "0xf872a020bf0de4df4861e4184def33fbb5c7e634b9c33718934bf717ec7b695ea08cb5b84ff84d8089015af1d78b58c40000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
                ],
                "storageProof": [
                    {
                        "key": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
                        "proof": [],
                        "value": "0x0"
                    }
                ]
            },
          },
        },
      ]

      const server = mockServer(port, openrpcDocument);
      server.start();

      // TODO: move these to a "Confirmation" tag in api-specs
      const methodsWithConfirmations = [
        'wallet_requestPermissions',
        'eth_requestAccounts',
        'wallet_watchAsset',
        'personal_sign', // requires permissions for eth_accounts
        'wallet_addEthereumChain',
        'eth_signTypedData_v4', // requires permissions for eth_accounts
        'wallet_switchEthereumChain',

        // commented out because its not returning 4001 error.
        // see here https://github.com/MetaMask/metamask-extension/issues/24227
        // 'eth_getEncryptionPublicKey', // requires permissions for eth_accounts
      ];
      const filteredMethods = openrpcDocument.methods
        .filter((_m: unknown) => {
          const m = _m as MethodObject;
          return (
            m.name.includes('snap') ||
            m.name.includes('Snap') ||
            m.name.toLowerCase().includes('account') ||
            m.name.includes('crypt') ||
            m.name.includes('blob') ||
            m.name.includes('sendTransaction') ||
            m.name.startsWith('wallet_scanQRCode') ||
            methodsWithConfirmations.includes(m.name) ||
            // filters are currently 0 prefixed for odd length on
            // extension which doesn't pass spec
            // see here: https://github.com/MetaMask/eth-json-rpc-filters/issues/152
            m.name.includes('filter') ||
            m.name.includes('Filter')
          );
        })
        .map((m) => (m as MethodObject).name);

      const testCoverageResults = await testCoverage({
        openrpcDocument: (await parseOpenRPCDocument(
          openrpcDocument as never,
        )) as never,
        transport,
        reporters: [
          'console-streaming',
          new HtmlReporter({ autoOpen: !process.env.CI }),
        ],
        skip: [
          'eth_coinbase',
          // these methods below are not supported by MetaMask extension yet and
          // don't get passed through. See here: https://github.com/MetaMask/metamask-extension/issues/24225
          'eth_getBlockReceipts',
          'eth_maxPriorityFeePerGas',
          'wallet_swapAsset',
        ],
        rules: [
          new JsonSchemaFakerRule({
            only: [],
            skip: filteredMethods,
            numCalls: 2,
          }),
          new ExamplesRule({
            only: [],
            skip: filteredMethods,
          }),
          new ConfirmationsRejectRule({
            driver,
            only: methodsWithConfirmations,
          }),
        ],
      });

      await driver.quit();

      // if any of the tests failed, exit with a non-zero code
      if (testCoverageResults.every((r) => r.valid)) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    },
  );
}

main();
