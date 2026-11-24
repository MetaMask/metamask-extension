import { isProduction } from '../../../../shared/lib/environment';

/**
 * Whether this build runs the MFA dev tools (the QA presets). Also the
 * fallback for the `mfaUiKit` remote flag, which decides whether the MFA
 * screens can be reached.
 *
 * @returns `true` in development and test builds only.
 */
export const isMfaDevBuild = (): boolean => !isProduction();
