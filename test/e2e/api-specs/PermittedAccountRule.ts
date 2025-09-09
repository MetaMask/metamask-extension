import Rule from '@open-rpc/test-coverage/build/rules/rule';
import { Call } from '@open-rpc/test-coverage/build/coverage';
import { MethodObject, OpenrpcDocument } from '@open-rpc/meta-schema';
import ExamplesRule from '@open-rpc/test-coverage/build/rules/examples-rule';
import { Driver } from '../webdriver/driver';
import { WINDOW_TITLES, switchToOrOpenDapp } from '../helpers';
import { addToQueue } from './helpers';

type PermittedAccountRuleOptions = {
  only?: string[];
  skip?: string[];
  driver: Driver;
};
// This rules requests and revokes permissions for calls that require them
export class PermittedAccountRule implements Rule {
  private driver: Driver;

  private examplesRules: ExamplesRule;

  constructor(options: PermittedAccountRuleOptions) {
    this.driver = options.driver;

    this.examplesRules = new ExamplesRule({
      only: options.only ?? [],
      skip: options.skip ?? [],
    });
  }

  getTitle() {
    return 'Permitted Account Rule';
  }

  async beforeRequest(_: unknown, _call: Call) {
    await new Promise((resolve, reject) => {
      addToQueue({
        name: 'beforeRequest',
        resolve,
        reject,
        task: async () => {
          try {
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

            await this.driver.waitUntilXWindowHandles(3);
            await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

            await this.driver.findClickableElements({
              text: 'Connect',
              tag: 'button',
            });

            await this.driver.clickElement({
              text: 'Connect',
              tag: 'button',
            });

            await switchToOrOpenDapp(this.driver);

            const switchEthereumChainRequest = JSON.stringify({
              jsonrpc: '2.0',
              method: 'wallet_switchEthereumChain',
              params: [
                {
                  chainId: '0x539', // 1337
                },
              ],
            });

            await this.driver.executeScript(
              `window.ethereum.request(${switchEthereumChainRequest})`,
            );
          } catch (e) {
            console.log(e);
          }
        },
      });
    });
  }

  async afterResponse(_: unknown, _call: Call) {
    await new Promise((resolve, reject) => {
      addToQueue({
        name: 'afterResponse',
        resolve,
        reject,
        task: async () => {
          try {
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
          } catch (e) {
            console.log(e);
          }
        },
      });
    });
  }

  getCalls(_: OpenrpcDocument, method: MethodObject) {
    return this.examplesRules.getCalls(_, method);
  }

  validateCall(call: Call) {
    return this.examplesRules.validateCall(call);
  }
}
