import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  AvatarNetwork,
  Text,
  AvatarNetworkSize,
} from '../../../../../component-library';
import {
  TextVariant,
  BlockSize,
  TextColor,
  AlignItems,
  Display,
  JustifyContent,
} from '../../../../../../helpers/constants/design-system';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  FEATURED_NETWORK_CHAIN_IDS,
} from '../../../../../../../shared/constants/network';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { getCurrentNetwork } from '../../../../../../selectors';

type NetworkFilterDropdownItemProps = {
  isCurrentNetwork: boolean;
  openListNetwork: () => void;
  currentNetworkImageUrl: string;
  allOpts: Record<string, boolean>;
  setDropdownOpen: () => void;
};

export const NetworkFilterDropdownItem = ({
  isCurrentNetwork,
  openListNetwork,
  currentNetworkImageUrl,
  allOpts,
  setDropdownOpen,
}: NetworkFilterDropdownItemProps) => {
  const t = useI18nContext();
  const currentNetwork = useSelector(getCurrentNetwork);

  if (isCurrentNetwork) {
    return (
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.spaceBetween}
        width={BlockSize.Full}
        paddingTop={3}
        paddingBottom={3}
        gap={3}
        onClick={setDropdownOpen}
      >
        <Box>
          <Text
            variant={TextVariant.bodyMdMedium}
            color={TextColor.textDefault}
          >
            {currentNetwork?.nickname ?? t('currentNetwork')}
          </Text>
        </Box>
        <Box display={Display.Flex} alignItems={AlignItems.flexStart}>
          <AvatarNetwork
            key={currentNetworkImageUrl}
            name={currentNetworkImageUrl ?? ''}
            src={currentNetworkImageUrl ?? undefined}
            size={AvatarNetworkSize.Sm}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      width={BlockSize.Full}
      paddingTop={3}
      paddingBottom={3}
      gap={3}
      onClick={setDropdownOpen}
    >
      <Text variant={TextVariant.bodyMdMedium} color={TextColor.textDefault}>
        {t('popularNetworks')}
      </Text>
      <Box
        display={Display.Flex}
        alignItems={AlignItems.flexEnd}
        onClick={openListNetwork}
      >
        {FEATURED_NETWORK_CHAIN_IDS.filter((chain) => allOpts[chain]).map(
          (chain, index) => {
            const networkImageUrl = CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[chain];
            return (
              <AvatarNetwork
                key={networkImageUrl}
                name={networkImageUrl}
                src={networkImageUrl ?? undefined}
                size={AvatarNetworkSize.Sm}
                style={{
                  marginLeft: index === 0 ? 0 : '-20px',
                  zIndex: 5 - index,
                }}
              />
            );
          },
        )}
      </Box>
    </Box>
  );
};
