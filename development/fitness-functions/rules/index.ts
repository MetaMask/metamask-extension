import { preventSinonAssertSyntax } from './sinon-assert-syntax';
import { preventJavaScriptFileAdditions } from './javascript-additions';

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
