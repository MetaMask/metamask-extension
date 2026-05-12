import type { I18NSubstitution } from '../i18n';
import type { ActivityType, Status } from './types';

export function getLabels({
  status,
  substitutions,
  type,
}: {
  status: Status;
  substitutions?: I18NSubstitution[];
  type: ActivityType;
}) {
  return {
    description: {
      key: `activity.${type}.${status}.description`,
      substitutions,
    },
    title: {
      key: `activity.${type}.${status}.title`,
      substitutions,
    },
  };
}
