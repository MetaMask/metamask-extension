import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  AURORA_DISPLAY_NAME,
  AURORA_TOKEN_IMAGE_URL,
  CHAIN_IDS,
  CURRENCY_SYMBOLS,
  DEPRECATED_NETWORKS,
  NEAR_AURORA_MAINNET_IMAGE_URL,
} from '../../../../shared/constants/network';
import { NETWORKS_ROUTE } from '../../../helpers/constants/routes';
import { editAndSetNetworkConfiguration, upsertNetworkConfiguration } from '../../../store/actions';
import { MetaMetricsNetworkEventSource } from '../../../../shared/constants/metametrics';

export default function DeprecatedNetworks() {
  const history = useHistory();
  const dispatch = useDispatch();
  const currentNetwork = useSelector(getCurrentNetwork);
  const { chainId, rpcUrl } = currentNetwork;
  console.log(currentNetwork)
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
  } else if (chainId === CHAIN_IDS.AURORA /*&& rpcUrl.includes('infura.io')*/) {
    props = {
      description:
        'The Infura RPC URL is no longer supporting Aurora. Click here to use https://mainnet.aurora.dev.',
      actionButtonLabel: 'Change RPC Endpoint',
      actionButtonOnClick: async () => {
        setIsClosed(true);
        await dispatch(
          editAndSetNetworkConfiguration(
            {
             networkConfigurationId: currentNetwork.id,
             chainId: CHAIN_IDS.AURORA,
             nickname: AURORA_DISPLAY_NAME,
             rpcUrl: 'https://mainnet.aurora.dev',
             ticker: CURRENCY_SYMBOLS.ETH,
             rpcPrefs: {
              imageUrl: NEAR_AURORA_MAINNET_IMAGE_URL,
              blockExplorerUrl: 'https://aurorascan.dev',
            },
            },
            { source: MetaMetricsNetworkEventSource.CustomNetworkForm},
          ),
        );
      },
    };
  }

  return (
    props ? (
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
    ) : null
  );
}
