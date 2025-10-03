import { useSelector } from 'react-redux';

import { getIsMultichainAccountsState2Enabled } from '../../../selectors/multichain-accounts/feature-flags';
import { getRemoteFeatureFlags } from '../../../selectors/remote-feature-flags';

type SendRedesignFeatureFlag = {
  enabled: boolean;
};

export const useRedesignedSendFlow = () => {
  const { sendRedesign: sendRedesignFeatureFlag } = useSelector(
    getRemoteFeatureFlags,
  );
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );
  const { enabled: isSendRedesignEnabled } = (sendRedesignFeatureFlag ??
    {}) as SendRedesignFeatureFlag;

  if (!isSendRedesignEnabled || !isMultichainAccountsState2Enabled) {
    return {
      enabled: false,
    };
  }

  return {
    enabled: true,
  };
};
