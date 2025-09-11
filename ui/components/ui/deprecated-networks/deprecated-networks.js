import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  BackgroundColor,
  BorderRadius,
  Severity,
} from '../../../helpers/constants/design-system';

import { getCurrentNetwork, getEnabledNetworks } from '../../../selectors';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';
import { getCompletedOnboarding } from '../../../ducks/metamask/metamask';
import { BannerAlert, Box } from '../../component-library';
import {
  CHAIN_IDS,
  DEPRECATED_NETWORKS,
} from '../../../../shared/constants/network';
import { updateNetwork } from '../../../store/actions';

export default function DeprecatedNetworks() {
  const { chainId, rpcUrl } = useSelector(getCurrentNetwork) ?? {};
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const enabledNetworks = useSelector(getEnabledNetworks);
  const [isClosed, setIsClosed] = useState(false);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const t = useI18nContext();
  const dispatch = useDispatch();

  const GOERLI_VARIANTS = [
    CHAIN_IDS.GOERLI,
    CHAIN_IDS.LINEA_GOERLI,
    CHAIN_IDS.ARBITRUM_GOERLI,
    CHAIN_IDS.OPTIMISM_GOERLI,
  ];

  const isDeprecatedNetworkGoerliVariants = Object.keys(
    enabledNetworks?.eip155 || {},
  ).some((network) => GOERLI_VARIANTS.includes(network));

  const isDeprecatedNetwork = Object.keys(enabledNetworks?.eip155 || {}).some(
    (network) => DEPRECATED_NETWORKS.includes(network),
  );

  if (!completedOnboarding || isClosed) {
    return null;
  }

  let props;
  if (
    // Goerli variants
    chainId === CHAIN_IDS.GOERLI ||
    chainId === CHAIN_IDS.LINEA_GOERLI ||
    chainId === CHAIN_IDS.ARBITRUM_GOERLI ||
    chainId === CHAIN_IDS.OPTIMISM_GOERLI ||
    isDeprecatedNetworkGoerliVariants
  ) {
    props = {
      description: t('deprecatedGoerliNtwrkMsg'),
      actionButtonLabel: t('learnMoreUpperCase'),
      actionButtonProps: {
        href: 'https://github.com/eth-clients/goerli#goerli-goerlitzer-testnet',
        externalLink: true,
      },
    };
  } else if (DEPRECATED_NETWORKS.includes(chainId) || isDeprecatedNetwork) {
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

        const networkConfiguration = networkConfigurations[chainId];
        networkConfiguration.rpcEndpoints[
          networkConfiguration.defaultRpcEndpointIndex
        ].url = 'https://mainnet.aurora.dev';

        await dispatch(updateNetwork(networkConfiguration));
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
