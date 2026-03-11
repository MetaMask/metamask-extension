import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { NetworkConfiguration } from '@metamask/network-controller';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  AvatarNetwork,
  AvatarNetworkSize,
} from '@metamask/design-system-react';
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Modal,
} from '../../../components/component-library';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';
import { TEST_CHAINS } from '../../../../shared/constants/network';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../../../shared/constants/bridge';
import { getImageForChainId } from '../../../selectors/multichain';

export const ContactNetworks = ({
  isOpen,
  onClose,
  selectedChainId,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedChainId?: string;
  onSelect?: (chainId: string) => void;
}) => {
  const t = useI18nContext();

  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const [nonTestNetworks, testNetworks] = useMemo(
    () =>
      Object.entries(networkConfigurations).reduce(
        ([nonTest, test], [chainId, config]) => {
          const isTest = (TEST_CHAINS as string[]).includes(chainId);
          (isTest ? test : nonTest).push(config);
          return [nonTest, test];
        },
        [[] as NetworkConfiguration[], [] as NetworkConfiguration[]],
      ),
    [networkConfigurations],
  );

  const renderNetworkRow = (
    name: string,
    chainId: string,
    iconSrc: string | undefined,
  ) => {
    const displayName =
      NETWORK_TO_SHORT_NETWORK_NAME_MAP[
        chainId as unknown as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
      ] ?? name;
    const selected = selectedChainId === chainId;

    return (
      <Box
        key={chainId}
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={2}
        padding={4}
        className={`flex cursor-pointer ${
          selected ? 'bg-background-muted' : 'bg-transparent'
        }`}
        onClick={() => {
          onSelect?.(chainId);
          onClose();
        }}
        data-testid={`network-list-item-${chainId}`}
      >
        <AvatarNetwork
          size={AvatarNetworkSize.Sm}
          name={displayName}
          src={iconSrc}
          className="rounded-xl"
        />
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextDefault}
          fontWeight={selected ? FontWeight.Medium : undefined}
          ellipsis
          className="min-w-0 flex-1"
        >
          {displayName}
        </Text>
      </Box>
    );
  };

  const renderNetworkList = (networks: { name: string; chainId: string }[]) =>
    networks.map(({ name, chainId }) =>
      renderNetworkRow(name, chainId, getImageForChainId(chainId)),
    );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="multichain-asset-picker__network-modal"
    >
      <ModalOverlay />
      <ModalContent modalDialogProps={{ padding: 0 }}>
        <ModalHeader onBack={onClose} onClose={onClose}>
          {t('bridgeSelectNetwork')}
        </ModalHeader>
        <Box
          flexDirection={BoxFlexDirection.Column}
          className="flex w-full flex-col overflow-auto"
        >
          <Box
            flexDirection={BoxFlexDirection.Column}
            className="flex w-full flex-col"
          >
            {renderNetworkList(nonTestNetworks)}

            <Box
              flexDirection={BoxFlexDirection.Column}
              className="flex flex-col"
            >
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextDefault}
                className="p-4"
              >
                {t('testnets')}
              </Text>
              {renderNetworkList(testNetworks)}
            </Box>
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
};
