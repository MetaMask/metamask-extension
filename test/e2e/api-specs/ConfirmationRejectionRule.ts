import Rule from '@open-rpc/test-coverage/build/rules/rule';
import { Call } from '@open-rpc/test-coverage/build/coverage';
import {
  ContentDescriptorObject,
  ExampleObject,
  ExamplePairingObject,
  MethodObject,
} from '@open-rpc/meta-schema';
import paramsToObj from '@open-rpc/test-coverage/build/utils/params-to-obj';
import { Driver } from '../webdriver/driver';
import { WINDOW_TITLES, switchToOrOpenDapp } from '../helpers';
import Eip7702AndSendCalls from '../page-objects/pages/confirmations/redesign/batch-confirmation';
import { addToQueue } from './helpers';

type ConfirmationsRejectRuleOptions = {
  driver: Driver;
  only: string[];
  requiresEthAccountsPermission: string[];
  requiresSmartAccountUpgrade: string[];
};

// this rule makes sure that all confirmation requests are rejected.
// it also validates that the JSON-RPC response is an error with
// error code 4001 (user rejected request)
export class ConfirmationsRejectRule implements Rule {
  private driver: Driver;

  private only: string[];

  private requiresEthAccountsPermission: string[];

  private requiresSmartAccountUpgrade: string[];

  constructor(options: ConfirmationsRejectRuleOptions) {
    this.driver = options.driver;
    this.only = options.only;

    this.requiresEthAccountsPermission = options.requiresEthAccountsPermission;

    this.requiresSmartAccountUpgrade = options.requiresSmartAccountUpgrade;
  }

  getTitle() {
    return 'Confirmations Rejection Rule';
  }

  async beforeRequest(_: unknown, call: Call) {
    await new Promise((resolve, reject) => {
      addToQueue({
        name: 'beforeRequest',
        resolve,
        reject,
        task: async () => {
          try {
            if (this.requiresEthAccountsPermission.includes(call.methodName)) {
              const requestPermissionsRequest = JSON.stringify({
                jsonrpc: '2.0',
                method: 'wallet_requestPermissions',
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                params: [{ eth_accounts: {} }],
              });

              await this.driver.executeScript(
                `window.ethereum.request(${requestPermissionsRequest})`,
              );
              const screenshot = await this.driver.driver.takeScreenshot();
              call.attachments = call.attachments || [];
              call.attachments.push({
                type: 'image',
                data: `data:image/png;base64,${screenshot}`,
              });

              await this.driver.waitUntilXWindowHandles(3);
              await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

              await this.driver.findClickableElements({
                text: 'Connect',
                tag: 'button',
              });

              const screenshotTwo = await this.driver.driver.takeScreenshot();
              call.attachments.push({
                type: 'image',
                data: `data:image/png;base64,${screenshotTwo}`,
              });

              await this.driver.clickElement({
                text: 'Connect',
                tag: 'button',
              });

              await switchToOrOpenDapp(this.driver);

              const switchEthereumChainRequest = JSON.stringify({
                jsonrpc: '2.0',
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x539' }],
              });

              await this.driver.executeScript(
                `window.ethereum.request(${switchEthereumChainRequest})`,
              );
            }
          } catch (e) {
            console.log(e);
          }
        },
      });
    });
  }

  async afterRequest(_: unknown, call: Call) {
    await new Promise((resolve, reject) => {
      addToQueue({
        name: 'afterRequest',
        resolve,
        reject,
        task: async () => {
          const requiresSmartAccountUpgrade =
            this.requiresSmartAccountUpgrade.includes(call.methodName);

          try {
            if (requiresSmartAccountUpgrade) {
              // TODO: Having flaky results when handling smart account upgrade screen
              await this.driver.delay(3000); // Wait for dialog to open
            }
            await this.driver.waitAndSwitchToWindowWithTitle(
              3,
              WINDOW_TITLES.Dialog,
            );

            // Handle smart account upgrade splash screen
            if (requiresSmartAccountUpgrade) {
              const eip7702 = new Eip7702AndSendCalls(this.driver);
              await eip7702.clickUseSmartAccountButton();
            }

            const screenshot = await this.driver.driver.takeScreenshot();
            call.attachments = call.attachments || [];
            call.attachments.push({
              type: 'image',
              data: `data:image/png;base64,${screenshot}`,
            });

            await this.driver.clickElement({
              text: 'Cancel',
              tag: 'button',
            });

            // Ensure we're back on the dapp window
            await switchToOrOpenDapp(this.driver);
          } catch (e) {
            console.log(e);
          }
        },
      });
    });
  }

  getCalls(_: unknown, method: MethodObject) {
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
        const p = ex.params.map((_e) => (_e as ExampleObject).value);
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

  async afterResponse(_: unknown, call: Call) {
    await new Promise((resolve, reject) => {
      addToQueue({
        name: 'afterResponse',
        resolve,
        reject,
        task: async () => {
          try {
            if (this.requiresEthAccountsPermission.includes(call.methodName)) {
              const revokePermissionsRequest = JSON.stringify({
                jsonrpc: '2.0',
                method: 'wallet_revokePermissions',
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                params: [{ eth_accounts: {} }],
              });

              await this.driver.executeScript(
                `window.ethereum.request(${revokePermissionsRequest})`,
              );
            }
          } catch (e) {
            console.log(e);
          }
        },
      });
    });
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
