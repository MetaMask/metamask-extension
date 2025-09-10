import { useSelector } from 'react-redux';
import { getRemoteFeatureFlags } from '../../../selectors/remote-feature-flags';
import { getIsMultichainAccountsState2Enabled } from '../../../selectors/multichain-accounts/feature-flags';
import { ENVIRONMENT } from '../../../../development/build/constants';

type SendRedesignFeatureFlag = {
  enabled: boolean;
};

export function isDevBuild() {
  return process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.DEVELOPMENT;
}

export const useRedesignedSendFlow = () => {
  const { sendRedesign: sendRedesignFeatureFlag } = useSelector(
    getRemoteFeatureFlags,
  );
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );
  const { enabled: isSendRedesignEnabled } = (sendRedesignFeatureFlag ??
    {}) as SendRedesignFeatureFlag;

  // This environment variable is only used for local development to override the remote feature flag
  if (isDevBuild() && process.env.SEND_REDESIGN_ENABLED === 'true') {
    return {
      enabled: true,
    };
  }

  if (isSendRedesignEnabled) {
    if (isMultichainAccountsState2Enabled) {
      return {
        enabled: true,
      };
    }
  }

  return {
    enabled: false,
  };
};
