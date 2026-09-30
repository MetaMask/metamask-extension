import { AUTOMATION_TYPE } from '../common/constants';
import { preventGetApiExpansion } from './prevent-get-api-expansion';
import { preventLegacyBackgroundApiServiceExpansion } from './prevent-legacy-background-api-service-expansion';
import { IRule, RULES, runFitnessFunctionRule } from '.';

describe('runFitnessFunctionRule', () => {
  it('skips the getApi rule when the PR has the allow-background-api-changes label', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    runFitnessFunctionRule({
      rule: findRule(preventGetApiExpansion),
      diff: '',
      automationType: AUTOMATION_TYPE.CI,
      ruleOptions: { labels: ['allow-background-api-changes'] },
      baseRef: 'HEAD',
    });

    expect(log).not.toHaveBeenCalled();
  });

  it('skips the LegacyBackgroundApiService rule when the PR has the allow-background-api-changes label', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    runFitnessFunctionRule({
      rule: findRule(preventLegacyBackgroundApiServiceExpansion),
      diff: '',
      automationType: AUTOMATION_TYPE.CI,
      ruleOptions: { labels: ['allow-background-api-changes'] },
      baseRef: 'HEAD',
    });

    expect(log).not.toHaveBeenCalled();
  });

  it('runs the legacy background API rules when the PR has other labels', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const rule = findRule(preventGetApiExpansion);

    runFitnessFunctionRule({
      rule,
      diff: '',
      automationType: AUTOMATION_TYPE.CI,
      ruleOptions: { labels: ['team-core-platform'] },
      baseRef: 'HEAD',
    });

    expect(log).toHaveBeenCalledWith(`Checking rule "${rule.name}"...`);
  });

  it('skips CI-only rules outside of CI', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    runFitnessFunctionRule({
      rule: findRule(preventGetApiExpansion),
      diff: '',
      automationType: AUTOMATION_TYPE.PRE_COMMIT_HOOK,
      ruleOptions: { labels: [] },
      baseRef: 'HEAD',
    });

    expect(log).not.toHaveBeenCalled();
  });
});

function findRule(fn: IRule['fn']): IRule {
  const rule = RULES.find((candidate) => candidate.fn === fn);
  if (!rule) {
    throw new Error('Rule not found');
  }
  return rule;
}
