import type { HostProvenance } from '../../../../shared/constants/benchmarks';

/** The provenance fields a stable-runner spec can hold fixed. */
export type ConstrainableField =
  | 'label'
  | 'os'
  | 'arch'
  | 'cpuModel'
  | 'cpuCount'
  | 'imageOs'
  | 'imageVersion'
  | 'runnerEnvironment'
  | 'browserName'
  | 'browserVersion'
  | 'driverVersion';

/**
 * Each constrained field and the values a job may report for it. A field left
 * out is unconstrained; a constrained field a job did not record is nonconforming.
 */
export type StableRunnerSpec = {
  readonly [Field in ConstrainableField]?: readonly (string | number)[];
};

/**
 * What stable runners hold fixed across a series' runs. Empty until a runner
 * evaluation names the pool and its values, so no field is constrained.
 */
export const STABLE_RUNNER_SPEC: StableRunnerSpec = {};

// The fields a job's `host` holds outside the spec, one problem each naming
// the field and the value recorded. `host` is a result file's record as read
// from JSON, so any shape is tolerated; none means the job conforms.
export function provenanceProblems(
  host: unknown,
  spec: StableRunnerSpec = STABLE_RUNNER_SPEC,
): string[] {
  const recorded = (
    typeof host === 'object' && host !== null ? host : {}
  ) as Partial<Record<ConstrainableField, HostProvenance[ConstrainableField]>>;
  return (Object.entries(spec) as [ConstrainableField, readonly unknown[]][])
    .filter(([field, allowed]) => !allowed.includes(recorded[field]))
    .map(([field, allowed]) => {
      const value = recorded[field];
      const list = allowed.map((entry) => JSON.stringify(entry)).join(', ');
      return value === null || value === undefined
        ? `${field} is not recorded (allowed: ${list})`
        : `${field} ${JSON.stringify(value)} is not allowed (allowed: ${list})`;
    });
}
