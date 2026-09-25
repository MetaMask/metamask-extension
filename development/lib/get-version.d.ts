/**
 * Get the current version of the MetaMask extension. The base manifest version
 * is modified according to the build type and version.
 *
 * The build version is needed because certain build types (such as beta) may
 * be released multiple times during the release process.
 *
 * @param buildType - The build type.
 * @param buildVersion - The build version.
 * @returns The MetaMask extension version.
 */
export declare function getVersion(buildType: string, buildVersion: number): string;
