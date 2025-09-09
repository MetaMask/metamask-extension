import {
  MethodObject,
  ContentDescriptorObject,
  ExamplePairingObject,
  ExampleObject,
  ErrorObject,
} from '@open-rpc/meta-schema';
import Rule from '@open-rpc/test-coverage/build/rules/rule';
import { Call } from '@open-rpc/test-coverage/build/coverage';
import paramsToObj from '@open-rpc/test-coverage/build/utils/params-to-obj';

type ExpectedErrorRuleOptions = {
  only: string[];
};
/**
 * This rule accepts expected errors as successful test results.
 * Errors are automatically extracted from the OpenRPC specification
 * and used for validation during test execution.
 */
export class ExpectedErrorRule implements Rule {
  private only: string[];

  private methodErrors: Map<string, ErrorObject[]>;

  constructor(options: ExpectedErrorRuleOptions) {
    this.only = options.only;
    this.methodErrors = new Map();
  }

  getTitle() {
    return 'Expected Error Rule';
  }

  validateCall(call: Call): Call {
    const expectedErrors = this.methodErrors.get(call.methodName);

    if (expectedErrors && expectedErrors.length > 0) {
      // Check for expected errors from method definition
      if (!call.error) {
        call.valid = false;
        call.reason = `Expected one of the defined errors but received a successful response`;
        return call;
      }

      // Check if the actual error matches any of the expected errors
      const actualError = call.error;
      const matchingError = expectedErrors.find(
        (expectedError) =>
          expectedError.code === actualError.code &&
          expectedError.message === actualError.message &&
          (expectedError.data === null ||
            JSON.stringify(expectedError.data) ===
              JSON.stringify(actualError.data)),
      );

      call.valid = Boolean(matchingError);
      if (!matchingError) {
        const expectedCodes = expectedErrors.map((e) => e.code).join(', ');
        call.reason = `Expected error with code in [${expectedCodes}], got ${actualError.code} and message ${actualError.message}`;
      }
    } else {
      // Accept any error as a successful test result if no specific errors are defined
      call.valid = Boolean(call.error);

      if (!call.error) {
        call.valid = false;
        call.reason = 'Expected an error but received a successful response';
      }
    }

    return call;
  }

  getCalls(_: unknown, method: MethodObject): Call[] {
    const calls: Call[] = [];
    const isMethodAllowed = this.only ? this.only.includes(method.name) : true;

    if (isMethodAllowed) {
      // Extract and store errors from method definition
      if (method.errors) {
        const errorObjects: ErrorObject[] = [];
        for (const error of method.errors) {
          if ('code' in error && 'message' in error) {
            errorObjects.push(error as ErrorObject);
          }
        }
        if (errorObjects.length > 0) {
          this.methodErrors.set(method.name, errorObjects);
        }
      }

      if (method.examples && method.examples.length > 0) {
        // Use the first example from the method
        const example = method.examples[0] as ExamplePairingObject;

        if (example.params) {
          const params = example.params.map(
            (param) => (param as ExampleObject).value,
          );
          const formattedParams =
            method.paramStructure === 'by-name'
              ? paramsToObj(params, method.params as ContentDescriptorObject[])
              : params;

          calls.push({
            title: `${this.getTitle()} - ${method.name} with example params ${example.name}`,
            methodName: method.name,
            params: formattedParams,
            url: '',
            resultSchema: (method.result as ContentDescriptorObject).schema,
          });
        }
      } else {
        // Generate a call with empty params if no examples are available
        calls.push({
          title: `${this.getTitle()} - ${method.name} with no params`,
          methodName: method.name,
          params: [],
          url: '',
          resultSchema: (method.result as ContentDescriptorObject).schema,
        });
      }
    }

    return calls;
  }
}
