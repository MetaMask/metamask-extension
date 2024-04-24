import testCoverage from '@open-rpc/test-coverage';
import { parseOpenRPCDocument } from '@open-rpc/schema-utils-js';
const mockServer = require('@open-rpc/mock-server/build/index').default;
import HtmlReporter from '@open-rpc/test-coverage/build/reporters/html-reporter';
import ExamplesRule from '@open-rpc/test-coverage/build/rules/examples-rule';
import JsonSchemaFakerRule from '@open-rpc/test-coverage/build/rules/json-schema-faker-rule';
import paramsToObj from '@open-rpc/test-coverage/build/utils/params-to-obj';
import {
  ContentDescriptorObject,
  ExampleObject,
  ExamplePairingObject,
  MethodObject,
  OpenrpcDocument,
} from '@open-rpc/meta-schema';
const { v4 } = require('uuid');

declare let window: any;

const uuid = v4;

const FixtureBuilder = require('./fixture-builder');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  WINDOW_TITLES,
  switchToOrOpenDapp,
} = require('./helpers');

import { Driver, PAGES } from './webdriver/driver';
import Rule from '@open-rpc/test-coverage/build/rules/rule';
import { Call } from '@open-rpc/test-coverage/build/coverage';

const pollForResult = async (driver: Driver, generatedKey: string) => {
  let result = await driver.executeScript(`return window['${generatedKey}'];`);

  while (result === null) {
    // Continue polling if result is not set
    await driver.delay(50);
    result = await driver.executeScript(`return window['${generatedKey}'];`);
  }

  // clear the result
  await driver.executeScript(`delete window['${generatedKey}'];`);

  return result;
};

const createDriverTransport = (driver: Driver) => {
  return async (
    _: string,
    method: string,
    params: any[] | Record<string, any>,
  ) => {
    const generatedKey = uuid();
    // don't wait for executeScript to finish window.ethereum promise
    // we need this because if we wait for the promise to resolve it
    // will hang in selenium since it can only do one thing at a time.
    // the workaround is to put the response on window.asyncResult and poll for it.
    driver.executeScript(
      ([m, p, g]: any) => {
        window[g] = null;
        window.ethereum
          .request({ method: m, params: p })
          .then((r: any) => {
            window[g] = { result: r };
          })
          .catch((e: any) => {
            window[g] = {
              error: {
                code: e.code,
                message: e.message,
                data: e.data,
              },
            };
          });
      },
      method,
      params,
      generatedKey,
    );
    const response = await pollForResult(driver, generatedKey);
    return response;
  };
};

interface ConfirmationsRejectRuleOptions {
  driver: Driver;
  only: string[];
}
// this rule makes sure that all confirmation requests are rejected.
// it also validates that the JSON-RPC response is an error with
// error code 4001 (user rejected request)
class ConfirmationsRejectRule implements Rule {
  private driver: any;
  private only: string[];
  private rejectButtonInsteadOfCancel: string[];
  private requiresEthAccountsPermission: string[];

  constructor(options: ConfirmationsRejectRuleOptions) {
    this.driver = options.driver;
    this.only = options.only;
    this.rejectButtonInsteadOfCancel = [
      'personal_sign',
      'eth_signTypedData_v4',
    ];
    this.requiresEthAccountsPermission = [
      'personal_sign',
      'eth_signTypedData_v4',
      'eth_getEncryptionPublicKey',
    ];
  }

  getTitle() {
    return 'Confirmations Rejection Rule';
  }

  async beforeRequest(_: any, call: Call) {
    if (this.requiresEthAccountsPermission.includes(call.methodName)) {
      const requestPermissionsRequest = JSON.stringify({
        jsonrpc: '2.0',
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });

      await this.driver.executeScript(
        `window.ethereum.request(${requestPermissionsRequest})`,
      );
      const screenshot = await this.driver.driver.takeScreenshot();
      call.attachments = call.attachments || [];
      call.attachments.push({
        type: 'image',
        data: `data:image/png;base64,${screenshot.toString('base64')}`,
      });

      await this.driver.waitUntilXWindowHandles(3);
      await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

      await this.driver.findClickableElements({
        text: 'Next',
        tag: 'button',
      });

      const screenshotTwo = await this.driver.driver.takeScreenshot();
      call.attachments.push({
        type: 'image',
        data: `data:image/png;base64,${screenshotTwo.toString('base64')}`,
      });

      await this.driver.clickElement({
        text: 'Next',
        tag: 'button',
      });

      await this.driver.findClickableElements({
        text: 'Connect',
        tag: 'button',
      });

      await this.driver.clickElement({
        text: 'Connect',
        tag: 'button',
      });

      await switchToOrOpenDapp(this.driver);
    }
  }

  async afterRequest(_: any, call: Call) {
    await this.driver.waitUntilXWindowHandles(3);
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

    let text = 'Cancel';
    if (this.rejectButtonInsteadOfCancel.includes(call.methodName)) {
      await this.driver.findClickableElements({
        text: 'Reject',
        tag: 'button',
      });
      text = 'Reject';
    } else {
      await this.driver.findClickableElements({
        text: 'Cancel',
        tag: 'button',
      });
    }
    const screenshot = await this.driver.driver.takeScreenshot();
    call.attachments = call.attachments || [];
    call.attachments.push({
      type: 'image',
      data: `data:image/png;base64,${screenshot.toString('base64')}`,
    });
    await this.driver.clickElement({ text, tag: 'button' });
    // make sure to switch back to the dapp or else the next test will fail on the wrong window
    await switchToOrOpenDapp(this.driver);
  }

  // get all the confirmation calls to make and expect to pass
  getCalls(_: any, method: MethodObject) {
    const calls: Call[] = [];
    const isMethodAllowed = this.only ? this.only.includes(method.name) : true;
    if (isMethodAllowed) {
      if (method.examples) {
        // pull the first example
        const e = method.examples[0];
        const ex = e as ExamplePairingObject;

        if (!ex.result) {
          return calls;
        }
        const p = ex.params.map((e) => (e as ExampleObject).value);
        const params =
          method.paramStructure === 'by-name'
            ? paramsToObj(p, method.params as ContentDescriptorObject[])
            : p;
        calls.push({
          title: `${this.getTitle()} - with example ${ex.name}`,
          methodName: method.name,
          params,
          url: '',
          resultSchema: (method.result as ContentDescriptorObject).schema,
          expectedResult: (ex.result as ExampleObject).value,
        });
      } else {
        // naively call the method with no params
        calls.push({
          title: `${method.name} > confirmation rejection`,
          methodName: method.name,
          params: [],
          url: '',
          resultSchema: (method.result as ContentDescriptorObject).schema,
        });
      }
    }
    return calls;
  }

  async afterResponse(_: any, call: Call) {
    if (this.requiresEthAccountsPermission.includes(call.methodName)) {
      const revokePermissionsRequest = JSON.stringify({
        jsonrpc: '2.0',
        method: 'wallet_revokePermissions',
        params: [{ eth_accounts: {} }],
      });

      await this.driver.executeScript(
        `window.ethereum.request(${revokePermissionsRequest})`,
      );
    }
  }

  validateCall(call: Call) {
    if (call.error) {
      call.valid = call.error.code === 4001;
      if (!call.valid) {
        call.reason = `Expected error code 4001, got ${call.error.code}`;
      }
    }
    return call;
  }
}

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

      const openrpcDocument: OpenrpcDocument = await (
        await fetch('https://metamask.github.io/api-specs/latest/openrpc.json')
      ).json();

      const transaction = openrpcDocument.components?.schemas?.TransactionInfo?.allOf?.[0];

      if (transaction) {
        delete transaction.unevaluatedProperties;
      }

      const chainIdMethod = openrpcDocument.methods.find(
        (m) => (m as any).name === 'eth_chainId',
      );
      (chainIdMethod as MethodObject)!.examples = [
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
              value: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1', // can we get this from the wallet?
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
              value: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
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

      // just update address for signTypedData
      (signTypedData4 as any).examples[0].params[0].value =
        '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1';

      // update chainId for signTypedData
      (signTypedData4 as any).examples[0].params[1].value.domain.chainId = 1337;

      // add net_version
      openrpcDocument.methods.push({
        name: 'net_version',
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
              value: '0x1',
            },
          },
        ],
      });

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
              value: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
            },
          ],
          result: {
            name: 'getEncryptionPublicKeyResult',
            value: '0x1a8819e0c9bab700',
          },
        },
      ];

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
        .filter(
          (m: any) =>
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
            m.name.includes('Filter'),
        )
        .map((m) => (m as MethodObject).name);

      const testCoverageResults = await testCoverage({
        openrpcDocument: await parseOpenRPCDocument(openrpcDocument as any) as any,
        transport,
        reporters: [
          'console-streaming',
          new HtmlReporter({ autoOpen: !process.env.CI }),
        ],
        skip: [
          'eth_coinbase',
          // these 2 methods below are not supported by MetaMask extension yet and
          // don't get passed through. See here: https://github.com/MetaMask/metamask-extension/issues/24225
          'eth_getBlockReceipts',
          'eth_maxPriorityFeePerGas',
        ],
            // these 2 method
        // only: ['eth_newFilter'],
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
