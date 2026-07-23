import { createSelector } from 'reselect';
import { getUseExternalServices } from '../selectors';
import { IS_TOKEN_SECURITY_TRUST_UI_ENABLED } from './constants';

/**
 * Security & Trust is available when the code toggle is on and the user has
 * Basic Functionality (external services) enabled.
 */
export const selectIsTokenSecurityTrustEnabled = createSelector(
  getUseExternalServices,
  (useExternalServices) =>
    IS_TOKEN_SECURITY_TRUST_UI_ENABLED && useExternalServices,
);
