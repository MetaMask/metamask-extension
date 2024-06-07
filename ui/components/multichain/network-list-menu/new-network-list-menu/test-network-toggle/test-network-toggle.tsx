import React from 'react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Box, Text } from '../../../../component-library';
import { NetworkListItem } from '../../../network-list-item';
import ToggleButton from '../../../../ui/toggle-button';
import {
  BorderColor,
  Display,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';

const TestNetworksToggle = ({
  showTestNetworks,
  currentlyOnTestNetwork,
  handleToggle,
  testNetworks,
}: any) => {
  const t = useI18nContext();

  return (
    <Box>
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.spaceBetween}
        borderColor={BorderColor.backgroundDefault}
      >
        <Text paddingLeft={4}>{t('showTestnetNetworks')}</Text>
        <ToggleButton
          value={showTestNetworks}
          disabled={currentlyOnTestNetwork}
          onToggle={handleToggle}
        />
      </Box>
      {showTestNetworks || currentlyOnTestNetwork ? (
        <Box className="new-network-list-menu">
          {testNetworks.map((network: any) => (
            <NetworkListItem
              key={network.id}
              name={network.nickname}
              iconSrc={network?.rpcPrefs?.imageUrl}
              selected={false}
              focus={false}
              onClick={() => {}}
              onDeleteClick={null}
            />
          ))}
        </Box>
      ) : null}
    </Box>
  );
};

export default TestNetworksToggle;
