import { getPermissionDescription } from '../../../helpers/utils/permission';

export function getSnapInstallWarnings(permissions, targetSubjectMetadata, t) {
  const weightOneWarnings = Object.entries(permissions).reduce(
    (filteredWarnings, [permissionName, permissionValue]) => {
      const permissionDescription = getPermissionDescription({
        t,
        permissionName,
        permissionValue,
        targetSubjectMetadata,
      });

      return filteredWarnings.concat(
        permissionDescription.filter((description) => description.weight <= 2),
      );
    },
    [],
  );

  return weightOneWarnings;
}
