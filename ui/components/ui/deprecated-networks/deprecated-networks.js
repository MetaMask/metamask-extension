import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  BackgroundColor,
  BorderRadius,
  Severity,
} from '../../../helpers/constants/design-system';

import { getCurrentChainId } from '../../../selectors';
import { getCompletedOnboarding } from '../../../ducks/metamask/metamask';
import { BannerAlert, Box, ButtonLink } from '../../component-library';
import {
  CHAIN_IDS,
  DEPRECATED_NETWORKS,
} from '../../../../shared/constants/network';

export default function DeprecatedNetworks() {
  const currentChainID = useSelector(getCurrentChainId);
  const [isShowingWarning, setIsShowingWarning] = useState(false);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const t = useI18nContext();

  useEffect(() => {
    if (completedOnboarding && DEPRECATED_NETWORKS.includes(currentChainID)) {
      setIsShowingWarning(true);
    } else {
      setIsShowingWarning(false);
    }
  }, [currentChainID, completedOnboarding]);

  const { bannerAlertDescription, actionBtnLinkURL } =
    getDeprecationWarningCopy(t, currentChainID);

  return isShowingWarning ? (
    <Box
      className="deprecated-networks"
      backgroundColor={BackgroundColor.backgroundDefault}
      padding={4}
      borderRadius={BorderRadius.SM}
    >
      <BannerAlert
        severity={Severity.Warning}
        description={bannerAlertDescription}
        onClose={() => setIsShowingWarning(false)}
        actionButtonLabel={t('learnMoreUpperCase')}
        actionButtonProps={{
          className: 'deprecated-networks__content__inline-link',
          href: actionBtnLinkURL,
          variant: ButtonLink,
          externalLink: true,
        }}
      />
    </Box>
  ) : null;
}

function getDeprecationWarningCopy(t, currentChainID) {
  let bannerAlertDescription, actionBtnLinkURL;

  if (currentChainID === CHAIN_IDS.AURORA) {
    bannerAlertDescription = t('deprecatedAuroraNetworkMsg');
    actionBtnLinkURL = 'https://mainnet.aurora.dev/';
  } else if (DEPRECATED_NETWORKS.includes(currentChainID)) {
    bannerAlertDescription = t('deprecatedGoerliNtwrkMsg');
    actionBtnLinkURL =
      'https://github.com/eth-clients/goerli#goerli-goerlitzer-testnet';
  }

  return { bannerAlertDescription, actionBtnLinkURL };
}
