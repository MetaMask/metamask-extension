/**
 * Canonical `active_ab_tests` entry emitted on analytics business events.
 */
export type ActiveABTestAssignment = {
  /** Canonical experiment identifier, usually the LaunchDarkly flag key. */
  key: string;
  /** Assigned variant name for the active experiment. */
  value: string;
  /** Convenience `key=value` representation derived from `key` and `value`. */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  key_value_pair: string;
};

/**
 * Creates a normalized `active_ab_tests` entry with a derived
 * `key_value_pair`.
 *
 * @param key - Canonical experiment identifier.
 * @param value - Assigned variant name for the active experiment.
 * @returns A normalized active A/B test assignment.
 */
export function createActiveABTestAssignment(
  key: string,
  value: string,
): ActiveABTestAssignment {
  return {
    key,
    value,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    key_value_pair: `${key}=${value}`,
  };
}

const isActiveABTestAssignment = (
  value: unknown,
): value is Pick<ActiveABTestAssignment, 'key' | 'value'> =>
  Boolean(
    value &&
    typeof value === 'object' &&
    'key' in value &&
    typeof value.key === 'string' &&
    'value' in value &&
    typeof value.value === 'string',
  );

/**
 * Normalizes an unknown `active_ab_tests` payload into canonical entries.
 *
 * Legacy objects that only include `key` and `value` are upgraded by deriving
 * `key_value_pair`. Entries without the minimum assignment shape are discarded.
 *
 * @param value - Unknown analytics payload value.
 * @returns Normalized active A/B test assignments.
 */
export function normalizeActiveABTestAssignments(
  value: unknown,
): ActiveABTestAssignment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isActiveABTestAssignment)
    .map(({ key, value: assignmentValue }) =>
      createActiveABTestAssignment(key, assignmentValue),
    );
}
