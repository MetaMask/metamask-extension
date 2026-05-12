import type { I18NSubstitution } from '../i18n';
import type { ActivityType, Status } from './types';

const fallbackLabelKey = 'activity_fallback';

export function getLabels({
  type,
  status,
  substitutions,
}: {
  type: ActivityType;
  status: Status;
  substitutions?: I18NSubstitution[];
}) {
  const key = type && status ? `activity_${type}_${status}` : fallbackLabelKey;

  return {
    title: {
      key: `${key}_title`,
      substitutions,
    },
    description: {
      key: `${key}_description`,
      substitutions,
    },
  };
}
