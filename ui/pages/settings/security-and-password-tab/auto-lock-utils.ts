export type AutoLockOption = {
  labelKey: string;
  /** Value in minutes. 0 means no idle timer (never). */
  value: number;
};

export const AUTO_LOCK_OPTIONS: AutoLockOption[] = [
  { labelKey: 'autoLockAfter15Seconds', value: 0.25 },
  { labelKey: 'autoLockAfter30Seconds', value: 0.5 },
  { labelKey: 'autoLockAfter1Minute', value: 1 },
  { labelKey: 'autoLockAfter5Minutes', value: 5 },
  { labelKey: 'autoLockNever', value: 0 },
];

export function formatAutoLockLabel(
  minutes: number,
  t: (key: string, substitutions?: string[]) => string,
): string {
  const option = AUTO_LOCK_OPTIONS.find((opt) => opt.value === minutes);
  if (option) {
    return t(option.labelKey);
  }

  // Round custom values to keep labels readable. 2 is what we used in other places.
  const roundedMinutes = Number(minutes.toFixed(2));
  return t('autoLockAfterMinutes', [`${roundedMinutes}`]);
}
