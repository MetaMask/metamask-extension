import Rule from '@open-rpc/test-coverage/build/rules/rule';
import { Call } from '@open-rpc/test-coverage/build/coverage';
import {
  ContentDescriptorObject,
  ErrorObject,
  MethodObject,
} from '@open-rpc/meta-schema';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import _ from 'lodash';
import { Driver } from '../webdriver/driver';
import { WINDOW_TITLES, switchToOrOpenDapp } from '../helpers';
import { addToQueue } from './helpers';

type MultichainAuthorizationConfirmationOptions = {
  driver: Driver;
  only?: string[];
};
// this rule makes sure that a multichain authorization error codes are returned
export class MultichainAuthorizationConfirmationErrors implements Rule {
  private driver: Driver;

  private only: string[];

  private errorCodesToHitCancel: number[];

  constructor(options: MultichainAuthorizationConfirmationOptions) {
    this.driver = options.driver;
    this.only = options.only || ['wallet_createSession'];
    this.errorCodesToHitCancel = [5001, 5002];
  }

  getTitle() {
    return 'Multichain Authorization Confirmation Rule';
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async afterRequest(__: unknown, call: Call) {
    await new Promise((resolve, reject) => {
      addToQueue({
        name: 'afterRequest',
        resolve,
        reject,
        task: async () => {
          if (this.errorCodesToHitCancel.includes(call.expectedResult?.code)) {
            try {
              await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

              const text = 'Cancel';

              await this.driver.findClickableElements({
                text: 'Cancel',
                tag: 'button',
              });

              const screenshot = await this.driver.driver.takeScreenshot();
              call.attachments = call.attachments || [];
              call.attachments.push({
                type: 'image',
                data: `data:image/png;base64,${screenshot}`,
              });
              await this.driver.clickElement({ text, tag: 'button' });
              // make sure to switch back to the dapp or else the next test will fail on the wrong window
              await switchToOrOpenDapp(this.driver);
            } catch (e) {
              console.log(e);
            }
          }
        },
      });
    });
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  getCalls(__: unknown, method: MethodObject) {
    const calls: Call[] = [];
    const isMethodAllowed = this.only ? this.only.includes(method.name) : true;
    if (isMethodAllowed) {
      if (method.errors) {
        method.errors.forEach((err) => {
          const unsupportedErrorCodes = [5000, 5100, 5101, 5102, 5300, 5301];
          const error = err as ErrorObject;
          if (unsupportedErrorCodes.includes(error.code)) {
            return;
          }
          let params: Record<string, unknown> = {};
          switch (error.code) {
            case 5100:
              params = {
                requiredScopes: {
                  'eip155:10124': {
                    methods: ['eth_signTypedData_v4'],
                    notifications: [],
                  },
                },
              };
              break;
            case 5302:
              params = {
                requiredScopes: {
                  'eip155:1': {
                    methods: ['eth_signTypedData_v4'],
                    notifications: [],
                  },
                },
                sessionProperties: {},
              };
              break;
            default:
              break;
          }

          // params should make error happen (or lifecycle hooks will make it happen)
          calls.push({
            title: `${this.getTitle()} - with error ${error.code} ${
              error.message
            } `,
            methodName: method.name,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            params: params as any,
            url: '',
            resultSchema: (method.result as ContentDescriptorObject).schema,
            expectedResult: error,
          });
        });
      }
    }
    return calls;
  }

  validateCall(call: Call) {
    if (call.error) {
      call.valid = _.isEqual(call.error.code, call.expectedResult.code);
      if (!call.valid) {
        call.reason = `Expected:\n${JSON.stringify(
          call.expectedResult,
          null,
          4,
        )} but got\n${JSON.stringify(call.error, null, 4)}`;
      }
    }
    return call;
  }
}
