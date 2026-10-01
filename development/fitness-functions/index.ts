import { exitWithError } from '../lib/exit-with-error';
import { getDiffByAutomationType } from './common/get-diff';
import { parseFitnessFunctionArguments } from './common/parse-arguments';
import { RULES, runFitnessFunctionRule } from './rules';

const { automationType, diffPath, allowBackgroundApiChanges } =
  parseFitnessFunctionArguments(process.argv.slice(2));

getDiffByAutomationType(automationType, diffPath)
  .then(({ baseRef, diff }) => {
    for (const rule of RULES) {
      runFitnessFunctionRule({
        rule,
        diff,
        automationType,
        ruleOptions: { allowBackgroundApiChanges },
        baseRef,
      });
    }
  })
  .catch((error) => {
    exitWithError(error);
  });
