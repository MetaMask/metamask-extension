import { getUseExternalServices } from '../selectors';

/**
 * Security & Trust is available when the user has Basic Functionality
 * (external services) enabled.
 */
export const selectIsTokenSecurityTrustEnabled = getUseExternalServices;
