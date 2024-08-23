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
import { addToQueue } from './helpers';

type MultichainAuthorizationConfirmationOptions = {
  driver: Driver;
  only?: string[];
};
// this rule makes sure that all confirmation requests are rejected.
// it also validates that the JSON-RPC response is an error with
// error code 4001 (user rejected request)
export class MultichainAuthorizationConfirmation implements Rule {
  private driver: Driver;

  private only: string[];

  constructor(options: MultichainAuthorizationConfirmationOptions) {
    this.driver = options.driver;
    this.only = options.only || ['wallet_createSession'];
  }

  getTitle() {
    return 'Multichain Authorization Confirmation Rule';
  }

  async afterRequest(_: unknown, call: Call) {
    await new Promise((resolve, reject) => {
      addToQueue({
        name: 'afterRequest',
        resolve,
        reject,
        task: async () => {
          try {
            await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

            const text = 'Next';

            await this.driver.findClickableElements({
              text,
              tag: 'button',
            });

            const screenshot = await this.driver.driver.takeScreenshot();
            call.attachments = call.attachments || [];
            call.attachments.push({
              type: 'image',
              data: `data:image/png;base64,${screenshot}`,
            });
            await this.driver.clickElement({ text, tag: 'button' });

            const screenshotConfirm = await this.driver.driver.takeScreenshot();
            call.attachments.push({
              type: 'image',
              data: `data:image/png;base64,${screenshotConfirm}`,
            });

            await this.driver.findClickableElements({
              text: 'Confirm',
              tag: 'button',
            });
            await this.driver.clickElement({ text: 'Confirm', tag: 'button' });
            // make sure to switch back to the dapp or else the next test will fail on the wrong window
            await switchToOrOpenDapp(this.driver);
          } catch (e) {
            console.log(e);
          }
        },
      });
    });
  }

  // get all the confirmation calls to make and expect to pass
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
          title: `${method.name} > multichain authorization confirmation`,
          methodName: method.name,
          params: [],
          url: '',
          resultSchema: (method.result as ContentDescriptorObject).schema,
        });
      }
    }
    return calls;
  }

  validateCall(call: Call) {
    if (call.error) {
      call.valid = false;
      if (!call.valid) {
        call.reason = `Expected a result but got error \ncode: ${call.error.code}\n message: ${call.error.message}`;
      }
    } else {
      // TODO: change this to check if the result matches the expected result
      call.valid = true;
    }
    return call;
  }
}
