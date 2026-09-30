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
      'The properties of MetamaskController.getApi() must match legacy-background-api-snapshot.json.\n- If you removed a property, remove it from the snapshot as well.\n- If you added a property, please place the action in a controller or service instead, expose it through the messenger, and use useMessenger() in UI files to access it.\n  - You can read more about UI messengers here: https://github.com/MetaMask/core/tree/main/docs/legacy/ui-messengers-announcement.md\n  - You can read about data services here: https://github.com/MetaMask/core/tree/main/docs/legacy/data-services-announcement.md\n- In an emergency, you may add the property to the snapshot, but this requires approval from @MetaMask/core-platform.',
  },
  {
    name: "Don't expand LegacyBackgroundApiService",
    fn: preventLegacyBackgroundApiServiceExpansion,
    errorMessage:
      'The public methods of LegacyBackgroundApiService must match legacy-background-api-snapshot.json.\n- If you removed a method, remove it from the snapshot as well.\n- If you added a method, please place the action in a controller or service instead, expose it through the messenger, and use useMessenger() in UI files to access it.\n  - You can read more about UI messengers here: https://github.com/MetaMask/core/tree/main/docs/legacy/ui-messengers-announcement.md\n  - You can read about data services here: https://github.com/MetaMask/core/tree/main/docs/legacy/data-services-announcement.md\n- In an emergency, you may add the method to the snapshot, but this requires approval from @MetaMask/core-platform.',
  },
];

type IRule = {
  name: string;
  fn: (diff: string) => boolean;
  errorMessage: string;
};

function runFitnessFunctionRule(rule: IRule, diff: string): void {
  const { name, fn, errorMessage } = rule;
  console.log(`Checking rule "${name}"...`);

  const hasRulePassed: boolean = fn(diff) as boolean;
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
