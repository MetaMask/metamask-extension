import { AUTOMATION_TYPE } from '../common/constants';
import { preventSinonAssertSyntax } from './sinon-assert-syntax';
import { preventJavaScriptFileAdditions } from './javascript-additions';
import { preventDeprecatedImports } from './prevent-deprecated-imports';
import { preventGetApiExpansion } from './prevent-get-api-expansion';
import { preventLegacyBackgroundApiServiceExpansion } from './prevent-legacy-background-api-service-expansion';

const RULES: IRule[] = [
  {
    name: "Don't use `sinon` or `assert` in unit tests",
    fn: preventSinonAssertSyntax,
    errorMessage:
      '`sinon` or `assert` was detected in the diff. Please use Jest instead. For more info: https://github.com/MetaMask/metamask-extension/blob/main/docs/testing.md#favor-jest-instead-of-mocha',
  },
  {
    name: "Don't add JS or JSX files",
    fn: preventJavaScriptFileAdditions,
    errorMessage:
      'The diff includes a newly created JS or JSX file. Please use TS or TSX instead.',
  },
  {
    name: "Don't import deprecated UI components in new files",
    fn: preventDeprecatedImports,
    errorMessage:
      'The diff includes imports from deprecated paths. Please use @metamask/design-system-react instead. See: https://github.com/MetaMask/metamask-extension/blob/main/docs/design-system.md',
  },
  {
    name: "Don't expand MetamaskController.getApi",
    fn: preventGetApiExpansion,
    errorMessage:
      'Do not add new properties to MetamaskController.getApi(). Please place actions in a controller or service, expose them through the messenger, and use useMessenger() in UI files to access them.\n- You can read more about UI messengers here: https://github.com/MetaMask/core/tree/main/docs/legacy/ui-messengers-announcement.md.\n- You can read about data services here: https://github.com/MetaMask/core/tree/main/docs/legacy/data-services-announcement.md.',
    automationType: AUTOMATION_TYPE.CI,
    skip: ({ allowBackgroundApiChanges }) => allowBackgroundApiChanges,
  },
  {
    name: "Don't expand LegacyBackgroundApiService",
    fn: preventLegacyBackgroundApiServiceExpansion,
    errorMessage:
      'Do not add new methods to LegacyBackgroundApiService. Please place actions in a controller or service, expose them through the messenger, and use useMessenger() in UI files to access them.\n- You can read more about UI messengers here: https://github.com/MetaMask/core/tree/main/docs/legacy/ui-messengers-announcement.md.\n- You can read about data services here: https://github.com/MetaMask/core/tree/main/docs/legacy/data-services-announcement.md.',
    automationType: AUTOMATION_TYPE.CI,
    skip: ({ allowBackgroundApiChanges }) => allowBackgroundApiChanges,
  },
];

type IRule = {
  name: string;
  fn: (diff: string, baseRef: string) => boolean;
  errorMessage: string;
  automationType?: AUTOMATION_TYPE;
  skip?: (options: { allowBackgroundApiChanges: boolean }) => boolean;
};

function runFitnessFunctionRule({
  rule,
  diff,
  automationType,
  ruleOptions,
  baseRef,
}: {
  rule: IRule;
  diff: string;
  automationType: AUTOMATION_TYPE;
  ruleOptions: {
    allowBackgroundApiChanges: boolean;
  };
  baseRef: string;
}): void {
  const { name, fn, errorMessage } = rule;
  if (
    (rule.automationType && rule.automationType !== automationType) ||
    rule.skip?.(ruleOptions)
  ) {
    return;
  }
  console.log(`Checking rule "${name}"...`);

  const hasRulePassed: boolean = fn(diff, baseRef);
  if (hasRulePassed === true) {
    console.log(`...OK`);
  } else {
    console.log(`...FAILED. Changes not accepted by the fitness function.`);
    console.log(errorMessage);
    process.exit(1);
  }
}

export { RULES, runFitnessFunctionRule };
export type { IRule };
