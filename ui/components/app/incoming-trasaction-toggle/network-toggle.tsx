import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Text,
} from '../../component-library';
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

import Tooltip from '../../ui/tooltip';
import ToggleButton from '../../ui/toggle-button';
import { I18nContext } from '../../../contexts/i18n';

const MAXIMUM_CHARACTERS_WITHOUT_TOOLTIP = 20;

interface NetworkPreferences {
  isShowIncomingTransactions: boolean;
  label: string;
  imageUrl: string;
}

interface NetworkToggleProps {
  networkPreferences: NetworkPreferences;
  toggleSingleNetwork: (chainId: string, value: boolean) => void;
  chainId: string;
}

const NetworkToggle = ({
  networkPreferences,
  toggleSingleNetwork,
  chainId,
}: NetworkToggleProps) => {
  const t = useContext(I18nContext);

  const { isShowIncomingTransactions } = networkPreferences;

  const networkName = networkPreferences.label;

  return (
    <Box
      marginTop={6}
      marginBottom={6}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      data-testid={`network-toggle-${chainId}`}
      className="network-toggle-wrapper"
    >
      <Box
        gap={2}
        backgroundColor={BackgroundColor.transparent}
        display={Display.Flex}
        alignItems={AlignItems.center}
        width={BlockSize.Full}
      >
        <AvatarNetwork
          size={AvatarNetworkSize.Sm}
          src={networkPreferences.imageUrl}
          name={networkName}
        />
        <Text
          color={TextColor.textDefault}
          backgroundColor={BackgroundColor.transparent}
          variant={TextVariant.bodyMd}
          ellipsis
          marginLeft={2}
        >
          {networkName.length > MAXIMUM_CHARACTERS_WITHOUT_TOOLTIP ? (
            <Tooltip title={networkName} position="bottom">
              {networkName}
            </Tooltip>
          ) : (
            networkName
          )}
        </Text>
      </Box>

      <ToggleButton
        value={isShowIncomingTransactions}
        onToggle={(value) => toggleSingleNetwork(chainId, !value)}
        offLabel={t('off')}
        onLabel={t('on')}
      />
    </Box>
  );
};

export default NetworkToggle;

NetworkToggle.propTypes = {
  chainId: PropTypes.string.isRequired,
  networkPreferences: PropTypes.object.isRequired,
  toggleSingleNetwork: PropTypes.func.isRequired,
};
