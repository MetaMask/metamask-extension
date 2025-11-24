import semver from 'semver';
import packageJson from '../../../package.json';

export type VersionGatedFeatureFlag = {
  enabled: boolean;
  minimumVersion: string | null;
};

const APP_VERSION = packageJson.version;

export const hasMinimumRequiredVersion = (
  minRequiredVersion?: string | null,
) => {
  if (!minRequiredVersion || !APP_VERSION) {
    return false;
  }
  try {
    return semver.gte(APP_VERSION, minRequiredVersion);
  } catch {
    return false;
  }
};

export const validatedVersionGatedFeatureFlag = (
  remoteFlag: VersionGatedFeatureFlag | undefined | null,
) => {
  if (
    !remoteFlag ||
    typeof remoteFlag.enabled !== 'boolean' ||
    (remoteFlag.minimumVersion !== null &&
      typeof remoteFlag.minimumVersion !== 'string')
  ) {
    return undefined;
  }

  return (
    remoteFlag.enabled && hasMinimumRequiredVersion(remoteFlag.minimumVersion)
  );
};
