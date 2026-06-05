import type { ActivityKind, Status } from './types';

const fallbackLabelKey = 'activity_fallback';

export function getLabelKeys({
  type,
  status,
}: {
  type: ActivityKind;
  status: Status;
}) {
  const key = type && status ? `activity_${type}_${status}` : fallbackLabelKey;

  return {
    title: {
      key: `${key}_title`,
    },
    description: {
      key: `${key}_description`,
    },
  };
}
