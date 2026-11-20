import { ADMITTED_SERIES } from './gated-metrics';
import { PAIRED_ORDERS, type PairedOrder } from './paired';
import { BENCHMARK_DIR, PRESETS } from './presets';

/** The file of each flow that carries an admitted series, by the flow's result key. */
const FLOW_FILES: Readonly<Record<string, string>> = {
  bridgeUserActions: `${BENCHMARK_DIR}/interaction/bridge-user-actions.ts`,
  loadNewAccount: `${BENCHMARK_DIR}/interaction/load-new-account.ts`,
  assetDetails: `${BENCHMARK_DIR}/user-journey/asset-details.ts`,
  solanaAssetDetails: `${BENCHMARK_DIR}/user-journey/solana-asset-details.ts`,
  startupStandardHome: `${BENCHMARK_DIR}/startup/standard-home.ts`,
};

export type PairedFlow = {
  /** The flow's result key, the first segment of an admitted series' name. */
  name: string;
  file: string;
};

/**
 * Names of the flows with an admitted series, in the order the record lists
 * them.
 */
export function admittedFlowNames(): string[] {
  return [
    ...new Set(ADMITTED_SERIES.map((entry) => entry.series.split('.')[0])),
  ];
}

/**
 * The flows a PR's jobs run paired: those with an admitted series. Every other
 * flow runs unpaired and is reported, never blocking.
 */
export function getPairedFlows(): PairedFlow[] {
  return admittedFlowNames().map((name) => {
    const file = FLOW_FILES[name];
    if (!file) {
      throw new Error(
        `Admitted series name flow "${name}", which has no file in FLOW_FILES (paired-flows.ts)`,
      );
    }
    return { name, file };
  });
}

/**
 * @param files - A preset's benchmark files.
 * @param skip - Files that run paired in another job.
 * @returns The preset's files without those.
 */
export function omitFiles(
  files: readonly string[],
  skip: readonly string[],
): string[] {
  return files.filter((file) => !skip.includes(file));
}

/** The presets the benchmark workflow runs, one job per browser each, in the workflow's order. */
export const CI_PRESETS = [
  'startupStandardHome',
  'startupPowerUserHome',
  'interactionUserActions',
  'userJourneyOnboardingImport',
  'userJourneyOnboardingNew',
  'userJourneyAssets',
  'userJourneyTransactions',
  'userJourneyAccountManagement',
] as const;

/**
 * Jobs per order and flow. Two orders of two give four jobs, eight differences
 * and a signed-rank bound at 5%: the shape the admitted series were scored at.
 */
export const PAIRED_REPEATS = 2;

/** One job of the benchmark workflow's matrix. */
export type BenchmarkLeg = {
  browser: 'chrome' | 'firefox';
  buildType: 'webpack';
  /** The preset an unpaired job runs, `''` for a paired job. */
  pageType: string;
  /** The flow a paired job runs, `''` for an unpaired job. */
  pairedFlow: PairedFlow | '';
  pairedOrder: PairedOrder | '';
  /** Which of the flow's `PAIRED_REPEATS` jobs in this order, from 1; `''` for an unpaired job. */
  pairedRepeat: number | '';
  /** Files of `pageType` that run paired instead, space separated. */
  skip: string;
};

/**
 * The jobs of the benchmark workflow, which a test holds equal to the literals in `run-benchmarks.yml`.
 * @param paired - Whether the PR's jobs pair base and head builds.
 */
export function getBenchmarkLegs(paired: boolean): BenchmarkLeg[] {
  const pairedFiles = paired ? getPairedFlows().map(({ file }) => file) : [];
  const legs: BenchmarkLeg[] = [];
  for (const browser of ['chrome', 'firefox'] as const) {
    for (const pageType of CI_PRESETS) {
      const files = PRESETS[pageType];
      // Paired jobs run on Chrome only, so Firefox keeps every file.
      const skip =
        browser === 'chrome'
          ? files.filter((file) => pairedFiles.includes(file))
          : [];
      if (skip.length < files.length) {
        legs.push({
          browser,
          buildType: 'webpack',
          pageType,
          pairedFlow: '',
          pairedOrder: '',
          pairedRepeat: '',
          skip: skip.join(' '),
        });
      }
    }
  }
  if (paired) {
    for (const pairedFlow of getPairedFlows()) {
      for (const pairedOrder of PAIRED_ORDERS) {
        for (
          let pairedRepeat = 1;
          pairedRepeat <= PAIRED_REPEATS;
          pairedRepeat++
        ) {
          legs.push({
            browser: 'chrome',
            buildType: 'webpack',
            pageType: '',
            pairedFlow,
            pairedOrder,
            pairedRepeat,
            skip: '',
          });
        }
      }
    }
  }
  return legs;
}
