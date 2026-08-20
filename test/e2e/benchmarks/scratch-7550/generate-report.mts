import { readFileSync, writeFileSync } from 'fs';
import type {
  BenchmarkResults,
  WebVitalsSummary,
} from '../../../../shared/constants/benchmarks';

type BenchmarkBundle = Record<string, BenchmarkResults>;

type CliArgs = {
  after: string;
  beforeToken: string;
  beforeSwitch: string;
  afterSha: string;
  beforeTokenSha: string;
  beforeSwitchSha: string;
  out: string;
};

type ScenarioRow = {
  scenario: string;
  harness: string;
  beforeSha: string;
  afterSha: string;
  beforeKey: string;
  afterKey: string;
  beforeBundle: BenchmarkBundle;
  afterBundle: BenchmarkBundle;
  primaryTimer: string;
};

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const get = (flag: string): string => {
    const index = args.indexOf(flag);
    if (index === -1 || !args[index + 1]) {
      throw new Error(`Missing required flag ${flag}`);
    }
    return args[index + 1];
  };
  return {
    after: get('--after'),
    beforeToken: get('--before-token'),
    beforeSwitch: get('--before-switch'),
    afterSha: get('--after-sha'),
    beforeTokenSha: get('--before-token-sha'),
    beforeSwitchSha: get('--before-switch-sha'),
    out: get('--out'),
  };
}

function loadBundle(path: string): BenchmarkBundle {
  return JSON.parse(readFileSync(path, 'utf8')) as BenchmarkBundle;
}

function formatMetric(
  bundle: BenchmarkBundle,
  registryKey: string,
  timerId: string,
  webVitals?: WebVitalsSummary,
): string {
  const result = bundle[registryKey];
  if (!result) {
    return 'n/a';
  }
  const actionP75 = result.p75[timerId];
  const longTaskMax = result.p75.longTaskMaxDuration;
  const tbt = result.p75.tbt;
  const inp = webVitals?.aggregated.inp?.p75 ?? result.webVitals?.aggregated.inp?.p75;
  const parts: string[] = [];
  if (inp !== undefined && inp !== null) {
    parts.push(`INP p75 ${Math.round(inp)}ms`);
  }
  if (actionP75 !== undefined) {
    parts.push(`action p75 ${Math.round(actionP75)}ms`);
  }
  if (longTaskMax !== undefined) {
    parts.push(`longTaskMax p75 ${Math.round(longTaskMax)}ms`);
  }
  if (tbt !== undefined) {
    parts.push(`TBT p75 ${Math.round(tbt)}ms`);
  }
  return parts.length > 0 ? parts.join(' · ') : 'n/a';
}

function formatDelta(before: string, after: string): string {
  if (before === 'n/a' || after === 'n/a') {
    return 'n/a';
  }
  const parseInp = (value: string): number | null => {
    const match = value.match(/INP p75 (\d+)ms/u);
    return match ? Number(match[1]) : null;
  };
  const beforeInp = parseInp(before);
  const afterInp = parseInp(after);
  if (beforeInp === null || afterInp === null) {
    return 'see notes';
  }
  const delta = afterInp - beforeInp;
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta}ms INP`;
}

function buildRow(row: ScenarioRow): string {
  const before = formatMetric(
    row.beforeBundle,
    row.beforeKey,
    row.primaryTimer,
    row.beforeBundle[row.beforeKey]?.webVitals,
  );
  const after = formatMetric(
    row.afterBundle,
    row.afterKey,
    row.primaryTimer,
    row.afterBundle[row.afterKey]?.webVitals,
  );
  const beforeCell = `${before} @ \`${row.beforeSha.slice(0, 7)}\``;
  const afterCell = `${after} @ \`${row.afterSha.slice(0, 7)}\``;
  const delta = formatDelta(before, after);
  return `| ${row.scenario} | ${row.harness} | ${beforeCell} | ${afterCell} | ${delta} | done | |`;
}

function main(): void {
  const cli = parseArgs();
  const afterBundle = loadBundle(cli.after);
  const beforeTokenBundle = loadBundle(cli.beforeToken);
  const beforeSwitchBundle = loadBundle(cli.beforeSwitch);

  const rows: ScenarioRow[] = [
    {
      scenario: 'Token search (1000+ tokens)',
      harness: 'token-search-power-user USER_ACTION',
      beforeSha: cli.beforeTokenSha,
      afterSha: cli.afterSha,
      beforeKey: 'tokenSearchPowerUser',
      afterKey: 'tokenSearchPowerUser',
      beforeBundle: beforeTokenBundle,
      afterBundle,
      primaryTimer: 'token_search_power_user',
    },
    {
      scenario: 'Account switching',
      harness: 'account-switch USER_ACTION',
      beforeSha: cli.beforeSwitchSha,
      afterSha: cli.afterSha,
      beforeKey: 'accountSwitchPowerUser',
      afterKey: 'accountSwitchPowerUser',
      beforeBundle: beforeSwitchBundle,
      afterBundle,
      primaryTimer: 'account_switch',
    },
    {
      scenario: 'Network switching',
      harness: 'network-switch USER_ACTION',
      beforeSha: cli.beforeSwitchSha,
      afterSha: cli.afterSha,
      beforeKey: 'networkSwitchPowerUser',
      afterKey: 'networkSwitchPowerUser',
      beforeBundle: beforeSwitchBundle,
      afterBundle,
      primaryTimer: 'network_switch',
    },
    {
      scenario: 'Transaction list scroll',
      harness: 'activity-scroll USER_ACTION',
      beforeSha: cli.beforeSwitchSha,
      afterSha: cli.afterSha,
      beforeKey: 'activityScrollPowerUser',
      afterKey: 'activityScrollPowerUser',
      beforeBundle: beforeSwitchBundle,
      afterBundle,
      primaryTimer: 'activity_list_scroll',
    },
  ];

  const header = `## Scenario measurement (#6657)

| Scenario | New e2e (#7550) | Before (value @ SHA) | After (value @ SHA) | Δ | Status | Notes |
|----------|-----------------|----------------------|---------------------|---|--------|-------|
`;

  const body = rows.map(buildRow).join('\n');
  const footer = `

### SHAs

- After (current): \`${cli.afterSha}\`
- Before token search (pre-#7475 / extension#44443): \`${cli.beforeTokenSha}\`
- Before account/network/activity (pre-#7476 / extension#45265): \`${cli.beforeSwitchSha}\`
`;

  writeFileSync(cli.out, `${header}${body}${footer}`);
  console.log(`Wrote ${cli.out}`);
}

main();
