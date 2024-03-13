import { getPermissionDescription } from '../../../helpers/utils/permission';

export function getSnapInstallWarnings(permissions, t, snapName) {
  const weightOneWarnings = Object.entries(permissions).reduce(
    (filteredWarnings, [permissionName, permissionValue]) => {
      const permissionDescription = getPermissionDescription({
        t,
        permissionName,
        permissionValue,
        subjectName: snapName,
      });

      return filteredWarnings.concat(
        permissionDescription.filter((description) => description.weight <= 2),
      );
    },
    [],
  );

  return weightOneWarnings;
}
