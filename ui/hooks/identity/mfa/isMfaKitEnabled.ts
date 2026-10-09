import { isProduction } from '../../../../shared/lib/environment';

/**
 * Whether the MFA screens can be reached in this build.
 *
 * @returns `true` in development and test builds only.
 */
export const isMfaKitEnabled = (): boolean => !isProduction();
