import React from 'react';
import {
  Box,
  ButtonIcon,
  AvatarNetwork,
  Text,
  IconName,
  ButtonIconSize,
  AvatarNetworkSize,
} from '../../../../component-library';
import {
  TextVariant,
  BlockSize,
  TextColor,
  BorderRadius,
  AlignItems,
  Display,
  JustifyContent,
  BorderColor,
} from '../../../../../helpers/constants/design-system';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  FEATURED_NETWORK_CHAIN_IDS,
} from '../../../../../../shared/constants/network';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

type NetworkFilterDropdownProps = {
  title: string;
  buttonDataTestId: string;
  isCurrentNetwork: boolean;
  openListNetwork: () => void;
  currentNetworkImageUrl: string;
  allOpts: Record<string, boolean>;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (isOpen: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
};

export const NetworkFilterDropdown = ({
  title,
  buttonDataTestId,
  isCurrentNetwork,
  openListNetwork,
  currentNetworkImageUrl,
  allOpts,
  isDropdownOpen,
  setIsDropdownOpen,
  dropdownRef,
}: NetworkFilterDropdownProps) => {
  const t = useI18nContext();

  const renderItem = () => {
    if (isCurrentNetwork) {
      return (
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          width={BlockSize.Full}
          paddingTop={3}
          paddingBottom={3}
          gap={3}
        >
          <Box>
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textDefault}
            >
              {t('currentNetwork')}
            </Text>
          </Box>
          <Box
            display={Display.Flex}
            alignItems={AlignItems.flexStart}
            onClick={openListNetwork}
          >
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

  return (
    <Box
      className="dropdown-editor__item-dropdown"
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
      borderRadius={BorderRadius.LG}
      borderColor={BorderColor.borderDefault}
      borderWidth={1}
      paddingLeft={4}
      paddingRight={1}
      ref={dropdownRef}
    >
      {renderItem()}
      <ButtonIcon
        marginLeft="auto"
        iconName={isDropdownOpen ? IconName.ArrowUp : IconName.ArrowDown}
        ariaLabel={title}
        size={ButtonIconSize.Md}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        data-testid={buttonDataTestId}
      />
    </Box>
  );
};

export default NetworkFilterDropdown;
