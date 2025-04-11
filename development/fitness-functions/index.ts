import type { AUTOMATION_TYPE } from './common/constants';
import { getDiffByAutomationType } from './common/get-diff';
import type { IRule } from './rules';
import { RULES, runFitnessFunctionRule } from './rules';

const automationType: AUTOMATION_TYPE = process.argv[2] as AUTOMATION_TYPE;

const diff = getDiffByAutomationType(automationType);

if (typeof diff === 'string') {
  RULES.forEach((rule: IRule): void => runFitnessFunctionRule(rule, diff));
}
