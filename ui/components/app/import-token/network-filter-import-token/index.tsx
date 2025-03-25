import React, { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  TextVariant,
  BlockSize,
  TextColor,
  BorderRadius,
  AlignItems,
  Display,
  JustifyContent,
  BorderColor,
} from '../../../../helpers/constants/design-system';
import {
  ButtonIcon,
  Box,
  Popover,
  PopoverPosition,
  ButtonIconSize,
  IconName,
  Label,
  Text,
  AvatarNetwork,
  AvatarNetworkSize,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import NetworkFilter from '../../assets/asset-list/network-filter';
import {
  getCurrentNetwork,
  getIsTokenNetworkFilterEqualCurrentNetwork,
} from '../../../../selectors';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  FEATURED_NETWORK_CHAIN_IDS,
} from '../../../../../shared/constants/network';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/modules/selectors/networks';
import { getImageForChainId } from '../../../../selectors/multichain';

export const NetworkFilterImportToken = ({
  title,
  buttonDataTestId,
  openListNetwork,
  networkFilter,
  setNetworkFilter,
}: {
  title: string;
  buttonDataTestId: string;
  openListNetwork: () => void;
  networkFilter?: Record<string, boolean>;
  setNetworkFilter?: (network: Record<string, boolean>) => void;
}) => {
  const t = useI18nContext();
  const dropdown = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isTokenNetworkFilterEqualCurrentNetwork = useSelector(
    getIsTokenNetworkFilterEqualCurrentNetwork,
  );
  const currentNetwork = useSelector(getCurrentNetwork);
  const currentNetworkImageUrl = getImageForChainId(currentNetwork?.chainId);
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);

  const allOpts: Record<string, boolean> = {};
  Object.keys(allNetworks || {}).forEach((chain) => {
    allOpts[chain] = true;
  });

  const isCurrentNetwork = networkFilter
    ? Object.keys(networkFilter).length === 1 &&
      networkFilter[currentNetwork?.chainId]
    : isTokenNetworkFilterEqualCurrentNetwork;

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
              const networkImageUrl =
                CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
                  chain as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
                ];
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

  const box = (
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
      ref={dropdown}
    >
      {renderItem()}
      <ButtonIcon
        marginLeft="auto"
        iconName={isDropdownOpen ? IconName.ArrowUp : IconName.ArrowDown}
        ariaLabel={title}
        size={ButtonIconSize.Md}
        onClick={() => {
          setIsDropdownOpen(!isDropdownOpen);
        }}
        data-testid={buttonDataTestId}
      />
    </Box>
  );

  return (
    <Box>
      {title ? <Label variant={TextVariant.bodyMdMedium}>{title}</Label> : null}
      {box}
      <Popover
        onClickOutside={() => setIsDropdownOpen(false)}
        isOpen={isDropdownOpen}
        position={PopoverPosition.BottomStart}
        referenceElement={dropdown.current}
        matchWidth
        style={{
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
        }}
      >
        <NetworkFilter
          handleClose={() => setIsDropdownOpen(false)}
          handleFilterNetwork={(chainFilters) => {
            if (setNetworkFilter) {
              setNetworkFilter(chainFilters);
            }
          }}
          {...(networkFilter && {
            networkFilter,
          })}
        />
      </Popover>
    </Box>
  );
};

export default NetworkFilterImportToken;
