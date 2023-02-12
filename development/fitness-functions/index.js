const { getDiffByAutomationType } = require('./common/get-diff');
const { RULES, runFitnessFunctionRule } = require('./rules');

const automationType = process.argv[2];

const diff = getDiffByAutomationType(automationType);

RULES.forEach((rule) => runFitnessFunctionRule(rule, diff));
