import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  BackgroundColor,
  BorderRadius,
  Severity,
} from '../../../helpers/constants/design-system';

import { getCurrentNetwork } from '../../../selectors';
import { getCompletedOnboarding } from '../../../ducks/metamask/metamask';
import { BannerAlert, Box } from '../../component-library';
import {
  AURORA_DISPLAY_NAME,
  CHAIN_IDS,
  CURRENCY_SYMBOLS,
  DEPRECATED_NETWORKS,
  NEAR_AURORA_MAINNET_IMAGE_URL,
} from '../../../../shared/constants/network';
import { upsertNetworkConfiguration } from '../../../store/actions';
import { MetaMetricsNetworkEventSource } from '../../../../shared/constants/metametrics';

export default function DeprecatedNetworks() {
  const { id, chainId, rpcUrl } = useSelector(getCurrentNetwork) ?? {};
  const [isClosed, setIsClosed] = useState(false);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const t = useI18nContext();
  const dispatch = useDispatch();

  if (!completedOnboarding || isClosed) {
    return null;
  }

  let props;
  if (
    // Goerli variants
    chainId === CHAIN_IDS.GOERLI ||
    chainId === CHAIN_IDS.LINEA_GOERLI ||
    chainId === CHAIN_IDS.ARBITRUM_GOERLI ||
    chainId === CHAIN_IDS.OPTIMISM_GOERLI
  ) {
    props = {
      description: t('deprecatedGoerliNtwrkMsg'),
      actionButtonLabel: t('learnMoreUpperCase'),
      actionButtonProps: {
        href: 'https://github.com/eth-clients/goerli#goerli-goerlitzer-testnet',
        externalLink: true,
      },
    };
  } else if (DEPRECATED_NETWORKS.includes(chainId)) {
    props = { description: t('deprecatedNetwork') };
  } else if (
    chainId === CHAIN_IDS.AURORA &&
    rpcUrl.startsWith('https://aurora-mainnet.infura.io/')
  ) {
    props = {
      description: t('auroraRpcDeprecationMessage'),
      actionButtonLabel: t('switchToNetwork', ['mainnet.aurora.dev']),
      actionButtonOnClick: async () => {
        setIsClosed(true);
        await dispatch(
          upsertNetworkConfiguration(
            {
              id,
              chainId: CHAIN_IDS.AURORA,
              nickname: AURORA_DISPLAY_NAME,
              rpcUrl: 'https://mainnet.aurora.dev',
              ticker: CURRENCY_SYMBOLS.ETH,
              rpcPrefs: {
                imageUrl: NEAR_AURORA_MAINNET_IMAGE_URL,
                blockExplorerUrl: 'https://aurorascan.dev',
              },
            },
            {
              source: MetaMetricsNetworkEventSource.DeprecatedNetworkModal,
              setActive: true,
            },
          ),
        );
      },
    };
  }

  return props ? (
    <Box
      className="deprecated-networks"
      backgroundColor={BackgroundColor.backgroundDefault}
      padding={4}
      borderRadius={BorderRadius.SM}
    >
      <BannerAlert
        severity={Severity.Warning}
        onClose={() => setIsClosed(true)}
        {...props}
      />
    </Box>
  ) : null;
}
