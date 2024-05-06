import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  BackgroundColor,
  BorderRadius,
  Severity,
} from '../../../helpers/constants/design-system';

import { getCurrentNetwork } from '../../../selectors';
import { getCompletedOnboarding } from '../../../ducks/metamask/metamask';
import { BannerAlert, Box, ButtonLink } from '../../component-library';
import {
  CHAIN_IDS,
  DEPRECATED_NETWORKS,
} from '../../../../shared/constants/network';
import { NETWORKS_ROUTE } from '../../../helpers/constants/routes';

export default function DeprecatedNetworks() {
  const history = useHistory();
  const { chainId, rpcUrl } = useSelector(getCurrentNetwork);
  const [isClosed, setIsClosed] = useState(false);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const t = useI18nContext();

  if (!completedOnboarding || isClosed) {
    return null;
  }

  let props;
  if (chainId === CHAIN_IDS.GOERLI) {
    props = {
      description: t('deprecatedGoerliNtwrkMsg'),
      actionButtonLabel: t('learnMoreUpperCase'),
      actionButtonProps: {
        href: 'https://github.com/eth-clients/goerli#goerli-goerlitzer-testnet',
      },
    };
  } else if (DEPRECATED_NETWORKS.includes(chainId)) {
    props = { description: t('deprecatedNetwork') };
  } else if (chainId === CHAIN_IDS.AURORA && rpcUrl.includs('infura.io')) {
    props = {
      description:
        'The Infura RPC URL is no longer supporting Aurora. To use Aurora, please edit the RPC URL.',
      actionButtonLabel: 'Network Settings',
      actionButtonOnClick: () => {
        setIsClosed(true);
        global.platform.openExtensionInBrowser(NETWORKS_ROUTE);
      },
    };
  }

  return (
    props && (
      <Box
        className="deprecated-networks"
        backgroundColor={BackgroundColor.backgroundDefault}
        padding={4}
        borderRadius={BorderRadius.SM}
      >
        <BannerAlert
          severity={Severity.Warning}
          onClose={() => setIsClosed(true)}
          actionButtonProps={{
            variant: ButtonLink,
            externalLink: true,
            ...props.actionButtonProps,
          }}
          {...props}
        />
      </Box>
    )
  );
}
