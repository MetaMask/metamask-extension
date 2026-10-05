import { useSelector } from 'react-redux';
import type { TrendingAsset } from '@metamask/assets-controllers';

import { getUseExternalServices } from '../../selectors';
import { getIsSecurityTrustTdpEnabled } from '../../selectors/multichain/feature-flags';

/**
 * Whether Discover feeds may request and show token security data.
 * Matches the tokens list gate: basic functionality and Security & Trust.
 */
export const useDiscoverTokenSecurityDataEnabled = (): boolean => {
  const allowExternalServices = useSelector(getUseExternalServices);
  const isSecurityTrustEnabled = useSelector(getIsSecurityTrustTdpEnabled);

  return Boolean(allowExternalServices && isSecurityTrustEnabled);
};
