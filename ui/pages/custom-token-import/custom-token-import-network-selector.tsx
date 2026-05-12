import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatChainIdToHex } from '@metamask/bridge-controller';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonIcon,
  ButtonIconSize,
  FontWeight,
  IconName,
  ModalBody,
  ModalFocus,
  ModalOverlay,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { type Hex } from '@metamask/utils';

import { useI18nContext } from '../../hooks/useI18nContext';
import { getImageForChainId } from '../../selectors/multichain';

export type CustomTokenImportNetworkOption = {
  chainId: string;
  name: string;
};

export type CustomTokenImportNetworkSelectorProps = {
  isOpen: boolean;
  networks: CustomTokenImportNetworkOption[];
  selectedNetwork: Hex;
  onBack: () => void;
  onClose: () => void;
  onSelectNetwork: (network: CustomTokenImportNetworkOption) => void;
};

const NetworkSelectorRow = ({
  network,
  selectedNetwork,
  onSelectNetwork,
}: {
  network: CustomTokenImportNetworkOption;
  selectedNetwork: Hex;
  onSelectNetwork: (network: CustomTokenImportNetworkOption) => void;
}) => {
  const isSelected = formatChainIdToHex(network.chainId) === selectedNetwork;

  return (
    <Box
      asChild
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={4}
      paddingHorizontal={4}
      paddingVertical={3}
      backgroundColor={
        isSelected ? BoxBackgroundColor.BackgroundMuted : undefined
      }
      className="w-full text-left transition-colors hover:bg-hover active:bg-pressed"
    >
      <button
        type="button"
        data-testid={`select-network-item-${network.chainId}`}
        aria-current={isSelected ? 'true' : undefined}
        onClick={() => onSelectNetwork(network)}
      >
        <AvatarNetwork
          name={network.name}
          src={getImageForChainId(network.chainId)}
          size={AvatarNetworkSize.Sm}
        />
        <Text
          asChild
          variant={TextVariant.BodyMd}
          color={TextColor.TextDefault}
          fontWeight={isSelected ? FontWeight.Medium : FontWeight.Regular}
          ellipsis
        >
          <span className="min-w-0 flex-1">{network.name}</span>
        </Text>
      </button>
    </Box>
  );
};

export const CustomTokenImportNetworkSelector = ({
  isOpen,
  networks,
  selectedNetwork,
  onBack,
  onClose,
  onSelectNetwork,
}: CustomTokenImportNetworkSelectorProps) => {
  const t = useI18nContext();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <>
      <ModalOverlay onClick={onClose} />
      <Box
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        padding={4}
        className="pointer-events-none fixed inset-0 z-[1051] flex motion-safe:animate-fade-in"
      >
        <ModalFocus autoFocus restoreFocus>
          <Box
            asChild
            flexDirection={BoxFlexDirection.Column}
            backgroundColor={BoxBackgroundColor.BackgroundDefault}
            paddingVertical={4}
            className="pointer-events-auto flex max-h-full w-full max-w-[360px] overflow-hidden rounded-lg shadow-lg"
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="custom-token-import-network-selector-title"
            >
              <Box
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                justifyContent={BoxJustifyContent.Between}
                gap={2}
                paddingHorizontal={4}
                paddingBottom={4}
              >
                <ButtonIcon
                  ariaLabel={t('back')}
                  iconName={IconName.ArrowLeft}
                  size={ButtonIconSize.Md}
                  onClick={onBack}
                />
                <Text
                  asChild
                  variant={TextVariant.HeadingSm}
                  textAlign={TextAlign.Center}
                  ellipsis
                  className="min-w-0 flex-1"
                >
                  <h2 id="custom-token-import-network-selector-title">
                    {t('networkMenuHeading')}
                  </h2>
                </Text>
                <ButtonIcon
                  ariaLabel={t('close')}
                  iconName={IconName.Close}
                  size={ButtonIconSize.Md}
                  onClick={onClose}
                />
              </Box>
              <ModalBody className="px-0">
                {networks.map((network) => (
                  <NetworkSelectorRow
                    key={network.chainId}
                    network={network}
                    selectedNetwork={selectedNetwork}
                    onSelectNetwork={onSelectNetwork}
                  />
                ))}
              </ModalBody>
            </section>
          </Box>
        </ModalFocus>
      </Box>
    </>,
    document.body,
  );
};

export default CustomTokenImportNetworkSelector;
