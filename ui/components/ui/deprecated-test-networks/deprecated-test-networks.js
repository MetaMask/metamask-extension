import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Severity } from '../../../helpers/constants/design-system';

import { getCurrentChainId } from '../../../selectors';
import { getCompletedOnboarding } from '../../../ducks/metamask/metamask';
import { BannerAlert, BUTTON_VARIANT } from '../../component-library';

export default function DeprecatedTestNetworks() {
  const currentChainID = useSelector(getCurrentChainId);
  const [isShowingWarning, setIsShowingWarning] = useState(false);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const t = useI18nContext();
  useEffect(() => {
    if (
      completedOnboarding &&
      (currentChainID === '0x3' ||
        currentChainID === '0x2a' ||
        currentChainID === '0x4')
    ) {
      setIsShowingWarning(true);
    } else {
      setIsShowingWarning(false);
    }
  }, [currentChainID, completedOnboarding]);

  return (
    isShowingWarning && (
      <BannerAlert
        severity={Severity.Warning}
        className="deprecated-test-networks"
        description={t('deprecatedTestNetworksMsg')}
        onClose={() => setIsShowingWarning(false)}
        margin={2}
        actionButtonLabel={t('deprecatedTestNetworksLink')}
        actionButtonProps={{
          className: 'deprecated-test-networks__content__inline-link',
          href: 'https://blog.ethereum.org/2022/06/21/testnet-deprecation/',
          variant: BUTTON_VARIANT.LINK,
          externalLink: true,
        }}
      />
    )
  );
}
