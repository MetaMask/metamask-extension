import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { EthScope, isEvmAccountType } from '@metamask/keyring-api';
import { type AddNetworkFields } from '@metamask/network-controller';
import { type MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { type CaipChainId } from '@metamask/utils';
import {
  AvatarIcon,
  AvatarIconSeverity,
  AvatarIconSize,
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  IconColor as DsIconColor,
  IconName as DsIconName,
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
import { transitionForward } from '../../../../ui/transition';
import { NETWORKS_ROUTE } from '../../../../../helpers/constants/routes';
import {
  addNetwork,
  setEnabledAllPopularNetworks,
} from '../../../../../store/actions';
import type { MetaMaskReduxState } from '../../../../../store/store';
import {
  getAllEnabledNetworksForAllNamespaces,
  getMultichainNetworkConfigurationsByChainId,
} from '../../../../../selectors/multichain/networks';
import {
  getOrderedNetworksList,
  getShowTestNetworks,
  getUseExternalServices,
} from '../../../../../selectors';
import {
  getInternalAccountBySelectedAccountGroupAndCaip,
  getInternalAccountsFromGroupById,
  getSelectedAccountGroup,
} from '../../../../../selectors/multichain-accounts/account-tree';
import type { MultichainAccountsState } from '../../../../../selectors/multichain-accounts/account-tree.types';
import { selectAdditionalNetworksBlacklistFeatureFlag } from '../../../../../selectors/network-blacklist/network-blacklist';
import { useNetworkManagerState } from '../../../../multichain/network-manager/hooks/useNetworkManagerState';
import { useNetworkChangeHandlers } from '../../../../multichain/network-manager/hooks/useNetworkChangeHandlers';
import { NetworkListItem } from '../../../../multichain/network-list-item';

type HomeNetworkFilterModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type NetworkRowProps = {
  name: string;
  iconSrc?: string | IconName;
  chainId?: string;
  selected?: boolean;
  disabled?: boolean;
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
  disabled?: boolean;
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
  'data-testid'?: string;
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

const SectionHeader = ({
  children,
  className = 'px-4 pb-2 pt-4',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <Text
    variant={TextVariant.BodyMd}
    color={TextColor.TextAlternative}
    fontWeight={FontWeight.Medium}
    className={className}
  >
    {children}
  </Text>
);

const HomeNetworkFilterRow = ({
  name,
  iconSrc,
  chainId,
  selected = false,
  disabled = false,
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
        disabled={disabled}
        onClick={disabled ? () => undefined : onClick}
        focus={false}
        endAccessory={
          endIconName ? (
            <Box className="flex items-center justify-center rounded-lg p-1">
              <Icon name={endIconName} size={IconSize.Lg} />
            </Box>
          ) : undefined
        }
        showEndAccessory={!selected}
      />
    </Box>
  );
};

const getDsIconName = (iconName: IconName): DsIconName =>
  Object.keys(IconName).find(
    (key) => IconName[key as keyof typeof IconName] === iconName,
  ) as DsIconName;

const NetworkSelectionItemIcon = ({
  name,
  iconSrc,
}: {
  name: string;
  iconSrc?: string;
}) => {
  if (isIconName(iconSrc)) {
    return (
      <AvatarIcon
        iconName={getDsIconName(iconSrc)}
        size={AvatarIconSize.Md}
        severity={AvatarIconSeverity.Neutral}
        iconProps={{ color: DsIconColor.IconDefault }}
      />
    );
  }

  return (
    <AvatarNetwork name={name} src={iconSrc} size={AvatarNetworkSize.Md} />
  );
};

export const NetworkSelectionModal = ({
  isOpen,
  onClose,
  title,
  sections,
  topItem,
  footerButton,
  'data-testid': dataTestId,
}: NetworkSelectionModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isClosedOnOutsideClick
      isClosedOnEscapeKey
      data-testid={dataTestId}
    >
      <ModalOverlay />
      {isOpen ? (
        <ModalContent
          size={ModalContentSize.Sm}
          modalDialogProps={{
            padding: 0,
            className: 'flex h-full flex-col overflow-hidden',
          }}
        >
          <ModalHeader onClose={onClose}>{title}</ModalHeader>
          <Box
            className="min-h-0 flex-1 overflow-y-auto"
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
                  <NetworkSelectionItemIcon
                    name={topItem.name}
                    iconSrc={topItem.iconSrc}
                  />
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
                    size={IconSize.Lg}
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
                  <SectionHeader
                    className={index > 0 ? 'px-4 pb-2 pt-4' : undefined}
                  >
                    {section.title}
                  </SectionHeader>
                ) : null}
                {section.items.map(({ key, ...item }) => (
                  <HomeNetworkFilterRow key={key} {...item} />
                ))}
              </Box>
            ))}
          </Box>
          {footerButton ? (
            <Box className="px-4 pt-4">
              <Button
                data-testid={footerButton.testId}
                className="h-12 w-full rounded-xl border-0 bg-muted hover:bg-muted-hover active:bg-muted-pressed"
                size={ButtonSize.Md}
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
  const rawMultichainNetworkConfigurationsByChainId = useSelector(
    (state: MetaMaskReduxState) =>
      state.metamask.multichainNetworkConfigurationsByChainId,
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
  const isEvmOnlySelectedAccountGroup = useSelector(
    (state: MetaMaskReduxState) => {
      const multichainAccountsState =
        state as unknown as MultichainAccountsState;
      const selectedAccountGroup = getSelectedAccountGroup(
        multichainAccountsState,
      );
      const selectedAccountGroupAccounts = getInternalAccountsFromGroupById(
        multichainAccountsState,
        selectedAccountGroup,
      );

      return (
        selectedAccountGroupAccounts.length > 0 &&
        selectedAccountGroupAccounts.every((account) =>
          isEvmAccountType(account.type),
        )
      );
    },
  );
  const { handleNetworkChange } = useNetworkChangeHandlers();
  const {
    nonTestNetworks: allDefaultNetworkMap,
    isNetworkInDefaultNetworkTab,
  } = useNetworkManagerState({ showDefaultNetworks: true });
  const { nonTestNetworks: customNetworkMap, testNetworks: testNetworkMap } =
    useNetworkManagerState();

  const allDefaultNetworksForSelectedAccountGroup = useMemo(
    () =>
      isEvmOnlySelectedAccountGroup
        ? {
            ...rawMultichainNetworkConfigurationsByChainId,
            ...allDefaultNetworkMap,
          }
        : allDefaultNetworkMap,
    [
      allDefaultNetworkMap,
      isEvmOnlySelectedAccountGroup,
      rawMultichainNetworkConfigurationsByChainId,
    ],
  );

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

  const isNetworkDisabled = useCallback(
    (network: MultichainNetworkConfiguration) =>
      !network.isEvm && isEvmOnlySelectedAccountGroup,
    [isEvmOnlySelectedAccountGroup],
  );

  const defaultNetworks = useMemo(() => {
    return sortNetworks(
      allDefaultNetworksForSelectedAccountGroup,
      orderedNetworksList,
    ).filter((network) => {
      if (!isNetworkInDefaultNetworkTab(network)) {
        return false;
      }

      return network.isEvm ? Boolean(evmAccountGroup) : useExternalServices;
    });
  }, [
    allDefaultNetworksForSelectedAccountGroup,
    evmAccountGroup,
    isNetworkInDefaultNetworkTab,
    orderedNetworksList,
    useExternalServices,
  ]);

  const customNetworks = useMemo(() => {
    return sortNetworks(customNetworkMap, orderedNetworksList).filter(
      (network) => network.isEvm || useExternalServices,
    );
  }, [customNetworkMap, orderedNetworksList, useExternalServices]);

  const testNetworks = useMemo(() => {
    return sortNetworks(testNetworkMap, orderedNetworksList).filter(
      (network) => network.isEvm || useExternalServices,
    );
  }, [orderedNetworksList, testNetworkMap, useExternalServices]);

  // When there are no custom networks and no visible test networks, the default
  // list is the only list, so selecting default networks is equivalent to
  // selecting all networks. Once custom or test networks are visible, the top row
  // specifically selects "All default networks".
  const hasOnlyDefaultNetworks =
    customNetworks.length === 0 && !(showTestnets && testNetworks.length > 0);

  const additionalNetworks = useMemo(() => {
    const availableNetworks = FEATURED_RPCS.filter(
      ({ chainId }) => !evmNetworks[chainId],
    ).filter(
      ({ chainId }) =>
        isEvmChainId(chainId as CaipChainId) || useExternalServices,
    );

    return getFilteredFeaturedNetworks(
      blacklistedChainIds,
      availableNetworks,
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [
    blacklistedChainIds,
    evmNetworks,
    useExternalServices,
  ]);

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
    // Don't close the modal first — letting the whole current view (modal
    // included) transition as one view-transition snapshot keeps the motion
    // smooth. The modal's open state resets when the home route unmounts.
    transitionForward(() => navigate(NETWORKS_ROUTE));
  }, [navigate]);

  const sections = useMemo<NetworkSelectionSection[]>(() => {
    const nextSections: NetworkSelectionSection[] = [
      {
        key: 'default-networks',
        title: hasOnlyDefaultNetworks ? undefined : t('defaultNetworks'),
        items: defaultNetworks.map((network) => ({
          key: network.chainId,
          name: network.name,
          iconSrc: getNetworkIcon(network),
          chainId: getSelectableChainId(network),
          selected: isNetworkSelected(network),
          disabled: isNetworkDisabled(network),
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
          disabled: isNetworkDisabled(network),
          onClick: () => handleSelectNetwork(network.chainId),
          testId: `home-network-filter-custom-${getSelectableChainId(network)}`,
        })),
      });
    }

    if (showTestnets && testNetworks.length > 0) {
      nextSections.push({
        key: 'test-networks',
        title: t('testnets'),
        items: testNetworks.map((network) => ({
          key: network.chainId,
          name: network.name,
          iconSrc: getNetworkIcon(network),
          chainId: getSelectableChainId(network),
          selected: isNetworkSelected(network),
          disabled: isNetworkDisabled(network),
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
          disabled:
            !isEvmChainId(network.chainId as CaipChainId) &&
            isEvmOnlySelectedAccountGroup,
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
    hasOnlyDefaultNetworks,
    isEvmOnlySelectedAccountGroup,
    isNetworkDisabled,
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
        name: hasOnlyDefaultNetworks
          ? t('allNetworks')
          : t('allDefaultNetworks'),
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
