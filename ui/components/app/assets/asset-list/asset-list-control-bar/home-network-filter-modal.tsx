import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { EthScope } from '@metamask/keyring-api';
import { type AddNetworkFields } from '@metamask/network-controller';
import { type MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { type CaipChainId } from '@metamask/utils';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  FEATURED_RPCS,
} from '../../../../../../shared/constants/network';
import {
  convertCaipToHexChainId,
  getFilteredFeaturedNetworks,
  getNetworkIcon,
  sortNetworks,
} from '../../../../../../shared/lib/network.utils';
import { isEvmChainId } from '../../../../../../shared/lib/asset-utils';
import {
  Icon,
  IconName,
  IconSize,
  Modal,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
} from '../../../../component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { NETWORKS_ROUTE } from '../../../../../helpers/constants/routes';
import {
  addNetwork,
  setEnabledAllPopularNetworks,
} from '../../../../../store/actions';
import {
  getAllEnabledNetworksForAllNamespaces,
  getMultichainNetworkConfigurationsByChainId,
} from '../../../../../selectors/multichain/networks';
import {
  getOrderedNetworksList,
  getShowTestNetworks,
  getUseExternalServices,
} from '../../../../../selectors';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../../../selectors/multichain-accounts/account-tree';
import { selectAdditionalNetworksBlacklistFeatureFlag } from '../../../../../selectors/network-blacklist/network-blacklist';
import { useNetworkManagerState } from '../../../../multichain/network-manager/hooks/useNetworkManagerState';
import { useNetworkChangeHandlers } from '../../../../multichain/network-manager/hooks/useNetworkChangeHandlers';
import { NetworkListItem } from '../../../../multichain';

type HomeNetworkFilterModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type NetworkRowProps = {
  name: string;
  iconSrc?: string | IconName;
  chainId?: string;
  selected?: boolean;
  endIconName?: IconName;
  onClick: () => void;
  testId: string;
};

export type NetworkSelectionItem = {
  key: string;
  name: string;
  iconSrc?: string | IconName;
  chainId?: string;
  selected?: boolean;
  endIconName?: IconName;
  onClick: () => void;
  testId: string;
};

export type NetworkSelectionSection = {
  key: string;
  title?: React.ReactNode;
  items: NetworkSelectionItem[];
};

type NetworkSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  sections: NetworkSelectionSection[];
  topItem?: NetworkSelectionItem;
  footerButton?: {
    label: React.ReactNode;
    testId: string;
    iconName?: IconName;
    onClick: () => void;
  };
};

const getSelectableChainId = (network: MultichainNetworkConfiguration) =>
  network.isEvm ? convertCaipToHexChainId(network.chainId) : network.chainId;

const isIconName = (iconSrc?: string | IconName): iconSrc is IconName =>
  Object.values(IconName).includes(iconSrc as IconName);

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <Text
    variant={TextVariant.BodyMd}
    color={TextColor.TextAlternative}
    fontWeight={FontWeight.Medium}
    className="px-4 py-2"
  >
    {children}
  </Text>
);

const HomeNetworkFilterRow = ({
  name,
  iconSrc,
  chainId,
  selected = false,
  endIconName,
  onClick,
  testId,
}: NetworkRowProps) => {
  return (
    <Box data-testid={testId}>
      <NetworkListItem
        name={name}
        iconSrc={isIconName(iconSrc) ? (iconSrc as string) : iconSrc}
        chainId={chainId}
        selected={selected}
        onClick={onClick}
        focus={false}
        endAccessory={
          endIconName ? (
            <Icon name={endIconName} size={IconSize.Sm} />
          ) : undefined
        }
        showEndAccessory={!selected}
      />
    </Box>
  );
};

export const NetworkSelectionModal = ({
  isOpen,
  onClose,
  title,
  sections,
  topItem,
  footerButton,
}: NetworkSelectionModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isClosedOnOutsideClick
      isClosedOnEscapeKey
    >
      <ModalOverlay />
      {isOpen ? (
        <ModalContent
          size={ModalContentSize.Sm}
          modalDialogProps={{
            padding: 0,
            className: 'overflow-hidden',
          }}
        >
          <ModalHeader onClose={onClose}>{title}</ModalHeader>
          <Box
            className="max-h-[calc(100vh-168px)] overflow-y-auto"
            flexDirection={BoxFlexDirection.Column}
          >
            {topItem ? (
              <button
                type="button"
                className={`flex min-h-16 w-full cursor-pointer items-center justify-between border-0 p-4 text-left hover:bg-hover ${
                  topItem.selected ? 'bg-muted' : 'bg-transparent'
                }`}
                data-testid={topItem.testId}
                onClick={topItem.onClick}
              >
                <Box className="flex min-w-0 items-center gap-3">
                  {isIconName(topItem.iconSrc) ? (
                    <Icon name={topItem.iconSrc} size={IconSize.Sm} />
                  ) : (
                    <AvatarNetwork
                      name={topItem.name}
                      src={topItem.iconSrc}
                      size={AvatarNetworkSize.Md}
                    />
                  )}
                  <Text
                    variant={TextVariant.BodyMd}
                    color={TextColor.TextDefault}
                    fontWeight={FontWeight.Medium}
                    className="truncate"
                  >
                    {topItem.name}
                  </Text>
                </Box>
                {(topItem.selected || topItem.endIconName) && (
                  <Icon
                    name={
                      topItem.selected
                        ? IconName.Check
                        : (topItem.endIconName as IconName)
                    }
                    size={IconSize.Sm}
                  />
                )}
              </button>
            ) : null}
            {sections.map((section, index) => (
              <Box key={section.key} className="flex flex-col">
                {index > 0 ? (
                  <hr className="mx-4 mt-2 w-[calc(100%-32px)] border-0 border-t border-border-muted" />
                ) : null}
                {section.title ? (
                  <SectionHeader>{section.title}</SectionHeader>
                ) : null}
                {section.items.map(({ key, ...item }) => (
                  <HomeNetworkFilterRow key={key} {...item} />
                ))}
              </Box>
            ))}
          </Box>
          {footerButton ? (
            <Box className="px-4 pt-2">
              <Button
                data-testid={footerButton.testId}
                className="h-14 w-full rounded-2xl border-0 bg-muted hover:bg-muted-hover active:bg-muted-pressed"
                size={ButtonSize.Lg}
                variant={ButtonVariant.Secondary}
                onClick={footerButton.onClick}
              >
                <Box className="flex items-center justify-center gap-2">
                  {footerButton.iconName ? (
                    <Icon name={footerButton.iconName} size={IconSize.Sm} />
                  ) : null}
                  {footerButton.label}
                </Box>
              </Button>
            </Box>
          ) : null}
        </ModalContent>
      ) : null}
    </Modal>
  );
};

const HomeNetworkFilterModalContent = ({
  onClose,
}: {
  onClose: () => void;
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const orderedNetworksList = useSelector(getOrderedNetworksList);
  const [, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const enabledNetworks = useSelector(getAllEnabledNetworksForAllNamespaces);
  const useExternalServices = useSelector(getUseExternalServices);
  const showTestnets = useSelector(getShowTestNetworks);
  const blacklistedChainIds = useSelector(
    selectAdditionalNetworksBlacklistFeatureFlag,
  );
  const evmAccountGroup = useSelector((state) =>
    getInternalAccountBySelectedAccountGroupAndCaip(state, EthScope.Eoa),
  );
  const { handleNetworkChange } = useNetworkChangeHandlers();
  const {
    nonTestNetworks: allDefaultNetworkMap,
    isNetworkInDefaultNetworkTab,
  } = useNetworkManagerState({ showDefaultNetworks: true });
  const { nonTestNetworks: customNetworkMap, testNetworks: testNetworkMap } =
    useNetworkManagerState();

  const enabledNetworkSet = useMemo(
    () => new Set(enabledNetworks),
    [enabledNetworks],
  );

  const isAllDefaultSelected = enabledNetworks.length > 1;

  const isNetworkSelected = useCallback(
    (network: MultichainNetworkConfiguration) =>
      enabledNetworks.length === 1 &&
      enabledNetworkSet.has(getSelectableChainId(network)),
    [enabledNetworkSet, enabledNetworks.length],
  );

  const defaultNetworks = useMemo(() => {
    return sortNetworks(allDefaultNetworkMap, orderedNetworksList).filter(
      (network) => {
        if (!isNetworkInDefaultNetworkTab(network)) {
          return false;
        }

        if (!useExternalServices && !network.isEvm) {
          return false;
        }

        return network.isEvm ? Boolean(evmAccountGroup) : true;
      },
    );
  }, [
    allDefaultNetworkMap,
    evmAccountGroup,
    isNetworkInDefaultNetworkTab,
    orderedNetworksList,
    useExternalServices,
  ]);

  const customNetworks = useMemo(() => {
    return sortNetworks(customNetworkMap, orderedNetworksList).filter(
      (network) => useExternalServices || network.isEvm,
    );
  }, [customNetworkMap, orderedNetworksList, useExternalServices]);

  const testNetworks = useMemo(() => {
    return sortNetworks(testNetworkMap, orderedNetworksList).filter(
      (network) => useExternalServices || network.isEvm,
    );
  }, [orderedNetworksList, testNetworkMap, useExternalServices]);

  const additionalNetworks = useMemo(() => {
    const availableNetworks = FEATURED_RPCS.filter(
      ({ chainId }) => !evmNetworks[chainId],
    ).filter(
      ({ chainId }) =>
        useExternalServices || isEvmChainId(chainId as CaipChainId),
    );

    return getFilteredFeaturedNetworks(
      blacklistedChainIds,
      availableNetworks,
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [blacklistedChainIds, evmNetworks, useExternalServices]);

  const handleSelectAllDefaultNetworks = useCallback(() => {
    dispatch(setEnabledAllPopularNetworks());
    onClose();
  }, [dispatch, onClose]);

  const handleSelectNetwork = useCallback(
    async (chainId: CaipChainId) => {
      await handleNetworkChange(chainId);
      onClose();
    },
    [handleNetworkChange, onClose],
  );

  const handleAddNetwork = useCallback(
    async (network: AddNetworkFields) => {
      await dispatch(addNetwork(network));
      onClose();
    },
    [dispatch, onClose],
  );

  const handleManageNetworks = useCallback(() => {
    onClose();
    navigate(`${NETWORKS_ROUTE}?drawerOpen=true`);
  }, [navigate, onClose]);

  const sections = useMemo<NetworkSelectionSection[]>(() => {
    const nextSections: NetworkSelectionSection[] = [
      {
        key: 'default-networks',
        title: t('defaultNetworks'),
        items: defaultNetworks.map((network) => ({
          key: network.chainId,
          name: network.name,
          iconSrc: getNetworkIcon(network),
          chainId: getSelectableChainId(network),
          selected: isNetworkSelected(network),
          onClick: () => handleSelectNetwork(network.chainId),
          testId: `home-network-filter-network-${getSelectableChainId(network)}`,
        })),
      },
    ];

    if (customNetworks.length > 0) {
      nextSections.push({
        key: 'custom-networks',
        title: t('customNetworks'),
        items: customNetworks.map((network) => ({
          key: network.chainId,
          name: network.name,
          iconSrc: getNetworkIcon(network),
          chainId: getSelectableChainId(network),
          selected: isNetworkSelected(network),
          onClick: () => handleSelectNetwork(network.chainId),
          testId: `home-network-filter-custom-${getSelectableChainId(network)}`,
        })),
      });
    }

    if (
      (showTestnets || process.env.METAMASK_DEBUG) &&
      testNetworks.length > 0
    ) {
      nextSections.push({
        key: 'test-networks',
        title: t('testnets'),
        items: testNetworks.map((network) => ({
          key: network.chainId,
          name: network.name,
          iconSrc: getNetworkIcon(network),
          chainId: getSelectableChainId(network),
          selected: isNetworkSelected(network),
          onClick: () => handleSelectNetwork(network.chainId),
          testId: `home-network-filter-test-${getSelectableChainId(network)}`,
        })),
      });
    }

    if (additionalNetworks.length > 0) {
      nextSections.push({
        key: 'additional-networks',
        title: t('additionalNetworks'),
        items: additionalNetworks.map((network) => ({
          key: network.chainId,
          name: network.name,
          iconSrc:
            CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
              network.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
            ],
          chainId: network.chainId,
          endIconName: IconName.Add,
          onClick: () => handleAddNetwork(network),
          testId: `home-network-filter-additional-${network.chainId}`,
        })),
      });
    }

    return nextSections;
  }, [
    additionalNetworks,
    customNetworks,
    defaultNetworks,
    handleAddNetwork,
    handleSelectNetwork,
    isNetworkSelected,
    showTestnets,
    t,
    testNetworks,
  ]);

  return (
    <NetworkSelectionModal
      isOpen
      onClose={onClose}
      title={t('bridgeSelectNetwork')}
      topItem={{
        key: 'all-default-networks',
        name: t('allDefaultNetworks'),
        iconSrc: IconName.Global,
        selected: isAllDefaultSelected,
        onClick: handleSelectAllDefaultNetworks,
        testId: 'home-network-filter-all-default',
      }}
      sections={sections}
      footerButton={{
        label: t('manageNetworksMenuHeading'),
        testId: 'home-network-filter-manage-networks',
        iconName: IconName.Setting,
        onClick: handleManageNetworks,
      }}
    />
  );
};

export const HomeNetworkFilterModal = ({
  isOpen,
  onClose,
}: HomeNetworkFilterModalProps) => {
  return isOpen ? <HomeNetworkFilterModalContent onClose={onClose} /> : null;
};
