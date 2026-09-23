import { exitWithError } from '../lib/exit-with-error';
import { getDiffByAutomationType } from './common/get-diff';
import { parseFitnessFunctionArguments } from './common/parse-arguments';
import { IRule, RULES, runFitnessFunctionRule } from './rules';

const { automationType, diffPath, allowBackgroundApiChanges } =
  parseFitnessFunctionArguments(process.argv.slice(2));

getDiffByAutomationType(automationType, diffPath)
  .then(({ baseRef, diff }) => {
    RULES.forEach((rule: IRule): void =>
      runFitnessFunctionRule({
        rule,
        diff,
        automationType,
        ruleOptions: { allowBackgroundApiChanges },
        baseRef,
      }),
    );
  })
  .catch((error) => {
    exitWithError(error);
  });
