import { useSelector } from 'react-redux';

import { getRemoteFeatureFlags } from '../../../selectors/remote-feature-flags';

type SendRedesignFeatureFlag = {
  enabled: boolean;
};

export const useRedesignedSendFlow = () => {
  const { sendRedesign: sendRedesignFeatureFlag } = useSelector(
    getRemoteFeatureFlags,
  );

  const { enabled: isSendRedesignEnabled } = (sendRedesignFeatureFlag ??
    {}) as SendRedesignFeatureFlag;

  return {
    enabled: isSendRedesignEnabled,
  };
};
