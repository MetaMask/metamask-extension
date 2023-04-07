import { AUTOMATION_TYPE } from './common/constants';
import { getDiffByAutomationType } from './common/get-diff';
import { RULES, runFitnessFunctionRule } from './rules';

const automationType: AUTOMATION_TYPE = process.argv[2] as AUTOMATION_TYPE;

const diff = getDiffByAutomationType(automationType);

RULES.forEach((rule) => runFitnessFunctionRule(rule, diff));
