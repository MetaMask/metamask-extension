import type { BuildType } from '../../lib/build-type';

/**
 * Computes the version number for use in the extension manifest. Uses the
 * `version` field in the project's `package.json`.
 *
 * @param type
 * @param options
 * @param options.id
 * @param options.isPrerelease
 * @param releaseVersion
 * @returns Returns the version and version_name values for the extension.
 */
export const getExtensionVersion = (
  type: string,
  { id, isPrerelease }: Pick<BuildType, 'id' | 'isPrerelease'>,
  releaseVersion: number,
): { version: string; versionName: string } => {
  const { version } = require('../../../package.json') as { version: string };

  if (id < 10 || id > 64 || releaseVersion < 0 || releaseVersion > 999) {
    throw new Error(
      `Build id must be 10-64 and release version must be 0-999
(inclusive). Received an id of '${id}' and a release version of
'${releaseVersion}'.

Wait, but that seems so arbitrary?
==================================

We encode the build id and the release version into the extension version by
concatenating the two numbers together. The maximum value for the concatenated
number is 65535 (a Chromium limitation). The value cannot start with a '0'. We
utilize 2 digits for the build id and 3 for the release version. This affords us
55 release types and 1000 releases per 'version' + build type.

Okay, so how do I fix it?
=========================

You'll need to adjust the build 'id' (in builds.yml) or the release version to
fit within these limits or bump the version number in package.json and start the
release version number over from 0. If you can't do that you'll need to come up
with a new way of encoding this information, or re-evaluate the need for this
metadata.

Good luck on your endeavors.`,
    );
  }

  if (!isPrerelease) {
    if (releaseVersion !== 0) {
      throw new Error(
        `A '${type}' build's release version must always be '0'. Got '${releaseVersion}' instead.`,
      );
    }
    // main build (non-prerelease) version_name is just a plain version number
    // the version field needs the `.0` because some runtime code freaks out
    // if it's missing.
    return {
      version: `${version}.0`,
      versionName: version,
    };
  }
  return {
    // if version=18.7.25, id=10, releaseVersion=12 we get 18.7.25.1012
    version: `${version}.${id}${releaseVersion}`,
    // The manifest.json's `version_name` field can be anything we want, so we
    // make it human readable, e.g., `18.7.25-beta.123`.
    versionName: `${version}-${type}.${releaseVersion}`,
  };
};
