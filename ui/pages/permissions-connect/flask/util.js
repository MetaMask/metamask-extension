import { PERMISSION_DESCRIPTIONS } from '../../../helpers/utils/permission';

export function getSnapInstallWarnings(permissions, targetSubjectMetadata, t) {
  const weightOneWarnings = Object.entries(permissions).reduce(
    (filteredPermissions, [permissionName, permissionValue]) => {
      const permissionDescription = PERMISSION_DESCRIPTIONS[permissionName]({
        t,
        permissionValue,
        targetSubjectMetadata,
      });
      if (permissionDescription.weight === 1) {
        const { id, message } = permissionDescription;
        filteredPermissions.push({ id, message });
      }
      return filteredPermissions;
    },
    [],
  );

  return weightOneWarnings;
}
