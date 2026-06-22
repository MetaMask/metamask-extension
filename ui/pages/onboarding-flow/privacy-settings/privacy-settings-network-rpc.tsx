import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  BoxFlexDirection,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  TEST_CHAINS,
} from '../../../../shared/constants/network';
import { getNetworkConfigurationsByChainId } from '../../../../shared/lib/selectors/networks';
import { NetworkListItem } from '../../../components/multichain/network-list-item';
import { useI18nContext } from '../../../hooks/useI18nContext';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { setEditedNetwork, toggleNetworkMenu } from '../../../store/actions';

const PrivacySettingsNetworkRpc = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="w-full overflow-y-auto"
      data-testid="privacy-settings-network-rpc"
    >
      <Box paddingHorizontal={4} paddingVertical={3}>
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
          {t('onboardingAdvancedPrivacyNetworkTitle')}
        </Text>
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          className="mt-4"
        >
          {t('onboardingAdvancedPrivacyNetworkDescription', [
            <a
              href="https://consensys.io/privacy-policy/"
              key="privacy-policy-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('privacyMsg')}
            </a>,
            <a
              href={ZENDESK_URLS.ADD_SOLANA_ACCOUNTS}
              key="solana-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('onboardingAdvancedPrivacyNetworkDescriptionCallToAction')}
            </a>,
          ])}
        </Text>
      </Box>

      <Box flexDirection={BoxFlexDirection.Column} className="w-full px-2">
        {Object.values(networkConfigurations)
          .filter(({ chainId }) => !TEST_CHAINS.includes(chainId))
          .map((network) => {
            const rpcUrl =
              network?.rpcEndpoints[network?.defaultRpcEndpointIndex]?.url;
            const rpcOrigin = rpcUrl
              ? new URL(rpcUrl).origin
              : undefined;

            return (
              <NetworkListItem
                key={network.chainId}
                chainId={network.chainId}
                name={network.name}
                iconSrc={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[network.chainId]}
                rpcEndpoint={rpcOrigin ? { url: rpcOrigin } : undefined}
                onClick={() => {
                  dispatch(
                    setEditedNetwork({
                      chainId: network.chainId,
                    }),
                  );
                  dispatch(toggleNetworkMenu());
                }}
              />
            );
          })}
      </Box>
    </Box>
  );
};

export default PrivacySettingsNetworkRpc;
