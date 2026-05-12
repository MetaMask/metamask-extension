import type { I18NSubstitution } from '../i18n';
import type { ActivityType, Status } from './types';

const fallbackLabelKey = 'activity.fallback';

export function getLabels({
  type,
  status,
  substitutions,
}: {
  type: ActivityType;
  status: Status;
  substitutions?: I18NSubstitution[];
}) {
  const key = type && status ? `activity.${type}.${status}` : fallbackLabelKey;

  return {
    title: {
      key: `${key}.title`,
      substitutions,
    },
    description: {
      key: `${key}.description`,
      substitutions,
    },
  };
}
