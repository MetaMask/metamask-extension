import type { PairedBuild, PairedOrder } from '../paired';

// One flow's results from a paired job, as `mergePairedRuns` writes them: head
// runs in `values`, base runs in `baseValues`, each iteration tagged with its
// run's build and position. A run's two iterations sit 5 ms either side of its mean.
export function makePairedFlowResults({
  order,
  runMeans,
  missingByRun,
  error,
}: {
  order: PairedOrder;
  /** Each series' mean per run, by position. */
  runMeans: Record<string, readonly [number, number, number, number]>;
  /** Page loads with no value per series and run, by position: a startup flow's `missingCount`. */
  missingByRun?: Record<string, readonly [number, number, number, number]>;
  /** Set on a job that did not complete. */
  error?: string;
}): Record<string, unknown> {
  const builds = order.split('-') as PairedBuild[];
  const samples = (want: PairedBuild) =>
    Object.fromEntries(
      Object.entries(runMeans).map(([series, means]) => [
        series,
        builds.flatMap((build, position) =>
          build === want
            ? [-5, 5].map((offset, i) => ({
                iteration: position * 2 + i,
                value: means[position] + offset,
                build,
                position,
              }))
            : [],
        ),
      ]),
    );
  const statistic = (value: number) =>
    Object.fromEntries(Object.keys(runMeans).map((series) => [series, value]));
  return {
    testTitle: 'paired',
    persona: 'standard',
    mean: statistic(1000),
    min: statistic(990),
    max: statistic(1010),
    stdDev: statistic(5),
    p75: statistic(1005),
    p95: statistic(1010),
    values: samples('head'),
    baseValues: samples('base'),
    pairing: {
      order,
      warmup: builds
        .slice(0, 2)
        .map((build, position) => ({ build, position })),
      runs: builds.map((build, position) => ({
        build,
        position,
        ...(missingByRun && {
          missingCount: Object.fromEntries(
            Object.entries(missingByRun).map(([series, counts]) => [
              series,
              counts[position],
            ]),
          ),
        }),
      })),
    },
    ...(error && { error }),
  };
}

// Head runs `shift` ms above base runs for every series, around a base of 1000.
export function makeShiftedFlowResults(
  order: PairedOrder,
  series: readonly string[],
  shift: number,
): Record<string, unknown> {
  const [first, second, third, fourth] = order
    .split('-')
    .map((build) => (build === 'head' ? 1000 + shift : 1000));
  return makePairedFlowResults({
    order,
    runMeans: Object.fromEntries(
      series.map((id) => [id, [first, second, third, fourth] as const]),
    ),
  });
}
