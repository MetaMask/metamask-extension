import Rule from '@open-rpc/test-coverage/build/rules/rule';
import { Call } from '@open-rpc/test-coverage/build/coverage';
import {
  ContentDescriptorObject,
  ExampleObject,
  ExamplePairingObject,
  MethodObject,
} from '@open-rpc/meta-schema';
import paramsToObj from '@open-rpc/test-coverage/build/utils/params-to-obj';
import _ from 'lodash';
import { Driver } from '../webdriver/driver';
import { WINDOW_TITLES, switchToOrOpenDapp } from '../helpers';
import { addToQueue } from './helpers';

type MultichainAuthorizationConfirmationOptions = {
  driver: Driver;
  only?: string[];
};
// this rule makes sure that a multichain authorization confirmation dialog is shown and confirmed
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

  async afterRequest(__: unknown, call: Call) {
    await new Promise((resolve, reject) => {
      addToQueue({
        name: 'afterRequest',
        resolve,
        reject,
        task: async () => {
          try {
            await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

            const text = 'Connect';

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
  getCalls(__: unknown, method: MethodObject) {
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
      call.reason = `Expected a result but got error \ncode: ${call.error.code}\n message: ${call.error.message}`;
    } else {
      call.valid = _.isEqual(call.result, call.expectedResult);
      if (!call.valid) {
        call.reason = `Expected:\n${JSON.stringify(
          call.expectedResult,
          null,
          4,
        )} but got\n${JSON.stringify(call.result, null, 4)}`;
      }
    }
    return call;
  }
}
