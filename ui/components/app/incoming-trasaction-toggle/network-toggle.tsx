import PropTypes from 'prop-types';
import React, { useContext } from 'react';
import { ETHERSCAN_SUPPORTED_NETWORKS } from '../../../../shared/constants/network';
import { I18nContext } from '../../../contexts/i18n';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Text,
} from '../../component-library';
import ToggleButton from '../../ui/toggle-button';
import Tooltip from '../../ui/tooltip';

const MAXIMUM_CHARACTERS_WITHOUT_TOOLTIP = 20;

type NetworkPreferences = {
  isShowIncomingTransactions: boolean;
  label: string;
  imageUrl: string;
};

type NetworkToggleProps = {
  networkPreferences: NetworkPreferences;
  toggleSingleNetwork: (chainId: string, value: boolean) => void;
  chainId: string;
};

const NetworkToggle = ({
  networkPreferences,
  toggleSingleNetwork,
  chainId,
}: NetworkToggleProps) => {
  const t = useContext(I18nContext);

  const { isShowIncomingTransactions } = networkPreferences;

  const networkName = networkPreferences.label;

  type SupportedChainId = keyof typeof ETHERSCAN_SUPPORTED_NETWORKS;

  const networkDomainAndSubdomain =
    ETHERSCAN_SUPPORTED_NETWORKS?.[chainId as SupportedChainId];

  const domain = networkDomainAndSubdomain?.domain;

  const upperCaseDomain = domain?.charAt(0)?.toUpperCase() + domain?.slice(1);

  return (
    <Box
      marginTop={6}
      marginBottom={6}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      gap={4}
      justifyContent={JustifyContent.spaceBetween}
      data-testid={`network-toggle-${chainId}`}
      className="network-toggle-wrapper"
    >
      <Box
        backgroundColor={BackgroundColor.transparent}
        display={Display.Flex}
        alignItems={AlignItems.center}
        width={BlockSize.Full}
        gap={4}
        className="network-toggle-wrapper__overflow-container"
      >
        <AvatarNetwork
          size={AvatarNetworkSize.Sm}
          src={networkPreferences.imageUrl}
          name={networkName}
        />
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          className="network-toggle-wrapper__overflow-container"
        >
          {networkName.length > MAXIMUM_CHARACTERS_WITHOUT_TOOLTIP ? (
            <Tooltip position="bottom">
              <Text
                color={TextColor.textDefault}
                backgroundColor={BackgroundColor.transparent}
                variant={TextVariant.bodyMd}
                ellipsis
              >
                {networkName}
              </Text>
            </Tooltip>
          ) : (
            <Text
              color={TextColor.textDefault}
              backgroundColor={BackgroundColor.transparent}
              variant={TextVariant.bodyMd}
              ellipsis
            >
              {networkName}
            </Text>
          )}

          <Text
            color={TextColor.primaryDefault}
            backgroundColor={BackgroundColor.transparent}
            variant={TextVariant.bodySm}
            ellipsis
          >
            {
              // For tests, we have localhost in the network list, but obviously
              // there's no 3rd party API for incoming transactions for such
              // Chain ID (0x539). We don't show any link, then.
              domain && (
                <a
                  key={`network_${domain}_link`}
                  href={`https://${domain}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  {upperCaseDomain}
                </a>
              )
            }
          </Text>
        </Box>
      </Box>
      <Box marginLeft="auto">
        <ToggleButton
          value={isShowIncomingTransactions}
          onToggle={(value) => toggleSingleNetwork(chainId, !value)}
          offLabel={t('off')}
          onLabel={t('on')}
        />
      </Box>
    </Box>
  );
};

export default NetworkToggle;

NetworkToggle.propTypes = {
  chainId: PropTypes.string.isRequired,
  networkPreferences: PropTypes.object.isRequired,
  toggleSingleNetwork: PropTypes.func.isRequired,
};
