/**
 * The build target. This descrbes the overall purpose of the build.
 *
 * These constants also act as the high-level tasks for the build system (i.e.
 * the usual tasks invoked directly via the CLI rather than internally).
 */
export enum BuildTarget {
  dev = 'dev',
  dist = 'dist',
  prod = 'prod',
  test = 'test',
  testDev = 'testDev',
}

/**
 * The build environment. This describes the environment this build was produced in.
 */
export enum BuildEnvironment {
  development = 'development',
  production = 'production',
  other = 'other',
  pullRequest = 'pull-request',
  releaseCandidate = 'release-candidate',
  staging = 'staging',
  testing = 'testing',
}
