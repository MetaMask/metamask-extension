import { preventSinonAssertSyntax } from './sinon-assert-syntax';
import { preventJavaScriptFileAdditions } from './javascript-additions';

const RULES: IRule[] = [
  {
    name: "Don't use `sinon` or `assert` in unit tests",
    fn: preventSinonAssertSyntax,
    docURL:
      'https://github.com/MetaMask/metamask-extension/blob/develop/docs/testing.md#favor-jest-instead-of-mocha',
  },
  {
    name: "Don't add JS or JSX files to the `shared` directory",
    fn: preventJavaScriptFileAdditions,
    docURL: '',
  },
];

interface IRule {
  name: string;
  fn: (diff: string) => boolean;
  docURL?: string;
}

function runFitnessFunctionRule(
  { name, fn, docURL }: IRule,
  diff: string,
): void {
  console.log(`Checking rule "${name}"...`);

  const hasRulePassed: boolean = fn(diff) as boolean;
  if (hasRulePassed === true) {
    console.log(`...OK`);
  } else {
    console.log(`...FAILED. Changes not accepted by the fitness function.`);

    if (docURL !== '') {
      console.log(`For more info: ${docURL}.`);
    }

    process.exit(1);
  }
}

export { RULES, runFitnessFunctionRule };
export type { IRule };
