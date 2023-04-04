import { isObject } from '@metamask/utils';
import { PERMISSION_DESCRIPTIONS } from '../../../helpers/utils/permission';

export function getSnapInstallWarnings(permissions, targetSubjectMetadata, t) {
  const weightOneWarnings = Object.entries(permissions).reduce(
    (filteredWarnings, [permissionName, permissionValue]) => {
      const permissionDescription = PERMISSION_DESCRIPTIONS[permissionName]({
        t,
        permissionValue,
        targetSubjectMetadata,
      });
      if (Array.isArray(permissionDescription)) {
        permissionDescription.forEach((description) => {
          if (description.weight === 1) {
            const { id, message } = description;
            filteredWarnings.push({ id, message });
          }
        });
      } else if (
        isObject(permissionDescription) &&
        permissionDescription.weight === 1
      ) {
        const { id, message } = permissionDescription;
        filteredWarnings.push({ id, message });
      }
      return filteredWarnings;
    },
    [],
  );

  return weightOneWarnings;
}
