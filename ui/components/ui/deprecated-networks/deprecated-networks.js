import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Severity } from '../../../helpers/constants/design-system';

import { getCurrentChainId } from '../../../selectors';
import { getCompletedOnboarding } from '../../../ducks/metamask/metamask';
import { BannerAlert, ButtonLink } from '../../component-library';

export default function DeprecatedNetworks() {
  const currentChainID = useSelector(getCurrentChainId);
  const [isShowingWarning, setIsShowingWarning] = useState(false);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const t = useI18nContext();
  useEffect(() => {
    if (completedOnboarding && currentChainID === '0x4e454152') {
      setIsShowingWarning(true);
    } else {
      setIsShowingWarning(false);
    }
  }, [currentChainID, completedOnboarding]);

  return (
    isShowingWarning && (
      <BannerAlert
        severity={Severity.Warning}
        className="deprecated-networks"
        description={t('deprecatedAuroraNetworkMsg')}
        onClose={() => setIsShowingWarning(false)}
        margin={2}
        actionButtonLabel={t('learnMoreUpperCase')}
        actionButtonProps={{
          className: 'deprecated-networks__content__inline-link',
          href: 'https://mainnet.aurora.dev/',
          variant: ButtonLink,
          externalLink: true,
        }}
      />
    )
  );
}
